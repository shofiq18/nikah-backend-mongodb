import { PrismaClient } from '@prisma/client';
import { TLoginUser, TRegisterUser, TUpdateProfile } from './user.interface.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '../../../config/index.js';
import { sendEmail } from '../../utils/sendEmail.js';
import { QueryHelpers } from '../../utils/queryHelpers.js';

const prisma = new PrismaClient();

const registerUser = async (payload: TRegisterUser) => {
  // Hash password
  const hashedPassword = payload.password ? await bcrypt.hash(payload.password, 12) : '';

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

  // Generate unique memberId
  const memberId = `NKBD${Math.floor(100000 + Math.random() * 900000).toString()}`;

  const result = await (prisma.user as any).create({
    data: {
      memberId,
      email: payload.email,
      password: hashedPassword,
      profileFor: payload.profileFor,
      fullName: payload.fullName,
      verificationOtp: otp,
      verificationOtpExpires: otpExpires,
      profile: {
        create: {
            gender: payload.gender
        } // Initialize an empty profile for the onboarding steps
      }
    },
    include: {
      profile: true
    }
  });

  // Send Email with OTP
  await sendEmail(
    payload.email,
    `<div>
      <h1>Welcome to NikahBD</h1>
      <p>Your verification OTP is: <strong>${otp}</strong></p>
      <p>This OTP will expire in 10 minutes.</p>
    </div>`
  );
  
  // Omit sensitive data from result
  const { password, verificationOtp, verificationOtpExpires, ...userWithoutSensitiveData } = result as any;

  const jwtPayload = {
    email: result.email,
    id: result.id,
    role: result.role
  };

  const accessToken = jwt.sign(jwtPayload, config.jwt_secret as string, {
    expiresIn: config.jwt_expires_in as any
  });

  return {
    accessToken,
    user: userWithoutSensitiveData
  };
};

const verifyEmail = async (email: string, otp: string) => {
  const user = await (prisma.user as any).findUnique({ where: { email } });
  
  if (!user) {
    throw new Error('User not found');
  }

  if (user.isEmailVerified) {
    throw new Error('Email is already verified');
  }

  if (!user.verificationOtp || !user.verificationOtpExpires) {
    throw new Error('No OTP requested for this user');
  }

  // Check if OTP is expired
  if (user.verificationOtpExpires < new Date()) {
    throw new Error('OTP has expired');
  }

  // Verify OTP
  if (user.verificationOtp !== otp) {
    throw new Error('Invalid OTP');
  }

  const updatedUser = await (prisma.user as any).update({
    where: { email },
    data: { 
      isEmailVerified: true,
      onboardingStep: 2,
      verificationOtp: null,
      verificationOtpExpires: null
    },
  });

  const jwtPayload = {
    email: updatedUser.email,
    id: updatedUser.id,
    role: updatedUser.role
  };

  const accessToken = jwt.sign(jwtPayload, config.jwt_secret as string, {
    expiresIn: config.jwt_expires_in as any
  });

  return {
    accessToken,
    user: {
      id: updatedUser.id,
      memberId: updatedUser.memberId,
      email: updatedUser.email,
      fullName: updatedUser.fullName,
      role: updatedUser.role
    }
  };
};

const loginUser = async (payload: TLoginUser) => {
  const user = await (prisma.user as any).findUnique({
    where: { email: payload.email },
    include: { profile: true }
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (payload.password) {
    const isPasswordMatched = await bcrypt.compare(payload.password, user.password);
    if (!isPasswordMatched) {
      throw new Error('Incorrect password');
    }
  }

  const jwtPayload = {
    email: user.email,
    id: user.id,
    role: user.role
  };

  const accessToken = jwt.sign(jwtPayload, config.jwt_secret as string, {
    expiresIn: config.jwt_expires_in as any
  });

  return {
    accessToken,
    user: {
      id: user.id,
      memberId: user.memberId,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      profile: user.profile
    }
  };
};

const updateProfile = async (userId: string, payload: TUpdateProfile) => {
  // Handle dob string to Date conversion and calculate age if needed
  if (payload.dob) {
    if (typeof payload.dob === 'string') {
      payload.dob = new Date(payload.dob);
    }
    const today = new Date();
    let age = today.getFullYear() - payload.dob.getFullYear();
    const m = today.getMonth() - payload.dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < payload.dob.getDate())) {
      age--;
    }
    payload.age = age;
  }

  const result = await prisma.profile.update({
    where: {
      userId,
    },
    data: payload
  });
  return result;
};

