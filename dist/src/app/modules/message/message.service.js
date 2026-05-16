import { PrismaClient } from '@prisma/client';
import { NotificationService } from '../notification/notification.service.js';
const prisma = new PrismaClient();
const sendMessage = async (payload) => {
    const { senderId, receiverId, content } = payload;
    const sender = await prisma.user.findUnique({ where: { id: senderId } });
    if (!sender)
        throw new Error('Sender not found');
    const isPlanActive = sender.planType !== 'FREE' && sender.planExpiry && new Date(sender.planExpiry) > new Date();
    if (!isPlanActive) {
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
    const result = await prisma.message.create({
        data: {
            senderId,
            receiverId,
            content,
        }
    });
    await NotificationService.createNotification({
        userId: receiverId,
        type: 'MESSAGE_RECEIVED',
        title: sender.fullName,
        message: 'sent you a new message.',
        path: `/dashboard/user/inbox?id=${senderId}`,
        senderId: senderId,
    });
    return result;
};
const getMyInbox = async (userId) => {
    const result = await prisma.message.findMany({
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
    return result;
};
const getSentMessages = async (userId) => {
    const result = await prisma.message.findMany({
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
const getConversation = async (userId, otherUserId) => {
    return await prisma.message.findMany({
        where: {
            OR: [
                { senderId: userId, receiverId: otherUserId },
                { senderId: otherUserId, receiverId: userId }
            ]
        },
        orderBy: { createdAt: 'asc' }
    });
};
const markAsRead = async (messageId) => {
    return await prisma.message.update({
        where: { id: messageId },
        data: { isRead: true }
    });
};
const deleteConversation = async (userId, otherUserId) => {
    return await prisma.message.deleteMany({
        where: {
            OR: [
                { senderId: userId, receiverId: otherUserId },
                { senderId: otherUserId, receiverId: userId }
            ]
        }
    });
};
export const MessageService = {
    sendMessage,
    getMyInbox,
    getSentMessages,
    getConversation,
    markAsRead,
    deleteConversation
};
//# sourceMappingURL=message.service.js.map