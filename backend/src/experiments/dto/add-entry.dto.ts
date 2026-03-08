import { IsString, IsOptional } from 'class-validator';

export class AddEntryDto {
  @IsOptional()
  @IsString()
  entryType?: string;

  @IsString()
  content: string;

  @IsString()
  createdBy: string;
}