const getProfile = async (requesterId: string | undefined, targetUserId: string) => {
  const user = await (prisma.user as any).findUnique({
    where: { id: targetUserId },
    include: { profile: true }
  });

  if (!user || !user.profile) {
    throw new Error('Profile not found');
  }

  const { password, verificationOtp, verificationOtpExpires, ...userWithoutSensitiveData } = user;
  const profile = userWithoutSensitiveData.profile;

  // Check if unclocked or if requester is the owner
  if (requesterId && requesterId === targetUserId) {
    return { ...userWithoutSensitiveData, isUnlocked: true };
  }

  let hasUnlocked = null;
  let isShortlisted = false;
  
  if (requesterId) {
    const shortlistModel = (prisma as any).shortlist || (prisma as any).Shortlist;
    
    const queries: any[] = [
      prisma.contactUnlock.findUnique({
        where: {
          unlockedById_targetUserId: {
            unlockedById: requesterId,
            targetUserId: targetUserId
          }
        }
      })
    ];
    
    if (shortlistModel) {
      queries.push(
        shortlistModel.findUnique({
          where: {
            userId_targetUserId: {
              userId: requesterId,
              targetUserId: targetUserId
            }
          }
        })
      );
    } else {
      queries.push(Promise.resolve(null));
    }

    const [unlockResult, shortlistResult] = await Promise.all(queries);
    hasUnlocked = unlockResult;
    isShortlisted = !!shortlistResult;
  }

  if (!hasUnlocked) {
    // Hide paywalled data securely by obfuscation or removal
    const { nidFront, nidBack, ...publicProfile } = profile;
    
    // Obfuscate contact details instead of removing them so frontend can show blurred placeholders
    if (publicProfile.guardianMobile) publicProfile.guardianMobile = '+8801XXXXXXXXX';
    if (publicProfile.guardianEmail) publicProfile.guardianEmail = 'hidden@locked.com';
    
    const { email, ...publicUser } = userWithoutSensitiveData;
    publicUser.profile = publicProfile;
    return { ...publicUser, isUnlocked: false, isShortlisted };
  }

  return { ...userWithoutSensitiveData, isUnlocked: true, isShortlisted };
};

const unlockContact = async (requesterId: string, targetUserId: string) => {
  const user = await (prisma.user as any).findUnique({ where: { id: requesterId } });
  
  if (!user || user.connections < 1) {
    throw new Error('Insufficient Balance');
  }

  const result = await prisma.$transaction([
    (prisma.user as any).update({
      where: { id: requesterId },
      data: { connections: { decrement: 1 } }
    }),
    prisma.contactUnlock.create({
      data: {
        unlockedById: requesterId,
        targetUserId: targetUserId
      }
    })
  ]);

  return result[1];
};

const buyConnections = async (userId: string, amount: number) => {
  const result = await (prisma.user as any).update({
    where: { id: userId },
    data: { connections: { increment: amount } }
  });
  return result;
};

