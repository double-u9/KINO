import { prisma } from '../../config/database.js';

export class NotificationsService {
  async list(userId: string, cursor?: string, limit = 20) {
    const where: any = { userId };
    if (cursor) {
      where.createdAt = { lt: new Date(cursor) };
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
    });

    const hasMore = notifications.length > limit;
    const items = hasMore ? notifications.slice(0, limit) : notifications;
    const nextCursor = hasMore ? items[items.length - 1].createdAt.toISOString() : null;

    return { notifications: items, hasMore, nextCursor };
  }

  async unreadCount(userId: string) {
    return prisma.notification.count({
      where: { userId, read: false },
    });
  }

  async markRead(userId: string, notificationId: string) {
    return prisma.notification.deleteMany({
      where: { id: notificationId, userId },
    });
  }

  async markAllRead(userId: string) {
    return prisma.notification.deleteMany({
      where: { userId },
    });
  }
}

export const notificationsService = new NotificationsService();
