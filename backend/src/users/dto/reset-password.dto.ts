import { IsString, Matches } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/, {
    message:
      'password must be at least 8 characters and contain a letter and a number',
  })
  password: string;
}
