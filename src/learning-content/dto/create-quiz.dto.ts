import { IsString, IsNotEmpty, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateQuizDto {
  @ApiProperty({
    description: 'Title of the quiz',
    example: 'JavaScript Fundamentals Quiz',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Array of quiz questions with options',
    isArray: true,
    example: [
      {
        question: 'What is JavaScript?',
        options: ['Programming language', 'Markup language', 'Style language'],
        correctAnswer: 0,
      },
    ],
  })
  @IsArray()
  questions: any[];
}
