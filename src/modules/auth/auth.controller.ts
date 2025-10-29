import { Controller, Post, Body, Headers, UnauthorizedException, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto, UserResponseDto } from './dto/auth-response.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/auth/signup
   * Register a new user
   */
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() signupDto: SignupDto): Promise<AuthResponseDto> {
    return this.authService.signup(signupDto);
  }

  /**
   * POST /api/auth/login
   * Authenticate a user
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  /**
   * POST /api/auth/verify
   * Verify JWT token from Authorization header
   */
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verify(@Headers('authorization') authorization: string): Promise<{ user: UserResponseDto }> {
    if (!authorization) {
      throw new UnauthorizedException('Authorization header is required');
    }

    // Extract token from "Bearer <token>" format
    const token = this.extractTokenFromHeader(authorization);
    if (!token) {
      throw new UnauthorizedException('Invalid authorization header format');
    }

    const user = await this.authService.verifyToken(token);
    return { user };
  }

  /**
   * Helper method to extract token from Authorization header
   */
  private extractTokenFromHeader(authorization: string): string | null {
    const [type, token] = authorization.split(' ');
    return type === 'Bearer' ? token : null;
  }
}
