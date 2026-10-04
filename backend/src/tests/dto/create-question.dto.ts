import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class QuestionOptionDto {
  @IsString()
  @IsNotEmpty()
  optionKey: string;

  @IsString()
  @IsNotEmpty()
  optionText: string;
}

export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty()
  questionText: string;

  @IsInt()
  @Min(1)
  marks: number;

  @IsString()
  @IsNotEmpty()
  correctOption: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  options: QuestionOptionDto[];
}
