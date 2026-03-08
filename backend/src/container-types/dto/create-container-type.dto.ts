import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateContainerTypeDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  size?: string;

  @IsOptional()
  @IsString()
  material?: string;

  @IsOptional()
  @IsBoolean()
  isVented?: boolean;

  @IsOptional()
  @IsBoolean()
  isReusable?: boolean;
}
