import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateMediaRecipeDto {
  @IsString()
  name: string;

  @IsString()
  baseType: string;

  @IsNumber()
  phLevel: number;

  @IsNumber()
  agar: number;

  @IsOptional()
  @IsString()
  hormones?: string;
}
