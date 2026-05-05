import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { NotesService } from './notes.service';
import { UpsertNoteBodyDto } from './dto/upsert-note.dto';
import type { NoteDto } from '@cp-dashboard/types';

@Controller('notes')
export class NotesController {
  constructor(private readonly notes: NotesService) {}

  /**
   * GET /notes/:problemId?handle=tourist
   * Returns the note for a problem for the given handle.
   */
  @Get(':problemId')
  async findOne(
    @Param('problemId') problemId: string,
    @Query('handle') handle: string,
  ): Promise<NoteDto | null> {
    return this.notes.findByProblem(problemId, handle);
  }

  /**
   * PUT /notes/:problemId?handle=tourist
   * Creates or updates a note for the given problem+handle.
   */
  @Put(':problemId')
  async upsert(
    @Param('problemId') problemId: string,
    @Query('handle') handle: string,
    @Body() dto: UpsertNoteBodyDto,
  ): Promise<NoteDto> {
    return this.notes.upsert(problemId, handle, dto);
  }

  /**
   * GET /notes?handle=tourist
   * Returns all notes for a given user handle.
   */
  @Get()
  async findAll(@Query('handle') handle: string): Promise<NoteDto[]> {
    return this.notes.getAllForUser(handle);
  }
}
