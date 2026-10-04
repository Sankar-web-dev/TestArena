import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';

export class UpdateTestDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  duration?: number;

  /** Only re-hashed when a non-empty value is provided. */
  @IsString()
  @ValidateIf((o: UpdateTestDto) => o.password !== undefined)
  @IsOptional()
  password?: string;

  /** Pass null to clear the scheduled window. */
  @ValidateIf((o: UpdateTestDto) => o.startTime !== null)
  @IsDateString()
  @IsOptional()
  startTime?: string | null;

  @ValidateIf((o: UpdateTestDto) => o.endTime !== null)
  @IsDateString()
  @IsOptional()
  endTime?: string | null;
}
