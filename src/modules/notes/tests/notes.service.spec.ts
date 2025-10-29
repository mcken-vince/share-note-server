import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { NotesService } from '../notes.service';
import { Note, NoteType } from '../entities/note.entity';
import { NoteItem } from '../entities/note-item.entity';

describe('NotesService', () => {
  let service: NotesService;
  let noteModel: typeof Note;
  let noteItemModel: typeof NoteItem;

  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
  const mockNoteId = '123e4567-e89b-12d3-a456-426614174001';

  const mockNote = {
    id: mockNoteId,
    userId: mockUserId,
    title: 'Test Note',
    type: NoteType.NOTE,
    body: 'Test body',
    tags: ['test'],
    items: [],
    createdAt: new Date(),
    modifiedAt: new Date(),
    deletedAt: null,
    save: jest.fn(),
    destroy: jest.fn(),
    restore: jest.fn(),
  };

  const mockNoteModel = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    count: jest.fn(),
  };

  const mockNoteItemModel = {
    bulkCreate: jest.fn(),
    destroy: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotesService,
        {
          provide: getModelToken(Note),
          useValue: mockNoteModel,
        },
        {
          provide: getModelToken(NoteItem),
          useValue: mockNoteItemModel,
        },
      ],
    }).compile();

    service = module.get<NotesService>(NotesService);
    noteModel = module.get<typeof Note>(getModelToken(Note));
    noteItemModel = module.get<typeof NoteItem>(getModelToken(NoteItem));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a note type successfully', async () => {
      const createNoteDto = {
        title: 'Test Note',
        type: NoteType.NOTE,
        body: 'Test body',
        tags: ['test'],
      };

      mockNoteModel.create.mockResolvedValue(mockNote);
      mockNoteModel.findOne.mockResolvedValue({ ...mockNote, items: [] });

      const result = await service.create(createNoteDto, mockUserId);

      expect(result).toBeDefined();
      expect(mockNoteModel.create).toHaveBeenCalledWith({
        userId: mockUserId,
        title: createNoteDto.title,
        type: createNoteDto.type,
        body: createNoteDto.body,
        tags: createNoteDto.tags,
      });
    });

    it('should create a checklist type with items', async () => {
      const createNoteDto = {
        title: 'Test Checklist',
        type: NoteType.CHECKLIST,
        items: [
          { checked: false, body: 'Item 1' },
          { checked: true, body: 'Item 2' },
        ],
        tags: [],
      };

      const mockChecklistNote = {
        ...mockNote,
        type: NoteType.CHECKLIST,
        body: null,
      };

      mockNoteModel.create.mockResolvedValue(mockChecklistNote);
      mockNoteItemModel.bulkCreate.mockResolvedValue([]);
      mockNoteModel.findOne.mockResolvedValue({
        ...mockChecklistNote,
        items: createNoteDto.items,
      });

      const result = await service.create(createNoteDto, mockUserId);

      expect(result).toBeDefined();
      expect(mockNoteItemModel.bulkCreate).toHaveBeenCalled();
    });

    it('should throw BadRequestException if note type without body', async () => {
      const createNoteDto = {
        title: 'Test Note',
        type: NoteType.NOTE,
        tags: [],
      };

      await expect(
        service.create(createNoteDto as any, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if checklist type without items', async () => {
      const createNoteDto = {
        title: 'Test Checklist',
        type: NoteType.CHECKLIST,
        tags: [],
      };

      await expect(
        service.create(createNoteDto as any, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return all notes for a user', async () => {
      mockNoteModel.findAll.mockResolvedValue([mockNote]);

      const result = await service.findAll(mockUserId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(mockNoteModel.findAll).toHaveBeenCalled();
    });

    it('should filter by note type', async () => {
      mockNoteModel.findAll.mockResolvedValue([mockNote]);

      await service.findAll(mockUserId, { type: NoteType.NOTE });

      expect(mockNoteModel.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: NoteType.NOTE }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a note by id', async () => {
      mockNoteModel.findOne.mockResolvedValue(mockNote);

      const result = await service.findOne(mockNoteId, mockUserId);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockNoteId);
    });

    it('should throw NotFoundException if note not found', async () => {
      mockNoteModel.findOne.mockResolvedValue(null);

      await expect(service.findOne(mockNoteId, mockUserId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user does not own note', async () => {
      const differentUserNote = { ...mockNote, userId: 'different-user-id' };
      mockNoteModel.findOne.mockResolvedValue(differentUserNote);

      await expect(service.findOne(mockNoteId, mockUserId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('update', () => {
    it('should update a note', async () => {
      const updateNoteDto = { title: 'Updated Title' };
      const updatedNote = { ...mockNote, title: 'Updated Title' };

      mockNoteModel.findByPk.mockResolvedValue(mockNote);
      mockNote.save.mockResolvedValue(updatedNote);
      mockNoteModel.findOne.mockResolvedValue(updatedNote);

      const result = await service.update(
        mockNoteId,
        updateNoteDto,
        mockUserId,
      );

      expect(result.title).toBe('Updated Title');
      expect(mockNote.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if note not found', async () => {
      mockNoteModel.findByPk.mockResolvedValue(null);

      await expect(
        service.update(mockNoteId, {}, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own note', async () => {
      const differentUserNote = { ...mockNote, userId: 'different-user-id' };
      mockNoteModel.findByPk.mockResolvedValue(differentUserNote);

      await expect(
        service.update(mockNoteId, {}, mockUserId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should soft delete a note', async () => {
      mockNoteModel.findByPk.mockResolvedValue(mockNote);
      mockNote.destroy.mockResolvedValue(undefined);

      await service.remove(mockNoteId, mockUserId);

      expect(mockNote.destroy).toHaveBeenCalled();
    });

    it('should throw NotFoundException if note not found', async () => {
      mockNoteModel.findByPk.mockResolvedValue(null);

      await expect(service.remove(mockNoteId, mockUserId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getTags', () => {
    it('should return unique tags', async () => {
      mockNoteModel.findAll.mockResolvedValue([
        { tags: ['tag1', 'tag2'] },
        { tags: ['tag2', 'tag3'] },
      ]);

      const result = await service.getTags(mockUserId);

      expect(result).toEqual(['tag1', 'tag2', 'tag3']);
    });
  });

  describe('getStats', () => {
    it('should return note statistics', async () => {
      mockNoteModel.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(6) // notes
        .mockResolvedValueOnce(4) // checklists
        .mockResolvedValueOnce(12) // total including deleted
        .mockResolvedValueOnce(10); // total active

      const result = await service.getStats(mockUserId);

      expect(result).toEqual({
        total: 10,
        notes: 6,
        checklists: 4,
        deleted: 2,
      });
    });
  });
});
