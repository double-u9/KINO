import { prisma } from '../../config/database.js';

export class FeedService {
  /** Get friend activity feed (paginated) */
  async getFriendFeed(userId: string, cursor?: string, limit = 20) {
    // Get all friend IDs
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      select: { userAId: true, userBId: true },
    });

    const friendIds = friendships.map((f: any) =>
      f.userAId === userId ? f.userBId : f.userAId,
    );

    // Include own activities too
    const allIds = [userId, ...friendIds];

    const where: any = { userId: { in: allIds } };
    if (cursor) {
      where.createdAt = { lt: new Date(cursor) };
    }

    const activities = await prisma.activityFeed.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      include: {
        user: {
          select: {
            id: true, username: true,
            profile: { select: { displayName: true, avatarUrl: true } },
          },
        },
      },
    });

    const hasMore = activities.length > limit;
    const items = hasMore ? activities.slice(0, limit) : activities;
    const nextCursor = hasMore ? items[items.length - 1].createdAt.toISOString() : null;

    // Parse JSON payloads
    const parsed = items.map((a: any) => ({
      ...a,
      payload: typeof a.payload === 'string' ? JSON.parse(a.payload) : a.payload,
    }));

    return { activities: parsed, hasMore, nextCursor };
  }

  /** Get a specific user's activity */
  async getUserActivity(userId: string, cursor?: string, limit = 20) {
    const where: any = { userId };
    if (cursor) {
      where.createdAt = { lt: new Date(cursor) };
    }

    const activities = await prisma.activityFeed.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      include: {
        user: {
          select: {
            id: true, username: true,
            profile: { select: { displayName: true, avatarUrl: true } },
          },
        },
      },
    });

    const hasMore = activities.length > limit;
    const items = hasMore ? activities.slice(0, limit) : activities;
    const nextCursor = hasMore ? items[items.length - 1].createdAt.toISOString() : null;

    const parsed = items.map((a: any) => ({
      ...a,
      payload: typeof a.payload === 'string' ? JSON.parse(a.payload) : a.payload,
    }));

    return { activities: parsed, hasMore, nextCursor };
  }
}

export const feedService = new FeedService();
