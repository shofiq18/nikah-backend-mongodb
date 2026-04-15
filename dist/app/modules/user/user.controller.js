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
        maxAge: 30 * 24 * 60 * 60 * 1000,
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
        maxAge: 30 * 24 * 60 * 60 * 1000,
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
    const requesterId = req.user?.id;
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
    const requesterId = req.user?.id;
    if (!requesterId) {
        throw new Error('User not authenticated');
    }
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
const getAllUserProfiles = catchAsync(async (req, res) => {
    const requesterId = req.user?.id;
    const result = await UserService.getAllUserProfiles(req.query, requesterId);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'User profiles fetched successfully',
        data: result,
    });
});
const getMe = catchAsync(async (req, res) => {
    const user = req.user;
    const result = await UserService.getMe(user.id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'User fetched successfully',
        data: result,
    });
});
const logout = catchAsync(async (req, res) => {
    res.clearCookie('token', {
        secure: config.node_env === 'production',
        httpOnly: true,
    });
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'User logged out successfully',
        data: null,
    });
});
const toggleShortlist = catchAsync(async (req, res) => {
    const targetUserId = req.params.id;
    const userId = req.user?.id;
    if (!userId) {
        throw new Error('User not authenticated');
    }
    const result = await UserService.toggleShortlist(userId, targetUserId);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.message,
        data: result,
    });
});
const getShortlistedProfiles = catchAsync(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new Error('User not authenticated');
    }
    const result = await UserService.getShortlistedProfiles(userId);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Shortlisted profiles fetched successfully',
        data: result,
    });
});
const sendInterest = catchAsync(async (req, res) => {
    const senderId = req.user?.id;
    const receiverId = req.params.id;
    const result = await UserService.sendInterest(senderId, receiverId);
    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: "Interest sent successfully",
        data: result,
    });
});
const handleInterestResponse = catchAsync(async (req, res) => {
    const userId = req.user?.id;
    const interestId = req.params.interestId;
    const { status } = req.body;
    const result = await UserService.handleInterestResponse(userId, interestId, status);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: `Interest ${status.toLowerCase()} successfully`,
        data: result,
    });
});
const getReceivedInterests = catchAsync(async (req, res) => {
    const userId = req.user?.id;
    const result = await UserService.getReceivedInterests(userId);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Received interests fetched successfully",
        data: result,
    });
});
const getSentInterests = catchAsync(async (req, res) => {
    const userId = req.user?.id;
    const result = await UserService.getSentInterests(userId);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Sent interests fetched successfully",
        data: result,
    });
});
export const UserController = {
    loginUser,
    getMe,
    logout,
    registerUser,
    verifyEmail,
    resendOtp,
    updateProfile,
    getProfile,
    getAllUserProfiles,
    unlockContact,
    buyConnections,
    toggleShortlist,
    getShortlistedProfiles,
    sendInterest,
    handleInterestResponse,
    getReceivedInterests,
    getSentInterests
};
//# sourceMappingURL=user.controller.js.map