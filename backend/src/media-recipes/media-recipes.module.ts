import { Module } from '@nestjs/common';
import { MediaRecipesController } from './media-recipes.controller';
import { MediaRecipesService } from './media-recipes.service';

@Module({
  controllers: [MediaRecipesController],
  providers: [MediaRecipesService],
  exports: [MediaRecipesService],
})
export class MediaRecipesModule {}
