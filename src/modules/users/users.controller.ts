import { Controller, Get, Post, Param, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /api/user/:id
   * Get user by ID
   */
  @Get(':id')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async getUserById(@Param('id') id: string): Promise<UserResponseDto> {
    return this.usersService.findById(id);
  }

  /**
   * GET /api/user/email/:email
   * Get user by email
   */
  @Get('email/:email')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async getUserByEmail(@Param('email') email: string): Promise<UserResponseDto> {
    return this.usersService.findByEmail(email);
  }

  /**
   * POST /api/user/:id
   * Update user profile (firstName and lastName only)
   * Email and password cannot be updated through this endpoint
   */
  @Post(':id')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateUser(id, updateUserDto);
  }

  /**
   * POST /api/user/:id/password
   * Update user password
   * Requires current password for security
   */
  @Post(':id/password')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async updatePassword(
    @Param('id') id: string,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ): Promise<{ message: string }> {
    await this.usersService.updatePassword(id, updatePasswordDto);
    return { message: 'Password updated successfully' };
  }
}
