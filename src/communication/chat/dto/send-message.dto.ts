import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({
    description: 'Message content to send',
    example: 'Hello, I have a question about the assignment...',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}
