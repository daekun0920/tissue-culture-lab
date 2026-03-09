import { IsString, IsOptional } from 'class-validator';

export class UpdateShelfDto {
  @IsOptional()
  @IsString()
  name?: string;
}
