import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CodeforcesService } from '../codeforces/codeforces.service';
import { AnalyticsService } from '../analytics/analytics.service';
import type { RecommendationsDto, RecommendedProblem } from '@cp-dashboard/types';

const RATING_OFFSET_MIN = 100;
const RATING_OFFSET_MAX = 300;
const MAX_RECOMMENDATIONS = 20;

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cf: CodeforcesService,
    private readonly analytics: AnalyticsService,
  ) {}

  async getRecommendations(handle: string): Promise<RecommendationsDto> {
    // 1. Get user's current rating
    const user = await this.prisma.user.findUnique({
      where: { cfHandle: handle },
    });

    if (!user) {
      throw new NotFoundException(
        `User "${handle}" not found. Sync first with POST /sync/${handle}`,
      );
    }

    const currentRating = user.currentRating ?? 1200;
    const targetMin = currentRating + RATING_OFFSET_MIN;
    const targetMax = currentRating + RATING_OFFSET_MAX;

    // 2. Get user's solved problem IDs
    const solvedSubmissions = await this.prisma.submission.findMany({
      where: { userId: user.id, verdict: 'OK' },
      select: { problemId: true },
      distinct: ['problemId'],
    });
    const solvedIds = new Set(solvedSubmissions.map((s) => s.problemId));

    // 3. Get analytics to know weak tags
    const analyticsData = await this.analytics.getSummary(handle);
    const weakTagSet = new Set(
      analyticsData.tagWeaknesses
        .filter((t) => t.weaknessScore > 0.3)  // tags with >30% failure rate
        .slice(0, 10)                            // top 10 weak tags
        .map((t) => t.tag),
    );

    // 4. Fetch Codeforces problemset and filter
    let problemset: Array<{
      contestId: number;
      index: string;
      name: string;
      rating?: number;
      tags: string[];
      type: string;
    }> = [];

    try {
      const data = await this.cf.getProblemset();
      problemset = data.problems;
    } catch (err) {
      this.logger.warn('Failed to fetch problemset from CF, using DB fallback');
      // Fallback: use problems already in DB
      const dbProblems = await this.prisma.problem.findMany({
        where: {
          rating: { gte: targetMin, lte: targetMax },
        },
      });
      problemset = dbProblems.map((p) => ({
        contestId: p.contestId,
        index: p.index,
        name: p.name,
        rating: p.rating ?? undefined,
        tags: p.tags,
        type: p.problemType,
      }));
    }

    // 5. Apply filters
    const candidates = problemset.filter((p) => {
      const pid = `${p.contestId}${p.index}`;
      if (solvedIds.has(pid)) return false;               // already solved
      if (!p.rating) return false;                         // no rating
      if (p.rating < targetMin || p.rating > targetMax) return false; // out of range
      if (p.type !== 'PROGRAMMING') return false;          // skip non-programming
      return true;
    });

    // 6. Score each candidate by weakness overlap
    const scored: RecommendedProblem[] = candidates.map((p) => {
      const weaknessTags = p.tags.filter((t) => weakTagSet.has(t));
      const tagWeaknessSum = p.tags.reduce((sum, tag) => {
        const ws = analyticsData.tagWeaknesses.find((t) => t.tag === tag);
        return sum + (ws?.weaknessScore ?? 0);
      }, 0);

      // Priority score: weakness tag overlap weight + normalized tag weakness sum
      const priorityScore =
        weaknessTags.length * 2 +        // 2 pts per overlapping weak tag
        tagWeaknessSum * 0.5 +            // bonus from aggregate weakness
        (1 - (p.rating! - targetMin) / (RATING_OFFSET_MAX - RATING_OFFSET_MIN)) * 0.5; // prefer easier in range

      const pid = `${p.contestId}${p.index}`;
      return {
        id: pid,
        contestId: p.contestId,
        index: p.index,
        name: p.name,
        rating: p.rating!,
        tags: p.tags,
        url: `https://codeforces.com/contest/${p.contestId}/problem/${p.index}`,
        weaknessTags,
        priorityScore,
      };
    });

    // 7. Sort by priority and deduplicate (keep top N)
    scored.sort((a, b) => b.priorityScore - a.priorityScore);
    const topN = scored.slice(0, MAX_RECOMMENDATIONS);

    this.logger.log(
      `Generated ${topN.length} recommendations for ${handle} (rating ${currentRating})`,
    );

    return {
      handle,
      currentRating,
      targetRatingMin: targetMin,
      targetRatingMax: targetMax,
      problems: topN,
    };
  }
}