const resendOtp = async (email: string) => {
  const user = await (prisma.user as any).findUnique({ where: { email } });
  
  if (!user) {
    throw new Error('User not found');
  }

  if (user.isEmailVerified) {
    throw new Error('Email is already verified');
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

  await (prisma.user as any).update({
    where: { email },
    data: {
      verificationOtp: otp,
      verificationOtpExpires: otpExpires,
    },
  });

  await sendEmail(
    email,
    `<div>
      <h1>New Verification OTP for NikahBD</h1>
      <p>Your new verification OTP is: <strong>${otp}</strong></p>
      <p>This OTP will expire in 10 minutes.</p>
    </div>`
  );

  return { message: 'OTP resent successfully' };
};

const getAllUserProfiles = async (query: Record<string, any>, requesterId?: string) => {
    const { page, limit, skip, sortBy, sortOrder } = QueryHelpers.calculatePagination(query);
    const { 
        maritalStatus, 
        gender, 
        country, 
        division, 
        district, 
        subDistrict, 
        minAge, 
        maxAge, 
        highestEducation,
        religion,
        profileFor,
        searchTerm
    } = query;

    const where: any = {};

    // Base filters for User model
    if (profileFor) where.profileFor = profileFor;
    
    // Search term (fullName or email or memberId)
    if (searchTerm) {
        where.OR = [
            { fullName: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } },
            { memberId: { contains: searchTerm, mode: 'insensitive' } },
        ];
    }

    // Profile specific filters
    const profileFilters: any = {};
    if (gender) profileFilters.gender = gender;
    if (maritalStatus) profileFilters.maritalStatus = maritalStatus;
    if (country) profileFilters.country = country;
    if (division) profileFilters.division = division;
    if (district) profileFilters.district = district;
    if (subDistrict) profileFilters.subDistrict = subDistrict;
    if (highestEducation) profileFilters.highestEducation = highestEducation;
    if (religion) profileFilters.religion = religion;

    // Age calculation from DOB
    if (minAge || maxAge) {
        const now = new Date();
        const maxDob = minAge ? new Date(now.getFullYear() - Number(minAge), now.getMonth(), now.getDate()) : undefined;
        const minDob = maxAge ? new Date(now.getFullYear() - Number(maxAge) - 1, now.getMonth(), now.getDate()) : undefined;

        profileFilters.dob = {};
        if (minDob) profileFilters.dob.gte = minDob;
        if (maxDob) profileFilters.dob.lte = maxDob;
    }

    if (Object.keys(profileFilters).length > 0) {
        where.profile = profileFilters;
    }

    const result = await (prisma.user as any).findMany({
        where,
        skip,
        take: limit,
        include: {
            profile: true,
        },
        orderBy: {
            [sortBy]: sortOrder,
        },
    });

    const total = await (prisma.user as any).count({ where });

    // Fetch user's shortlists if authenticated
    let shortlistedIds: string[] = [];
    if (requesterId) {
      const shortlistModel = (prisma as any).shortlist || (prisma as any).Shortlist;
      if (shortlistModel) {
        const shortlists = await shortlistModel.findMany({
          where: { userId: requesterId },
          select: { targetUserId: true }
        });
        shortlistedIds = shortlists.map((s: any) => s.targetUserId);
      }
    }

    // Omit sensitive data
    const users = result.map((user: any) => {
        const { password, verificationOtp, verificationOtpExpires, ...userWithoutSensitiveData } = user;
        if (userWithoutSensitiveData.profile) {
            const { guardianMobile, guardianEmail, nidFront, nidBack, ...publicProfile } = userWithoutSensitiveData.profile;
            userWithoutSensitiveData.profile = publicProfile;
        }
        
        // Add isShortlisted flag
        userWithoutSensitiveData.isShortlisted = shortlistedIds.includes(user.id);
        
        return userWithoutSensitiveData;
    });

    return {
        meta: {
            page,
            limit,
            total,
        },
        data: users,
    };
};

const getMe = async (id: string) => {
  const result = await (prisma.user as any).findUnique({
    where: { id },
    include: {
      profile: true
    }
  });

  if (!result) {
    throw new Error('User not found');
  }

  const { password, verificationOtp, verificationOtpExpires, ...userWithoutSensitiveData } = result;
  return userWithoutSensitiveData;
};

const toggleShortlist = async (userId: string, targetUserId: string) => {
  const targetUser = await (prisma as any).user.findUnique({ where: { id: targetUserId } });
  
  if (!targetUser) {
    throw new Error('Target user not found');
  }

  const shortlistModel = (prisma as any).shortlist || (prisma as any).Shortlist;
  if (!shortlistModel) {
    throw new Error('Shortlist model not found in Prisma client. Please run prisma generate.');
  }

  const existingShortlist = await shortlistModel.findUnique({
    where: {
      userId_targetUserId: {
        userId,
        targetUserId
      }
    }
  });

  if (existingShortlist) {
    await shortlistModel.delete({
      where: {
        userId_targetUserId: {
          userId,
          targetUserId
        }
      }
    });
    return { message: 'Removed from shortlist', isShortlisted: false };
  } else {
    await shortlistModel.create({
      data: {
        userId,
        targetUserId
      }
    });
    return { message: 'Added to shortlist', isShortlisted: true };
  }
};

const getShortlistedProfiles = async (userId: string) => {
  const shortlistModel = (prisma as any).shortlist || (prisma as any).Shortlist;
  if (!shortlistModel) {
    throw new Error('Shortlist model not found in Prisma client');
  }

  const result = await shortlistModel.findMany({
    where: { userId },
    include: {
      targetUser: {
        include: {
          profile: true
        }
      }
    }
  });

  const profiles = result.map((item: any) => {
    const user = item.targetUser;
    const { password, verificationOtp, verificationOtpExpires, ...userWithoutSensitiveData } = user;
    if (userWithoutSensitiveData.profile) {
      const { guardianMobile, guardianEmail, nidFront, nidBack, ...publicProfile } = userWithoutSensitiveData.profile;
      userWithoutSensitiveData.profile = publicProfile;
    }
    return userWithoutSensitiveData;
  });

  return profiles;
};

export const UserService = {
  loginUser,
  getMe,
  registerUser,
  verifyEmail,
  resendOtp,
  updateProfile,
  getProfile,
  getAllUserProfiles,
  unlockContact,
  buyConnections,
  toggleShortlist,
  getShortlistedProfiles
};
