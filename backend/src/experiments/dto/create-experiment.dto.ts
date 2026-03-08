import { IsString, IsOptional } from 'class-validator';

export class CreateExperimentDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  createdBy: string;
}
