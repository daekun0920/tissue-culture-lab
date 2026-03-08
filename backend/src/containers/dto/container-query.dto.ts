import { IsOptional, IsString } from 'class-validator';

export class ContainerQueryDto {
  @IsOptional()
  @IsString()
  q?: string;
}
