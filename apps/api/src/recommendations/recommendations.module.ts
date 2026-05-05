import { Module } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { RecommendationsController } from './recommendations.controller';
import { CodeforcesModule } from '../codeforces/codeforces.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [CodeforcesModule, AnalyticsModule],
  providers: [RecommendationsService],
  controllers: [RecommendationsController],
})
export class RecommendationsModule {}
