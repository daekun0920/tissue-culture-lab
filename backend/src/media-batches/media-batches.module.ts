import { Module } from '@nestjs/common';
import { MediaBatchesController } from './media-batches.controller';
import { MediaBatchesService } from './media-batches.service';

@Module({
  controllers: [MediaBatchesController],
  providers: [MediaBatchesService],
  exports: [MediaBatchesService],
})
export class MediaBatchesModule {}
