import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ContainerTypesService } from './container-types.service';
import { CreateContainerTypeDto } from './dto/create-container-type.dto';
import { UpdateContainerTypeDto } from './dto/update-container-type.dto';

@Controller('container-types')
export class ContainerTypesController {
  constructor(
    private readonly containerTypesService: ContainerTypesService,
  ) {}

  @Get()
  findAll() {
    return this.containerTypesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.containerTypesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateContainerTypeDto) {
    return this.containerTypesService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateContainerTypeDto) {
    return this.containerTypesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.containerTypesService.remove(id);
  }
}
