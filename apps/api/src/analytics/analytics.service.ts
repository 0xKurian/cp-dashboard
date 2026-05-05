import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CodeforcesService } from '../codeforces/codeforces.service';
import type { AnalyticsSummaryDto, TagWeaknessScore, RatingDataPoint } from '@cp-dashboard/types';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cf: CodeforcesService,
  ) {}

  async getSummary(handle: string): Promise<AnalyticsSummaryDto> {
    const user = await this.prisma.user.findUnique({
      where: { cfHandle: handle },
    });

    if (!user) {
      throw new NotFoundException(
        `User "${handle}" not found. Please sync first.`,
      );
    }

    const [submissions, ratingHistory] = await Promise.all([
      this.prisma.submission.findMany({
        where: { userId: user.id },
        include: { problem: true },
        orderBy: { submittedAt: 'asc' },
      }),
      this.cf.getRatingHistory(handle),
    ]);

    const tagWeaknesses = this.computeTagWeaknesses(submissions);
    const ratingData = this.mapRatingHistory(ratingHistory);

    // Count accepted verdicts on unique problems
    const solvedSet = new Set<string>();
    for (const sub of submissions) {
      if (sub.verdict === 'OK') solvedSet.add(sub.problemId);
    }

    const totalSubs = submissions.length;
    const acceptedSubs = submissions.filter((s) => s.verdict === 'OK').length;
    const acceptedRate = totalSubs > 0 ? acceptedSubs / totalSubs : 0;

    return {
      handle,
      totalSubmissions: totalSubs,
      solvedProblems: solvedSet.size,
      acceptedRate,
      tagWeaknesses,
      ratingHistory: ratingData,
      currentRating: user.currentRating,
    };
  }

  // ─── Core Algorithm: Tag Weakness Scoring ───────────────────
  //
  // For each tag across all submissions:
  //   weaknessScore = wrongAnswers / (accepted + wrongAnswers)
  //   (considers only the BEST attempt per problem — i.e., if a problem
  //    has any AC, it counts as accepted, not wrong)
  //
  private computeTagWeaknesses(
    submissions: Array<{
      verdict: string;
      problemId: string;
      problem: { tags: string[]; rating: number | null };
    }>,
  ): TagWeaknessScore[] {
    // Aggregate per-problem final verdict (OK wins over all others)
    const problemVerdict = new Map<string, 'OK' | 'WRONG_ANSWER'>();

    for (const sub of submissions) {
      const current = problemVerdict.get(sub.problemId);
      if (current === 'OK') continue; // already solved
      if (sub.verdict === 'OK') {
        problemVerdict.set(sub.problemId, 'OK');
      } else if (sub.verdict === 'WRONG_ANSWER' && !current) {
        problemVerdict.set(sub.problemId, 'WRONG_ANSWER');
      }
    }

    // Build per-problem map for tag lookup
    const problemTags = new Map<string, string[]>();
    for (const sub of submissions) {
      if (!problemTags.has(sub.problemId)) {
        problemTags.set(sub.problemId, sub.problem.tags);
      }
    }

    // Accumulate tag scores
    const tagStats = new Map<string, { accepted: number; wrongAnswer: number }>();

    for (const [problemId, verdict] of problemVerdict) {
      const tags = problemTags.get(problemId) ?? [];
      for (const tag of tags) {
        if (!tagStats.has(tag)) {
          tagStats.set(tag, { accepted: 0, wrongAnswer: 0 });
        }
        const stats = tagStats.get(tag)!;
        if (verdict === 'OK') {
          stats.accepted++;
        } else {
          stats.wrongAnswer++;
        }
      }
    }

    // Convert to sorted array
    const result: TagWeaknessScore[] = [];
    for (const [tag, { accepted, wrongAnswer }] of tagStats) {
      const total = accepted + wrongAnswer;
      if (total < 2) continue; // ignore tags with too few problems
      const weaknessScore = total > 0 ? wrongAnswer / total : 0;
      result.push({ tag, accepted, wrongAnswer, total, weaknessScore });
    }

    // Sort by weakness score descending
    return result.sort((a, b) => b.weaknessScore - a.weaknessScore);
  }

  private mapRatingHistory(
    ratingChanges: Array<{
      contestId: number;
      contestName: string;
      rank: number;
      ratingUpdateTimeSeconds: number;
      oldRating: number;
      newRating: number;
    }>,
  ): RatingDataPoint[] {
    return ratingChanges.map((rc) => ({
      date: new Date(rc.ratingUpdateTimeSeconds * 1000).toISOString(),
      rating: rc.newRating,
      contestName: rc.contestName,
      rank: rc.rank,
      delta: rc.newRating - rc.oldRating,
    }));
  }
}
