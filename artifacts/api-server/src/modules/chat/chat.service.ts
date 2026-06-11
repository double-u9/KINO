import { prisma } from '../../config/database.js';
import { AppError } from '../../middleware/errorHandler.js';

export class ChatService {
  async getChatHistory(userId: string, friendId: string) {
    // Verify they are friends
    const [userAId, userBId] = [userId, friendId].sort();
    const friendship = await prisma.friendship.findUnique({
      where: { userAId_userBId: { userAId, userBId } }
    });

    if (!friendship) {
      throw new AppError(403, 'You can only chat with friends.', 'NOT_FRIENDS');
    }

    // Mark all received messages from this friend as read
    await prisma.chatMessage.updateMany({
      where: {
        senderId: friendId,
        receiverId: userId,
        read: false,
      },
      data: { read: true },
    });

    // Clear notifications for this chat
    await prisma.notification.deleteMany({
      where: {
        userId,
        type: 'new_message',
        payload: { contains: `"senderId":"${friendId}"` }
      }
    });

    const messages = await prisma.chatMessage.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: friendId },
          { senderId: friendId, receiverId: userId }
        ]
      },
      orderBy: { createdAt: 'asc' },
    });

    return messages;
  }

  async sendMessage(senderId: string, receiverId: string, content: string) {
    // Verify they are friends
    const [userAId, userBId] = [senderId, receiverId].sort();
    const friendship = await prisma.friendship.findUnique({
      where: { userAId_userBId: { userAId, userBId } }
    });

    if (!friendship) {
      throw new AppError(403, 'You can only chat with friends.', 'NOT_FRIENDS');
    }

    const message = await prisma.chatMessage.create({
      data: {
        senderId,
        receiverId,
        content
      }
    });

    const sender = await prisma.user.findUnique({ where: { id: senderId } });

    // Create or update a notification for the receiver (always upsert to prevent duplicates)
    const existingNotif = await prisma.notification.findFirst({
      where: {
        userId: receiverId,
        type: 'new_message',
        payload: { contains: `"senderId":"${senderId}"` }
      }
    });

    if (!existingNotif && sender) {
      await prisma.notification.create({
        data: {
          userId: receiverId,
          type: 'new_message',
          title: `New message from ${sender.username}`,
          body: content,
          payload: JSON.stringify({ senderId }),
        }
      });
    } else if (existingNotif && sender) {
      // Just update the body, mark as unread, and update createdAt to bump it up
      await prisma.notification.update({
        where: { id: existingNotif.id },
        data: { 
          body: content,
          read: false,
          createdAt: new Date()
        }
      });
    }

    return message;
  }
}

export const chatService = new ChatService();
