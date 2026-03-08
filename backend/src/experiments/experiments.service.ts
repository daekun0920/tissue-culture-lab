import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExperimentDto } from './dto/create-experiment.dto';
import { AddCultureDto } from './dto/add-culture.dto';
import { AddEntryDto } from './dto/add-entry.dto';

@Injectable()
export class ExperimentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(status?: string) {
    return this.prisma.experiment.findMany({
      where: status ? { status } : undefined,
      include: {
        creator: true,
        _count: { select: { cultures: true, entries: true } },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async findOne(id: string) {
    const experiment = await this.prisma.experiment.findUnique({
      where: { id },
      include: {
        creator: true,
        cultures: {
          include: {
            container: {
              include: { culture: true, media: { include: { recipe: true } } },
            },
          },
          orderBy: { addedAt: 'desc' },
        },
        entries: {
          include: { creator: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!experiment) {
      throw new NotFoundException(`Experiment ${id} not found`);
    }

    return experiment;
  }

  async create(dto: CreateExperimentDto) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: dto.createdBy },
    });
    if (!employee) {
      throw new BadRequestException(`Employee ${dto.createdBy} not found`);
    }

    return this.prisma.experiment.create({
      data: {
        name: dto.name,
        description: dto.description ?? null,
        createdBy: dto.createdBy,
      },
      include: { creator: true },
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      status?: string;
      endDate?: string;
    },
  ) {
    await this.findOne(id);
    return this.prisma.experiment.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.endDate !== undefined && { endDate: new Date(data.endDate) }),
      },
      include: { creator: true },
    });
  }

  async addCultures(id: string, dto: AddCultureDto) {
    await this.findOne(id);

    const results: { containerQr: string; added: boolean; reason?: string }[] =
      [];

    for (const qr of dto.containerQrCodes) {
      const container = await this.prisma.container.findUnique({
        where: { qrCode: qr },
      });

      if (!container) {
        results.push({
          containerQr: qr,
          added: false,
          reason: 'Container not found',
        });
        continue;
      }

      const existing = await this.prisma.experimentCulture.findUnique({
        where: { experimentId_containerQr: { experimentId: id, containerQr: qr } },
      });

      if (existing) {
        results.push({
          containerQr: qr,
          added: false,
          reason: 'Already in experiment',
        });
        continue;
      }

      await this.prisma.experimentCulture.create({
        data: {
          experimentId: id,
          containerQr: qr,
          notes: dto.notes ?? null,
        },
      });

      results.push({ containerQr: qr, added: true });
    }

    return { results };
  }

  async removeCulture(id: string, containerQr: string) {
    const entry = await this.prisma.experimentCulture.findUnique({
      where: { experimentId_containerQr: { experimentId: id, containerQr } },
    });

    if (!entry) {
      throw new NotFoundException(
        `Container ${containerQr} not found in experiment ${id}`,
      );
    }

    await this.prisma.experimentCulture.delete({
      where: { id: entry.id },
    });

    return { deleted: true };
  }

  async addEntry(id: string, dto: AddEntryDto) {
    await this.findOne(id);

    return this.prisma.experimentEntry.create({
      data: {
        experimentId: id,
        entryType: dto.entryType ?? 'log',
        content: dto.content,
        createdBy: dto.createdBy,
      },
      include: { creator: true },
    });
  }

  async getEntries(id: string, entryType?: string) {
    return this.prisma.experimentEntry.findMany({
      where: {
        experimentId: id,
        ...(entryType ? { entryType } : {}),
      },
      include: { creator: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
