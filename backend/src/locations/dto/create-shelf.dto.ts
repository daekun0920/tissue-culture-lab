import { IsString } from 'class-validator';

export class CreateShelfDto {
  @IsString()
  name: string;

  @IsString()
  rackId: string;
}
