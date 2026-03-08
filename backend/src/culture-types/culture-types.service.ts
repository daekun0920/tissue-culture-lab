import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCultureTypeDto } from './dto/create-culture-type.dto';
import { UpdateCultureTypeDto } from './dto/update-culture-type.dto';

@Injectable()
export class CultureTypesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.cultureType.findMany({
      include: { _count: { select: { containers: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const cultureType = await this.prisma.cultureType.findUnique({
      where: { id },
      include: { containers: true },
    });

    if (!cultureType) {
      throw new NotFoundException(`CultureType ${id} not found`);
    }

    return cultureType;
  }

  async create(dto: CreateCultureTypeDto) {
    return this.prisma.cultureType.create({ data: dto });
  }

  async update(id: string, dto: UpdateCultureTypeDto) {
    await this.findOne(id);
    return this.prisma.cultureType.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.cultureType.delete({ where: { id } });
  }
}
