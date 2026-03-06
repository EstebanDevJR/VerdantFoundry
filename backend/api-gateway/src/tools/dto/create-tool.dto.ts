import { IsOptional, IsString, IsObject } from 'class-validator';

export class CreateToolDto {
  @IsString()
  name: string;

  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  schemaJson?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
