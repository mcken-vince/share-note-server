import { IsOptional, IsEnum, IsString, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { NoteType } from '../entities/note.entity';

/**
 * DTO for querying/filtering notes
 */
export class QueryNotesDto {
  @IsOptional()
  @IsEnum(NoteType)
  type?: NoteType;

  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeDeleted?: boolean;
}
