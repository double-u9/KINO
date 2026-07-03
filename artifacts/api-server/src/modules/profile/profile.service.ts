import { prisma } from '../../config/database.js';
import { AppError } from '../../middleware/error-handler.js';

export class ProfileService {
  async getOwnProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, username: true, email: true, createdAt: true,
        profile: true,
        settings: true,
        privacy: true,
        _count: {
          select: {
            media: true,
            friendshipsA: true,
            friendshipsB: true,
          },
        },
      },
    });
    if (!user) throw new AppError(404, 'User not found.', 'NOT_FOUND');

    return {
      ...user,
      mediaCount: user._count.media,
      friendCount: user._count.friendshipsA + user._count.friendshipsB,
    };
  }

  async getPublicProfile(username: string, viewerId?: string) {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true, username: true, createdAt: true,
        profile: true,
        privacy: true,
        _count: {
          select: {
            media: true,
            friendshipsA: true,
            friendshipsB: true,
          },
        },
      },
    });
    if (!user) throw new AppError(404, 'User not found.', 'NOT_FOUND');

    const isSelf = viewerId === user.id;
    const visibility = user.privacy?.profileVisibility ?? 'public';

    // Check friendship if needed
    let isFriend = false;
    if (viewerId && !isSelf) {
      const [a, b] = [viewerId, user.id].sort();
      const friendship = await prisma.friendship.findUnique({
        where: { userAId_userBId: { userAId: a, userBId: b } },
      });
      isFriend = !!friendship;
    }

    if (!isSelf && visibility === 'private') {
      throw new AppError(403, 'This profile is private.', 'PROFILE_PRIVATE');
    }
    if (!isSelf && visibility === 'friends' && !isFriend) {
      throw new AppError(403, 'This profile is friends-only.', 'PROFILE_FRIENDS_ONLY');
    }

    return {
      id: user.id,
      username: user.username,
      createdAt: user.createdAt,
      profile: user.profile,
      mediaCount: user._count.media,
      friendCount: user._count.friendshipsA + user._count.friendshipsB,
      isFriend,
      isSelf,
    };
  }

  async updateProfile(userId: string, updates: {
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
    bannerUrl?: string;
    favoriteGenres?: string[];
    themeColor?: string;
    layoutPreset?: string;
    animatedAccents?: boolean;
  }) {
    return prisma.profile.update({
      where: { userId },
      data: {
        ...updates,
        favoriteGenres: updates.favoriteGenres
          ? JSON.stringify(updates.favoriteGenres)
          : undefined,
      },
    });
  }

  async updatePrivacy(userId: string, updates: {
    profileVisibility?: string;
    showWatchHistory?: boolean;
    showFavorites?: boolean;
    showActivity?: boolean;
    allowFriendRequests?: boolean;
  }) {
    return prisma.privacySettings.update({
      where: { userId },
      data: updates,
    });
  }

  async getUserMedia(username: string, viewerId?: string) {
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true, privacy: true },
    });
    if (!user) throw new AppError(404, 'User not found.', 'NOT_FOUND');

    // Privacy checks
    if (viewerId !== user.id) {
      const visibility = user.privacy?.profileVisibility ?? 'public';
      if (visibility === 'private') {
        throw new AppError(403, 'This profile is private.', 'PROFILE_PRIVATE');
      }
      if (visibility === 'friends' && viewerId) {
        const [a, b] = [viewerId, user.id].sort();
        const friendship = await prisma.friendship.findUnique({
          where: { userAId_userBId: { userAId: a, userBId: b } },
        });
        if (!friendship) {
          throw new AppError(403, 'This profile is friends-only.', 'PROFILE_FRIENDS_ONLY');
        }
      }
    }

    return prisma.mediaItem.findMany({
      where: { userId: user.id },
      include: { seasons: { orderBy: { seasonNumber: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const profileService = new ProfileService();
