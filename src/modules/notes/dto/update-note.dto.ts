import {
  IsString,
  IsEnum,
  IsArray,
  IsOptional,
  ValidateNested,
  ValidateIf,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { NoteType } from '../entities/note.entity';
import { NoteItemDto } from './note-item.dto';

/**
 * DTO for updating an existing note
 * All fields are optional since it's a partial update
 */
export class UpdateNoteDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEnum(NoteType)
  type?: NoteType;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NoteItemDto)
  items?: NoteItemDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
