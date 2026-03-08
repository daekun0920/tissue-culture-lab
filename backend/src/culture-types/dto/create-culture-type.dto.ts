import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateCultureTypeDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  species?: string;

  @IsOptional()
  @IsString()
  clone?: string;

  @IsOptional()
  @IsString()
  origin?: string;

  @IsOptional()
  @IsNumber()
  defaultSubcultureInterval?: number;
}
