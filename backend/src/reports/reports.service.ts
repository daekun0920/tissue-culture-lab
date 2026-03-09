import { Injectable, BadRequestException } from '@nestjs/common';
import { ContainerStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getEmployeeReport(employeeId: string, from?: string, to?: string) {
    const dateFilter: Record<string, unknown> = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      dateFilter.lte = toDate;
    }
    const hasDateFilter = Object.keys(dateFilter).length > 0;
    if (from && to && new Date(from) > new Date(to)) {
      throw new BadRequestException('from date must be before to date');
    }

    const where = {
      performedBy: employeeId,
      ...(hasDateFilter ? { timestamp: dateFilter } : {}),
    };

    const [actions, actionBreakdown, employee] = await Promise.all([
      this.prisma.actionLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        include: { container: true },
      }),
      this.prisma.actionLog.groupBy({
        by: ['action'],
        where,
        _count: { action: true },
      }),
      this.prisma.employee.findUnique({ where: { id: employeeId } }),
    ]);

    const totalActions = actions.length;
    const discardCultureActions = actions.filter(
      (a) => a.action === 'DISCARD_CULTURE',
    );
    const contaminationDiscards = discardCultureActions.filter((a) => {
      try {
        const meta = JSON.parse(a.metadata ?? '{}');
        return meta.reason === 'contamination';
      } catch {
        return false;
      }
    });

    const addCultureCount = actions.filter(
      (a) => a.action === 'ADD_CULTURE',
    ).length;
    const contaminationRate =
      addCultureCount > 0
        ? (contaminationDiscards.length / addCultureCount) * 100
        : 0;

    const uniqueContainers = new Set(actions.map((a) => a.containerQr)).size;

    return {
      employee,
      totalActions,
      containersProcessed: uniqueContainers,
      contaminationRate: Math.round(contaminationRate * 100) / 100,
      actionBreakdown: actionBreakdown.map((ab) => ({
        action: ab.action,
        count: ab._count.action,
      })),
      recentActions: actions.slice(0, 50),
    };
  }

  async getSystemReport(from?: string, to?: string) {
    const dateFilter: Record<string, unknown> = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      dateFilter.lte = toDate;
    }
    const hasDateFilter = Object.keys(dateFilter).length > 0;
    if (from && to && new Date(from) > new Date(to)) {
      throw new BadRequestException('from date must be before to date');
    }

    const actionWhere = hasDateFilter ? { timestamp: dateFilter } : {};

    const [
      statusGroups,
      totalContainers,
      activeCultures,
      actionBreakdown,
      discardActions,
      mediaBatchCount,
      subcultureCount,
    ] = await Promise.all([
      this.prisma.container.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      this.prisma.container.count(),
      this.prisma.container.count({
        where: { status: ContainerStatus.HAS_CULTURE },
      }),
      this.prisma.actionLog.groupBy({
        by: ['action'],
        where: actionWhere,
        _count: { action: true },
      }),
      this.prisma.actionLog.findMany({
        where: {
          action: 'DISCARD_CULTURE',
          ...(hasDateFilter ? { timestamp: dateFilter } : {}),
        },
      }),
      this.prisma.mediaBatch.count(),
      this.prisma.actionLog.count({
        where: {
          action: 'SUBCULTURE',
          ...(hasDateFilter ? { timestamp: dateFilter } : {}),
        },
      }),
    ]);

    const statusCounts = statusGroups.reduce(
      (acc, group) => {
        acc[group.status] = group._count.status;
        return acc;
      },
      {} as Record<string, number>,
    );

    const totalDiscards = discardActions.length;
    const contaminationDiscards = discardActions.filter((a) => {
      try {
        const meta = JSON.parse(a.metadata ?? '{}');
        return meta.reason === 'contamination';
      } catch {
        return false;
      }
    }).length;

    return {
      totalContainers,
      activeCultures,
      mediaBatchesUsed: mediaBatchCount,
      statusCounts,
      discardRate:
        totalContainers > 0
          ? Math.round((totalDiscards / totalContainers) * 10000) / 100
          : 0,
      totalDiscards,
      contaminationDiscards,
      subcultureCount,
      actionBreakdown: actionBreakdown.map((ab) => ({
        action: ab.action,
        count: ab._count.action,
      })),
    };
  }

  async getContainerHistory(qr: string) {
    const logs = await this.prisma.actionLog.findMany({
      where: { containerQr: qr },
      include: { employee: true },
      orderBy: { timestamp: 'asc' },
    });

    return { qrCode: qr, timeline: logs };
  }
}
