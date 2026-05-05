import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { UserProfileDto } from '@cp-dashboard/types';

@Controller('users')
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * GET /users/:handle
   * Returns the cached user profile from the database.
   */
  @Get(':handle')
  async getProfile(@Param('handle') handle: string): Promise<UserProfileDto> {
    const user = await this.prisma.user.findUnique({
      where: { cfHandle: handle },
    });

    if (!user) {
      throw new NotFoundException(
        `User "${handle}" not found. Sync first with POST /sync/${handle}`,
      );
    }

    return {
      id: user.id,
      cfHandle: user.cfHandle,
      currentRating: user.currentRating,
      maxRating: user.maxRating,
      rank: user.rank,
      avatar: user.avatar,
      country: user.country,
      lastSynced: user.lastSynced?.toISOString() ?? null,
    };
  }
}
