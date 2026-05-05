import { Controller, Post, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { SyncService } from './sync.service';
import type { SyncResultDto } from '@cp-dashboard/types';

@Controller('sync')
export class SyncController {
  constructor(private readonly sync: SyncService) {}

  /**
   * POST /sync/:handle
   * Triggers a full data sync from Codeforces for the given handle.
   * Invalidates Redis cache and upserts all data into PostgreSQL.
   */
  @Post(':handle')
  @HttpCode(HttpStatus.OK)
  async syncUser(@Param('handle') handle: string): Promise<SyncResultDto> {
    return this.sync.syncUser(handle);
  }
}
