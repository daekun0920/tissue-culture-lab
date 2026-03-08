import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { MediaBatchesService } from './media-batches.service';
import { CreateMediaBatchDto } from './dto/create-media-batch.dto';

@Controller('media-batches')
export class MediaBatchesController {
  constructor(private readonly mediaBatchesService: MediaBatchesService) {}

  @Get()
  findAll() {
    return this.mediaBatchesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mediaBatchesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateMediaBatchDto) {
    return this.mediaBatchesService.create(dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.mediaBatchesService.remove(id);
  }
}
