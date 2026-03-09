import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { MediaRecipesService } from './media-recipes.service';
import { PrismaService } from '../prisma/prisma.service';

describe('MediaRecipesService', () => {
  let service: MediaRecipesService;
  let prisma: PrismaService;

  const mockPrisma = {
    mediaRecipe: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    mediaBatch: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaRecipesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<MediaRecipesService>(MediaRecipesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all media recipes', async () => {
      const expected = [
        { id: '1', name: 'MS Medium', _count: { batches: 2 } },
        { id: '2', name: 'WPM', _count: { batches: 0 } },
      ];
      mockPrisma.mediaRecipe.findMany.mockResolvedValue(expected);

      const result = await service.findAll();

      expect(result).toEqual(expected);
      expect(mockPrisma.mediaRecipe.findMany).toHaveBeenCalledWith({
        include: { _count: { select: { batches: true } } },
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a media recipe when found', async () => {
      const expected = { id: '1', name: 'MS Medium', batches: [] };
      mockPrisma.mediaRecipe.findUnique.mockResolvedValue(expected);

      const result = await service.findOne('1');

      expect(result).toEqual(expected);
      expect(mockPrisma.mediaRecipe.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: {
          batches: { orderBy: { datePrep: 'desc' } },
        },
      });
    });

    it('should throw NotFoundException when not found', async () => {
      mockPrisma.mediaRecipe.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a media recipe with provided hormones', async () => {
      const dto = {
        name: 'MS Medium',
        baseType: 'MS',
        phLevel: 5.8,
        agar: 8,
        hormones: '{"BAP": 1.0}',
      };
      const expected = { id: '3', ...dto };
      mockPrisma.mediaRecipe.create.mockResolvedValue(expected);

      const result = await service.create(dto);

      expect(result).toEqual(expected);
      expect(mockPrisma.mediaRecipe.create).toHaveBeenCalledWith({
        data: { ...dto, hormones: '{"BAP": 1.0}' },
      });
    });

    it('should default hormones to empty object string when not provided', async () => {
      const dto = {
        name: 'WPM',
        baseType: 'WPM',
        phLevel: 5.5,
        agar: 7,
      };
      const expected = { id: '4', ...dto, hormones: '{}' };
      mockPrisma.mediaRecipe.create.mockResolvedValue(expected);

      const result = await service.create(dto);

      expect(result).toEqual(expected);
      expect(mockPrisma.mediaRecipe.create).toHaveBeenCalledWith({
        data: { ...dto, hormones: '{}' },
      });
    });
  });

  describe('update', () => {
    it('should update a media recipe when found', async () => {
      const existing = { id: '1', name: 'MS Medium', batches: [] };
      const dto = { name: 'MS Medium v2' };
      const expected = { id: '1', name: 'MS Medium v2' };
      mockPrisma.mediaRecipe.findUnique.mockResolvedValue(existing);
      mockPrisma.mediaRecipe.update.mockResolvedValue(expected);

      const result = await service.update('1', dto);

      expect(result).toEqual(expected);
      expect(mockPrisma.mediaRecipe.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: dto,
      });
    });

    it('should throw NotFoundException when not found', async () => {
      mockPrisma.mediaRecipe.findUnique.mockResolvedValue(null);

      await expect(
        service.update('missing', { name: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a media recipe when not in use', async () => {
      const existing = { id: '1', name: 'MS Medium', batches: [] };
      mockPrisma.mediaRecipe.findUnique.mockResolvedValue(existing);
      mockPrisma.mediaBatch.count.mockResolvedValue(0);
      mockPrisma.mediaRecipe.delete.mockResolvedValue(existing);

      const result = await service.remove('1');

      expect(result).toEqual(existing);
      expect(mockPrisma.mediaBatch.count).toHaveBeenCalledWith({
        where: { recipeId: '1' },
      });
      expect(mockPrisma.mediaRecipe.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw BadRequestException when in use', async () => {
      const existing = { id: '1', name: 'MS Medium', batches: [] };
      mockPrisma.mediaRecipe.findUnique.mockResolvedValue(existing);
      mockPrisma.mediaBatch.count.mockResolvedValue(4);

      await expect(service.remove('1')).rejects.toThrow(BadRequestException);
      expect(mockPrisma.mediaRecipe.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when not found', async () => {
      mockPrisma.mediaRecipe.findUnique.mockResolvedValue(null);

      await expect(service.remove('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
