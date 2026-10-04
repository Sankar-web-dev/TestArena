import {
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class SaveAnswerDto {
  @IsString()
  @IsNotEmpty()
  selectedOption: string;
}
