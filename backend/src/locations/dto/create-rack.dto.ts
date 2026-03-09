import { IsString } from 'class-validator';

export class CreateRackDto {
  @IsString()
  name: string;

  @IsString()
  zoneId: string;
}
