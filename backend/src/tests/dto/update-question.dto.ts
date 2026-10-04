import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class UpdateQuestionOptionDto {
  @IsString()
  @IsNotEmpty()
  optionKey: string;

  @IsString()
  @IsNotEmpty()
  optionText: string;
}

export class UpdateQuestionDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  questionText?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  marks?: number;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  correctOption?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateQuestionOptionDto)
  @IsOptional()
  options?: UpdateQuestionOptionDto[];
}
