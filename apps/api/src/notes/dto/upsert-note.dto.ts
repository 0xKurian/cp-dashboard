import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpsertNoteBodyDto {
  @IsString()
  @MaxLength(50_000)
  content!: string;

  @IsString()
  @IsOptional()
  @MaxLength(100_000)
  code?: string;

  @IsString()
  @IsOptional()
  language?: string;
}
