import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotesController } from '../notes.controller';
import { NotesService } from '../notes.service';
import { NoteType } from '../entities/note.entity';
import { AuthGuard } from '../../../common/guards/auth.guard';

describe('NotesController', () => {
  let controller: NotesController;
  let service: NotesService;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
  };

  const mockNoteResponse = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    userId: mockUser.id,
    title: 'Test Note',
    type: NoteType.NOTE,
    body: 'Test body',
    tags: ['test'],
    items: [],
    createdAt: new Date(),
    modifiedAt: new Date(),
  };

  const mockNotesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    hardDelete: jest.fn(),
    restore: jest.fn(),
    getTags: jest.fn(),
    getStats: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        JWT_SECRET: 'test-secret',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotesController],
      providers: [
        {
          provide: NotesService,
          useValue: mockNotesService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        AuthGuard,
      ],
    }).compile();

    controller = module.get<NotesController>(NotesController);
    service = module.get<NotesService>(NotesService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a note', async () => {
      const createNoteDto = {
        title: 'Test Note',
        type: NoteType.NOTE,
        body: 'Test body',
        tags: ['test'],
      };

      mockNotesService.create.mockResolvedValue(mockNoteResponse);

      const result = await controller.create(createNoteDto, mockUser);

      expect(result).toEqual(mockNoteResponse);
      expect(service.create).toHaveBeenCalledWith(createNoteDto, mockUser.id);
    });
  });

  describe('findAll', () => {
    it('should return all notes', async () => {
      mockNotesService.findAll.mockResolvedValue([mockNoteResponse]);

      const result = await controller.findAll(mockUser, {});

      expect(result).toEqual([mockNoteResponse]);
      expect(service.findAll).toHaveBeenCalledWith(mockUser.id, {});
    });
  });

  describe('findOne', () => {
    it('should return a single note', async () => {
      mockNotesService.findOne.mockResolvedValue(mockNoteResponse);

      const result = await controller.findOne(mockNoteResponse.id, mockUser);

      expect(result).toEqual(mockNoteResponse);
      expect(service.findOne).toHaveBeenCalledWith(
        mockNoteResponse.id,
        mockUser.id,
      );
    });
  });

  describe('update', () => {
    it('should update a note', async () => {
      const updateNoteDto = { title: 'Updated Title' };
      const updatedNote = { ...mockNoteResponse, title: 'Updated Title' };

      mockNotesService.update.mockResolvedValue(updatedNote);

      const result = await controller.update(
        mockNoteResponse.id,
        updateNoteDto,
        mockUser,
      );

      expect(result).toEqual(updatedNote);
      expect(service.update).toHaveBeenCalledWith(
        mockNoteResponse.id,
        updateNoteDto,
        mockUser.id,
      );
    });
  });

  describe('remove', () => {
    it('should soft delete a note', async () => {
      mockNotesService.remove.mockResolvedValue(undefined);

      await controller.remove(mockNoteResponse.id, mockUser);

      expect(service.remove).toHaveBeenCalledWith(
        mockNoteResponse.id,
        mockUser.id,
      );
    });
  });

  describe('hardDelete', () => {
    it('should permanently delete a note', async () => {
      mockNotesService.hardDelete.mockResolvedValue(undefined);

      await controller.hardDelete(mockNoteResponse.id, mockUser);

      expect(service.hardDelete).toHaveBeenCalledWith(
        mockNoteResponse.id,
        mockUser.id,
      );
    });
  });

  describe('restore', () => {
    it('should restore a deleted note', async () => {
      mockNotesService.restore.mockResolvedValue(mockNoteResponse);

      const result = await controller.restore(mockNoteResponse.id, mockUser);

      expect(result).toEqual(mockNoteResponse);
      expect(service.restore).toHaveBeenCalledWith(
        mockNoteResponse.id,
        mockUser.id,
      );
    });
  });

  describe('getTags', () => {
    it('should return all tags', async () => {
      const tags = ['tag1', 'tag2', 'tag3'];
      mockNotesService.getTags.mockResolvedValue(tags);

      const result = await controller.getTags(mockUser);

      expect(result).toEqual(tags);
      expect(service.getTags).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('getStats', () => {
    it('should return note statistics', async () => {
      const stats = { total: 10, notes: 6, checklists: 4, deleted: 2 };
      mockNotesService.getStats.mockResolvedValue(stats);

      const result = await controller.getStats(mockUser);

      expect(result).toEqual(stats);
      expect(service.getStats).toHaveBeenCalledWith(mockUser.id);
    });
  });
});
