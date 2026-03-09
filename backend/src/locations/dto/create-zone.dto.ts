import { IsString } from 'class-validator';

export class CreateZoneDto {
  @IsString()
  name: string;
}
