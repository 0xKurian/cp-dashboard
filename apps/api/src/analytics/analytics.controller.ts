import { Controller, Get, Param } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import type { AnalyticsSummaryDto } from '@cp-dashboard/types';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  /**
   * GET /analytics/:handle
   * Returns full analytics summary: rating history + tag weaknesses.
   */
  @Get(':handle')
  async getSummary(
    @Param('handle') handle: string,
  ): Promise<AnalyticsSummaryDto> {
    return this.analytics.getSummary(handle);
  }
}
