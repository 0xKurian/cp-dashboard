import { Controller, Get, Param } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import type { RecommendationsDto } from '@cp-dashboard/types';

@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recs: RecommendationsService) {}

  /**
   * GET /recommendations/:handle
   * Returns smart problem recommendations for the handle.
   */
  @Get(':handle')
  async getRecommendations(
    @Param('handle') handle: string,
  ): Promise<RecommendationsDto> {
    return this.recs.getRecommendations(handle);
  }
}
