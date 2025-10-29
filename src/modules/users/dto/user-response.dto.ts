export class UserResponseDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export class AuthResponseDto {
  token: string;
  user: UserResponseDto;
}
