import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ExperimentsService } from './experiments.service';
import { CreateExperimentDto } from './dto/create-experiment.dto';
import { AddCultureDto } from './dto/add-culture.dto';
import { AddEntryDto } from './dto/add-entry.dto';

@Controller('experiments')
export class ExperimentsController {
  constructor(private readonly experimentsService: ExperimentsService) {}

  @Get()
  findAll(@Query('status') status?: string) {
    return this.experimentsService.findAll(status);
  }

  @Post()
  create(@Body() dto: CreateExperimentDto) {
    return this.experimentsService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.experimentsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      description?: string;
      status?: string;
      endDate?: string;
    },
  ) {
    return this.experimentsService.update(id, body);
  }

  @Post(':id/cultures')
  addCultures(@Param('id') id: string, @Body() dto: AddCultureDto) {
    return this.experimentsService.addCultures(id, dto);
  }

  @Delete(':id/cultures/:containerQr')
  removeCulture(
    @Param('id') id: string,
    @Param('containerQr') containerQr: string,
  ) {
    return this.experimentsService.removeCulture(id, containerQr);
  }

  @Post(':id/entries')
  addEntry(@Param('id') id: string, @Body() dto: AddEntryDto) {
    return this.experimentsService.addEntry(id, dto);
  }

  @Get(':id/entries')
  getEntries(
    @Param('id') id: string,
    @Query('type') entryType?: string,
  ) {
    return this.experimentsService.getEntries(id, entryType);
  }
}
