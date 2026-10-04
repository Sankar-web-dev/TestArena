import {
  IsOptional,
  IsString,
} from 'class-validator';

export class EnterTestDto {
  @IsString()
  @IsOptional()
  password?: string;
}
