import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const getMyNotifications = async (userId) => {
    const notificationModel = prisma.notification || prisma.Notification;
    if (!notificationModel)
        throw new Error('Notification model not found in Prisma client.');
    const result = await notificationModel.findMany({
        where: {
            userId: userId,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
    const senderIds = [...new Set(result
            .filter((n) => n.senderId)
            .map((n) => n.senderId.toString()))];
    let senders = [];
    if (senderIds.length > 0) {
        senders = await prisma.user.findMany({
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
    const senderMap = new Map(senders.map(s => [s.id.toString(), s]));
    const notificationsWithSender = result.map((notif) => {
        if (notif.senderId) {
            const sId = notif.senderId.toString();
            return { ...notif, sender: senderMap.get(sId) };
        }
        return notif;
    });
    return notificationsWithSender;
};
const markAsRead = async (id) => {
    const notificationModel = prisma.notification || prisma.Notification;
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
const markAllAsRead = async (userId) => {
    const notificationModel = prisma.notification || prisma.Notification;
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
const createNotification = async (payload) => {
    const notificationModel = prisma.notification || prisma.Notification;
    if (!notificationModel)
        throw new Error('Notification model not found in Prisma client.');
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
//# sourceMappingURL=notification.service.js.map