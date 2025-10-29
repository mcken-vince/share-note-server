import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Note, NoteType } from './entities/note.entity';
import { NoteItem } from './entities/note-item.entity';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { QueryNotesDto } from './dto/query-notes.dto';
import { NoteResponseDto } from './dto/note-response.dto';

@Injectable()
export class NotesService {
  constructor(
    @InjectModel(Note)
    private noteModel: typeof Note,
    @InjectModel(NoteItem)
    private noteItemModel: typeof NoteItem,
  ) {}

  /**
   * Create a new note
   */
  async create(
    createNoteDto: CreateNoteDto,
    userId: string,
  ): Promise<NoteResponseDto> {
    const { title, type, body, items, tags } = createNoteDto;

    // Validate based on note type
    if (type === NoteType.NOTE && !body) {
      throw new BadRequestException('Body is required for note type');
    }

    if (type === NoteType.CHECKLIST && (!items || items.length === 0)) {
      throw new BadRequestException(
        'Items are required for checklist type',
      );
    }

    // Create note
    const note = await this.noteModel.create({
      userId,
      title,
      type,
      body: type === NoteType.NOTE ? body : null,
      tags: tags || [],
    });

    // Create checklist items if applicable
    if (type === NoteType.CHECKLIST && items) {
      const noteItems = items.map((item, index) => ({
        noteId: note.id,
        checked: item.checked || false,
        body: item.body,
        order: item.order ?? index,
      }));

      await this.noteItemModel.bulkCreate(noteItems);
    }

    // Fetch complete note with items
    return this.findOne(note.id, userId);
  }

  /**
   * Find all notes for a user
   */
  async findAll(
    userId: string,
    queryDto?: QueryNotesDto,
  ): Promise<NoteResponseDto[]> {
    const where: any = { userId };

    // Filter by type
    if (queryDto?.type) {
      where.type = queryDto.type;
    }

    // Filter by tag
    if (queryDto?.tag) {
      where.tags = {
        [Op.contains]: [queryDto.tag],
      };
    }

    // Search in title and body
    if (queryDto?.search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${queryDto.search}%` } },
        { body: { [Op.iLike]: `%${queryDto.search}%` } },
      ];
    }

    // Include deleted notes if requested
    const paranoid = !queryDto?.includeDeleted;

    const notes = await this.noteModel.findAll({
      where,
      include: [
        {
          model: NoteItem,
          as: 'items',
          required: false,
        },
      ],
      order: [
        ['modifiedAt', 'DESC'],
        [{ model: NoteItem, as: 'items' }, 'order', 'ASC'],
      ],
      paranoid,
    });

    return notes.map((note) => this.formatNoteResponse(note));
  }

  /**
   * Find a single note by id
   */
  async findOne(id: string, userId: string): Promise<NoteResponseDto> {
    const note = await this.noteModel.findOne({
      where: { id },
      include: [
        {
          model: NoteItem,
          as: 'items',
          required: false,
        },
      ],
      order: [[{ model: NoteItem, as: 'items' }, 'order', 'ASC']],
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    // Check ownership
    if (note.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.formatNoteResponse(note);
  }

  /**
   * Update a note
   */
  async update(
    id: string,
    updateNoteDto: UpdateNoteDto,
    userId: string,
  ): Promise<NoteResponseDto> {
    const note = await this.noteModel.findByPk(id);

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    // Check ownership
    if (note.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const { title, type, body, items, tags } = updateNoteDto;

    // Validate type change
    if (type && type !== note.type) {
      if (type === NoteType.NOTE && !body && !updateNoteDto.body) {
        throw new BadRequestException(
          'Body is required when changing to note type',
        );
      }
      if (type === NoteType.CHECKLIST && (!items || items.length === 0)) {
        throw new BadRequestException(
          'Items are required when changing to checklist type',
        );
      }
    }

    // Update note fields
    if (title !== undefined) note.title = title;
    if (type !== undefined) note.type = type;
    if (body !== undefined) note.body = body;
    if (tags !== undefined) note.tags = tags;

    await note.save();

    // Update items if provided
    if (items !== undefined) {
      // Delete existing items
      await this.noteItemModel.destroy({ where: { noteId: id } });

      // Create new items
      if (items.length > 0) {
        const noteItems = items.map((item, index) => ({
          noteId: id,
          checked: item.checked || false,
          body: item.body,
          order: item.order ?? index,
        }));

        await this.noteItemModel.bulkCreate(noteItems);
      }
    }

    return this.findOne(id, userId);
  }

  /**
   * Soft delete a note
   */
  async remove(id: string, userId: string): Promise<void> {
    const note = await this.noteModel.findByPk(id);

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    // Check ownership
    if (note.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Soft delete (sets deletedAt)
    await note.destroy();
  }

  /**
   * Permanently delete a note
   */
  async hardDelete(id: string, userId: string): Promise<void> {
    const note = await this.noteModel.findByPk(id, { paranoid: false });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    // Check ownership
    if (note.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Hard delete - permanently removes from database
    await note.destroy({ force: true });
  }

  /**
   * Restore a soft-deleted note
   */
  async restore(id: string, userId: string): Promise<NoteResponseDto> {
    const note = await this.noteModel.findByPk(id, { paranoid: false });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    // Check ownership
    if (note.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    if (!note.deletedAt) {
      throw new BadRequestException('Note is not deleted');
    }

    await note.restore();

    return this.findOne(id, userId);
  }

  /**
   * Get all tags used by a user
   */
  async getTags(userId: string): Promise<string[]> {
    const notes = await this.noteModel.findAll({
      where: { userId },
      attributes: ['tags'],
    });

    const allTags = notes.reduce((acc, note) => {
      return [...acc, ...note.tags];
    }, [] as string[]);

    // Return unique tags
    return [...new Set(allTags)].sort();
  }

  /**
   * Get note statistics for a user
   */
  async getStats(userId: string): Promise<{
    total: number;
    notes: number;
    checklists: number;
    deleted: number;
  }> {
    const total = await this.noteModel.count({ where: { userId } });
    const notes = await this.noteModel.count({ where: { userId, type: NoteType.NOTE } });
    const checklists = await this.noteModel.count({ where: { userId, type: NoteType.CHECKLIST } });
    const totalIncludingDeleted = await this.noteModel.count({ where: { userId }, paranoid: false });
    const deleted = totalIncludingDeleted - total;

    return { total, notes, checklists, deleted };
  }

  /**
   * Format note response
   */
  private formatNoteResponse(note: Note): NoteResponseDto {
    return {
      id: note.id,
      userId: note.userId,
      title: note.title,
      type: note.type,
      body: note.body,
      items: note.items?.map((item) => ({
        checked: item.checked,
        body: item.body,
        order: item.order,
      })),
      tags: note.tags,
      createdAt: note.createdAt,
      modifiedAt: note.modifiedAt,
      deletedAt: note.deletedAt,
    };
  }
}
