import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { LocationsService } from './locations.service';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';
import { CreateRackDto } from './dto/create-rack.dto';
import { UpdateRackDto } from './dto/update-rack.dto';
import { CreateShelfDto } from './dto/create-shelf.dto';
import { UpdateShelfDto } from './dto/update-shelf.dto';

@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  /* ---- Zones ---- */

  @Get('zones')
  findAllZones() {
    return this.locationsService.findAllZones();
  }

  @Get('zones/:id')
  findOneZone(@Param('id') id: string) {
    return this.locationsService.findOneZone(id);
  }

  @Post('zones')
  createZone(@Body() dto: CreateZoneDto) {
    return this.locationsService.createZone(dto);
  }

  @Patch('zones/:id')
  updateZone(@Param('id') id: string, @Body() dto: UpdateZoneDto) {
    return this.locationsService.updateZone(id, dto);
  }

  @Delete('zones/:id')
  removeZone(@Param('id') id: string) {
    return this.locationsService.removeZone(id);
  }

  /* ---- Racks ---- */

  @Get('racks/:id')
  findOneRack(@Param('id') id: string) {
    return this.locationsService.findOneRack(id);
  }

  @Post('racks')
  createRack(@Body() dto: CreateRackDto) {
    return this.locationsService.createRack(dto);
  }

  @Patch('racks/:id')
  updateRack(@Param('id') id: string, @Body() dto: UpdateRackDto) {
    return this.locationsService.updateRack(id, dto);
  }

  @Delete('racks/:id')
  removeRack(@Param('id') id: string) {
    return this.locationsService.removeRack(id);
  }

  /* ---- Shelves ---- */

  @Get('shelves/:id')
  findOneShelf(@Param('id') id: string) {
    return this.locationsService.findOneShelf(id);
  }

  @Post('shelves')
  createShelf(@Body() dto: CreateShelfDto) {
    return this.locationsService.createShelf(dto);
  }

  @Patch('shelves/:id')
  updateShelf(@Param('id') id: string, @Body() dto: UpdateShelfDto) {
    return this.locationsService.updateShelf(id, dto);
  }

  @Delete('shelves/:id')
  removeShelf(@Param('id') id: string) {
    return this.locationsService.removeShelf(id);
  }
}
