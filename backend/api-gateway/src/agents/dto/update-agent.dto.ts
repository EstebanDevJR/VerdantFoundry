import { IsOptional, IsString, IsInt, IsArray, Min, Max } from 'class-validator';

export class UpdateAgentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  objective?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  autonomyLevel?: number;

  @IsOptional()
  configJson?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  toolIds?: string[];
}
