import { InterestStatus, NidStatus, PrismaClient, UserStatus } from '@prisma/client';
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
  const memberId = `ZWBD${Math.floor(100000 + Math.random() * 900000).toString()}`;

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
      <h1>Welcome to ZawajBD</h1>
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
  let interestStatus = null;
  let photoRequestStatus = null;

  if (requesterId) {
    const shortlistModel = (prisma as any).shortlist || (prisma as any).Shortlist;
    const interestModel = (prisma as any).interest || (prisma as any).Interest;
    const photoRequestModel = (prisma as any).photoRequest || (prisma as any).PhotoRequest;

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

    if (interestModel) {
      queries.push(
        interestModel.findUnique({
          where: {
            senderId_receiverId: {
              senderId: requesterId,
              receiverId: targetUserId
            }
          }
        })
      );
    } else {
      queries.push(Promise.resolve(null));
    }

    if (photoRequestModel) {
      queries.push(
        photoRequestModel.findUnique({
          where: {
            requesterId_targetUserId: {
              requesterId: requesterId,
              targetUserId: targetUserId
            }
          }
        })
      );
    } else {
      queries.push(Promise.resolve(null));
    }

    const [unlockResult, shortlistResult, interestResult, photoReqResult] = await Promise.all(queries);
    hasUnlocked = unlockResult;
    isShortlisted = !!shortlistResult;
    interestStatus = interestResult?.status || null;
    photoRequestStatus = photoReqResult?.status || null;
  }

  const { nidFront, nidBack, ...publicProfile } = profile;

  // Keep photos even if private so frontend can apply blur
  // if (publicProfile.photoVisibility === 'PRIVATE' && photoRequestStatus !== 'ACCEPTED') {
  //   publicProfile.photos = [];
  // }

  if (!hasUnlocked) {
    // Hide paywalled data securely by obfuscation or removal
    // Obfuscate contact details instead of removing them so frontend can show blurred placeholders
    if (publicProfile.guardianMobile) publicProfile.guardianMobile = '+8801XXXXXXXXX';
    if (publicProfile.guardianEmail) publicProfile.guardianEmail = 'hidden@locked.com';

    const { email, ...publicUser } = userWithoutSensitiveData;
    publicUser.profile = publicProfile;
    return { ...publicUser, isUnlocked: false, isShortlisted, interestStatus, photoRequestStatus };
  }

  return { ...userWithoutSensitiveData, isUnlocked: true, isShortlisted, interestStatus, photoRequestStatus };
};

