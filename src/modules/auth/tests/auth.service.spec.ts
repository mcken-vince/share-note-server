import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { User } from '../../users/entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let userModel: typeof User;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    password: 'hashedPassword123',
    createdAt: new Date(),
    updatedAt: new Date(),
    validatePassword: jest.fn(),
  };

  const mockUserModel = {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        JWT_SECRET: 'test-secret',
        JWT_EXPIRES_IN: '24h',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken(User),
          useValue: mockUserModel,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userModel = module.get<typeof User>(getModelToken(User));

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signup', () => {
    it('should create a new user and return token', async () => {
      const signupDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.create.mockResolvedValue(mockUser);

      const result = await service.signup(signupDto);

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(signupDto.email);
      expect(result.user).not.toHaveProperty('password');
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        where: { email: signupDto.email },
      });
      expect(mockUserModel.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if user already exists', async () => {
      const signupDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      mockUserModel.findOne.mockResolvedValue(mockUser);

      await expect(service.signup(signupDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    it('should login user and return token', async () => {
      const loginDto = {
        email: 'john@example.com',
        password: 'password123',
      };

      const userWithValidate = {
        ...mockUser,
        validatePassword: jest.fn().mockResolvedValue(true),
      };

      mockUserModel.findOne.mockResolvedValue(userWithValidate);

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(loginDto.email);
      expect(userWithValidate.validatePassword).toHaveBeenCalledWith(
        loginDto.password,
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      mockUserModel.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      const loginDto = {
        email: 'john@example.com',
        password: 'wrongpassword',
      };

      const userWithValidate = {
        ...mockUser,
        validatePassword: jest.fn().mockResolvedValue(false),
      };

      mockUserModel.findOne.mockResolvedValue(userWithValidate);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token and return user', async () => {
      // Generate a valid token with the test secret
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        { id: mockUser.id, email: mockUser.email },
        'test-secret',
        { expiresIn: '24h' }
      );

      mockUserModel.findByPk.mockResolvedValue(mockUser);

      const result = await service.verifyToken(token);

      expect(result).toBeDefined();
      expect(result.email).toBe(mockUser.email);
      expect(result).not.toHaveProperty('password');
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      const invalidToken = 'invalid.token.here';

      await expect(service.verifyToken(invalidToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
