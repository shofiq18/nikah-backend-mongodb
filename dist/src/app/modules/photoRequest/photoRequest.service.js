import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const sendPhotoRequest = async (requesterId, targetUserId) => {
    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser)
        throw new Error('Target user not found');
    const photoRequestModel = prisma.photoRequest || prisma.PhotoRequest;
    if (!photoRequestModel)
        throw new Error('PhotoRequest model not found. Please run prisma generate.');
    const existingRequest = await photoRequestModel.findUnique({
        where: {
            requesterId_targetUserId: { requesterId, targetUserId }
        }
    });
    if (existingRequest)
        throw new Error('Photo request already sent');
    const result = await photoRequestModel.create({
        data: {
            requesterId,
            targetUserId,
            status: 'PENDING'
        }
    });
    return result;
};
const handlePhotoRequest = async (userId, requestId, status) => {
    const photoRequestModel = prisma.photoRequest || prisma.PhotoRequest;
    if (!photoRequestModel)
        throw new Error('PhotoRequest model not found.');
    const request = await photoRequestModel.findUnique({
        where: { id: requestId }
    });
    if (!request || request.targetUserId !== userId) {
        throw new Error('Photo request not found or unauthorized');
    }
    const result = await photoRequestModel.update({
        where: { id: requestId },
        data: { status }
    });
    return result;
};
const getReceivedPhotoRequests = async (userId) => {
    const photoRequestModel = prisma.photoRequest || prisma.PhotoRequest;
    if (!photoRequestModel)
        return [];
    const result = await photoRequestModel.findMany({
        where: { targetUserId: userId, status: 'PENDING' },
        include: {
            requester: {
                include: {
                    profile: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
    return result.map((item) => {
        const user = item.requester;
        const { password, verificationOtp, verificationOtpExpires, ...userWithoutSensitiveData } = user;
        if (userWithoutSensitiveData.profile) {
            const { guardianMobile, guardianEmail, nidFront, nidBack, ...publicProfile } = userWithoutSensitiveData.profile;
            userWithoutSensitiveData.profile = publicProfile;
        }
        return {
            ...item,
            requester: userWithoutSensitiveData
        };
    });
};
const getSentPhotoRequests = async (userId) => {
    const photoRequestModel = prisma.photoRequest || prisma.PhotoRequest;
    if (!photoRequestModel)
        return [];
    const result = await photoRequestModel.findMany({
        where: { requesterId: userId },
        include: {
            targetUser: {
                include: {
                    profile: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
    return result.map((item) => {
        const user = item.targetUser;
        const { password, verificationOtp, verificationOtpExpires, ...userWithoutSensitiveData } = user;
        if (userWithoutSensitiveData.profile) {
            const { guardianMobile, guardianEmail, nidFront, nidBack, ...publicProfile } = userWithoutSensitiveData.profile;
            userWithoutSensitiveData.profile = publicProfile;
        }
        return {
            ...item,
            targetUser: userWithoutSensitiveData
        };
    });
};
export const PhotoRequestService = {
    sendPhotoRequest,
    handlePhotoRequest,
    getReceivedPhotoRequests,
    getSentPhotoRequests
};
//# sourceMappingURL=photoRequest.service.js.map