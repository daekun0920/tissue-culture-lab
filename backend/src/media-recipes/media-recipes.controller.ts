import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { MediaRecipesService } from './media-recipes.service';
import { CreateMediaRecipeDto } from './dto/create-media-recipe.dto';
import { UpdateMediaRecipeDto } from './dto/update-media-recipe.dto';

@Controller('media-recipes')
export class MediaRecipesController {
  constructor(private readonly mediaRecipesService: MediaRecipesService) {}

  @Get()
  findAll() {
    return this.mediaRecipesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mediaRecipesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateMediaRecipeDto) {
    return this.mediaRecipesService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMediaRecipeDto) {
    return this.mediaRecipesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.mediaRecipesService.remove(id);
  }
}
