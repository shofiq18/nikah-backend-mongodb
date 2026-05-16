import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const getMyNotifications = async (userId: string) => {
  const notificationModel = (prisma as any).notification || (prisma as any).Notification;
  if (!notificationModel) throw new Error('Notification model not found in Prisma client.');

  const result = await notificationModel.findMany({
    where: {
      userId: userId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Defensive: Ensure senderIds are strings for the Set and the Map
  const senderIds = [...new Set(
    result
      .filter((n: any) => n.senderId)
      .map((n: any) => n.senderId.toString())
  )];
  
  let senders: any[] = [];
  if (senderIds.length > 0) {
    senders = await (prisma.user as any).findMany({
      where: {
        id: { in: senderIds }
      },
      select: {
        id: true,
        fullName: true,
        profile: {
          select: {
            photos: true
          }
        }
      }

    });
  }

  // Create a map with string keys for reliable lookup
  const senderMap = new Map(senders.map(s => [s.id.toString(), s]));

  const notificationsWithSender = result.map((notif: any) => {
    if (notif.senderId) {
      const sId = notif.senderId.toString();
      return { ...notif, sender: senderMap.get(sId) };
    }
    return notif;
  });

  return notificationsWithSender;
};



const markAsRead = async (id: string) => {
  const notificationModel = (prisma as any).notification || (prisma as any).Notification;
  const result = await notificationModel.update({
    where: {
      id,
    },
    data: {
      isRead: true,
    },
  });
  return result;
};

const markAllAsRead = async (userId: string) => {
  const notificationModel = (prisma as any).notification || (prisma as any).Notification;
  const result = await notificationModel.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });
  return result;
};

const createNotification = async (payload: any) => {
  const notificationModel = (prisma as any).notification || (prisma as any).Notification;
  if (!notificationModel) throw new Error('Notification model not found in Prisma client.');

  return await notificationModel.create({
    data: {
      userId: payload.userId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      path: payload.path || '#',
      senderId: payload.senderId || null,
      isRead: false
    }
  });
};

export const NotificationService = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  createNotification
};
