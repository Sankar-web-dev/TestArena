import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length } from 'class-validator';

/**
 * Admin-only student creation. Only name + email are asked
 * of the admin — the username is generated from the name and
 * the default password is set server-side, keeping account
 * creation a two-field operation. The role is never a client
 * input; the controller always forces STUDENT.
 */
export class CreateStudentDto {
  @Transform(({ value }) => String(value ?? '').trim())
  @IsString()
  @Length(2, 80)
  name: string;

  @Transform(({ value }) =>
    String(value ?? '').trim().toLowerCase(),
  )
  @IsEmail()
  email: string;
}
