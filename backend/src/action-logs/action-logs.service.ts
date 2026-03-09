import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const LOCATION_INCLUDE = {
  shelf: {
    include: {
      rack: {
        include: { zone: true },
      },
    },
  },
} as const;

@Injectable()
export class ActionLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params?: {
    containerQr?: string;
    action?: string;
    employeeId?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) {
    const {
      containerQr,
      action,
      employeeId,
      from,
      to,
      page = 1,
      limit = 50,
    } = params ?? {};

    const where: Record<string, unknown> = {};

    if (containerQr) where.containerQr = containerQr;
    if (action) where.action = action;
    if (employeeId) where.performedBy = employeeId;

    if (from || to) {
      const timestamp: Record<string, Date> = {};
      if (from) timestamp.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        timestamp.lte = toDate;
      }
      where.timestamp = timestamp;
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.actionLog.findMany({
        where,
        include: {
          employee: true,
          container: {
            include: {
              culture: true,
              containerType: true,
              ...LOCATION_INCLUDE,
            },
          },
        },
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.actionLog.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const log = await this.prisma.actionLog.findUnique({
      where: { id },
      include: {
        employee: true,
        container: {
          include: {
            culture: true,
            containerType: true,
            ...LOCATION_INCLUDE,
          },
        },
      },
    });

    if (!log) {
      throw new NotFoundException(`ActionLog ${id} not found`);
    }

    return log;
  }
}
