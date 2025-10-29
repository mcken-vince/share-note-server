import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verify } from 'jsonwebtoken';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;

    if (!authorization) {
      throw new UnauthorizedException('Authorization header is required');
    }

    const token = this.extractTokenFromHeader(authorization);
    if (!token) {
      throw new UnauthorizedException('Invalid authorization header format');
    }

    try {
      const jwtSecret =
        this.configService.get<string>('JWT_SECRET') ||
        'your-secret-key-change-in-production';
      const payload = verify(token, jwtSecret);
      request.user = payload;
      return true;
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid token');
      }
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token has expired');
      }
      throw new UnauthorizedException('Unauthorized');
    }
  }

  private extractTokenFromHeader(authorization: string): string | null {
    const [type, token] = authorization.split(' ');
    return type === 'Bearer' ? token : null;
  }
}
