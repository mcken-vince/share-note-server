import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { QueryNotesDto } from './dto/query-notes.dto';
import { NoteResponseDto } from './dto/note-response.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

interface JwtPayload {
  id: string;
  email: string;
}

@Controller('notes')
@UseGuards(AuthGuard)
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  /**
   * Create a new note
   * POST /api/notes
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createNoteDto: CreateNoteDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<NoteResponseDto> {
    return this.notesService.create(createNoteDto, user.id);
  }

  /**
   * Get all notes for the current user
   * GET /api/notes
   */
  @Get()
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query() queryDto: QueryNotesDto,
  ): Promise<NoteResponseDto[]> {
    return this.notesService.findAll(user.id, queryDto);
  }

  /**
   * Get note statistics
   * GET /api/notes/stats
   */
  @Get('stats')
  async getStats(@CurrentUser() user: JwtPayload) {
    return this.notesService.getStats(user.id);
  }

  /**
   * Get all tags used by the current user
   * GET /api/notes/tags
   */
  @Get('tags')
  async getTags(@CurrentUser() user: JwtPayload): Promise<string[]> {
    return this.notesService.getTags(user.id);
  }

  /**
   * Get a single note by id
   * GET /api/notes/:id
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<NoteResponseDto> {
    return this.notesService.findOne(id, user.id);
  }

  /**
   * Update a note
   * PATCH /api/notes/:id
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateNoteDto: UpdateNoteDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<NoteResponseDto> {
    return this.notesService.update(id, updateNoteDto, user.id);
  }

  /**
   * Soft delete a note
   * DELETE /api/notes/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    await this.notesService.remove(id, user.id);
  }

  /**
   * Permanently delete a note
   * DELETE /api/notes/:id/hard
   */
  @Delete(':id/hard')
  @HttpCode(HttpStatus.NO_CONTENT)
  async hardDelete(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    await this.notesService.hardDelete(id, user.id);
  }

  /**
   * Restore a soft-deleted note
   * POST /api/notes/:id/restore
   */
  @Post(':id/restore')
  async restore(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<NoteResponseDto> {
    return this.notesService.restore(id, user.id);
  }
}
