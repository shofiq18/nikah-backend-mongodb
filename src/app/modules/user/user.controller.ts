import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync.js';
import sendResponse from '../../utils/sendResponse.js';
import { UserService } from './user.service.js';
import config from '../../../config/index.js';

const registerUser = catchAsync(async (req: Request, res: Response) => {
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

const loginUser = catchAsync(async (req: Request, res: Response) => {
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

const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || req.body.userId;

  if (!userId) {
    throw new Error('User ID is required for profile update');
  }

  // Create a copy of the body and remove userId to avoid Prisma updating the relation field
  const updateData = { ...req.body };
  delete updateData.userId;

  // Handle Photos upload if present
  if (updateData.photos && Array.isArray(updateData.photos)) {
    const uploadedPhotos = await Promise.all(
      updateData.photos.map(async (photo: string) => {
        if (photo.startsWith('data:image/')) {
          return await uploadToCloudinary(photo, `${userId}/portraits`);
        }
        return photo;
      })
    );
    updateData.photos = uploadedPhotos;
  }

  // Handle NID Front upload if present
  if (updateData.nidFront && updateData.nidFront.startsWith('data:image/')) {
    updateData.nidFront = await uploadToCloudinary(updateData.nidFront, `${userId}/security`);
  }

  // Handle NID Back upload if present
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

const getProfile = catchAsync(async (req: Request, res: Response) => {
  const targetUserId = req.params.id as string;
  const requesterId = (req as any).user?.id || 'mock-requester-id'; // To be replaced with actual req.user.id

  const result = await UserService.getProfile(requesterId, targetUserId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Profile fetched successfully',
    data: result,
  });
});

const unlockContact = catchAsync(async (req: Request, res: Response) => {
  const targetUserId = req.params.id as string;
  const requesterId = (req as any).user?.id || 'mock-requester-id';

  const result = await UserService.unlockContact(requesterId, targetUserId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Contact unlocked successfully',
    data: result,
  });
});

const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  const result = await UserService.verifyEmail(email, otp);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Email verified successfully',
    data: result,
  });
});

const buyConnections = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || req.body.userId; // Usually from auth
  const { amount } = req.body;

  const result = await UserService.buyConnections(userId, amount);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Connections purchased successfully',
    data: result,
  });
});

const resendOtp = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;

  const result = await UserService.resendOtp(email);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'OTP resent successfully',
    data: result,
  });
});

const getAllUserProfiles = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getAllUserProfiles(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User profiles fetched successfully',
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
  getAllUserProfiles,
  unlockContact,
  buyConnections
};

