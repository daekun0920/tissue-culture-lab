import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { CultureTypesService } from './culture-types.service';
import { CreateCultureTypeDto } from './dto/create-culture-type.dto';
import { UpdateCultureTypeDto } from './dto/update-culture-type.dto';

@Controller('culture-types')
export class CultureTypesController {
  constructor(private readonly cultureTypesService: CultureTypesService) {}

  @Get()
  findAll() {
    return this.cultureTypesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cultureTypesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateCultureTypeDto) {
    return this.cultureTypesService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCultureTypeDto) {
    return this.cultureTypesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cultureTypesService.remove(id);
  }
}
