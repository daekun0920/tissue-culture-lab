import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContainerTypeDto } from './dto/create-container-type.dto';
import { UpdateContainerTypeDto } from './dto/update-container-type.dto';

@Injectable()
export class ContainerTypesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.containerType.findMany({
      include: { _count: { select: { containers: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const containerType = await this.prisma.containerType.findUnique({
      where: { id },
      include: { containers: true },
    });

    if (!containerType) {
      throw new NotFoundException(`ContainerType ${id} not found`);
    }

    return containerType;
  }

  async create(dto: CreateContainerTypeDto) {
    return this.prisma.containerType.create({ data: dto });
  }

  async update(id: string, dto: UpdateContainerTypeDto) {
    await this.findOne(id);
    return this.prisma.containerType.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    const inUse = await this.prisma.container.count({ where: { containerTypeId: id } });
    if (inUse > 0) {
      throw new BadRequestException(`Cannot delete: ${inUse} container(s) use this type`);
    }
    return this.prisma.containerType.delete({ where: { id } });
  }
}
