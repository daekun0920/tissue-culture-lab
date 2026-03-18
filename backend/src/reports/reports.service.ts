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

  async getEnhancedDashboard() {
    const now = new Date();
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const endOfWeek = new Date(now);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    // Current stats
    const [
      activeCultures,
      prevActiveCultures,
      dueThisWeek,
      prevDueThisWeek,
      totalContainers,
      prevTotalContainers,
      statusGroups,
      thisWeekDiscards,
      prevWeekDiscards,
      thisWeekLogs,
      upcomingDue,
      overdueCount,
    ] = await Promise.all([
      // Active cultures now
      this.prisma.container.count({
        where: { status: ContainerStatus.HAS_CULTURE },
      }),
      // Active cultures a week ago (approximate via logs)
      this.prisma.actionLog.count({
        where: {
          action: { in: ['ADD_CULTURE', 'SUBCULTURE'] },
          timestamp: { gte: twoWeeksAgo, lt: oneWeekAgo },
        },
      }),
      // Due this week
      this.prisma.container.count({
        where: {
          status: ContainerStatus.HAS_CULTURE,
          dueSubcultureDate: { gte: now, lte: endOfWeek },
        },
      }),
      // Due prev week (for trend)
      this.prisma.container.count({
        where: {
          status: ContainerStatus.HAS_CULTURE,
          dueSubcultureDate: { gte: oneWeekAgo, lte: now },
        },
      }),
      // Total containers
      this.prisma.container.count(),
      // Total containers a week ago
      this.prisma.container.count({
        where: { createdAt: { lt: oneWeekAgo } },
      }),
      // Status distribution
      this.prisma.container.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      // This week discards
      this.prisma.actionLog.count({
        where: {
          action: { in: ['DISCARD_CULTURE', 'DISCARD_CONTAINER'] },
          timestamp: { gte: oneWeekAgo },
        },
      }),
      // Previous week discards
      this.prisma.actionLog.count({
        where: {
          action: { in: ['DISCARD_CULTURE', 'DISCARD_CONTAINER'] },
          timestamp: { gte: twoWeeksAgo, lt: oneWeekAgo },
        },
      }),
      // This week's logs for daily activity chart
      this.prisma.actionLog.findMany({
        where: { timestamp: { gte: oneWeekAgo } },
        select: { action: true, timestamp: true },
      }),
      // Upcoming due containers for scatter chart (next 30 days)
      this.prisma.container.findMany({
        where: {
          status: ContainerStatus.HAS_CULTURE,
          dueSubcultureDate: {
            gte: now,
            lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          },
        },
        select: { dueSubcultureDate: true },
      }),
      // Overdue cultures (past due date, still active)
      this.prisma.container.count({
        where: {
          status: ContainerStatus.HAS_CULTURE,
          dueSubcultureDate: { lt: now },
        },
      }),
    ]);

    // Calculate percentage changes
    const calcChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    // Status distribution for donut chart
    const totalForDonut = statusGroups.reduce(
      (sum, g) => sum + g._count.status,
      0,
    );
    const statusDistribution = statusGroups.map((g) => ({
      status: g.status,
      count: g._count.status,
      percentage:
        totalForDonut > 0
          ? Math.round((g._count.status / totalForDonut) * 10000) / 100
          : 0,
    }));

    // Weekly activity for bar chart (group by day of week)
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyActivity = days.map((day) => ({
      day,
      processed: 0,
      discarded: 0,
    }));
    for (const log of thisWeekLogs) {
      const dayIndex = new Date(log.timestamp).getDay();
      if (
        ['ADD_CULTURE', 'SUBCULTURE', 'PREPARE_MEDIA'].includes(log.action)
      ) {
        weeklyActivity[dayIndex].processed++;
      } else if (
        ['DISCARD_CULTURE', 'DISCARD_CONTAINER'].includes(log.action)
      ) {
        weeklyActivity[dayIndex].discarded++;
      }
    }

    // Upcoming workload for scatter chart (group by date)
    const workloadMap = new Map<string, number>();
    for (const c of upcomingDue) {
      if (c.dueSubcultureDate) {
        const dateKey = c.dueSubcultureDate.toISOString().split('T')[0];
        workloadMap.set(dateKey, (workloadMap.get(dateKey) ?? 0) + 1);
      }
    }
    const upcomingWorkload = Array.from(workloadMap.entries())
      .map(([date, dueCount]) => ({ date, dueCount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Discard rate
    const discardRate =
      totalContainers > 0
        ? Math.round((thisWeekDiscards / totalContainers) * 10000) / 100
        : 0;
    const prevDiscardRate =
      prevTotalContainers > 0
        ? Math.round(
            (prevWeekDiscards / prevTotalContainers) * 10000,
          ) / 100
        : 0;

    // Alerts / Attention Required
    const todayStr = now.toISOString().split('T')[0];
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const dueToday = workloadMap.get(todayStr) ?? 0;
    const dueTomorrow = workloadMap.get(tomorrowStr) ?? 0;

    const alerts: string[] = [];
    if (dueToday > 0)
      alerts.push(`${dueToday} culture${dueToday === 1 ? ' is' : 's are'} due today`);
    if (dueTomorrow > 0)
      alerts.push(`${dueTomorrow} culture${dueTomorrow === 1 ? ' is' : 's are'} due tomorrow`);
    if (overdueCount > 0)
      alerts.push(`${overdueCount} culture${overdueCount === 1 ? ' is' : 's are'} overdue`);
    if (discardRate > 10)
      alerts.push(`Discard rate is high at ${discardRate}%`);

    return {
      activeCultures: {
        count: activeCultures,
        change: calcChange(activeCultures, prevActiveCultures),
      },
      dueThisWeek: {
        count: dueThisWeek,
        change: calcChange(dueThisWeek, prevDueThisWeek),
      },
      totalContainers: {
        count: totalContainers,
        change: calcChange(totalContainers, prevTotalContainers),
      },
      discardRate: {
        rate: discardRate,
        change: calcChange(
          Math.round(discardRate),
          Math.round(prevDiscardRate),
        ),
      },
      statusDistribution,
      weeklyActivity,
      upcomingWorkload,
      alerts,
    };
  }
}
