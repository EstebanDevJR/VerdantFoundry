import { IsString, IsOptional, IsArray } from 'class-validator';

export class CreateMemoryDto {
  @IsString()
  title: string;

  @IsString()
  type: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
