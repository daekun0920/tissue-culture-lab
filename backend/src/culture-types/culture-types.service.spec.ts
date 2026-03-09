import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CultureTypesService } from './culture-types.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CultureTypesService', () => {
  let service: CultureTypesService;
  let prisma: PrismaService;

  const mockPrisma = {
    cultureType: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    container: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CultureTypesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CultureTypesService>(CultureTypesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all culture types', async () => {
      const expected = [
        { id: '1', name: 'Orchid', _count: { containers: 2 } },
        { id: '2', name: 'Fern', _count: { containers: 0 } },
      ];
      mockPrisma.cultureType.findMany.mockResolvedValue(expected);

      const result = await service.findAll();

      expect(result).toEqual(expected);
      expect(mockPrisma.cultureType.findMany).toHaveBeenCalledWith({
        include: { _count: { select: { containers: true } } },
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a culture type when found', async () => {
      const expected = { id: '1', name: 'Orchid', containers: [] };
      mockPrisma.cultureType.findUnique.mockResolvedValue(expected);

      const result = await service.findOne('1');

      expect(result).toEqual(expected);
      expect(mockPrisma.cultureType.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: { containers: true },
      });
    });

    it('should throw NotFoundException when not found', async () => {
      mockPrisma.cultureType.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a culture type', async () => {
      const dto = { name: 'Rose', species: 'Rosa', origin: 'Garden' };
      const expected = { id: '3', ...dto };
      mockPrisma.cultureType.create.mockResolvedValue(expected);

      const result = await service.create(dto);

      expect(result).toEqual(expected);
      expect(mockPrisma.cultureType.create).toHaveBeenCalledWith({
        data: dto,
      });
    });
  });

  describe('update', () => {
    it('should update a culture type when found', async () => {
      const existing = { id: '1', name: 'Orchid', containers: [] };
      const dto = { name: 'Updated Orchid' };
      const expected = { id: '1', name: 'Updated Orchid' };
      mockPrisma.cultureType.findUnique.mockResolvedValue(existing);
      mockPrisma.cultureType.update.mockResolvedValue(expected);

      const result = await service.update('1', dto);

      expect(result).toEqual(expected);
      expect(mockPrisma.cultureType.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: dto,
      });
    });

    it('should throw NotFoundException when not found', async () => {
      mockPrisma.cultureType.findUnique.mockResolvedValue(null);

      await expect(
        service.update('missing', { name: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a culture type when not in use', async () => {
      const existing = { id: '1', name: 'Orchid', containers: [] };
      mockPrisma.cultureType.findUnique.mockResolvedValue(existing);
      mockPrisma.container.count.mockResolvedValue(0);
      mockPrisma.cultureType.delete.mockResolvedValue(existing);

      const result = await service.remove('1');

      expect(result).toEqual(existing);
      expect(mockPrisma.container.count).toHaveBeenCalledWith({
        where: { cultureId: '1' },
      });
      expect(mockPrisma.cultureType.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw BadRequestException when in use', async () => {
      const existing = { id: '1', name: 'Orchid', containers: [] };
      mockPrisma.cultureType.findUnique.mockResolvedValue(existing);
      mockPrisma.container.count.mockResolvedValue(3);

      await expect(service.remove('1')).rejects.toThrow(BadRequestException);
      expect(mockPrisma.cultureType.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when not found', async () => {
      mockPrisma.cultureType.findUnique.mockResolvedValue(null);

      await expect(service.remove('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
