import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';
import { ContainerStatus } from '@prisma/client';

const mockPrisma = {
  actionLog: {
    findMany: jest.fn(),
    groupBy: jest.fn(),
    count: jest.fn(),
  },
  container: {
    groupBy: jest.fn(),
    count: jest.fn(),
  },
  employee: {
    findUnique: jest.fn(),
  },
  mediaBatch: {
    count: jest.fn(),
  },
};

describe('ReportsService', () => {
  let service: ReportsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  // ---------------------------------------------------------------------------
  // getEmployeeReport
  // ---------------------------------------------------------------------------
  describe('getEmployeeReport', () => {
    const employee = { id: 'emp-1', name: 'Alice', isActive: true };

    it('should return report with breakdown and contamination rate', async () => {
      const actions = [
        {
          id: 'a1',
          action: 'ADD_CULTURE',
          containerQr: 'QR-001',
          performedBy: 'emp-1',
          metadata: '{}',
          container: { qrCode: 'QR-001' },
        },
        {
          id: 'a2',
          action: 'ADD_CULTURE',
          containerQr: 'QR-002',
          performedBy: 'emp-1',
          metadata: '{}',
          container: { qrCode: 'QR-002' },
        },
        {
          id: 'a3',
          action: 'DISCARD_CULTURE',
          containerQr: 'QR-001',
          performedBy: 'emp-1',
          metadata: '{"reason":"contamination"}',
          container: { qrCode: 'QR-001' },
        },
      ];

      const breakdown = [
        { action: 'ADD_CULTURE', _count: { action: 2 } },
        { action: 'DISCARD_CULTURE', _count: { action: 1 } },
      ];

      mockPrisma.actionLog.findMany.mockResolvedValue(actions);
      mockPrisma.actionLog.groupBy.mockResolvedValue(breakdown);
      mockPrisma.employee.findUnique.mockResolvedValue(employee);

      const result = await service.getEmployeeReport('emp-1');

      expect(result.employee).toEqual(employee);
      expect(result.totalActions).toBe(3);
      expect(result.containersProcessed).toBe(2);
      // 1 contamination / 2 ADD_CULTURE = 50%
      expect(result.contaminationRate).toBe(50);
      expect(result.actionBreakdown).toEqual([
        { action: 'ADD_CULTURE', count: 2 },
        { action: 'DISCARD_CULTURE', count: 1 },
      ]);
      expect(result.recentActions).toHaveLength(3);
    });

    it('should filter by dates', async () => {
      mockPrisma.actionLog.findMany.mockResolvedValue([]);
      mockPrisma.actionLog.groupBy.mockResolvedValue([]);
      mockPrisma.employee.findUnique.mockResolvedValue(employee);

      await service.getEmployeeReport('emp-1', '2025-01-01', '2025-06-30');

      const expectedWhere = {
        performedBy: 'emp-1',
        timestamp: {
          gte: new Date('2025-01-01'),
          lte: expect.any(Date),
        },
      };
      expect(mockPrisma.actionLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expectedWhere }),
      );
    });

    it('should throw BadRequestException when from > to', async () => {
      await expect(
        service.getEmployeeReport('emp-1', '2025-06-30', '2025-01-01'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.getEmployeeReport('emp-1', '2025-06-30', '2025-01-01'),
      ).rejects.toThrow('from date must be before to date');
    });

    it('should set to-date to end of day (23:59:59.999)', async () => {
      mockPrisma.actionLog.findMany.mockResolvedValue([]);
      mockPrisma.actionLog.groupBy.mockResolvedValue([]);
      mockPrisma.employee.findUnique.mockResolvedValue(employee);

      await service.getEmployeeReport('emp-1', undefined, '2025-03-15');

      const findManyCall = mockPrisma.actionLog.findMany.mock.calls[0][0];
      const toDate = findManyCall.where.timestamp.lte as Date;
      expect(toDate.getHours()).toBe(23);
      expect(toDate.getMinutes()).toBe(59);
      expect(toDate.getSeconds()).toBe(59);
      expect(toDate.getMilliseconds()).toBe(999);
    });

    it('should return 0 contaminationRate when no ADD_CULTURE actions', async () => {
      const actions = [
        {
          id: 'a1',
          action: 'DISCARD_CULTURE',
          containerQr: 'QR-001',
          performedBy: 'emp-1',
          metadata: '{"reason":"contamination"}',
          container: { qrCode: 'QR-001' },
        },
      ];

      mockPrisma.actionLog.findMany.mockResolvedValue(actions);
      mockPrisma.actionLog.groupBy.mockResolvedValue([
        { action: 'DISCARD_CULTURE', _count: { action: 1 } },
      ]);
      mockPrisma.employee.findUnique.mockResolvedValue(employee);

      const result = await service.getEmployeeReport('emp-1');

      expect(result.contaminationRate).toBe(0);
    });

    it('should correctly count contamination from metadata JSON', async () => {
      const actions = [
        {
          id: 'a1',
          action: 'ADD_CULTURE',
          containerQr: 'QR-001',
          performedBy: 'emp-1',
          metadata: '{}',
          container: { qrCode: 'QR-001' },
        },
        {
          id: 'a2',
          action: 'ADD_CULTURE',
          containerQr: 'QR-002',
          performedBy: 'emp-1',
          metadata: '{}',
          container: { qrCode: 'QR-002' },
        },
        {
          id: 'a3',
          action: 'ADD_CULTURE',
          containerQr: 'QR-003',
          performedBy: 'emp-1',
          metadata: '{}',
          container: { qrCode: 'QR-003' },
        },
        {
          id: 'a4',
          action: 'ADD_CULTURE',
          containerQr: 'QR-004',
          performedBy: 'emp-1',
          metadata: '{}',
          container: { qrCode: 'QR-004' },
        },
        {
          id: 'a5',
          action: 'DISCARD_CULTURE',
          containerQr: 'QR-001',
          performedBy: 'emp-1',
          metadata: '{"reason":"contamination"}',
          container: { qrCode: 'QR-001' },
        },
        {
          id: 'a6',
          action: 'DISCARD_CULTURE',
          containerQr: 'QR-002',
          performedBy: 'emp-1',
          metadata: '{"reason":"old"}',
          container: { qrCode: 'QR-002' },
        },
        {
          id: 'a7',
          action: 'DISCARD_CULTURE',
          containerQr: 'QR-003',
          performedBy: 'emp-1',
          metadata: '{"reason":"contamination"}',
          container: { qrCode: 'QR-003' },
        },
      ];

      mockPrisma.actionLog.findMany.mockResolvedValue(actions);
      mockPrisma.actionLog.groupBy.mockResolvedValue([]);
      mockPrisma.employee.findUnique.mockResolvedValue(employee);

      const result = await service.getEmployeeReport('emp-1');

      // 2 contamination / 4 ADD_CULTURE = 50%
      expect(result.contaminationRate).toBe(50);
    });

    it('should handle null metadata gracefully', async () => {
      const actions = [
        {
          id: 'a1',
          action: 'DISCARD_CULTURE',
          containerQr: 'QR-001',
          performedBy: 'emp-1',
          metadata: null,
          container: { qrCode: 'QR-001' },
        },
        {
          id: 'a2',
          action: 'ADD_CULTURE',
          containerQr: 'QR-002',
          performedBy: 'emp-1',
          metadata: '{}',
          container: { qrCode: 'QR-002' },
        },
      ];

      mockPrisma.actionLog.findMany.mockResolvedValue(actions);
      mockPrisma.actionLog.groupBy.mockResolvedValue([]);
      mockPrisma.employee.findUnique.mockResolvedValue(employee);

      const result = await service.getEmployeeReport('emp-1');

      // null metadata → no contamination counted
      expect(result.contaminationRate).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // getSystemReport
  // ---------------------------------------------------------------------------
  describe('getSystemReport', () => {
    const defaultMocks = () => {
      mockPrisma.container.groupBy.mockResolvedValue([
        { status: ContainerStatus.EMPTY, _count: { status: 5 } },
        { status: ContainerStatus.HAS_CULTURE, _count: { status: 10 } },
        { status: ContainerStatus.DISCARDED, _count: { status: 3 } },
      ]);
      mockPrisma.container.count
        .mockResolvedValueOnce(18) // totalContainers
        .mockResolvedValueOnce(10); // activeCultures
      mockPrisma.actionLog.groupBy.mockResolvedValue([
        { action: 'ADD_CULTURE', _count: { action: 15 } },
        { action: 'DISCARD_CULTURE', _count: { action: 3 } },
      ]);
      mockPrisma.actionLog.findMany.mockResolvedValue([
        { id: 'd1', action: 'DISCARD_CULTURE', metadata: '{"reason":"contamination"}' },
        { id: 'd2', action: 'DISCARD_CULTURE', metadata: '{"reason":"old"}' },
        { id: 'd3', action: 'DISCARD_CULTURE', metadata: '{"reason":"contamination"}' },
      ]);
      mockPrisma.mediaBatch.count.mockResolvedValue(7);
      mockPrisma.actionLog.count.mockResolvedValue(5); // subcultureCount
    };

    it('should return all system stats', async () => {
      defaultMocks();

      const result = await service.getSystemReport();

      expect(result.totalContainers).toBe(18);
      expect(result.activeCultures).toBe(10);
      expect(result.mediaBatchesUsed).toBe(7);
      expect(result.subcultureCount).toBe(5);
      expect(result.statusCounts).toEqual({
        [ContainerStatus.EMPTY]: 5,
        [ContainerStatus.HAS_CULTURE]: 10,
        [ContainerStatus.DISCARDED]: 3,
      });
      expect(result.actionBreakdown).toEqual([
        { action: 'ADD_CULTURE', count: 15 },
        { action: 'DISCARD_CULTURE', count: 3 },
      ]);
      expect(result.totalDiscards).toBe(3);
      expect(result.contaminationDiscards).toBe(2);
    });

    it('should apply date filtering', async () => {
      defaultMocks();

      await service.getSystemReport('2025-01-01', '2025-12-31');

      // Check actionLog.findMany was called with date filter
      const findManyCall = mockPrisma.actionLog.findMany.mock.calls[0][0];
      expect(findManyCall.where.action).toBe('DISCARD_CULTURE');
      expect(findManyCall.where.timestamp).toBeDefined();
      expect(findManyCall.where.timestamp.gte).toEqual(new Date('2025-01-01'));
    });

    it('should calculate discard rate correctly', async () => {
      defaultMocks();

      const result = await service.getSystemReport();

      // 3 discards / 18 total * 100 = 16.666... → rounded to 16.67
      expect(result.discardRate).toBe(16.67);
    });

    it('should count contamination from metadata', async () => {
      defaultMocks();

      const result = await service.getSystemReport();

      // 2 out of 3 discards have contamination reason
      expect(result.contaminationDiscards).toBe(2);
    });

    it('should return 0 discardRate with no containers', async () => {
      mockPrisma.container.groupBy.mockResolvedValue([]);
      mockPrisma.container.count
        .mockResolvedValueOnce(0) // totalContainers
        .mockResolvedValueOnce(0); // activeCultures
      mockPrisma.actionLog.groupBy.mockResolvedValue([]);
      mockPrisma.actionLog.findMany.mockResolvedValue([]);
      mockPrisma.mediaBatch.count.mockResolvedValue(0);
      mockPrisma.actionLog.count.mockResolvedValue(0);

      const result = await service.getSystemReport();

      expect(result.discardRate).toBe(0);
      expect(result.totalContainers).toBe(0);
    });

    it('should throw BadRequestException when from > to', async () => {
      await expect(
        service.getSystemReport('2025-12-31', '2025-01-01'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.getSystemReport('2025-12-31', '2025-01-01'),
      ).rejects.toThrow('from date must be before to date');
    });

    it('should handle malformed metadata gracefully', async () => {
      mockPrisma.container.groupBy.mockResolvedValue([]);
      mockPrisma.container.count
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(2);
      mockPrisma.actionLog.groupBy.mockResolvedValue([]);
      mockPrisma.actionLog.findMany.mockResolvedValue([
        { id: 'd1', action: 'DISCARD_CULTURE', metadata: 'not-json' },
        { id: 'd2', action: 'DISCARD_CULTURE', metadata: '{"reason":"contamination"}' },
        { id: 'd3', action: 'DISCARD_CULTURE', metadata: null },
      ]);
      mockPrisma.mediaBatch.count.mockResolvedValue(0);
      mockPrisma.actionLog.count.mockResolvedValue(0);

      const result = await service.getSystemReport();

      // Only 1 valid contamination, malformed and null are ignored
      expect(result.contaminationDiscards).toBe(1);
      expect(result.totalDiscards).toBe(3);
    });
  });

  // ---------------------------------------------------------------------------
  // getContainerHistory
  // ---------------------------------------------------------------------------
  describe('getContainerHistory', () => {
    it('should return timeline of actions for a container', async () => {
      const logs = [
        {
          id: 'log-1',
          action: 'ADD_MEDIA',
          containerQr: 'QR-001',
          timestamp: new Date('2025-01-01'),
          employee: { id: 'emp-1', name: 'Alice' },
        },
        {
          id: 'log-2',
          action: 'ADD_CULTURE',
          containerQr: 'QR-001',
          timestamp: new Date('2025-01-02'),
          employee: { id: 'emp-1', name: 'Alice' },
        },
      ];
      mockPrisma.actionLog.findMany.mockResolvedValue(logs);

      const result = await service.getContainerHistory('QR-001');

      expect(result).toEqual({ qrCode: 'QR-001', timeline: logs });
      expect(mockPrisma.actionLog.findMany).toHaveBeenCalledWith({
        where: { containerQr: 'QR-001' },
        include: { employee: true },
        orderBy: { timestamp: 'asc' },
      });
    });

    it('should return empty timeline for container with no actions', async () => {
      mockPrisma.actionLog.findMany.mockResolvedValue([]);

      const result = await service.getContainerHistory('QR-EMPTY');

      expect(result).toEqual({ qrCode: 'QR-EMPTY', timeline: [] });
    });
  });
});
