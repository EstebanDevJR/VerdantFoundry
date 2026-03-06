import { IsOptional, IsString, IsArray } from 'class-validator';

export class UpdateReportDto {
  @IsOptional()
  @IsString()
  title?: string;

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
