import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { PrismaService } from '../prisma/prisma.service';

describe('EmployeesService', () => {
  let service: EmployeesService;
  let prisma: PrismaService;

  const mockPrisma = {
    employee: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    actionLog: {
      count: jest.fn(),
    },
    experiment: {
      count: jest.fn(),
    },
    experimentEntry: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<EmployeesService>(EmployeesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all employees', async () => {
      const expected = [
        { id: '1', name: 'Alice', _count: { logs: 5 } },
        { id: '2', name: 'Bob', _count: { logs: 0 } },
      ];
      mockPrisma.employee.findMany.mockResolvedValue(expected);

      const result = await service.findAll();

      expect(result).toEqual(expected);
      expect(mockPrisma.employee.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
        include: { _count: { select: { logs: true } } },
      });
    });
  });

  describe('findOne', () => {
    it('should return an employee when found', async () => {
      const expected = { id: '1', name: 'Alice', isActive: true };
      mockPrisma.employee.findUnique.mockResolvedValue(expected);

      const result = await service.findOne('1');

      expect(result).toEqual(expected);
      expect(mockPrisma.employee.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw NotFoundException when not found', async () => {
      mockPrisma.employee.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create an employee', async () => {
      const dto = { name: 'Charlie', isActive: true };
      const expected = { id: '3', ...dto };
      mockPrisma.employee.create.mockResolvedValue(expected);

      const result = await service.create(dto);

      expect(result).toEqual(expected);
      expect(mockPrisma.employee.create).toHaveBeenCalledWith({
        data: dto,
      });
    });
  });

  describe('update', () => {
    it('should update an employee when found', async () => {
      const existing = { id: '1', name: 'Alice', isActive: true };
      const dto = { name: 'Alice Updated' };
      const expected = { id: '1', name: 'Alice Updated', isActive: true };
      mockPrisma.employee.findUnique.mockResolvedValue(existing);
      mockPrisma.employee.update.mockResolvedValue(expected);

      const result = await service.update('1', dto);

      expect(result).toEqual(expected);
      expect(mockPrisma.employee.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: dto,
      });
    });

    it('should throw NotFoundException when not found', async () => {
      mockPrisma.employee.findUnique.mockResolvedValue(null);

      await expect(
        service.update('missing', { name: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete an employee when no references exist', async () => {
      const existing = { id: '1', name: 'Alice', isActive: true };
      mockPrisma.employee.findUnique.mockResolvedValue(existing);
      mockPrisma.actionLog.count.mockResolvedValue(0);
      mockPrisma.experiment.count.mockResolvedValue(0);
      mockPrisma.experimentEntry.count.mockResolvedValue(0);
      mockPrisma.employee.delete.mockResolvedValue(existing);

      const result = await service.remove('1');

      expect(result).toEqual(existing);
      expect(mockPrisma.actionLog.count).toHaveBeenCalledWith({
        where: { performedBy: '1' },
      });
      expect(mockPrisma.experiment.count).toHaveBeenCalledWith({
        where: { createdBy: '1' },
      });
      expect(mockPrisma.experimentEntry.count).toHaveBeenCalledWith({
        where: { createdBy: '1' },
      });
      expect(mockPrisma.employee.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw BadRequestException when employee has action logs', async () => {
      const existing = { id: '1', name: 'Alice', isActive: true };
      mockPrisma.employee.findUnique.mockResolvedValue(existing);
      mockPrisma.actionLog.count.mockResolvedValue(3);
      mockPrisma.experiment.count.mockResolvedValue(0);
      mockPrisma.experimentEntry.count.mockResolvedValue(0);

      await expect(service.remove('1')).rejects.toThrow(BadRequestException);
      expect(mockPrisma.employee.delete).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when employee has experiments', async () => {
      const existing = { id: '1', name: 'Alice', isActive: true };
      mockPrisma.employee.findUnique.mockResolvedValue(existing);
      mockPrisma.actionLog.count.mockResolvedValue(0);
      mockPrisma.experiment.count.mockResolvedValue(2);
      mockPrisma.experimentEntry.count.mockResolvedValue(0);

      await expect(service.remove('1')).rejects.toThrow(BadRequestException);
      expect(mockPrisma.employee.delete).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when employee has entries', async () => {
      const existing = { id: '1', name: 'Alice', isActive: true };
      mockPrisma.employee.findUnique.mockResolvedValue(existing);
      mockPrisma.actionLog.count.mockResolvedValue(0);
      mockPrisma.experiment.count.mockResolvedValue(0);
      mockPrisma.experimentEntry.count.mockResolvedValue(7);

      await expect(service.remove('1')).rejects.toThrow(BadRequestException);
      expect(mockPrisma.employee.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when not found', async () => {
      mockPrisma.employee.findUnique.mockResolvedValue(null);

      await expect(service.remove('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
