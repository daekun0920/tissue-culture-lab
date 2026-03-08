import { IsString, IsOptional } from 'class-validator';

export class CreateMediaBatchDto {
  @IsString()
  recipeId: string;

  @IsOptional()
  @IsString()
  batchNumber?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
