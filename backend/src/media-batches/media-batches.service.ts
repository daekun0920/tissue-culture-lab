import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMediaBatchDto } from './dto/create-media-batch.dto';

@Injectable()
export class MediaBatchesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.mediaBatch.findMany({
      include: {
        recipe: true,
        _count: { select: { containers: true } },
      },
      orderBy: { datePrep: 'desc' },
    });
  }

  async findOne(id: string) {
    const batch = await this.prisma.mediaBatch.findUnique({
      where: { id },
      include: {
        recipe: true,
        containers: { include: { culture: true } },
      },
    });

    if (!batch) {
      throw new NotFoundException(`MediaBatch ${id} not found`);
    }

    return batch;
  }

  async create(dto: CreateMediaBatchDto) {
    const recipe = await this.prisma.mediaRecipe.findUnique({
      where: { id: dto.recipeId },
    });

    if (!recipe) {
      throw new BadRequestException(`MediaRecipe ${dto.recipeId} not found`);
    }

    return this.prisma.mediaBatch.create({
      data: {
        recipeId: dto.recipeId,
        batchNumber: dto.batchNumber ?? null,
        notes: dto.notes ?? null,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    const inUse = await this.prisma.container.count({ where: { mediaId: id } });
    if (inUse > 0) {
      throw new BadRequestException(`Cannot delete: ${inUse} container(s) use this media batch`);
    }
    return this.prisma.mediaBatch.delete({ where: { id } });
  }
}
