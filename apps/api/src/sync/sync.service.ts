import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CodeforcesService } from '../codeforces/codeforces.service';
import type { SyncResultDto } from '@cp-dashboard/types';
import type { CfSubmission } from '@cp-dashboard/types';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cf: CodeforcesService,
  ) {}

  async syncUser(handle: string): Promise<SyncResultDto> {
    this.logger.log(`Starting sync for ${handle}`);

    // 1. Invalidate old cache so we get fresh data
    await this.cf.invalidateUserCache(handle);

    // 2. Fetch user info from CF
    let cfUser;
    try {
      cfUser = await this.cf.getUserInfo(handle);
    } catch {
      throw new HttpException(
        `Codeforces user "${handle}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    // 3. Upsert User record
    const user = await this.prisma.user.upsert({
      where: { cfHandle: handle },
      create: {
        cfHandle: handle,
        currentRating: cfUser.rating ?? null,
        maxRating: cfUser.maxRating ?? null,
        rank: cfUser.rank ?? null,
        maxRank: cfUser.maxRank ?? null,
        avatar: cfUser.avatar ?? null,
        country: cfUser.country ?? null,
        organization: cfUser.organization ?? null,
        contribution: cfUser.contribution ?? 0,
        friendOfCount: cfUser.friendOfCount ?? 0,
        lastSynced: new Date(),
      },
      update: {
        currentRating: cfUser.rating ?? null,
        maxRating: cfUser.maxRating ?? null,
        rank: cfUser.rank ?? null,
        maxRank: cfUser.maxRank ?? null,
        avatar: cfUser.avatar ?? null,
        country: cfUser.country ?? null,
        organization: cfUser.organization ?? null,
        contribution: cfUser.contribution ?? 0,
        friendOfCount: cfUser.friendOfCount ?? 0,
        lastSynced: new Date(),
      },
    });

    // 4. Fetch submissions
    const submissions = await this.cf.getUserSubmissions(handle);

    // 5. Upsert each unique problem and submission
    let problemsCount = 0;
    let submissionsCount = 0;

    // Batch-process in chunks of 50 to avoid overwhelming Prisma
    const chunks = this.chunkArray(submissions, 50);

    for (const chunk of chunks) {
      await this.processSubmissionChunk(chunk, user.id);
      submissionsCount += chunk.length;
    }

    // Count unique problems
    const uniqueProblems = new Set(
      submissions.map((s) => this.problemId(s)),
    );
    problemsCount = uniqueProblems.size;

    this.logger.log(
      `Sync complete for ${handle}: ${submissionsCount} submissions, ${problemsCount} problems`,
    );

    return {
      handle,
      submissionsCount,
      problemsCount,
      syncedAt: new Date().toISOString(),
    };
  }

  private problemId(submission: CfSubmission): string {
    const contestId = submission.contestId ?? submission.problem.contestId;
    return `${contestId}${submission.problem.index}`;
  }

  private async processSubmissionChunk(
    submissions: CfSubmission[],
    userId: string,
  ): Promise<void> {
    for (const sub of submissions) {
      const p = sub.problem;
      const contestId = sub.contestId ?? p.contestId;
      if (!contestId) continue;

      const pid = `${contestId}${p.index}`;
      const url = `https://codeforces.com/contest/${contestId}/problem/${p.index}`;

      // Upsert Problem (create-once, no update needed)
      await this.prisma.problem.upsert({
        where: { id: pid },
        create: {
          id: pid,
          contestId,
          index: p.index,
          name: p.name,
          rating: p.rating ?? null,
          tags: p.tags,
          url,
          problemType: p.type ?? 'PROGRAMMING',
        },
        update: {
          // Update rating/tags as they can change
          rating: p.rating ?? null,
          tags: p.tags,
        },
      });

      // Upsert Submission
      await this.prisma.submission.upsert({
        where: { id: String(sub.id) },
        create: {
          id: String(sub.id),
          userId,
          problemId: pid,
          verdict: sub.verdict ?? 'TESTING',
          language: sub.programmingLanguage,
          passedTestCount: sub.passedTestCount ?? 0,
          timeConsumed: sub.timeConsumedMillis ?? null,
          memoryConsumed: sub.memoryConsumedBytes
            ? Math.round(sub.memoryConsumedBytes / 1024)
            : null,
          submittedAt: new Date(sub.creationTimeSeconds * 1000),
        },
        update: {
          verdict: sub.verdict ?? 'TESTING',
          passedTestCount: sub.passedTestCount ?? 0,
        },
      });
    }
  }

  private chunkArray<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  }
}
