import { IsOptional, IsString, IsArray, IsObject } from 'class-validator';

export class CreateReportDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsArray()
  blocks?: unknown[];

  @IsOptional()
  @IsString()
  themeId?: string;

  @IsOptional()
  @IsString()
  layoutId?: string;
}
