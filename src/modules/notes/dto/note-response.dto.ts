import { NoteType } from '../entities/note.entity';
import { NoteItemResponseDto } from './note-item.dto';

/**
 * Response DTO for Note
 */
export class NoteResponseDto {
  id: string;
  userId: string;
  title: string;
  type: NoteType;
  body?: string;
  items?: NoteItemResponseDto[];
  tags: string[];
  createdAt: Date;
  modifiedAt: Date;
  deletedAt?: Date;
}

/**
 * Response DTO for listing notes (can be extended with pagination info)
 */
export class NoteListResponseDto {
  notes: NoteResponseDto[];
  total: number;
}
