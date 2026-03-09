import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ContainerStatus } from '@prisma/client';
import { ContainersService } from './containers.service';
import { PrismaService } from '../prisma/prisma.service';
import { BatchActionDto } from './dto/batch-action.dto';

/* ------------------------------------------------------------------ */
/*  Mock Prisma                                                        */
/* ------------------------------------------------------------------ */

const mockPrisma = {
  container: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  containerType: { findUnique: jest.fn() },
  cultureType: { findUnique: jest.fn() },
  mediaBatch: { findUnique: jest.fn() },
  employee: { findUnique: jest.fn() },
  actionLog: {
    findMany: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  },
  $transaction: jest.fn((fn: (tx: typeof mockPrisma) => Promise<unknown>) =>
    fn(mockPrisma),
  ),
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function makeContainer(
  qrCode: string,
  status: ContainerStatus,
  overrides: Record<string, unknown> = {},
) {
  return {
    qrCode,
    status,
    containerTypeId: null,
    mediaId: null,
    cultureId: null,
    parentId: null,
    notes: null,
    cultureDate: null,
    subcultureInterval: null,
    dueSubcultureDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    containerType: null,
    media: null,
    culture: null,
    parent: null,
    children: [],
    logs: [],
    ...overrides,
  };
}

function makeDto(
  overrides: Partial<BatchActionDto> = {},
): BatchActionDto {
  return {
    qrCodes: ['QR-001'],
    action: 'PREPARE_MEDIA',
    employeeId: 'emp-1',
    ...overrides,
  };
}

/* ------------------------------------------------------------------ */
/*  Test Suite                                                         */
/* ------------------------------------------------------------------ */

describe('ContainersService', () => {
  let service: ContainersService;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Reset $transaction to default behaviour
    mockPrisma.$transaction.mockImplementation(
      (fn: (tx: typeof mockPrisma) => Promise<unknown>) => fn(mockPrisma),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContainersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ContainersService>(ContainersService);
  });

  /* ================================================================ */
  /*  findByQr                                                        */
  /* ================================================================ */

  describe('findByQr', () => {
    it('should return a container when found', async () => {
      const container = makeContainer('QR-001', ContainerStatus.EMPTY);
      mockPrisma.container.findUnique.mockResolvedValue(container);

      const result = await service.findByQr('QR-001');

      expect(result).toEqual(container);
      expect(mockPrisma.container.findUnique).toHaveBeenCalledWith({
        where: { qrCode: 'QR-001' },
        include: expect.objectContaining({
          containerType: true,
          culture: true,
        }),
      });
    });

    it('should throw NotFoundException when not found', async () => {
      mockPrisma.container.findUnique.mockResolvedValue(null);

      await expect(service.findByQr('MISSING')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  /* ================================================================ */
  /*  findAll                                                          */
  /* ================================================================ */

  describe('findAll', () => {
    it('should return all containers when no filter', async () => {
      const containers = [makeContainer('QR-001', ContainerStatus.EMPTY)];
      mockPrisma.container.findMany.mockResolvedValue(containers);

      const result = await service.findAll();

      expect(result).toEqual(containers);
      expect(mockPrisma.container.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: undefined }),
      );
    });

    it('should filter by status when provided', async () => {
      mockPrisma.container.findMany.mockResolvedValue([]);

      await service.findAll(ContainerStatus.HAS_CULTURE);

      expect(mockPrisma.container.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: ContainerStatus.HAS_CULTURE },
        }),
      );
    });
  });

  /* ================================================================ */
  /*  lookup                                                           */
  /* ================================================================ */

  describe('lookup', () => {
    it('should return matching containers limited to 20', async () => {
      mockPrisma.container.findMany.mockResolvedValue([]);

      await service.lookup('QR-');

      expect(mockPrisma.container.findMany).toHaveBeenCalledWith({
        where: { qrCode: { contains: 'QR-' } },
        take: 20,
      });
    });
  });

  /* ================================================================ */
  /*  validateAction                                                   */
  /* ================================================================ */

  describe('validateAction', () => {
    it('should return valid for containers in the correct status', async () => {
      mockPrisma.container.findUnique.mockResolvedValue(
        makeContainer('QR-001', ContainerStatus.EMPTY),
      );

      const result = await service.validateAction('PREPARE_MEDIA', ['QR-001']);

      expect(result.results[0].valid).toBe(true);
      expect(result.results[0].reason).toBeUndefined();
    });

    it('should return invalid for wrong status', async () => {
      mockPrisma.container.findUnique.mockResolvedValue(
        makeContainer('QR-001', ContainerStatus.HAS_CULTURE),
      );

      const result = await service.validateAction('PREPARE_MEDIA', ['QR-001']);

      expect(result.results[0].valid).toBe(false);
      expect(result.results[0].reason).toContain('EMPTY');
    });

    it('should mark unregistered containers as invalid', async () => {
      mockPrisma.container.findUnique.mockResolvedValue(null);

      const result = await service.validateAction('PREPARE_MEDIA', ['QR-001']);

      expect(result.results[0].valid).toBe(false);
      expect(result.results[0].reason).toBe('Not registered');
    });

    it('should throw BadRequestException for unknown action', async () => {
      await expect(
        service.validateAction('UNKNOWN', ['QR-001']),
      ).rejects.toThrow(BadRequestException);
    });
  });

  /* ================================================================ */
  /*  batchAction — common error paths                                 */
  /* ================================================================ */

  describe('batchAction — common errors', () => {
    it('should throw when employee not found', async () => {
      mockPrisma.employee.findUnique.mockResolvedValue(null);

      await expect(
        service.batchAction(makeDto({ action: 'PREPARE_MEDIA' })),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw for unknown action', async () => {
      mockPrisma.employee.findUnique.mockResolvedValue({ id: 'emp-1' });

      await expect(
        service.batchAction(makeDto({ action: 'BOGUS' })),
      ).rejects.toThrow(BadRequestException);
    });

    it('should error when container not found (non-register action)', async () => {
      mockPrisma.employee.findUnique.mockResolvedValue({ id: 'emp-1' });
      mockPrisma.container.findUnique.mockResolvedValue(null);

      const result = await service.batchAction(makeDto({ action: 'PREPARE_MEDIA', payload: { mediaBatchId: 'mb-1' } }));

      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ reason: 'Container not found' }),
        ]),
      );
    });

    it('should error when container is in wrong status', async () => {
      mockPrisma.employee.findUnique.mockResolvedValue({ id: 'emp-1' });
      mockPrisma.container.findUnique.mockResolvedValue(
        makeContainer('QR-001', ContainerStatus.DISCARDED),
      );

      const result = await service.batchAction(makeDto({ action: 'PREPARE_MEDIA', payload: { mediaBatchId: 'mb-1' } }));

      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            reason: expect.stringContaining('Cannot perform PREPARE_MEDIA'),
          }),
        ]),
      );
    });
  });

  /* ================================================================ */
  /*  batchAction — REGISTER_CONTAINER                                 */
  /* ================================================================ */

  describe('batchAction — REGISTER_CONTAINER', () => {
    const dto = makeDto({
      action: 'REGISTER_CONTAINER',
      payload: { containerTypeId: 'ct-1', note: 'new flask' },
    });

    beforeEach(() => {
      mockPrisma.employee.findUnique.mockResolvedValue({ id: 'emp-1' });
    });

    it('should create a new container + action log', async () => {
      mockPrisma.container.findUnique.mockResolvedValue(null);
      const created = makeContainer('QR-001', ContainerStatus.EMPTY);
      mockPrisma.container.create.mockResolvedValue(created);
      mockPrisma.containerType.findUnique.mockResolvedValue({ id: 'ct-1' });
      mockPrisma.actionLog.create.mockResolvedValue({});

      const result = await service.batchAction(dto);

      expect(result.results).toEqual([
        { qrCode: 'QR-001', status: ContainerStatus.EMPTY },
      ]);
      expect(mockPrisma.container.create).toHaveBeenCalled();
      expect(mockPrisma.actionLog.create).toHaveBeenCalled();
    });

    it('should error if container already exists', async () => {
      mockPrisma.container.findUnique.mockResolvedValue(
        makeContainer('QR-001', ContainerStatus.EMPTY),
      );

      const result = await service.batchAction(dto);

      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            reason: 'Container already registered',
          }),
        ]),
      );
    });

    it('should error if containerTypeId FK invalid', async () => {
      mockPrisma.container.findUnique.mockResolvedValue(null);
      mockPrisma.containerType.findUnique.mockResolvedValue(null);

      const result = await service.batchAction(dto);

      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            reason: expect.stringContaining('Container type'),
          }),
        ]),
      );
    });
  });

  /* ================================================================ */
  /*  batchAction — PREPARE_MEDIA                                      */
  /* ================================================================ */

  describe('batchAction — PREPARE_MEDIA', () => {
    beforeEach(() => {
      mockPrisma.employee.findUnique.mockResolvedValue({ id: 'emp-1' });
    });

    it('should update to HAS_MEDIA and set mediaId', async () => {
      const container = makeContainer('QR-001', ContainerStatus.EMPTY);
      mockPrisma.container.findUnique.mockResolvedValue(container);
      mockPrisma.mediaBatch.findUnique.mockResolvedValue({ id: 'mb-1' });
      const updated = makeContainer('QR-001', ContainerStatus.HAS_MEDIA);
      mockPrisma.container.update.mockResolvedValue(updated);
      mockPrisma.actionLog.create.mockResolvedValue({});

      const result = await service.batchAction(
        makeDto({ payload: { mediaBatchId: 'mb-1' } }),
      );

      expect(result.results[0].status).toBe(ContainerStatus.HAS_MEDIA);
      expect(mockPrisma.container.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: ContainerStatus.HAS_MEDIA,
            mediaId: 'mb-1',
          }),
        }),
      );
    });

    it('should error if mediaBatchId FK is invalid', async () => {
      const container = makeContainer('QR-001', ContainerStatus.EMPTY);
      mockPrisma.container.findUnique.mockResolvedValue(container);
      mockPrisma.mediaBatch.findUnique.mockResolvedValue(null);

      const result = await service.batchAction(
        makeDto({ payload: { mediaBatchId: 'bad-id' } }),
      );

      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            reason: expect.stringContaining('Media batch'),
          }),
        ]),
      );
    });

    it('should reject from wrong status', async () => {
      mockPrisma.container.findUnique.mockResolvedValue(
        makeContainer('QR-001', ContainerStatus.HAS_CULTURE),
      );

      const result = await service.batchAction(makeDto({ payload: { mediaBatchId: 'mb-1' } }));

      expect(result.errors[0].reason).toContain('Cannot perform PREPARE_MEDIA');
    });
  });

  /* ================================================================ */
  /*  batchAction — ADD_CULTURE                                        */
  /* ================================================================ */

  describe('batchAction — ADD_CULTURE', () => {
    const dto = makeDto({
      action: 'ADD_CULTURE',
      payload: {
        cultureTypeId: 'cult-1',
        parentQr: 'PARENT-QR',
        subcultureInterval: 14,
      },
    });

    beforeEach(() => {
      mockPrisma.employee.findUnique.mockResolvedValue({ id: 'emp-1' });
    });

    it('should update to HAS_CULTURE with culture fields and calculate due date', async () => {
      const container = makeContainer('QR-001', ContainerStatus.HAS_MEDIA);
      mockPrisma.container.findUnique.mockResolvedValue(container);
      mockPrisma.cultureType.findUnique.mockResolvedValue({ id: 'cult-1' });
      // Parent container for FK validation
      mockPrisma.container.findUnique
        .mockResolvedValueOnce(container) // first call: the container itself
        .mockResolvedValueOnce({ qrCode: 'PARENT-QR' }); // second call: parent FK check
      const updated = makeContainer('QR-001', ContainerStatus.HAS_CULTURE);
      mockPrisma.container.update.mockResolvedValue(updated);
      mockPrisma.actionLog.create.mockResolvedValue({});

      const result = await service.batchAction(dto);

      expect(result.results[0].status).toBe(ContainerStatus.HAS_CULTURE);
      expect(mockPrisma.container.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: ContainerStatus.HAS_CULTURE,
            cultureId: 'cult-1',
            parentId: 'PARENT-QR',
            subcultureInterval: 14,
          }),
        }),
      );
      // dueSubcultureDate should be set
      const updateCall = mockPrisma.container.update.mock.calls[0][0];
      expect(updateCall.data.dueSubcultureDate).toBeInstanceOf(Date);
      expect(updateCall.data.cultureDate).toBeInstanceOf(Date);
    });

    it('should use explicit dueSubcultureDate when provided', async () => {
      const container = makeContainer('QR-001', ContainerStatus.HAS_MEDIA);
      mockPrisma.container.findUnique.mockResolvedValue(container);
      mockPrisma.cultureType.findUnique.mockResolvedValue({ id: 'cult-1' });
      mockPrisma.container.update.mockResolvedValue(
        makeContainer('QR-001', ContainerStatus.HAS_CULTURE),
      );
      mockPrisma.actionLog.create.mockResolvedValue({});

      await service.batchAction(
        makeDto({
          action: 'ADD_CULTURE',
          payload: {
            cultureTypeId: 'cult-1',
            dueSubcultureDate: '2026-06-01',
          },
        }),
      );

      const updateCall = mockPrisma.container.update.mock.calls[0][0];
      expect(updateCall.data.dueSubcultureDate).toEqual(new Date('2026-06-01'));
    });

    it('should error if cultureTypeId FK is invalid', async () => {
      const container = makeContainer('QR-001', ContainerStatus.HAS_MEDIA);
      mockPrisma.container.findUnique.mockResolvedValue(container);
      mockPrisma.cultureType.findUnique.mockResolvedValue(null);

      const result = await service.batchAction(
        makeDto({
          action: 'ADD_CULTURE',
          payload: { cultureTypeId: 'bad' },
        }),
      );

      expect(result.errors[0].reason).toContain('Culture type');
    });

    it('should error if parentQr FK is invalid', async () => {
      const container = makeContainer('QR-001', ContainerStatus.HAS_MEDIA);
      // First call returns the container, second returns null (parent not found)
      mockPrisma.container.findUnique
        .mockResolvedValueOnce(container)
        .mockResolvedValueOnce(null);
      mockPrisma.cultureType.findUnique.mockResolvedValue({ id: 'cult-1' });

      const result = await service.batchAction(
        makeDto({
          action: 'ADD_CULTURE',
          payload: { cultureTypeId: 'cult-1', parentQr: 'MISSING' },
        }),
      );

      expect(result.errors[0].reason).toContain('Parent container');
    });
  });

  /* ================================================================ */
  /*  batchAction — DISCARD_CULTURE                                    */
  /* ================================================================ */

  describe('batchAction — DISCARD_CULTURE', () => {
    beforeEach(() => {
      mockPrisma.employee.findUnique.mockResolvedValue({ id: 'emp-1' });
    });

    it('should clear culture fields and set reason metadata', async () => {
      const container = makeContainer('QR-001', ContainerStatus.HAS_CULTURE);
      mockPrisma.container.findUnique.mockResolvedValue(container);
      const updated = makeContainer('QR-001', ContainerStatus.EMPTY);
      mockPrisma.container.update.mockResolvedValue(updated);
      mockPrisma.actionLog.create.mockResolvedValue({});

      const result = await service.batchAction(
        makeDto({
          action: 'DISCARD_CULTURE',
          payload: { reason: 'contamination' },
        }),
      );

      expect(result.results[0].status).toBe(ContainerStatus.EMPTY);
      expect(mockPrisma.container.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: ContainerStatus.EMPTY,
            cultureId: null,
            cultureDate: null,
            subcultureInterval: null,
            dueSubcultureDate: null,
            mediaId: null,
            parentId: null,
          }),
        }),
      );
      // Verify reason in action log metadata
      const logCall = mockPrisma.actionLog.create.mock.calls[0][0];
      expect(JSON.parse(logCall.data.metadata as string)).toEqual(
        expect.objectContaining({ reason: 'contamination' }),
      );
    });

    it('should only work from HAS_CULTURE', async () => {
      mockPrisma.container.findUnique.mockResolvedValue(
        makeContainer('QR-001', ContainerStatus.EMPTY),
      );

      const result = await service.batchAction(
        makeDto({ action: 'DISCARD_CULTURE', payload: { reason: 'contamination' } }),
      );

      expect(result.errors[0].reason).toContain('Cannot perform DISCARD_CULTURE');
    });
  });

  /* ================================================================ */
  /*  batchAction — DISCARD_CONTAINER                                  */
  /* ================================================================ */

  describe('batchAction — DISCARD_CONTAINER', () => {
    beforeEach(() => {
      mockPrisma.employee.findUnique.mockResolvedValue({ id: 'emp-1' });
    });

    it.each([
      ContainerStatus.EMPTY,
      ContainerStatus.HAS_MEDIA,
      ContainerStatus.HAS_CULTURE,
    ])('should discard from %s', async (status) => {
      const container = makeContainer('QR-001', status);
      mockPrisma.container.findUnique.mockResolvedValue(container);
      mockPrisma.container.update.mockResolvedValue(
        makeContainer('QR-001', ContainerStatus.DISCARDED),
      );
      mockPrisma.actionLog.create.mockResolvedValue({});

      const result = await service.batchAction(
        makeDto({
          action: 'DISCARD_CONTAINER',
          payload: { reason: 'other' },
        }),
      );

      expect(result.results[0].status).toBe(ContainerStatus.DISCARDED);
    });

    it('should reject from DISCARDED', async () => {
      mockPrisma.container.findUnique.mockResolvedValue(
        makeContainer('QR-001', ContainerStatus.DISCARDED),
      );

      const result = await service.batchAction(
        makeDto({ action: 'DISCARD_CONTAINER', payload: { reason: 'other' } }),
      );

      expect(result.errors[0].reason).toContain(
        'Cannot perform DISCARD_CONTAINER',
      );
    });
  });

  /* ================================================================ */
  /*  batchAction — SUBCULTURE                                         */
  /* ================================================================ */

  describe('batchAction — SUBCULTURE', () => {
    beforeEach(() => {
      mockPrisma.employee.findUnique.mockResolvedValue({ id: 'emp-1' });
    });

    it('should clear source and link targets', async () => {
      const source = makeContainer('QR-001', ContainerStatus.HAS_CULTURE, {
        cultureId: 'cult-1',
        subcultureInterval: 14,
      });
      const target = makeContainer('TGT-001', ContainerStatus.HAS_MEDIA);

      // findUnique calls: (1) source container, (2) target validation, (3) target in tx
      mockPrisma.container.findUnique
        .mockResolvedValueOnce(source) // for the main container lookup
        .mockResolvedValueOnce(target) // SUBCULTURE pre-validation
        .mockResolvedValueOnce(target); // inside $transaction for linking

      mockPrisma.container.update.mockResolvedValue(
        makeContainer('QR-001', ContainerStatus.EMPTY),
      );
      mockPrisma.actionLog.create.mockResolvedValue({});

      const result = await service.batchAction(
        makeDto({
          action: 'SUBCULTURE',
          payload: { targetQrCodes: ['TGT-001'] },
        }),
      );

      expect(result.results[0].status).toBe(ContainerStatus.EMPTY);
      // Source should be cleared
      expect(mockPrisma.container.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: ContainerStatus.EMPTY,
            cultureId: null,
            mediaId: null,
          }),
        }),
      );
    });

    it('should error if no targets provided', async () => {
      const source = makeContainer('QR-001', ContainerStatus.HAS_CULTURE);
      mockPrisma.container.findUnique.mockResolvedValue(source);

      const result = await service.batchAction(
        makeDto({
          action: 'SUBCULTURE',
          payload: { targetQrCodes: [] },
        }),
      );

      expect(result.errors[0].reason).toContain(
        'SUBCULTURE requires at least one target',
      );
    });

    it('should error if target not found', async () => {
      const source = makeContainer('QR-001', ContainerStatus.HAS_CULTURE);
      mockPrisma.container.findUnique
        .mockResolvedValueOnce(source)
        .mockResolvedValueOnce(null); // target not found

      const result = await service.batchAction(
        makeDto({
          action: 'SUBCULTURE',
          payload: { targetQrCodes: ['MISSING'] },
        }),
      );

      expect(result.errors[0].reason).toContain('Invalid targets');
      expect(result.errors[0].reason).toContain('not found');
    });

    it('should error if target is not HAS_MEDIA', async () => {
      const source = makeContainer('QR-001', ContainerStatus.HAS_CULTURE);
      const badTarget = makeContainer('TGT-001', ContainerStatus.EMPTY);
      mockPrisma.container.findUnique
        .mockResolvedValueOnce(source)
        .mockResolvedValueOnce(badTarget);

      const result = await service.batchAction(
        makeDto({
          action: 'SUBCULTURE',
          payload: { targetQrCodes: ['TGT-001'] },
        }),
      );

      expect(result.errors[0].reason).toContain('must be HAS_MEDIA');
    });
  });

  /* ================================================================ */
  /*  batchAction — EXIT_CULTURE                                       */
  /* ================================================================ */

  describe('batchAction — EXIT_CULTURE', () => {
    beforeEach(() => {
      mockPrisma.employee.findUnique.mockResolvedValue({ id: 'emp-1' });
    });

    it('should clear fields and parentId', async () => {
      const container = makeContainer('QR-001', ContainerStatus.HAS_CULTURE);
      mockPrisma.container.findUnique.mockResolvedValue(container);
      const updated = makeContainer('QR-001', ContainerStatus.EMPTY);
      mockPrisma.container.update.mockResolvedValue(updated);
      mockPrisma.actionLog.create.mockResolvedValue({});

      const result = await service.batchAction(
        makeDto({
          action: 'EXIT_CULTURE',
          payload: { exitType: 'harvested' },
        }),
      );

      expect(result.results[0].status).toBe(ContainerStatus.EMPTY);
      expect(mockPrisma.container.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: ContainerStatus.EMPTY,
            cultureId: null,
            mediaId: null,
            cultureDate: null,
            subcultureInterval: null,
            dueSubcultureDate: null,
            parentId: null,
          }),
        }),
      );
    });

    it('should only work from HAS_CULTURE', async () => {
      mockPrisma.container.findUnique.mockResolvedValue(
        makeContainer('QR-001', ContainerStatus.HAS_MEDIA),
      );

      const result = await service.batchAction(
        makeDto({ action: 'EXIT_CULTURE' }),
      );

      expect(result.errors[0].reason).toContain('Cannot perform EXIT_CULTURE');
    });
  });

  /* ================================================================ */
  /*  batchAction — WASH                                               */
  /* ================================================================ */

  describe('batchAction — WASH', () => {
    beforeEach(() => {
      mockPrisma.employee.findUnique.mockResolvedValue({ id: 'emp-1' });
    });

    it('should clear everything and set EMPTY', async () => {
      const container = makeContainer('QR-001', ContainerStatus.DISCARDED);
      mockPrisma.container.findUnique.mockResolvedValue(container);
      const updated = makeContainer('QR-001', ContainerStatus.EMPTY);
      mockPrisma.container.update.mockResolvedValue(updated);
      mockPrisma.actionLog.create.mockResolvedValue({});

      const result = await service.batchAction(
        makeDto({ action: 'WASH' }),
      );

      expect(result.results[0].status).toBe(ContainerStatus.EMPTY);
      expect(mockPrisma.container.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: ContainerStatus.EMPTY,
            mediaId: null,
            cultureId: null,
            parentId: null,
            cultureDate: null,
            subcultureInterval: null,
            dueSubcultureDate: null,
            notes: null,
          }),
        }),
      );
    });

    it('should only work from DISCARDED', async () => {
      mockPrisma.container.findUnique.mockResolvedValue(
        makeContainer('QR-001', ContainerStatus.EMPTY),
      );

      const result = await service.batchAction(
        makeDto({ action: 'WASH' }),
      );

      expect(result.errors[0].reason).toContain('Cannot perform WASH');
    });
  });

  /* ================================================================ */
  /*  getDashboardStats                                                */
  /* ================================================================ */

  describe('getDashboardStats', () => {
    it('should return statusCounts, recentLogs, totalCount, overdueCultures', async () => {
      mockPrisma.container.groupBy.mockResolvedValue([
        { status: ContainerStatus.EMPTY, _count: { status: 5 } },
        { status: ContainerStatus.HAS_CULTURE, _count: { status: 3 } },
      ]);
      mockPrisma.actionLog.findMany.mockResolvedValue([
        { id: 'log-1', action: 'PREPARE_MEDIA' },
      ]);
      mockPrisma.container.count
        .mockResolvedValueOnce(10) // totalCount
        .mockResolvedValueOnce(2); // overdueCultures

      const result = await service.getDashboardStats();

      expect(result.statusCounts).toEqual({
        EMPTY: 5,
        HAS_MEDIA: 0,
        HAS_CULTURE: 3,
        DISCARDED: 0,
      });
      expect(result.recentLogs).toHaveLength(1);
      expect(result.totalCount).toBe(10);
      expect(result.overdueCultures).toBe(2);
    });
  });

  /* ================================================================ */
  /*  registerContainers                                               */
  /* ================================================================ */

  describe('registerContainers', () => {
    it('should create containers in a transaction', async () => {
      mockPrisma.container.findUnique.mockResolvedValue(null);
      mockPrisma.container.create.mockResolvedValue({});

      const result = await service.registerContainers(
        ['QR-A', 'QR-B'],
        'ct-1',
        'batch note',
      );

      expect(result.created).toBe(2);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should skip existing containers', async () => {
      mockPrisma.container.findUnique
        .mockResolvedValueOnce(makeContainer('QR-A', ContainerStatus.EMPTY))
        .mockResolvedValueOnce(null);
      mockPrisma.container.create.mockResolvedValue({});

      const result = await service.registerContainers(['QR-A', 'QR-B']);

      expect(result.created).toBe(1);
    });

    it('should throw for empty array', async () => {
      await expect(service.registerContainers([])).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
