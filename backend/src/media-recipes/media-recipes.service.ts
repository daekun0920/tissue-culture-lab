import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMediaRecipeDto } from './dto/create-media-recipe.dto';
import { UpdateMediaRecipeDto } from './dto/update-media-recipe.dto';

@Injectable()
export class MediaRecipesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.mediaRecipe.findMany({
      include: { _count: { select: { batches: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const recipe = await this.prisma.mediaRecipe.findUnique({
      where: { id },
      include: {
        batches: { orderBy: { datePrep: 'desc' } },
      },
    });

    if (!recipe) {
      throw new NotFoundException(`MediaRecipe ${id} not found`);
    }

    return recipe;
  }

  async create(dto: CreateMediaRecipeDto) {
    return this.prisma.mediaRecipe.create({
      data: {
        ...dto,
        hormones: dto.hormones ?? '{}',
      },
    });
  }

  async update(id: string, dto: UpdateMediaRecipeDto) {
    await this.findOne(id);
    return this.prisma.mediaRecipe.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.mediaRecipe.delete({ where: { id } });
  }
}
