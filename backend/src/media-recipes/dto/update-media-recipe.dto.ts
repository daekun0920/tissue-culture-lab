import { PartialType } from '@nestjs/mapped-types';
import { CreateMediaRecipeDto } from './create-media-recipe.dto';

export class UpdateMediaRecipeDto extends PartialType(CreateMediaRecipeDto) {}
