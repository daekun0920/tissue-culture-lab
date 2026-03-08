import { PartialType } from '@nestjs/mapped-types';
import { CreateMediaBatchDto } from './create-media-batch.dto';

export class UpdateMediaBatchDto extends PartialType(CreateMediaBatchDto) {}
