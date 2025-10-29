import {
  IsString,
  IsNotEmpty,
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
 * DTO for creating a new note
 */
export class CreateNoteDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsEnum(NoteType)
  type: NoteType;

  @ValidateIf((o) => o.type === NoteType.NOTE)
  @IsNotEmpty({ message: 'Body is required for note type' })
  @IsString()
  body?: string;

  @ValidateIf((o) => o.type === NoteType.CHECKLIST)
  @IsArray()
  @ArrayMinSize(1, { message: 'Checklist must have at least one item' })
  @ValidateNested({ each: true })
  @Type(() => NoteItemDto)
  items?: NoteItemDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
