import {
  IsArray,
  IsString,
  ArrayMinSize,
  IsOptional,
  IsObject,
  IsNumber,
} from 'class-validator';

export class BatchActionPayload {
  // REGISTER_CONTAINER
  @IsOptional()
  @IsString()
  containerTypeId?: string;

  // PREPARE_MEDIA
  @IsOptional()
  @IsString()
  mediaBatchId?: string;

  // ADD_CULTURE
  @IsOptional()
  @IsString()
  cultureTypeId?: string;

  @IsOptional()
  @IsNumber()
  subcultureInterval?: number;

  @IsOptional()
  @IsString()
  dueSubcultureDate?: string;

  // DISCARD_CULTURE / DISCARD_CONTAINER
  @IsOptional()
  @IsString()
  reason?: string;

  // SUBCULTURE
  @IsOptional()
  @IsString()
  parentQr?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetQrCodes?: string[];

  // EXIT_CULTURE
  @IsOptional()
  @IsString()
  exitType?: string;

  // Common
  @IsOptional()
  @IsString()
  note?: string;
}

export class BatchActionDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  qrCodes: string[];

  @IsString()
  action: string;

  @IsOptional()
  @IsObject()
  payload?: BatchActionPayload;

  @IsString()
  employeeId: string;
}