const unlockContact = async (requesterId: string, targetUserId: string) => {
  const user = await (prisma.user as any).findUnique({ where: { id: requesterId } });

  if (!user) throw new Error('User not found');

  // Priority 1: Check if already unlocked (handled by unique constraint in create, but we check first for better UX)
  const existingUnlock = await prisma.contactUnlock.findUnique({
    where: {
      unlockedById_targetUserId: {
        unlockedById: requesterId,
        targetUserId: targetUserId
      }
    }
  });

  if (existingUnlock) return existingUnlock;

  // Priority 2: Check active Subscription Plan
  const isPlanActive = user.planType !== 'FREE' && user.planExpiry && new Date(user.planExpiry) > new Date();

  if (isPlanActive && user.remainingNumbers > 0) {
    const result = await prisma.$transaction([
      (prisma.user as any).update({
        where: { id: requesterId },
        data: { remainingNumbers: user.remainingNumbers - 1 }
      }),
      prisma.contactUnlock.create({
        data: {
          unlockedById: requesterId,
          targetUserId: targetUserId
        }
      })
    ]);
    return result[1];
  }

  // Priority 3: Check available Tokens
  if (user.availableTokens > 0) {
    const result = await prisma.$transaction([
      (prisma.user as any).update({
        where: { id: requesterId },
        data: { availableTokens: user.availableTokens - 1 }
      }),
      prisma.contactUnlock.create({
        data: {
          unlockedById: requesterId,
          targetUserId: targetUserId
        }
      })
    ]);
    return result[1];
  }

  throw new Error('INSUFFICIENT_BALANCE');
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
      <h1>New Verification OTP for ZawajBD</h1>
      <p>Your new verification OTP is: <strong>${otp}</strong></p>
      <p>This OTP will expire in 10 minutes.</p>
    </div>`
  );

  return { message: 'OTP resent successfully' };
};

const getAllUsers = async (query: Record<string, any>) => {
  const { searchTerm, role, planType, nidStatus, hasTokens, limit, page, status } = query;

  const where: any = {};
  if (status) where.status = status;
  if (searchTerm) {
    where.OR = [
      { fullName: { contains: searchTerm, mode: 'insensitive' } },
      { email: { contains: searchTerm, mode: 'insensitive' } },
      { memberId: { contains: searchTerm, mode: 'insensitive' } }
    ];
  }
  if (role) where.role = role;
  if (planType) where.planType = planType;
  if (nidStatus) {
    where.profile = { nidStatus };
  }
  if (hasTokens === 'true') {
    where.availableTokens = { gt: 0 };
  }

  // If no pagination is provided, fetch all
  const queryOptions: any = {
    where,
    include: { profile: true },
    orderBy: { createdAt: 'desc' }
  };

  if (limit && page) {
    queryOptions.skip = (Number(page) - 1) * Number(limit);
    queryOptions.take = Number(limit);
  }

  const result = await (prisma.user as any).findMany(queryOptions);
  const total = await (prisma.user as any).count({ where });

  return {
    meta: {
      total,
      page: Number(page || 1),
      limit: Number(limit || total)
    },
    data: result
  };
};

const updateNidStatus = async (id: string, nidStatus: NidStatus) => {
  return await (prisma.user as any).update({
    where: { id },
    data: {
      profile: {
        update: {
          nidStatus,
          isNidVerified: nidStatus === 'APPROVED'
        }
      }
    }
  });
};

const blockUser = async (id: string, status: UserStatus) => {
  return await (prisma.user as any).update({
    where: { id },
    data: { status }
  });
};

const deleteUser = async (id: string) => {
  return await (prisma.user as any).update({
    where: { id },
    data: { status: 'Deleted' }
  });
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

  // --- AUTOMATIC DATABASE MIGRATION ---
  // Fix older MongoDB documents that are missing the status field
  try {
    await prisma.$runCommandRaw({
      update: "User",
      updates: [
        {
          q: { status: { $exists: false } },
          u: { $set: { status: "Active" } },
          multi: true
        }
      ]
    });
  } catch (e) {
    // Ignore if raw commands are not supported
  }
  // ------------------------------------

  const where: any = {
    role: 'USER',
    status: 'Active'
  };

  // Base filters for User model
  if (profileFor) where.profileFor = profileFor;

  // Determine opposite gender for logged-in user
  let oppositeGender: string | undefined;
  if (requesterId) {
    const requester = await (prisma.user as any).findUnique({
      where: { id: requesterId },
      include: { profile: true }
    });
    if (requester?.profile?.gender) {
      oppositeGender = requester.profile.gender === 'Male' ? 'Female' : 'Male';
    }
  }

  // Search term (fullName or email or memberId)
  if (searchTerm) {
    where.AND = [
      {
        OR: [
          { fullName: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { memberId: { contains: searchTerm, mode: 'insensitive' } },
        ]
      }
    ];
  }

  // Profile specific filters
  const profileFilters: any = {};
  if (gender) {
    profileFilters.gender = gender;
  } else if (oppositeGender) {
    profileFilters.gender = oppositeGender;
  }

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

  // Fetch user's shortlists and interests if authenticated
  let shortlistedIds: string[] = [];
  let interestStatusMap: Record<string, string> = {};
  let photoRequestStatusMap: Record<string, string> = {};
  if (requesterId) {
    const shortlistModel = (prisma as any).shortlist || (prisma as any).Shortlist;
    const interestModel = (prisma as any).interest || (prisma as any).Interest;
    const photoRequestModel = (prisma as any).photoRequest || (prisma as any).PhotoRequest;

    if (shortlistModel) {
      const shortlists = await shortlistModel.findMany({
        where: { userId: requesterId },
        select: { targetUserId: true }
      });
      shortlistedIds = shortlists.map((s: any) => s.targetUserId);
    }

    if (interestModel) {
      const interests = await interestModel.findMany({
        where: { senderId: requesterId },
        select: { receiverId: true, status: true }
      });
      interests.forEach((i: any) => {
        interestStatusMap[i.receiverId] = i.status;
      });
    }

    if (photoRequestModel) {
      const photoRequests = await photoRequestModel.findMany({
        where: { requesterId: requesterId },
        select: { targetUserId: true, status: true }
      });
      photoRequests.forEach((pr: any) => {
        photoRequestStatusMap[pr.targetUserId] = pr.status;
      });
    }

    const unlockedContacts = await prisma.contactUnlock.findMany({
      where: { unlockedById: requesterId },
      select: { targetUserId: true }
    });
    var unlockedIds = unlockedContacts.map((uc: any) => uc.targetUserId);
  }

  // Omit sensitive data
  const users = result.map((user: any) => {
    const { password, verificationOtp, verificationOtpExpires, ...userWithoutSensitiveData } = user;

    // Add flags
    userWithoutSensitiveData.isShortlisted = shortlistedIds.includes(user.id);
    userWithoutSensitiveData.interestStatus = interestStatusMap[user.id] || null;
    userWithoutSensitiveData.photoRequestStatus = photoRequestStatusMap[user.id] || null;
    userWithoutSensitiveData.isUnlocked = (unlockedIds || []).includes(user.id);

    if (userWithoutSensitiveData.profile) {
      const { guardianMobile, guardianEmail, nidFront, nidBack, ...publicProfile } = userWithoutSensitiveData.profile;

      // Keep photos even if private so frontend can apply blur
      // if (publicProfile.photoVisibility === 'PRIVATE' && userWithoutSensitiveData.photoRequestStatus !== 'ACCEPTED') {
      //   publicProfile.photos = [];
      // }

      userWithoutSensitiveData.profile = publicProfile;
    }

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
    },
    orderBy: { createdAt: 'desc' }
  });

  const unlockedContacts = await prisma.contactUnlock.findMany({
    where: { unlockedById: userId },
    select: { targetUserId: true }
  });
  const unlockedIds = unlockedContacts.map((uc: any) => uc.targetUserId);

  const interestModel = (prisma as any).interest || (prisma as any).Interest;
  const photoRequestModel = (prisma as any).photoRequest || (prisma as any).PhotoRequest;

  let interestStatusMap: Record<string, string> = {};
  let photoRequestStatusMap: Record<string, string> = {};

  if (interestModel) {
    const interests = await interestModel.findMany({
      where: { senderId: userId },
      select: { receiverId: true, status: true }
    });
    interests.forEach((i: any) => {
      interestStatusMap[i.receiverId] = i.status;
    });
  }

  if (photoRequestModel) {
    const photoRequests = await photoRequestModel.findMany({
      where: { requesterId: userId },
      select: { targetUserId: true, status: true }
    });
    photoRequests.forEach((pr: any) => {
      photoRequestStatusMap[pr.targetUserId] = pr.status;
    });
  }

  const profiles = result.map((item: any) => {
    const user = item.targetUser;
    const { password, verificationOtp, verificationOtpExpires, ...userWithoutSensitiveData } = user;
    userWithoutSensitiveData.isUnlocked = unlockedIds.includes(user.id);
    userWithoutSensitiveData.isShortlisted = true;
    userWithoutSensitiveData.interestStatus = interestStatusMap[user.id] || null;
    userWithoutSensitiveData.photoRequestStatus = photoRequestStatusMap[user.id] || null;

    if (userWithoutSensitiveData.profile) {
      const { guardianMobile, guardianEmail, nidFront, nidBack, ...publicProfile } = userWithoutSensitiveData.profile;
      userWithoutSensitiveData.profile = publicProfile;
    }
    return userWithoutSensitiveData;
  });

  return profiles;
};

const sendInterest = async (senderId: string, receiverId: string) => {
  const receiver = await (prisma as any).user.findUnique({ where: { id: receiverId } });
  if (!receiver) throw new Error('Target user not found');

  const interestModel = (prisma as any).interest || (prisma as any).Interest;

  const existingInterest = await interestModel.findUnique({
    where: {
      senderId_receiverId: { senderId, receiverId }
    }
  });

  if (existingInterest) throw new Error('Interest already sent');

  const result = await interestModel.create({
    data: {
      senderId,
      receiverId,
      status: 'PENDING'
    }
  });

  return result;
};

const handleInterestResponse = async (userId: string, interestId: string, status: InterestStatus) => {
  const interestModel = (prisma as any).interest || (prisma as any).Interest;

  const interest = await interestModel.findUnique({
    where: { id: interestId }
  });

  if (!interest || interest.receiverId !== userId) {
    throw new Error('Interest record not found or unauthorized');
  }

  const result = await interestModel.update({
    where: { id: interestId },
    data: { status }
  });

  return result;
};

const getReceivedInterests = async (userId: string) => {
  const interestModel = (prisma as any).interest || (prisma as any).Interest;

  const result = await interestModel.findMany({
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

  const unlockedContacts = await prisma.contactUnlock.findMany({
    where: { unlockedById: userId },
    select: { targetUserId: true }
  });
  const unlockedIds = unlockedContacts.map((uc: any) => uc.targetUserId);

  return result.map((item: any) => {
    const user = item.sender;
    const { password, verificationOtp, verificationOtpExpires, ...userWithoutSensitiveData } = user;
    userWithoutSensitiveData.isUnlocked = unlockedIds.includes(user.id);
    if (userWithoutSensitiveData.profile) {
      const { guardianMobile, guardianEmail, nidFront, nidBack, ...publicProfile } = userWithoutSensitiveData.profile;
      userWithoutSensitiveData.profile = publicProfile;
    }
    return {
      ...item,
      sender: userWithoutSensitiveData
    };
  });
};

const getSentInterests = async (userId: string) => {
  const interestModel = (prisma as any).interest || (prisma as any).Interest;

  const result = await interestModel.findMany({
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

  const unlockedContacts = await prisma.contactUnlock.findMany({
    where: { unlockedById: userId },
    select: { targetUserId: true }
  });
  const unlockedIds = unlockedContacts.map((uc: any) => uc.targetUserId);

  return result.map((item: any) => {
    const user = item.receiver;
    const { password, verificationOtp, verificationOtpExpires, ...userWithoutSensitiveData } = user;
    userWithoutSensitiveData.isUnlocked = unlockedIds.includes(user.id);
    if (userWithoutSensitiveData.profile) {
      const { guardianMobile, guardianEmail, nidFront, nidBack, ...publicProfile } = userWithoutSensitiveData.profile;
      userWithoutSensitiveData.profile = publicProfile;
    }
    return {
      ...item,
      receiver: userWithoutSensitiveData
    };
  });
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
