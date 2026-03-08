import { IsString, IsArray, IsOptional } from 'class-validator';

export class AddCultureDto {
  @IsArray()
  @IsString({ each: true })
  containerQrCodes: string[];

  @IsOptional()
  @IsString()
  notes?: string;
}
