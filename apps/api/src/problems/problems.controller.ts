import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('problems')
export class ProblemsController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * GET /problems/:id
   * Returns problem metadata by ID (e.g. "1900A").
   */
  @Get(':id')
  async getProblem(@Param('id') id: string) {
    const problem = await this.prisma.problem.findUnique({ where: { id } });
    if (!problem) {
      throw new NotFoundException(`Problem "${id}" not found`);
    }
    return problem;
  }
}
