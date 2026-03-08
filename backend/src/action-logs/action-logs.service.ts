import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActionLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(containerQr?: string) {
    return this.prisma.actionLog.findMany({
      where: containerQr ? { containerQr } : undefined,
      include: {
        employee: true,
        container: true,
      },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });
  }

  async findOne(id: string) {
    const log = await this.prisma.actionLog.findUnique({
      where: { id },
      include: {
        employee: true,
        container: true,
      },
    });

    if (!log) {
      throw new NotFoundException(`ActionLog ${id} not found`);
    }

    return log;
  }
}
