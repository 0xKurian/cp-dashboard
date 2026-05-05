import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertNoteBodyDto } from './dto/upsert-note.dto';
import type { NoteDto } from '@cp-dashboard/types';

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  private toDto(note: {
    id: string;
    userId: string;
    problemId: string;
    content: string;
    code: string | null;
    language: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): NoteDto {
    return {
      id: note.id,
      userId: note.userId,
      problemId: note.problemId,
      content: note.content,
      code: note.code,
      language: note.language,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
    };
  }

  async findByProblem(
    problemId: string,
    handle: string,
  ): Promise<NoteDto | null> {
    const user = await this.prisma.user.findUnique({ where: { cfHandle: handle } });
    if (!user) return null;

    const note = await this.prisma.note.findUnique({
      where: { userId_problemId: { userId: user.id, problemId } },
    });

    return note ? this.toDto(note) : null;
  }

  async upsert(
    problemId: string,
    handle: string,
    dto: UpsertNoteBodyDto,
  ): Promise<NoteDto> {
    const user = await this.prisma.user.findUnique({ where: { cfHandle: handle } });
    if (!user) {
      throw new NotFoundException(`User "${handle}" not found. Sync first.`);
    }

    // Ensure problem exists (create placeholder if needed)
    const problem = await this.prisma.problem.findUnique({ where: { id: problemId } });
    if (!problem) {
      await this.prisma.problem.create({
        data: {
          id: problemId,
          contestId: 0,
          index: '',
          name: problemId,
          tags: [],
          url: `https://codeforces.com/problemset/problem/${problemId}`,
        },
      });
    }

    const note = await this.prisma.note.upsert({
      where: { userId_problemId: { userId: user.id, problemId } },
      create: {
        userId: user.id,
        problemId,
        content: dto.content,
        code: dto.code ?? null,
        language: dto.language ?? null,
      },
      update: {
        content: dto.content,
        code: dto.code ?? null,
        language: dto.language ?? null,
      },
    });

    return this.toDto(note);
  }

  async getAllForUser(handle: string): Promise<NoteDto[]> {
    const user = await this.prisma.user.findUnique({ where: { cfHandle: handle } });
    if (!user) return [];

    const notes = await this.prisma.note.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
    });

    return notes.map(this.toDto);
  }
}
