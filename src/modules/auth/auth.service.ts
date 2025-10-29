import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';
import { sign, verify } from 'jsonwebtoken';
import { User } from '../users/entities/user.entity';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto, UserResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string | number;

  constructor(
    @InjectModel(User)
    private userModel: typeof User,
    private configService: ConfigService,
  ) {
    this.jwtSecret = this.configService.get<string>('JWT_SECRET') || 'your-secret-key-change-in-production';
    this.jwtExpiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '24h';
  }

  /**
   * Generate JWT token for a user
   */
  private generateToken(user: User): string {
    const payload = {
      id: user.id,
      email: user.email,
    };

    return sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn as any,
    });
  }

  /**
   * Format user response (exclude password)
   */
  private formatUserResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * User signup
   */
  async signup(signupDto: SignupDto): Promise<AuthResponseDto> {
    const { firstName, lastName, email, password } = signupDto;

    // Check if user already exists
    const existingUser = await this.userModel.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Create new user (password will be hashed automatically by the entity hook)
    const user = await this.userModel.create({
      firstName,
      lastName,
      email,
      password,
    });

    // Generate token
    const token = this.generateToken(user);

    return {
      token,
      user: this.formatUserResponse(user),
    };
  }

  /**
   * User login
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.userModel.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Validate password
    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Generate token
    const token = this.generateToken(user);

    return {
      token,
      user: this.formatUserResponse(user),
    };
  }

  /**
   * Verify JWT token and return user
   */
  async verifyToken(token: string): Promise<UserResponseDto> {
    try {
      // Verify token
      const decoded = verify(token, this.jwtSecret) as any;

      // Find user
      const user = await this.userModel.findByPk(decoded.id);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return this.formatUserResponse(user);
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid token');
      }
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token has expired');
      }
      throw error;
    }
  }
}
