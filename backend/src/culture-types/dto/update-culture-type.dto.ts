import { PartialType } from '@nestjs/mapped-types';
import { CreateCultureTypeDto } from './create-culture-type.dto';

export class UpdateCultureTypeDto extends PartialType(CreateCultureTypeDto) {}
