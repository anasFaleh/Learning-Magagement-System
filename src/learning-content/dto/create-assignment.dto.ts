import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAssignmentDto {
  @ApiProperty({
    description: 'Title of the assignment',
    example: 'Build a Todo App',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Detailed description of assignment requirements',
    example: 'Create a todo application using HTML, CSS, and JavaScript with add, delete, and mark complete features',
  })
  @IsString()
  @IsNotEmpty()
  description: string;
}
