import { PartialType } from '@nestjs/mapped-types';
import { CreateContainerTypeDto } from './create-container-type.dto';

export class UpdateContainerTypeDto extends PartialType(
  CreateContainerTypeDto,
) {}
