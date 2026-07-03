import { prisma } from '../../config/database.js';
import { AppError } from '../../middleware/error-handler.js';
import type {
  CreateMediaInput,
  UpdateMediaInput,
  CreateSeasonInput,
  UpdateSeasonInput,
} from './media.schema.js';

export class MediaService {
  async list(userId: string, filters?: { type?: string; search?: string; sort?: string }) {
    const where: any = { userId };

    if (filters?.type && filters.type !== 'all') {
      where.type = filters.type;
    }
    if (filters?.search) {
      where.title = { contains: filters.search };
    }

    let orderBy: any = { createdAt: 'desc' };
    if (filters?.sort === 'rating') orderBy = { rating: 'desc' };
    else if (filters?.sort === 'alpha') orderBy = { title: 'asc' };

    return prisma.mediaItem.findMany({
      where,
      orderBy,
      include: { seasons: { orderBy: { seasonNumber: 'asc' } } },
    });
  }

  async getById(userId: string, mediaId: string) {
    const item = await prisma.mediaItem.findUnique({
      where: { id: mediaId },
      include: { seasons: { orderBy: { seasonNumber: 'asc' } } },
    });

    if (!item || item.userId !== userId) {
      throw new AppError(404, 'Media not found.', 'NOT_FOUND');
    }

    return item;
  }

  async create(userId: string, input: CreateMediaInput) {
    const item = await prisma.mediaItem.create({
      data: {
        ...input,
        userId,
      },
      include: { seasons: true },
    });

    // Log activity
    await prisma.activityFeed.create({
      data: {
        userId,
        type: 'added_media',
        payload: JSON.stringify({
          mediaId: item.id,
          title: item.title,
          type: item.type,
          coverImageUrl: item.coverImageUrl,
          rating: item.rating,
        }),
      },
    });

    return item;
  }

  async update(userId: string, mediaId: string, input: UpdateMediaInput) {
    // Verify ownership
    const existing = await prisma.mediaItem.findUnique({ where: { id: mediaId } });
    if (!existing || existing.userId !== userId) {
      throw new AppError(404, 'Media not found.', 'NOT_FOUND');
    }

    const updated = await prisma.mediaItem.update({
      where: { id: mediaId },
      data: input,
      include: { seasons: { orderBy: { seasonNumber: 'asc' } } },
    });

    // Log rating activity if rating changed
    if (input.rating !== undefined && input.rating !== existing.rating) {
      await prisma.activityFeed.create({
        data: {
          userId,
          type: 'rated',
          payload: JSON.stringify({
            mediaId: updated.id,
            title: updated.title,
            type: updated.type,
            rating: updated.rating,
            coverImageUrl: updated.coverImageUrl,
          }),
        },
      });
    }

    // Log favorite activity
    if (input.isFavorite !== undefined && input.isFavorite !== existing.isFavorite) {
      if (input.isFavorite) {
        await prisma.activityFeed.create({
          data: {
            userId,
            type: 'favorited',
            payload: JSON.stringify({
              mediaId: updated.id,
              title: updated.title,
              type: updated.type,
              coverImageUrl: updated.coverImageUrl,
            }),
          },
        });
      }
    }

    return updated;
  }

  async delete(userId: string, mediaId: string) {
    const existing = await prisma.mediaItem.findUnique({ where: { id: mediaId } });
    if (!existing || existing.userId !== userId) {
      throw new AppError(404, 'Media not found.', 'NOT_FOUND');
    }

    await prisma.mediaItem.delete({ where: { id: mediaId } });
    return { deleted: true };
  }

  // ── Seasons ──

  async addSeason(userId: string, mediaId: string, input: CreateSeasonInput) {
    const media = await prisma.mediaItem.findUnique({ where: { id: mediaId } });
    if (!media || media.userId !== userId) {
      throw new AppError(404, 'Media not found.', 'NOT_FOUND');
    }

    return prisma.season.create({
      data: {
        ...input,
        mediaItemId: mediaId,
      },
    });
  }

  async updateSeason(
    userId: string,
    mediaId: string,
    seasonId: string,
    input: UpdateSeasonInput,
  ) {
    const media = await prisma.mediaItem.findUnique({ where: { id: mediaId } });
    if (!media || media.userId !== userId) {
      throw new AppError(404, 'Media not found.', 'NOT_FOUND');
    }

    const season = await prisma.season.findUnique({ where: { id: seasonId } });
    if (!season || season.mediaItemId !== mediaId) {
      throw new AppError(404, 'Season not found.', 'NOT_FOUND');
    }

    const updated = await prisma.season.update({
      where: { id: seasonId },
      data: {
        ...input,
        completionDate: input.completed ? new Date() : season.completionDate,
      },
    });

    // Log completion activity
    if (input.completed && !season.completed) {
      await prisma.activityFeed.create({
        data: {
          userId,
          type: 'completed_season',
          payload: JSON.stringify({
            mediaId: media.id,
            title: media.title,
            type: media.type,
            seasonNumber: updated.seasonNumber,
            coverImageUrl: media.coverImageUrl,
          }),
        },
      });
    }

    return updated;
  }

  async deleteSeason(userId: string, mediaId: string, seasonId: string) {
    const media = await prisma.mediaItem.findUnique({ where: { id: mediaId } });
    if (!media || media.userId !== userId) {
      throw new AppError(404, 'Media not found.', 'NOT_FOUND');
    }

    await prisma.season.delete({ where: { id: seasonId } });
    return { deleted: true };
  }
}

export const mediaService = new MediaService();
