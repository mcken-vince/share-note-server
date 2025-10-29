import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users.service';
import { User } from '../entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;
  let userModel: typeof User;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    password: 'hashedPassword123',
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn(),
    validatePassword: jest.fn(),
  };

  const mockUserModel = {
    findOne: jest.fn(),
    findByPk: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userModel = module.get<typeof User>(getModelToken(User));

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('should find user by id and return formatted response', async () => {
      mockUserModel.findByPk.mockResolvedValue(mockUser);

      const result = await service.findById(mockUser.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockUser.id);
      expect(result.email).toBe(mockUser.email);
      expect(result).not.toHaveProperty('password');
      expect(mockUserModel.findByPk).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserModel.findByPk.mockResolvedValue(null);

      await expect(service.findById('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByEmail', () => {
    it('should find user by email and return formatted response', async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail(mockUser.email);

      expect(result).toBeDefined();
      expect(result.email).toBe(mockUser.email);
      expect(result).not.toHaveProperty('password');
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        where: { email: mockUser.email },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserModel.findOne.mockResolvedValue(null);

      await expect(service.findByEmail('nonexistent@example.com')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateUser', () => {
    it('should update user firstName and lastName', async () => {
      const updateDto = {
        firstName: 'Jane',
        lastName: 'Smith',
      };

      const updatedUser = {
        ...mockUser,
        firstName: 'Jane',
        lastName: 'Smith',
        save: jest.fn().mockResolvedValue(undefined),
      };

      mockUserModel.findByPk.mockResolvedValue(updatedUser);

      const result = await service.updateUser(mockUser.id, updateDto);

      expect(result.firstName).toBe('Jane');
      expect(result.lastName).toBe('Smith');
      expect(result).not.toHaveProperty('password');
      expect(updatedUser.save).toHaveBeenCalled();
    });

    it('should update only firstName', async () => {
      const updateDto = {
        firstName: 'Jane',
      };

      const updatedUser = {
        ...mockUser,
        firstName: 'Jane',
        save: jest.fn().mockResolvedValue(undefined),
      };

      mockUserModel.findByPk.mockResolvedValue(updatedUser);

      const result = await service.updateUser(mockUser.id, updateDto);

      expect(result.firstName).toBe('Jane');
      expect(result.lastName).toBe(mockUser.lastName);
      expect(updatedUser.save).toHaveBeenCalled();
    });

    it('should update only lastName', async () => {
      const updateDto = {
        lastName: 'Smith',
      };

      const updatedUser = {
        ...mockUser,
        lastName: 'Smith',
        save: jest.fn().mockResolvedValue(undefined),
      };

      mockUserModel.findByPk.mockResolvedValue(updatedUser);

      const result = await service.updateUser(mockUser.id, updateDto);

      expect(result.firstName).toBe(mockUser.firstName);
      expect(result.lastName).toBe('Smith');
      expect(updatedUser.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserModel.findByPk.mockResolvedValue(null);

      await expect(
        service.updateUser('nonexistent-id', { firstName: 'Jane' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updatePassword', () => {
    it('should update password when current password is correct', async () => {
      const updatePasswordDto = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword123',
      };

      const userWithPassword = {
        ...mockUser,
        validatePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(undefined),
      };

      mockUserModel.findByPk.mockResolvedValue(userWithPassword);

      await service.updatePassword(mockUser.id, updatePasswordDto);

      expect(userWithPassword.validatePassword).toHaveBeenCalledWith('oldPassword123');
      expect(userWithPassword.password).toBe('newPassword123');
      expect(userWithPassword.save).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if current password is incorrect', async () => {
      const updatePasswordDto = {
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword123',
      };

      const userWithPassword = {
        ...mockUser,
        validatePassword: jest.fn().mockResolvedValue(false),
      };

      mockUserModel.findByPk.mockResolvedValue(userWithPassword);

      await expect(
        service.updatePassword(mockUser.id, updatePasswordDto),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserModel.findByPk.mockResolvedValue(null);

      await expect(
        service.updatePassword('nonexistent-id', {
          currentPassword: 'oldPassword',
          newPassword: 'newPassword',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
