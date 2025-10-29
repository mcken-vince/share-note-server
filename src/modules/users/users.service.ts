import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
  ) {}

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
   * Find user by ID and return formatted response
   */
  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.userModel.findByPk(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return this.formatUserResponse(user);
  }

  /**
   * Find user by email and return formatted response
   */
  async findByEmail(email: string): Promise<UserResponseDto> {
    const user = await this.userModel.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
    return this.formatUserResponse(user);
  }

  /**
   * Update user profile (firstName and lastName only)
   * Email and password updates are not allowed
   */
  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.userModel.findByPk(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Only update firstName and lastName
    if (updateUserDto.firstName !== undefined) {
      user.firstName = updateUserDto.firstName;
    }
    if (updateUserDto.lastName !== undefined) {
      user.lastName = updateUserDto.lastName;
    }

    await user.save();
    return this.formatUserResponse(user);
  }

  /**
   * Update user password
   * Requires current password verification
   */
  async updatePassword(id: string, updatePasswordDto: UpdatePasswordDto): Promise<void> {
    const user = await this.userModel.findByPk(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Verify current password
    const isPasswordValid = await user.validatePassword(updatePasswordDto.currentPassword);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Update to new password (will be hashed automatically by the entity hook)
    user.password = updatePasswordDto.newPassword;
    await user.save();
  }
}
