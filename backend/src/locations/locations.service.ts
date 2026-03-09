import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';
import { CreateRackDto } from './dto/create-rack.dto';
import { UpdateRackDto } from './dto/update-rack.dto';
import { CreateShelfDto } from './dto/create-shelf.dto';
import { UpdateShelfDto } from './dto/update-shelf.dto';

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  /* ---- Zones ---- */

  async findAllZones() {
    return this.prisma.zone.findMany({
      include: {
        _count: { select: { racks: true } },
        racks: {
          include: {
            _count: { select: { shelves: true } },
            shelves: {
              include: { _count: { select: { containers: true } } },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOneZone(id: string) {
    const zone = await this.prisma.zone.findUnique({
      where: { id },
      include: {
        racks: {
          include: {
            _count: { select: { shelves: true } },
            shelves: {
              include: { _count: { select: { containers: true } } },
            },
          },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!zone) {
      throw new NotFoundException(`Zone ${id} not found`);
    }

    return zone;
  }

  async createZone(dto: CreateZoneDto) {
    return this.prisma.zone.create({ data: dto });
  }

  async updateZone(id: string, dto: UpdateZoneDto) {
    await this.findOneZone(id);
    return this.prisma.zone.update({ where: { id }, data: dto });
  }

  async removeZone(id: string) {
    await this.findOneZone(id);
    const rackCount = await this.prisma.rack.count({ where: { zoneId: id } });
    if (rackCount > 0) {
      throw new BadRequestException(
        `Cannot delete: zone has ${rackCount} rack(s)`,
      );
    }
    return this.prisma.zone.delete({ where: { id } });
  }

  /* ---- Racks ---- */

  async findOneRack(id: string) {
    const rack = await this.prisma.rack.findUnique({
      where: { id },
      include: {
        zone: true,
        shelves: {
          include: {
            _count: { select: { containers: true } },
          },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!rack) {
      throw new NotFoundException(`Rack ${id} not found`);
    }

    return rack;
  }

  async createRack(dto: CreateRackDto) {
    const zone = await this.prisma.zone.findUnique({
      where: { id: dto.zoneId },
    });
    if (!zone) {
      throw new BadRequestException(`Zone ${dto.zoneId} not found`);
    }
    return this.prisma.rack.create({ data: dto });
  }

  async updateRack(id: string, dto: UpdateRackDto) {
    await this.findOneRack(id);
    return this.prisma.rack.update({ where: { id }, data: dto });
  }

  async removeRack(id: string) {
    await this.findOneRack(id);
    const shelfCount = await this.prisma.shelf.count({ where: { rackId: id } });
    if (shelfCount > 0) {
      throw new BadRequestException(
        `Cannot delete: rack has ${shelfCount} shelf/shelves`,
      );
    }
    return this.prisma.rack.delete({ where: { id } });
  }

  /* ---- Shelves ---- */

  async findOneShelf(id: string) {
    const shelf = await this.prisma.shelf.findUnique({
      where: { id },
      include: {
        rack: { include: { zone: true } },
        containers: {
          include: {
            containerType: true,
            culture: true,
          },
          orderBy: { updatedAt: 'desc' },
        },
      },
    });

    if (!shelf) {
      throw new NotFoundException(`Shelf ${id} not found`);
    }

    return shelf;
  }

  async createShelf(dto: CreateShelfDto) {
    const rack = await this.prisma.rack.findUnique({
      where: { id: dto.rackId },
    });
    if (!rack) {
      throw new BadRequestException(`Rack ${dto.rackId} not found`);
    }
    return this.prisma.shelf.create({ data: dto });
  }

  async updateShelf(id: string, dto: UpdateShelfDto) {
    await this.findOneShelf(id);
    return this.prisma.shelf.update({ where: { id }, data: dto });
  }

  async removeShelf(id: string) {
    await this.findOneShelf(id);
    const containerCount = await this.prisma.container.count({
      where: { shelfId: id },
    });
    if (containerCount > 0) {
      throw new BadRequestException(
        `Cannot delete: shelf has ${containerCount} container(s)`,
      );
    }
    return this.prisma.shelf.delete({ where: { id } });
  }
}
