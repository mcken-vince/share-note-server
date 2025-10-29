import { IsBoolean, IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

/**
 * DTO for NoteItem
 */
export class NoteItemDto {
  @IsBoolean()
  checked: boolean;

  @IsNotEmpty()
  @IsString()
  body: string;

  @IsOptional()
  @IsNumber()
  order?: number;
}

/**
 * Response DTO for NoteItem
 */
export class NoteItemResponseDto {
  checked: boolean;
  body: string;
  order?: number;
}
