import { Injectable } from '@nestjs/common';
import { ContainerStatus } from '@prisma/client';
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
export class PickListService {
  constructor(private readonly prisma: PrismaService) {}

  async getPickList(date?: string) {
    const now = new Date();
    const targetDate = date ? new Date(date) : now;

    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const [dueSoon, expired, completedLogs] = await Promise.all([
      // Due within next 7 days, not yet past
      this.prisma.container.findMany({
        where: {
          status: ContainerStatus.HAS_CULTURE,
          dueSubcultureDate: {
            gte: now,
            lte: sevenDaysFromNow,
          },
        },
        include: {
          culture: true,
          containerType: true,
          ...LOCATION_INCLUDE,
        },
        orderBy: { dueSubcultureDate: 'asc' },
      }),

      // Past due
      this.prisma.container.findMany({
        where: {
          status: ContainerStatus.HAS_CULTURE,
          dueSubcultureDate: { lt: now },
        },
        include: {
          culture: true,
          containerType: true,
          ...LOCATION_INCLUDE,
        },
        orderBy: { dueSubcultureDate: 'asc' },
      }),

      // Completed today
      this.prisma.actionLog.findMany({
        where: {
          action: { in: ['ADD_CULTURE', 'DISCARD_CULTURE', 'SUBCULTURE'] },
          timestamp: { gte: startOfDay, lte: endOfDay },
        },
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
      }),
    ]);

    return { dueSoon, expired, completed: completedLogs };
  }

  async getSummary() {
    const now = new Date();
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const [dueSoonCount, expiredCount, completedCount] = await Promise.all([
      this.prisma.container.count({
        where: {
          status: ContainerStatus.HAS_CULTURE,
          dueSubcultureDate: { gte: now, lte: sevenDaysFromNow },
        },
      }),
      this.prisma.container.count({
        where: {
          status: ContainerStatus.HAS_CULTURE,
          dueSubcultureDate: { lt: now },
        },
      }),
      this.prisma.actionLog.count({
        where: {
          action: { in: ['ADD_CULTURE', 'DISCARD_CULTURE', 'SUBCULTURE'] },
          timestamp: { gte: startOfDay, lte: endOfDay },
        },
      }),
    ]);

    const total = dueSoonCount + expiredCount;

    return { dueSoonCount, expiredCount, completedCount, total };
  }
}
