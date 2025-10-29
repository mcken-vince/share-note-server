import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthResponse = {
    token: 'mock.jwt.token',
    user: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  const mockUserResponse = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAuthService = {
    signup: jest.fn(),
    login: jest.fn(),
    verifyToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signup', () => {
    it('should create a new user', async () => {
      const signupDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      mockAuthService.signup.mockResolvedValue(mockAuthResponse);

      const result = await controller.signup(signupDto);

      expect(result).toEqual(mockAuthResponse);
      expect(service.signup).toHaveBeenCalledWith(signupDto);
    });
  });

  describe('login', () => {
    it('should login user', async () => {
      const loginDto = {
        email: 'john@example.com',
        password: 'password123',
      };

      mockAuthService.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.login(loginDto);

      expect(result).toEqual(mockAuthResponse);
      expect(service.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('verify', () => {
    it('should verify token and return user', async () => {
      const authorization = 'Bearer mock.jwt.token';

      mockAuthService.verifyToken.mockResolvedValue(mockUserResponse);

      const result = await controller.verify(authorization);

      expect(result).toEqual({ user: mockUserResponse });
      expect(service.verifyToken).toHaveBeenCalledWith('mock.jwt.token');
    });

    it('should throw UnauthorizedException if authorization header is missing', async () => {
      await expect(controller.verify(undefined)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if authorization format is invalid', async () => {
      await expect(controller.verify('InvalidFormat')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
