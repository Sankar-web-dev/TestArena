import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

/**
 * Admin profile edits. Role and status are deliberately not
 * updatable through this DTO.
 */
export class UpdateUserDto {
  @IsOptional()
  @Transform(({ value }) => String(value ?? '').trim())
  @IsString()
  @Length(2, 80)
  name?: string;

  @IsOptional()
  @Transform(({ value }) =>
    String(value ?? '').trim().toLowerCase(),
  )
  @IsString()
  @Matches(/^[a-z0-9_.-]{3,30}$/, {
    message:
      'username must be 3-30 characters: lowercase letters, numbers, "_", ".", "-"',
  })
  username?: string;

  @IsOptional()
  @Transform(({ value }) =>
    String(value ?? '').trim().toLowerCase(),
  )
  @IsEmail()
  email?: string;
}
