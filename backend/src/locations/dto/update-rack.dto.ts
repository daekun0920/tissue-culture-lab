import { IsString, IsOptional } from 'class-validator';

export class UpdateRackDto {
  @IsOptional()
  @IsString()
  name?: string;
}
