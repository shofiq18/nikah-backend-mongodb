import { PrismaClient } from '@prisma/client';
import { TMessage } from './message.interface.js';

const prisma = new PrismaClient();

const sendMessage = async (payload: TMessage) => {
  const { senderId, receiverId, content } = payload;

  // Check Permissions
  const sender = await (prisma.user as any).findUnique({ where: { id: senderId } });
  if (!sender) throw new Error('Sender not found');

  const isPlanActive = sender.planType !== 'FREE' && sender.planExpiry && new Date(sender.planExpiry) > new Date();
  
  if (!isPlanActive) {
    // Check if profile is unlocked
    const hasUnlocked = await prisma.contactUnlock.findUnique({
      where: {
        unlockedById_targetUserId: {
          unlockedById: senderId,
          targetUserId: receiverId
        }
      }
    });

    if (!hasUnlocked) {
      throw new Error('Please unlock this profile or buy a subscription to send messages.');
    }
  }

  const result = await (prisma as any).message.create({
    data: {
      senderId,
      receiverId,
      content,
    }
  });

  return result;
};

const getMyInbox = async (userId: string) => {
  const result = await (prisma as any).message.findMany({
    where: { receiverId: userId },
    include: {
      sender: {
        include: {
          profile: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Unique conversations (last message from each sender)
  // For the "Inbox list" view like in the photo
  return result;
};

const getSentMessages = async (userId: string) => {
  const result = await (prisma as any).message.findMany({
    where: { senderId: userId },
    include: {
      receiver: {
        include: {
          profile: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return result;
};

const getConversation = async (userId: string, otherUserId: string) => {
    return await (prisma as any).message.findMany({
        where: {
            OR: [
                { senderId: userId, receiverId: otherUserId },
                { senderId: otherUserId, receiverId: userId }
            ]
        },
        orderBy: { createdAt: 'asc' }
    });
};

const markAsRead = async (messageId: string) => {
    return await (prisma as any).message.update({
        where: { id: messageId },
        data: { isRead: true }
    });
};

export const MessageService = {
  sendMessage,
  getMyInbox,
  getSentMessages,
  getConversation,
  markAsRead
};
