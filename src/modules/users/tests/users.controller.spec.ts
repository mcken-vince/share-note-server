import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../users.controller';
import { UsersService } from '../users.service';
import { ConfigService } from '@nestjs/config';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUserResponse = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUsersService = {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    updateUser: jest.fn(),
    updatePassword: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      mockUsersService.findById.mockResolvedValue(mockUserResponse);

      const result = await controller.getUserById(userId);

      expect(result).toEqual(mockUserResponse);
      expect(service.findById).toHaveBeenCalledWith(userId);
    });
  });

  describe('getUserByEmail', () => {
    it('should return user by email', async () => {
      const email = 'john@example.com';

      mockUsersService.findByEmail.mockResolvedValue(mockUserResponse);

      const result = await controller.getUserByEmail(email);

      expect(result).toEqual(mockUserResponse);
      expect(service.findByEmail).toHaveBeenCalledWith(email);
    });
  });

  describe('updateUser', () => {
    it('should update user profile', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const updateDto = {
        firstName: 'Jane',
        lastName: 'Smith',
      };

      const updatedUser = {
        ...mockUserResponse,
        ...updateDto,
      };

      mockUsersService.updateUser.mockResolvedValue(updatedUser);

      const result = await controller.updateUser(userId, updateDto);

      expect(result).toEqual(updatedUser);
      expect(service.updateUser).toHaveBeenCalledWith(userId, updateDto);
    });

    it('should update only firstName', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const updateDto = {
        firstName: 'Jane',
      };

      const updatedUser = {
        ...mockUserResponse,
        firstName: 'Jane',
      };

      mockUsersService.updateUser.mockResolvedValue(updatedUser);

      const result = await controller.updateUser(userId, updateDto);

      expect(result).toEqual(updatedUser);
      expect(service.updateUser).toHaveBeenCalledWith(userId, updateDto);
    });
  });

  describe('updatePassword', () => {
    it('should update user password', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const updatePasswordDto = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword123',
      };

      mockUsersService.updatePassword.mockResolvedValue(undefined);

      const result = await controller.updatePassword(userId, updatePasswordDto);

      expect(result).toEqual({ message: 'Password updated successfully' });
      expect(service.updatePassword).toHaveBeenCalledWith(userId, updatePasswordDto);
    });
  });
});
