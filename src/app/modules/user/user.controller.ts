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
    sameSite: config.node_env === 'production' ? 'none' : 'lax',
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

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.loginUser(req.body);
  const { accessToken, user } = result;

  res.cookie('token', accessToken, {
    secure: config.node_env === 'production',
    httpOnly: true,
    sameSite: config.node_env === 'production' ? 'none' : 'lax',
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
import { NidStatus, UserStatus } from '@prisma/client';

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
  const requesterId = (req as any).user?.id;

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
  const requesterId = (req as any).user?.id;

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

const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  const result = await UserService.verifyEmail(email, otp);
  const { accessToken, user } = result;

  res.cookie('token', accessToken, {
    secure: config.node_env === 'production',
    httpOnly: true,
    sameSite: config.node_env === 'production' ? 'none' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Email verified successfully',
    data: {
      accessToken,
      user
    },
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
  const requesterId = (req as any).user?.id;
  const result = await UserService.getAllUserProfiles(req.query, requesterId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User profiles fetched successfully',
    data: result,
  });
});

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getAllUsers(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Users fetched successfully',
    data: result.data, // Send only the array to fix frontend filter error
  });
});

const updateNidStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nidStatus } = req.body;
  const result = await UserService.updateNidStatus(id as string, nidStatus as NidStatus);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'NID status updated successfully',
    data: result,
  });
});

const blockUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const result = await UserService.blockUser(id as string, status as UserStatus);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User status updated successfully',
    data: result,
  });
});

const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await UserService.deleteUser(id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User deleted successfully',
    data: result,
  });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await UserService.getMe(user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User fetched successfully',
    data: result,
  });
});

const logout = catchAsync(async (req: Request, res: Response) => {
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

const toggleShortlist = catchAsync(async (req: Request, res: Response) => {
  const targetUserId = req.params.id as string;
  const userId = (req as any).user?.id;

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

const getShortlistedProfiles = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;

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

const sendInterest = catchAsync(async (req: Request, res: Response) => {
  const senderId = (req as any).user?.id;
  const receiverId = req.params.id as string;
  const result = await UserService.sendInterest(senderId, receiverId);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Interest sent successfully",
    data: result,
  });
});

const handleInterestResponse = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const interestId = req.params.interestId as string;
  const { status } = req.body;
  const result = await UserService.handleInterestResponse(userId, interestId, status);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: `Interest ${status.toLowerCase()} successfully`,
    data: result,
  });
});

const getReceivedInterests = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const result = await UserService.getReceivedInterests(userId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Received interests fetched successfully",
    data: result,
  });
});

const getSentInterests = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
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
  getAllUsers,
  updateNidStatus,
  blockUser,
  deleteUser,
  unlockContact,
  toggleShortlist,
  getShortlistedProfiles,
  sendInterest,
  handleInterestResponse,
  getReceivedInterests,
  getSentInterests
};

