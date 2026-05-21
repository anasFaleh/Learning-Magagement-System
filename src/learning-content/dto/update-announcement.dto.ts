import { IsString, IsOptional } from 'class-validator';
export class UpdateAnnouncementDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() content?: string;
}
