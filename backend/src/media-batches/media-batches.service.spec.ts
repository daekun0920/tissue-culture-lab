import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { MediaBatchesService } from './media-batches.service';
import { PrismaService } from '../prisma/prisma.service';

describe('MediaBatchesService', () => {
  let service: MediaBatchesService;
  let prisma: PrismaService;

  const mockPrisma = {
    mediaBatch: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    mediaRecipe: {
      findUnique: jest.fn(),
    },
    container: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaBatchesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<MediaBatchesService>(MediaBatchesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all media batches', async () => {
      const expected = [
        {
          id: '1',
          recipeId: 'r1',
          recipe: { id: 'r1', name: 'MS' },
          _count: { containers: 5 },
        },
      ];
      mockPrisma.mediaBatch.findMany.mockResolvedValue(expected);

      const result = await service.findAll();

      expect(result).toEqual(expected);
      expect(mockPrisma.mediaBatch.findMany).toHaveBeenCalledWith({
        include: {
          recipe: true,
          _count: { select: { containers: true } },
        },
        orderBy: { datePrep: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a media batch when found', async () => {
      const expected = {
        id: '1',
        recipeId: 'r1',
        recipe: { id: 'r1', name: 'MS' },
        containers: [],
      };
      mockPrisma.mediaBatch.findUnique.mockResolvedValue(expected);

      const result = await service.findOne('1');

      expect(result).toEqual(expected);
      expect(mockPrisma.mediaBatch.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: {
          recipe: true,
          containers: { include: { culture: true } },
        },
      });
    });

    it('should throw NotFoundException when not found', async () => {
      mockPrisma.mediaBatch.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a media batch when recipe exists', async () => {
      const dto = { recipeId: 'r1', batchNumber: 'B001', notes: 'Test' };
      const recipe = { id: 'r1', name: 'MS Medium' };
      const expected = { id: '1', ...dto };
      mockPrisma.mediaRecipe.findUnique.mockResolvedValue(recipe);
      mockPrisma.mediaBatch.create.mockResolvedValue(expected);

      const result = await service.create(dto);

      expect(result).toEqual(expected);
      expect(mockPrisma.mediaRecipe.findUnique).toHaveBeenCalledWith({
        where: { id: 'r1' },
      });
      expect(mockPrisma.mediaBatch.create).toHaveBeenCalledWith({
        data: {
          recipeId: 'r1',
          batchNumber: 'B001',
          notes: 'Test',
        },
      });
    });

    it('should default batchNumber and notes to null when not provided', async () => {
      const dto = { recipeId: 'r1' };
      const recipe = { id: 'r1', name: 'MS Medium' };
      const expected = { id: '2', recipeId: 'r1', batchNumber: null, notes: null };
      mockPrisma.mediaRecipe.findUnique.mockResolvedValue(recipe);
      mockPrisma.mediaBatch.create.mockResolvedValue(expected);

      const result = await service.create(dto);

      expect(result).toEqual(expected);
      expect(mockPrisma.mediaBatch.create).toHaveBeenCalledWith({
        data: {
          recipeId: 'r1',
          batchNumber: null,
          notes: null,
        },
      });
    });

    it('should throw BadRequestException when recipe not found', async () => {
      const dto = { recipeId: 'invalid' };
      mockPrisma.mediaRecipe.findUnique.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      expect(mockPrisma.mediaBatch.create).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a media batch when not in use', async () => {
      const existing = {
        id: '1',
        recipeId: 'r1',
        recipe: { id: 'r1' },
        containers: [],
      };
      mockPrisma.mediaBatch.findUnique.mockResolvedValue(existing);
      mockPrisma.container.count.mockResolvedValue(0);
      mockPrisma.mediaBatch.delete.mockResolvedValue(existing);

      const result = await service.remove('1');

      expect(result).toEqual(existing);
      expect(mockPrisma.container.count).toHaveBeenCalledWith({
        where: { mediaId: '1' },
      });
      expect(mockPrisma.mediaBatch.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw BadRequestException when in use', async () => {
      const existing = {
        id: '1',
        recipeId: 'r1',
        recipe: { id: 'r1' },
        containers: [],
      };
      mockPrisma.mediaBatch.findUnique.mockResolvedValue(existing);
      mockPrisma.container.count.mockResolvedValue(3);

      await expect(service.remove('1')).rejects.toThrow(BadRequestException);
      expect(mockPrisma.mediaBatch.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when not found', async () => {
      mockPrisma.mediaBatch.findUnique.mockResolvedValue(null);

      await expect(service.remove('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
