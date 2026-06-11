import { prisma } from '../../config/database.js';
import { AppError } from '../../middleware/errorHandler.js';

export class FriendsService {
  // ── Send Friend Request ──
  async sendRequest(senderId: string, receiverId: string) {
    if (senderId === receiverId) {
      throw new AppError(400, 'You cannot send a friend request to yourself.', 'SELF_REQUEST');
    }

    // Check if blocked
    const blocked = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: senderId, blockedId: receiverId },
          { blockerId: receiverId, blockedId: senderId },
        ],
      },
    });
    if (blocked) {
      throw new AppError(403, 'Cannot send request to this user.', 'BLOCKED');
    }

    // Check if already friends
    const existingFriendship = await this.areFriends(senderId, receiverId);
    if (existingFriendship) {
      throw new AppError(409, 'You are already friends.', 'ALREADY_FRIENDS');
    }

    // Check for existing pending request in either direction
    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId, receiverId, status: 'pending' },
          { senderId: receiverId, receiverId: senderId, status: 'pending' },
        ],
      },
    });

    if (existingRequest) {
      // If they already sent us a request, auto-accept
      if (existingRequest.senderId === receiverId) {
        return this.acceptRequest(senderId, existingRequest.id);
      }
      throw new AppError(409, 'Friend request already sent.', 'DUPLICATE_REQUEST');
    }

    const request = await prisma.friendRequest.create({
      data: { senderId, receiverId },
      include: {
        sender: { select: { id: true, username: true, profile: { select: { displayName: true, avatarUrl: true } } } },
        receiver: { select: { id: true, username: true, profile: { select: { displayName: true, avatarUrl: true } } } },
      },
    });

    // Create notification for receiver
    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: 'friend_request',
        title: 'New Friend Request',
        body: `${request.sender.profile?.displayName || request.sender.username} sent you a friend request.`,
        payload: JSON.stringify({ requestId: request.id, senderId }),
      },
    });

    return request;
  }

  // ── Accept Request ──
  async acceptRequest(userId: string, requestId: string) {
    const request = await prisma.friendRequest.findUnique({
      where: { id: requestId },
      include: {
        sender: { select: { id: true, username: true, profile: { select: { displayName: true } } } },
        receiver: { select: { id: true, username: true, profile: { select: { displayName: true } } } },
      },
    });

    if (!request || request.receiverId !== userId) {
      throw new AppError(404, 'Friend request not found.', 'NOT_FOUND');
    }
    if (request.status !== 'pending') {
      throw new AppError(400, 'This request has already been handled.', 'ALREADY_HANDLED');
    }

    // Ensure canonical ordering: userAId < userBId
    const [userAId, userBId] = [request.senderId, request.receiverId].sort();

    const [, friendship] = await prisma.$transaction([
      prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: 'accepted' },
      }),
      prisma.friendship.create({
        data: { userAId, userBId },
      }),
    ]);

    // Notify sender that request was accepted
    await prisma.notification.create({
      data: {
        userId: request.senderId,
        type: 'friend_accepted',
        title: 'Friend Request Accepted',
        body: `${request.receiver.profile?.displayName || request.receiver.username} accepted your friend request!`,
        payload: JSON.stringify({ friendshipId: friendship.id, userId }),
      },
    });

    // Log activity for both users
    await prisma.activityFeed.createMany({
      data: [
        {
          userId: request.senderId,
          type: 'friended',
          payload: JSON.stringify({
            friendId: request.receiverId,
            friendUsername: request.receiver.username,
          }),
        },
        {
          userId: request.receiverId,
          type: 'friended',
          payload: JSON.stringify({
            friendId: request.senderId,
            friendUsername: request.sender.username,
          }),
        },
      ],
    });

    return friendship;
  }

  // ── Decline Request ──
  async declineRequest(userId: string, requestId: string) {
    const request = await prisma.friendRequest.findUnique({ where: { id: requestId } });
    if (!request || request.receiverId !== userId) {
      throw new AppError(404, 'Friend request not found.', 'NOT_FOUND');
    }
    if (request.status !== 'pending') {
      throw new AppError(400, 'This request has already been handled.', 'ALREADY_HANDLED');
    }

    return prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: 'declined' },
    });
  }

  // ── Cancel Sent Request ──
  async cancelRequest(userId: string, requestId: string) {
    const request = await prisma.friendRequest.findUnique({ where: { id: requestId } });
    if (!request || request.senderId !== userId) {
      throw new AppError(404, 'Friend request not found.', 'NOT_FOUND');
    }
    if (request.status !== 'pending') {
      throw new AppError(400, 'This request has already been handled.', 'ALREADY_HANDLED');
    }

    return prisma.friendRequest.delete({ where: { id: requestId } });
  }

  // ── Remove Friend ──
  async removeFriend(userId: string, friendshipId: string) {
    const friendship = await prisma.friendship.findUnique({ where: { id: friendshipId } });
    if (!friendship || (friendship.userAId !== userId && friendship.userBId !== userId)) {
      throw new AppError(404, 'Friendship not found.', 'NOT_FOUND');
    }

    return prisma.friendship.delete({ where: { id: friendshipId } });
  }

  // ── Block User ──
  async blockUser(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) {
      throw new AppError(400, 'You cannot block yourself.', 'SELF_BLOCK');
    }

    // Remove existing friendship if any
    const [userAId, userBId] = [blockerId, blockedId].sort();
    await prisma.friendship.deleteMany({
      where: { userAId, userBId },
    });

    // Remove pending requests in both directions
    await prisma.friendRequest.deleteMany({
      where: {
        OR: [
          { senderId: blockerId, receiverId: blockedId, status: 'pending' },
          { senderId: blockedId, receiverId: blockerId, status: 'pending' },
        ],
      },
    });

    return prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId, blockedId } },
      create: { blockerId, blockedId },
      update: {},
    });
  }

  // ── Unblock User ──
  async unblockUser(blockerId: string, blockedId: string) {
    return prisma.block.deleteMany({
      where: { blockerId, blockedId },
    });
  }

  // ── List Friends ──
  async listFriends(userId: string) {
    const userSelect = {
      id: true, username: true,
      profile: { select: { displayName: true, avatarUrl: true, bio: true, themeColor: true } },
      _count: { 
        select: { 
          media: true,
          sentMessages: { where: { receiverId: userId, read: false } }
        } 
      },
      sentMessages: {
        where: { receiverId: userId },
        orderBy: { createdAt: 'desc' as const },
        take: 1,
        select: { content: true, createdAt: true, read: true }
      },
      receivedMessages: {
        where: { senderId: userId },
        orderBy: { createdAt: 'desc' as const },
        take: 1,
        select: { content: true, createdAt: true, read: true }
      }
    };

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      include: {
        userA: { select: userSelect },
        userB: { select: userSelect },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Clear friend_accepted notifications since the user is now viewing their friends list
    await prisma.notification.deleteMany({
      where: {
        userId,
        type: 'friend_accepted'
      }
    });

    return friendships.map(f => {
      const friend = f.userAId === userId ? f.userB : f.userA;
      
      const sent = friend.sentMessages[0];
      const received = friend.receivedMessages[0];
      let latestMessage = undefined;
      
      if (sent && received) {
        latestMessage = sent.createdAt > received.createdAt 
          ? { content: sent.content, createdAt: sent.createdAt, isMine: false, read: sent.read }
          : { content: received.content, createdAt: received.createdAt, isMine: true, read: received.read };
      } else if (sent) {
        latestMessage = { content: sent.content, createdAt: sent.createdAt, isMine: false, read: sent.read };
      } else if (received) {
        latestMessage = { content: received.content, createdAt: received.createdAt, isMine: true, read: received.read };
      }

      return {
        friendshipId: f.id,
        friendSince: f.createdAt,
        id: friend.id,
        username: friend.username,
        profile: friend.profile,
        mediaCount: friend._count.media,
        unreadCount: friend._count.sentMessages,
        latestMessage,
      };
    }).sort((a, b) => {
      const aTime = a.latestMessage?.createdAt ? new Date(a.latestMessage.createdAt).getTime() : new Date(a.friendSince).getTime();
      const bTime = b.latestMessage?.createdAt ? new Date(b.latestMessage.createdAt).getTime() : new Date(b.friendSince).getTime();
      return bTime - aTime;
    });
  }

  // ── Pending Requests ──
  async listPendingRequests(userId: string) {
    const [received, sent] = await Promise.all([
      prisma.friendRequest.findMany({
        where: { receiverId: userId, status: 'pending' },
        include: {
          sender: {
            select: {
              id: true, username: true,
              profile: { select: { displayName: true, avatarUrl: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.friendRequest.findMany({
        where: { senderId: userId, status: 'pending' },
        include: {
          receiver: {
            select: {
              id: true, username: true,
              profile: { select: { displayName: true, avatarUrl: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Clear friend_request notifications since the user is now viewing their pending requests
    await prisma.notification.deleteMany({
      where: {
        userId,
        type: 'friend_request'
      }
    });

    return { received, sent };
  }

  // ── Search Users ──
  async searchUsers(query: string, currentUserId: string) {
    if (!query || query.length < 2) return [];

    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: currentUserId } },
          {
            OR: [
              { username: { contains: query } },
              { profile: { displayName: { contains: query } } },
            ],
          },
        ],
      },
      select: {
        id: true, username: true,
        profile: { select: { displayName: true, avatarUrl: true, bio: true } },
        _count: { select: { media: true } },
      },
      take: 20,
    });

    // Check friendship status for each
    const results = await Promise.all(
      users.map(async (user) => {
        const [userAId, userBId] = [currentUserId, user.id].sort();
        const friendship = await prisma.friendship.findUnique({
          where: { userAId_userBId: { userAId, userBId } },
        });
        const pendingRequest = await prisma.friendRequest.findFirst({
          where: {
            OR: [
              { senderId: currentUserId, receiverId: user.id, status: 'pending' },
              { senderId: user.id, receiverId: currentUserId, status: 'pending' },
            ],
          },
        });
        const blocked = await prisma.block.findFirst({
          where: {
            OR: [
              { blockerId: currentUserId, blockedId: user.id },
              { blockerId: user.id, blockedId: currentUserId },
            ],
          },
        });

        let status: 'none' | 'friends' | 'pending_sent' | 'pending_received' | 'blocked' = 'none';
        if (blocked) status = 'blocked';
        else if (friendship) status = 'friends';
        else if (pendingRequest?.senderId === currentUserId) status = 'pending_sent';
        else if (pendingRequest) status = 'pending_received';

        return {
          ...user,
          mediaCount: user._count.media,
          relationshipStatus: status,
          requestId: pendingRequest?.id ?? null,
          friendshipId: friendship?.id ?? null,
        };
      }),
    );

    return results.filter(u => u.relationshipStatus !== 'blocked');
  }

  // ── Helpers ──
  private async areFriends(userAId: string, userBId: string): Promise<boolean> {
    const [a, b] = [userAId, userBId].sort();
    const friendship = await prisma.friendship.findUnique({
      where: { userAId_userBId: { userAId: a, userBId: b } },
    });
    return !!friendship;
  }
}

export const friendsService = new FriendsService();
