import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync.js';
import sendResponse from '../../utils/sendResponse.js';
import { UserService } from './user.service.js';
import config from '../../../config/index.js';
const registerUser = catchAsync(async (req, res) => {
    const result = await UserService.registerUser(req.body);
    const { accessToken, user } = result;
    res.cookie('token', accessToken, {
        secure: config.node_env === 'production',
        httpOnly: true,
    });
    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: 'User registered successfully',
        data: {
            accessToken,
            user
        },
    });
});
const loginUser = catchAsync(async (req, res) => {
    const result = await UserService.loginUser(req.body);
    const { accessToken, user } = result;
    res.cookie('token', accessToken, {
        secure: config.node_env === 'production',
        httpOnly: true,
    });
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'User logged in successfully',
        data: {
            accessToken,
            user
        },
    });
});
import { uploadToCloudinary } from '../../utils/cloudinary.js';
const updateProfile = catchAsync(async (req, res) => {
    const userId = req.user?.id || req.body.userId;
    if (!userId) {
        throw new Error('User ID is required for profile update');
    }
    const updateData = { ...req.body };
    delete updateData.userId;
    if (updateData.photos && Array.isArray(updateData.photos)) {
        const uploadedPhotos = await Promise.all(updateData.photos.map(async (photo) => {
            if (photo.startsWith('data:image/')) {
                return await uploadToCloudinary(photo, `${userId}/portraits`);
            }
            return photo;
        }));
        updateData.photos = uploadedPhotos;
    }
    if (updateData.nidFront && updateData.nidFront.startsWith('data:image/')) {
        updateData.nidFront = await uploadToCloudinary(updateData.nidFront, `${userId}/security`);
    }
    if (updateData.nidBack && updateData.nidBack.startsWith('data:image/')) {
        updateData.nidBack = await uploadToCloudinary(updateData.nidBack, `${userId}/security`);
    }
    const result = await UserService.updateProfile(userId, updateData);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Profile updated successfully',
        data: result,
    });
});
const getProfile = catchAsync(async (req, res) => {
    const targetUserId = req.params.id;
    const requesterId = req.user?.id || 'mock-requester-id';
    const result = await UserService.getProfile(requesterId, targetUserId);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Profile fetched successfully',
        data: result,
    });
});
const unlockContact = catchAsync(async (req, res) => {
    const targetUserId = req.params.id;
    const requesterId = req.user?.id || 'mock-requester-id';
    const result = await UserService.unlockContact(requesterId, targetUserId);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Contact unlocked successfully',
        data: result,
    });
});
const verifyEmail = catchAsync(async (req, res) => {
    const { email, otp } = req.body;
    const result = await UserService.verifyEmail(email, otp);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Email verified successfully',
        data: result,
    });
});
const buyConnections = catchAsync(async (req, res) => {
    const userId = req.user?.id || req.body.userId;
    const { amount } = req.body;
    const result = await UserService.buyConnections(userId, amount);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Connections purchased successfully',
        data: result,
    });
});
const resendOtp = catchAsync(async (req, res) => {
    const { email } = req.body;
    const result = await UserService.resendOtp(email);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'OTP resent successfully',
        data: result,
    });
});
export const UserController = {
    loginUser,
    registerUser,
    verifyEmail,
    resendOtp,
    updateProfile,
    getProfile,
    unlockContact,
    buyConnections
};
//# sourceMappingURL=user.controller.js.map