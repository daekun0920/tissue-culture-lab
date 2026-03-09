import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ContainerTypesService } from './container-types.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ContainerTypesService', () => {
  let service: ContainerTypesService;
  let prisma: PrismaService;

  const mockPrisma = {
    containerType: {
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
        ContainerTypesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ContainerTypesService>(ContainerTypesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all container types', async () => {
      const expected = [
        { id: '1', name: 'Jar', _count: { containers: 3 } },
        { id: '2', name: 'Flask', _count: { containers: 0 } },
      ];
      mockPrisma.containerType.findMany.mockResolvedValue(expected);

      const result = await service.findAll();

      expect(result).toEqual(expected);
      expect(mockPrisma.containerType.findMany).toHaveBeenCalledWith({
        include: { _count: { select: { containers: true } } },
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a container type when found', async () => {
      const expected = { id: '1', name: 'Jar', containers: [] };
      mockPrisma.containerType.findUnique.mockResolvedValue(expected);

      const result = await service.findOne('1');

      expect(result).toEqual(expected);
      expect(mockPrisma.containerType.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: { containers: true },
      });
    });

    it('should throw NotFoundException when not found', async () => {
      mockPrisma.containerType.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a container type', async () => {
      const dto = { name: 'Petri Dish', size: '100mm', isVented: true };
      const expected = { id: '3', ...dto };
      mockPrisma.containerType.create.mockResolvedValue(expected);

      const result = await service.create(dto);

      expect(result).toEqual(expected);
      expect(mockPrisma.containerType.create).toHaveBeenCalledWith({
        data: dto,
      });
    });
  });

  describe('update', () => {
    it('should update a container type when found', async () => {
      const existing = { id: '1', name: 'Jar', containers: [] };
      const dto = { name: 'Updated Jar' };
      const expected = { id: '1', name: 'Updated Jar' };
      mockPrisma.containerType.findUnique.mockResolvedValue(existing);
      mockPrisma.containerType.update.mockResolvedValue(expected);

      const result = await service.update('1', dto);

      expect(result).toEqual(expected);
      expect(mockPrisma.containerType.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: dto,
      });
    });

    it('should throw NotFoundException when not found', async () => {
      mockPrisma.containerType.findUnique.mockResolvedValue(null);

      await expect(service.update('missing', { name: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a container type when not in use', async () => {
      const existing = { id: '1', name: 'Jar', containers: [] };
      mockPrisma.containerType.findUnique.mockResolvedValue(existing);
      mockPrisma.container.count.mockResolvedValue(0);
      mockPrisma.containerType.delete.mockResolvedValue(existing);

      const result = await service.remove('1');

      expect(result).toEqual(existing);
      expect(mockPrisma.container.count).toHaveBeenCalledWith({
        where: { containerTypeId: '1' },
      });
      expect(mockPrisma.containerType.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw BadRequestException when in use', async () => {
      const existing = { id: '1', name: 'Jar', containers: [] };
      mockPrisma.containerType.findUnique.mockResolvedValue(existing);
      mockPrisma.container.count.mockResolvedValue(5);

      await expect(service.remove('1')).rejects.toThrow(BadRequestException);
      expect(mockPrisma.containerType.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when not found', async () => {
      mockPrisma.containerType.findUnique.mockResolvedValue(null);

      await expect(service.remove('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
