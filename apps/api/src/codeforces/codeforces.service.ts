import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { Redis } from 'ioredis';
import type {
  CfUserInfo,
  CfSubmission,
  CfRatingChange,
  ApiResponse,
} from '@cp-dashboard/types';

const CF_BASE = 'https://codeforces.com/api';
const CACHE_TTL_SECONDS = 20 * 60; // 20 minutes

interface CfProblemEntry {
  contestId: number;
  index: string;
  name: string;
  rating?: number;
  tags: string[];
  type: string;
}

interface CfProblemset {
  problems: CfProblemEntry[];
}

@Injectable()
export class CodeforcesService {
  private readonly logger = new Logger(CodeforcesService.name);
  private readonly http: AxiosInstance;
  private readonly redis: Redis;

  constructor(private readonly config: ConfigService) {
    this.http = axios.create({
      baseURL: CF_BASE,
      timeout: 15_000,
    });

    this.redis = new Redis(
      this.config.get<string>('REDIS_URL') ?? 'redis://localhost:6379',
    );
  }

  // ─── Private helpers ──────────────────────────────────────────

  private cacheKey(method: string, ...args: string[]): string {
    return `cf:${method}:${args.join(':')}`;
  }

  private async withCache<T>(
    key: string,
    fetcher: () => Promise<T>,
  ): Promise<T> {
    const cached = await this.redis.get(key);
    if (cached) {
      this.logger.debug(`Cache HIT: ${key}`);
      return JSON.parse(cached) as T;
    }

    this.logger.debug(`Cache MISS: ${key}`);
    const data = await fetcher();
    await this.redis.setex(key, CACHE_TTL_SECONDS, JSON.stringify(data));
    return data;
  }

  private async cfGet<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const res = await this.http.get<ApiResponse<T>>(endpoint, { params });
        if (res.data.status !== 'OK') {
          throw new HttpException(
            res.data.comment ?? 'Codeforces API error',
            HttpStatus.BAD_GATEWAY,
          );
        }
        return res.data.result;
      } catch (err: unknown) {
        lastError = err as Error;
        const isAxiosError = (e: unknown): e is { response?: { status?: number } } =>
          typeof e === 'object' && e !== null && 'response' in e;
        const status = isAxiosError(err) ? err.response?.status : undefined;

        // Rate limited — exponential backoff
        if (status === 503 || status === 429) {
          const delay = Math.pow(2, attempt) * 500;
          this.logger.warn(`CF API rate limited. Retrying in ${delay}ms...`);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        throw err;
      }
    }

    throw lastError ?? new Error('Codeforces API failed after retries');
  }

  // ─── Public API ───────────────────────────────────────────────

  async getUserInfo(handle: string): Promise<CfUserInfo> {
    const key = this.cacheKey('userInfo', handle);
    return this.withCache(key, async () => {
      const result = await this.cfGet<CfUserInfo[]>('/user.info', { handles: handle });
      if (!result[0]) {
        throw new HttpException(
          `User "${handle}" not found on Codeforces`,
          HttpStatus.NOT_FOUND,
        );
      }
      return result[0];
    });
  }

  async getUserSubmissions(handle: string): Promise<CfSubmission[]> {
    const key = this.cacheKey('submissions', handle);
    return this.withCache(key, () =>
      this.cfGet<CfSubmission[]>('/user.status', { handle, from: '1', count: '10000' }),
    );
  }

  async getRatingHistory(handle: string): Promise<CfRatingChange[]> {
    const key = this.cacheKey('ratingHistory', handle);
    return this.withCache(key, () =>
      this.cfGet<CfRatingChange[]>('/user.rating', { handle }),
    );
  }

  async getProblemset(): Promise<CfProblemset> {
    const key = this.cacheKey('problemset');
    return this.withCache(key, () =>
      this.cfGet<CfProblemset>('/problemset.problems'),
    );
  }

  // Invalidate cache for a user (e.g., after manual sync)
  async invalidateUserCache(handle: string): Promise<void> {
    const keys = [
      this.cacheKey('userInfo', handle),
      this.cacheKey('submissions', handle),
      this.cacheKey('ratingHistory', handle),
    ];
    await Promise.all(keys.map((k) => this.redis.del(k)));
    this.logger.log(`Cache invalidated for ${handle}`);
  }
}
