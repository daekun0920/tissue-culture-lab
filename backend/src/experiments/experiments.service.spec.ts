import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ExperimentsService } from './experiments.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  experiment: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  employee: {
    findUnique: jest.fn(),
  },
  container: {
    findUnique: jest.fn(),
  },
  experimentCulture: {
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  experimentEntry: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
};

describe('ExperimentsService', () => {
  let service: ExperimentsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExperimentsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ExperimentsService>(ExperimentsService);
  });

  // ---------------------------------------------------------------------------
  // findAll
  // ---------------------------------------------------------------------------
  describe('findAll', () => {
    it('should return all experiments when no status filter', async () => {
      const experiments = [
        { id: '1', name: 'Exp1', status: 'active' },
        { id: '2', name: 'Exp2', status: 'completed' },
      ];
      mockPrisma.experiment.findMany.mockResolvedValue(experiments);

      const result = await service.findAll();

      expect(result).toEqual(experiments);
      expect(mockPrisma.experiment.findMany).toHaveBeenCalledWith({
        where: undefined,
        include: {
          creator: true,
          _count: { select: { cultures: true, entries: true } },
        },
        orderBy: { startDate: 'desc' },
      });
    });

    it('should filter experiments by status', async () => {
      const active = [{ id: '1', name: 'Exp1', status: 'active' }];
      mockPrisma.experiment.findMany.mockResolvedValue(active);

      const result = await service.findAll('active');

      expect(result).toEqual(active);
      expect(mockPrisma.experiment.findMany).toHaveBeenCalledWith({
        where: { status: 'active' },
        include: {
          creator: true,
          _count: { select: { cultures: true, entries: true } },
        },
        orderBy: { startDate: 'desc' },
      });
    });
  });

  // ---------------------------------------------------------------------------
  // findOne
  // ---------------------------------------------------------------------------
  describe('findOne', () => {
    it('should return experiment when found', async () => {
      const experiment = {
        id: 'exp-1',
        name: 'Test Experiment',
        status: 'active',
        creator: { id: 'emp-1', name: 'Alice' },
        cultures: [],
        entries: [],
      };
      mockPrisma.experiment.findUnique.mockResolvedValue(experiment);

      const result = await service.findOne('exp-1');

      expect(result).toEqual(experiment);
      expect(mockPrisma.experiment.findUnique).toHaveBeenCalledWith({
        where: { id: 'exp-1' },
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
    });

    it('should throw NotFoundException when experiment not found', async () => {
      mockPrisma.experiment.findUnique.mockResolvedValue(null);

      await expect(service.findOne('not-found')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('not-found')).rejects.toThrow(
        'Experiment not-found not found',
      );
    });
  });

  // ---------------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------------
  describe('create', () => {
    it('should create experiment with valid employee', async () => {
      const employee = { id: 'emp-1', name: 'Alice' };
      const created = {
        id: 'exp-1',
        name: 'New Exp',
        description: 'Desc',
        createdBy: 'emp-1',
        creator: employee,
      };
      mockPrisma.employee.findUnique.mockResolvedValue(employee);
      mockPrisma.experiment.create.mockResolvedValue(created);

      const result = await service.create({
        name: 'New Exp',
        description: 'Desc',
        createdBy: 'emp-1',
      });

      expect(result).toEqual(created);
      expect(mockPrisma.experiment.create).toHaveBeenCalledWith({
        data: {
          name: 'New Exp',
          description: 'Desc',
          createdBy: 'emp-1',
        },
        include: { creator: true },
      });
    });

    it('should set description to null when not provided', async () => {
      const employee = { id: 'emp-1', name: 'Alice' };
      mockPrisma.employee.findUnique.mockResolvedValue(employee);
      mockPrisma.experiment.create.mockResolvedValue({ id: 'exp-1' });

      await service.create({ name: 'No Desc', createdBy: 'emp-1' });

      expect(mockPrisma.experiment.create).toHaveBeenCalledWith({
        data: {
          name: 'No Desc',
          description: null,
          createdBy: 'emp-1',
        },
        include: { creator: true },
      });
    });

    it('should throw BadRequestException for missing employee', async () => {
      mockPrisma.employee.findUnique.mockResolvedValue(null);

      await expect(
        service.create({ name: 'Exp', createdBy: 'ghost' }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create({ name: 'Exp', createdBy: 'ghost' }),
      ).rejects.toThrow('Employee ghost not found');
    });
  });

  // ---------------------------------------------------------------------------
  // update
  // ---------------------------------------------------------------------------
  describe('update', () => {
    const activeExperiment = {
      id: 'exp-1',
      name: 'Exp',
      status: 'active',
      creator: { id: 'emp-1' },
      cultures: [],
      entries: [],
    };

    beforeEach(() => {
      mockPrisma.experiment.findUnique.mockResolvedValue(activeExperiment);
    });

    it('should update name and description', async () => {
      const updated = { ...activeExperiment, name: 'Updated', description: 'New desc' };
      mockPrisma.experiment.update.mockResolvedValue(updated);

      const result = await service.update('exp-1', {
        name: 'Updated',
        description: 'New desc',
      });

      expect(result).toEqual(updated);
      expect(mockPrisma.experiment.update).toHaveBeenCalledWith({
        where: { id: 'exp-1' },
        data: { name: 'Updated', description: 'New desc' },
        include: { creator: true },
      });
    });

    it('should update status from active to completed', async () => {
      const updated = { ...activeExperiment, status: 'completed' };
      mockPrisma.experiment.update.mockResolvedValue(updated);

      const result = await service.update('exp-1', { status: 'completed' });

      expect(result.status).toBe('completed');
      expect(mockPrisma.experiment.update).toHaveBeenCalledWith({
        where: { id: 'exp-1' },
        data: { status: 'completed' },
        include: { creator: true },
      });
    });

    it('should update status from active to cancelled', async () => {
      const updated = { ...activeExperiment, status: 'cancelled' };
      mockPrisma.experiment.update.mockResolvedValue(updated);

      const result = await service.update('exp-1', { status: 'cancelled' });

      expect(result.status).toBe('cancelled');
    });

    it('should throw BadRequestException for invalid status', async () => {
      await expect(
        service.update('exp-1', { status: 'invalid' }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.update('exp-1', { status: 'invalid' }),
      ).rejects.toThrow('Invalid status: invalid');
    });

    it('should throw BadRequestException when experiment is not active', async () => {
      const completedExperiment = {
        ...activeExperiment,
        status: 'completed',
      };
      mockPrisma.experiment.findUnique.mockResolvedValue(completedExperiment);

      await expect(
        service.update('exp-1', { status: 'cancelled' }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.update('exp-1', { status: 'cancelled' }),
      ).rejects.toThrow('Cannot change status of completed experiment');
    });
  });

  // ---------------------------------------------------------------------------
  // addCultures
  // ---------------------------------------------------------------------------
  describe('addCultures', () => {
    const activeExperiment = {
      id: 'exp-1',
      name: 'Exp',
      status: 'active',
      creator: { id: 'emp-1' },
      cultures: [],
      entries: [],
    };

    beforeEach(() => {
      mockPrisma.experiment.findUnique.mockResolvedValue(activeExperiment);
    });

    it('should add containers to active experiment', async () => {
      mockPrisma.container.findUnique.mockResolvedValue({
        qrCode: 'QR-001',
        status: 'HAS_CULTURE',
      });
      mockPrisma.experimentCulture.findUnique.mockResolvedValue(null);
      mockPrisma.experimentCulture.create.mockResolvedValue({
        id: 'ec-1',
        experimentId: 'exp-1',
        containerQr: 'QR-001',
      });

      const result = await service.addCultures('exp-1', {
        containerQrCodes: ['QR-001'],
        notes: 'Test note',
      });

      expect(result.results).toEqual([{ containerQr: 'QR-001', added: true }]);
      expect(mockPrisma.experimentCulture.create).toHaveBeenCalledWith({
        data: {
          experimentId: 'exp-1',
          containerQr: 'QR-001',
          notes: 'Test note',
        },
      });
    });

    it('should report error for not-found containers', async () => {
      mockPrisma.container.findUnique.mockResolvedValue(null);

      const result = await service.addCultures('exp-1', {
        containerQrCodes: ['MISSING'],
      });

      expect(result.results).toEqual([
        { containerQr: 'MISSING', added: false, reason: 'Container not found' },
      ]);
      expect(mockPrisma.experimentCulture.create).not.toHaveBeenCalled();
    });

    it('should report error for containers already in experiment', async () => {
      mockPrisma.container.findUnique.mockResolvedValue({
        qrCode: 'QR-001',
      });
      mockPrisma.experimentCulture.findUnique.mockResolvedValue({
        id: 'ec-existing',
        experimentId: 'exp-1',
        containerQr: 'QR-001',
      });

      const result = await service.addCultures('exp-1', {
        containerQrCodes: ['QR-001'],
      });

      expect(result.results).toEqual([
        {
          containerQr: 'QR-001',
          added: false,
          reason: 'Already in experiment',
        },
      ]);
      expect(mockPrisma.experimentCulture.create).not.toHaveBeenCalled();
    });

    it('should handle mixed results for multiple containers', async () => {
      mockPrisma.container.findUnique
        .mockResolvedValueOnce({ qrCode: 'QR-001' })
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ qrCode: 'QR-003' });

      mockPrisma.experimentCulture.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'ec-existing' });

      mockPrisma.experimentCulture.create.mockResolvedValue({ id: 'ec-new' });

      const result = await service.addCultures('exp-1', {
        containerQrCodes: ['QR-001', 'QR-002', 'QR-003'],
      });

      expect(result.results).toHaveLength(3);
      expect(result.results[0]).toEqual({ containerQr: 'QR-001', added: true });
      expect(result.results[1]).toEqual({
        containerQr: 'QR-002',
        added: false,
        reason: 'Container not found',
      });
      expect(result.results[2]).toEqual({
        containerQr: 'QR-003',
        added: false,
        reason: 'Already in experiment',
      });
    });

    it('should throw BadRequestException for non-active experiment', async () => {
      const completedExp = { ...activeExperiment, status: 'completed' };
      mockPrisma.experiment.findUnique.mockResolvedValue(completedExp);

      await expect(
        service.addCultures('exp-1', { containerQrCodes: ['QR-001'] }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.addCultures('exp-1', { containerQrCodes: ['QR-001'] }),
      ).rejects.toThrow('Cannot modify completed experiment');
    });
  });

  // ---------------------------------------------------------------------------
  // removeCulture
  // ---------------------------------------------------------------------------
  describe('removeCulture', () => {
    it('should remove existing culture from experiment', async () => {
      const entry = { id: 'ec-1', experimentId: 'exp-1', containerQr: 'QR-001' };
      mockPrisma.experimentCulture.findUnique.mockResolvedValue(entry);
      mockPrisma.experimentCulture.delete.mockResolvedValue(entry);

      const result = await service.removeCulture('exp-1', 'QR-001');

      expect(result).toEqual({ deleted: true });
      expect(mockPrisma.experimentCulture.findUnique).toHaveBeenCalledWith({
        where: {
          experimentId_containerQr: {
            experimentId: 'exp-1',
            containerQr: 'QR-001',
          },
        },
      });
      expect(mockPrisma.experimentCulture.delete).toHaveBeenCalledWith({
        where: { id: 'ec-1' },
      });
    });

    it('should throw NotFoundException when culture not in experiment', async () => {
      mockPrisma.experimentCulture.findUnique.mockResolvedValue(null);

      await expect(
        service.removeCulture('exp-1', 'QR-MISSING'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.removeCulture('exp-1', 'QR-MISSING'),
      ).rejects.toThrow('Container QR-MISSING not found in experiment exp-1');
    });
  });

  // ---------------------------------------------------------------------------
  // addEntry
  // ---------------------------------------------------------------------------
  describe('addEntry', () => {
    const activeExperiment = {
      id: 'exp-1',
      name: 'Exp',
      status: 'active',
      creator: { id: 'emp-1' },
      cultures: [],
      entries: [],
    };

    beforeEach(() => {
      mockPrisma.experiment.findUnique.mockResolvedValue(activeExperiment);
    });

    it('should create entry on active experiment', async () => {
      const entry = {
        id: 'ee-1',
        experimentId: 'exp-1',
        entryType: 'observation',
        content: 'Growth observed',
        createdBy: 'emp-1',
        creator: { id: 'emp-1', name: 'Alice' },
      };
      mockPrisma.experimentEntry.create.mockResolvedValue(entry);

      const result = await service.addEntry('exp-1', {
        entryType: 'observation',
        content: 'Growth observed',
        createdBy: 'emp-1',
      });

      expect(result).toEqual(entry);
      expect(mockPrisma.experimentEntry.create).toHaveBeenCalledWith({
        data: {
          experimentId: 'exp-1',
          entryType: 'observation',
          content: 'Growth observed',
          createdBy: 'emp-1',
        },
        include: { creator: true },
      });
    });

    it('should default entryType to log when not provided', async () => {
      mockPrisma.experimentEntry.create.mockResolvedValue({
        id: 'ee-1',
        entryType: 'log',
      });

      await service.addEntry('exp-1', {
        content: 'Log entry',
        createdBy: 'emp-1',
      });

      expect(mockPrisma.experimentEntry.create).toHaveBeenCalledWith({
        data: {
          experimentId: 'exp-1',
          entryType: 'log',
          content: 'Log entry',
          createdBy: 'emp-1',
        },
        include: { creator: true },
      });
    });

    it('should throw BadRequestException for non-active experiment', async () => {
      const cancelledExp = { ...activeExperiment, status: 'cancelled' };
      mockPrisma.experiment.findUnique.mockResolvedValue(cancelledExp);

      await expect(
        service.addEntry('exp-1', { content: 'test', createdBy: 'emp-1' }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.addEntry('exp-1', { content: 'test', createdBy: 'emp-1' }),
      ).rejects.toThrow('Cannot modify cancelled experiment');
    });
  });

  // ---------------------------------------------------------------------------
  // getEntries
  // ---------------------------------------------------------------------------
  describe('getEntries', () => {
    it('should return all entries for experiment', async () => {
      const entries = [
        { id: 'ee-1', entryType: 'log', content: 'Entry 1' },
        { id: 'ee-2', entryType: 'observation', content: 'Entry 2' },
      ];
      mockPrisma.experimentEntry.findMany.mockResolvedValue(entries);

      const result = await service.getEntries('exp-1');

      expect(result).toEqual(entries);
      expect(mockPrisma.experimentEntry.findMany).toHaveBeenCalledWith({
        where: { experimentId: 'exp-1' },
        include: { creator: true },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter entries by entryType', async () => {
      const observations = [
        { id: 'ee-2', entryType: 'observation', content: 'Obs' },
      ];
      mockPrisma.experimentEntry.findMany.mockResolvedValue(observations);

      const result = await service.getEntries('exp-1', 'observation');

      expect(result).toEqual(observations);
      expect(mockPrisma.experimentEntry.findMany).toHaveBeenCalledWith({
        where: { experimentId: 'exp-1', entryType: 'observation' },
        include: { creator: true },
        orderBy: { createdAt: 'desc' },
      });
    });
  });
});
