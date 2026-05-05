import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { CodeforcesModule } from './codeforces/codeforces.module';
import { SyncModule } from './sync/sync.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { NotesModule } from './notes/notes.module';
import { UsersModule } from './users/users.module';
import { ProblemsModule } from './problems/problems.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    // Load .env files
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),

    // Rate limiting: 100 requests per minute globally
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 100,
      },
    ]),

    PrismaModule,
    CodeforcesModule,
    SyncModule,
    AnalyticsModule,
    RecommendationsModule,
    NotesModule,
    UsersModule,
    ProblemsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
