import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '../../../config/index.js';
import { sendEmail } from '../../utils/sendEmail.js';
import { QueryHelpers } from '../../utils/queryHelpers.js';
const prisma = new PrismaClient();
const registerUser = async (payload) => {
    const hashedPassword = payload.password ? await bcrypt.hash(payload.password, 12) : '';
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    const memberId = `ZWBD${Math.floor(100000 + Math.random() * 900000).toString()}`;
    const result = await prisma.user.create({
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
                }
            }
        },
        include: {
            profile: true
        }
    });
    await sendEmail(payload.email, `<div>
      <h1>Welcome to ZawajBD</h1>
      <p>Your verification OTP is: <strong>${otp}</strong></p>
      <p>This OTP will expire in 10 minutes.</p>
    </div>`);
    const { password, verificationOtp, verificationOtpExpires, ...userWithoutSensitiveData } = result;
    const jwtPayload = {
        email: result.email,
        id: result.id,
        role: result.role
    };
    const accessToken = jwt.sign(jwtPayload, config.jwt_secret, {
        expiresIn: config.jwt_expires_in
    });
    return {
        accessToken,
        user: userWithoutSensitiveData
    };
};
const verifyEmail = async (email, otp) => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        throw new Error('User not found');
    }
    if (user.isEmailVerified) {
        throw new Error('Email is already verified');
    }
    if (!user.verificationOtp || !user.verificationOtpExpires) {
        throw new Error('No OTP requested for this user');
    }
    if (user.verificationOtpExpires < new Date()) {
        throw new Error('OTP has expired');
    }
    if (user.verificationOtp !== otp) {
        throw new Error('Invalid OTP');
    }
    const updatedUser = await prisma.user.update({
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
    const accessToken = jwt.sign(jwtPayload, config.jwt_secret, {
        expiresIn: config.jwt_expires_in
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
const loginUser = async (payload) => {
    const user = await prisma.user.findUnique({
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
    const accessToken = jwt.sign(jwtPayload, config.jwt_secret, {
        expiresIn: config.jwt_expires_in
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
const updateProfile = async (userId, payload) => {
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
const getProfile = async (requesterId, targetUserId) => {
    const user = await prisma.user.findUnique({
        where: { id: targetUserId },
        include: { profile: true }
    });
    if (!user || !user.profile) {
        throw new Error('Profile not found');
    }
    const { password, verificationOtp, verificationOtpExpires, ...userWithoutSensitiveData } = user;
    const profile = userWithoutSensitiveData.profile;
    if (requesterId && requesterId === targetUserId) {
        return { ...userWithoutSensitiveData, isUnlocked: true };
    }
    let hasUnlocked = null;
    let isShortlisted = false;
    let interestStatus = null;
    let photoRequestStatus = null;
    if (requesterId) {
        const shortlistModel = prisma.shortlist || prisma.Shortlist;
        const interestModel = prisma.interest || prisma.Interest;
        const photoRequestModel = prisma.photoRequest || prisma.PhotoRequest;
        const queries = [
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
            queries.push(shortlistModel.findUnique({
                where: {
                    userId_targetUserId: {
                        userId: requesterId,
                        targetUserId: targetUserId
                    }
                }
            }));
        }
        else {
            queries.push(Promise.resolve(null));
        }
        if (interestModel) {
            queries.push(interestModel.findUnique({
                where: {
                    senderId_receiverId: {
                        senderId: requesterId,
                        receiverId: targetUserId
                    }
                }
            }));
        }
        else {
            queries.push(Promise.resolve(null));
        }
        if (photoRequestModel) {
            queries.push(photoRequestModel.findUnique({
                where: {
                    requesterId_targetUserId: {
                        requesterId: requesterId,
                        targetUserId: targetUserId
                    }
                }
            }));
        }
        else {
            queries.push(Promise.resolve(null));
        }
        const [unlockResult, shortlistResult, interestResult, photoReqResult] = await Promise.all(queries);
        hasUnlocked = unlockResult;
        isShortlisted = !!shortlistResult;
        interestStatus = interestResult?.status || null;
        photoRequestStatus = photoReqResult?.status || null;
    }
    const { nidFront, nidBack, ...publicProfile } = profile;
    if (publicProfile.photoVisibility === 'PRIVATE' && photoRequestStatus !== 'ACCEPTED') {
        publicProfile.photos = [];
    }
    if (!hasUnlocked) {
        if (publicProfile.guardianMobile)
            publicProfile.guardianMobile = '+8801XXXXXXXXX';
        if (publicProfile.guardianEmail)
            publicProfile.guardianEmail = 'hidden@locked.com';
        const { email, ...publicUser } = userWithoutSensitiveData;
        publicUser.profile = publicProfile;
        return { ...publicUser, isUnlocked: false, isShortlisted, interestStatus, photoRequestStatus };
    }
    return { ...userWithoutSensitiveData, isUnlocked: true, isShortlisted, interestStatus, photoRequestStatus };
};
const unlockContact = async (requesterId, targetUserId) => {
    const user = await prisma.user.findUnique({ where: { id: requesterId } });
    if (!user)
        throw new Error('User not found');
    const existingUnlock = await prisma.contactUnlock.findUnique({
        where: {
            unlockedById_targetUserId: {
                unlockedById: requesterId,
                targetUserId: targetUserId
            }
        }
    });
    if (existingUnlock)
        return existingUnlock;
    const isPlanActive = user.planType !== 'FREE' && user.planExpiry && new Date(user.planExpiry) > new Date();
    if (isPlanActive && user.remainingNumbers > 0) {
        const result = await prisma.$transaction([
            prisma.user.update({
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
    if (user.availableTokens > 0) {
        const result = await prisma.$transaction([
            prisma.user.update({
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
const resendOtp = async (email) => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        throw new Error('User not found');
    }
    if (user.isEmailVerified) {
        throw new Error('Email is already verified');
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await prisma.user.update({
        where: { email },
        data: {
            verificationOtp: otp,
            verificationOtpExpires: otpExpires,
        },
    });
    await sendEmail(email, `<div>
      <h1>New Verification OTP for ZawajBD</h1>
      <p>Your new verification OTP is: <strong>${otp}</strong></p>
      <p>This OTP will expire in 10 minutes.</p>
    </div>`);
    return { message: 'OTP resent successfully' };
};
const getAllUserProfiles = async (query, requesterId) => {
    const { page, limit, skip, sortBy, sortOrder } = QueryHelpers.calculatePagination(query);
    const { maritalStatus, gender, country, division, district, subDistrict, minAge, maxAge, highestEducation, religion, profileFor, searchTerm } = query;
    const where = { role: 'USER' };
    if (profileFor)
        where.profileFor = profileFor;
    let oppositeGender;
    if (requesterId) {
        const requester = await prisma.user.findUnique({
            where: { id: requesterId },
            include: { profile: true }
        });
        if (requester?.profile?.gender) {
            oppositeGender = requester.profile.gender === 'Male' ? 'Female' : 'Male';
        }
    }
    if (searchTerm) {
        where.OR = [
            { fullName: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } },
            { memberId: { contains: searchTerm, mode: 'insensitive' } },
        ];
    }
    const profileFilters = {};
    if (gender) {
        profileFilters.gender = gender;
    }
    else if (oppositeGender) {
        profileFilters.gender = oppositeGender;
    }
    if (maritalStatus)
        profileFilters.maritalStatus = maritalStatus;
    if (country)
        profileFilters.country = country;
    if (division)
        profileFilters.division = division;
    if (district)
        profileFilters.district = district;
    if (subDistrict)
        profileFilters.subDistrict = subDistrict;
    if (highestEducation)
        profileFilters.highestEducation = highestEducation;
    if (religion)
        profileFilters.religion = religion;
    if (minAge || maxAge) {
        const now = new Date();
        const maxDob = minAge ? new Date(now.getFullYear() - Number(minAge), now.getMonth(), now.getDate()) : undefined;
        const minDob = maxAge ? new Date(now.getFullYear() - Number(maxAge) - 1, now.getMonth(), now.getDate()) : undefined;
        profileFilters.dob = {};
        if (minDob)
            profileFilters.dob.gte = minDob;
        if (maxDob)
            profileFilters.dob.lte = maxDob;
    }
    if (Object.keys(profileFilters).length > 0) {
        where.profile = profileFilters;
    }
    const result = await prisma.user.findMany({
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
    const total = await prisma.user.count({ where });
    let shortlistedIds = [];
    let interestStatusMap = {};
    let photoRequestStatusMap = {};
    if (requesterId) {
        const shortlistModel = prisma.shortlist || prisma.Shortlist;
        const interestModel = prisma.interest || prisma.Interest;
        const photoRequestModel = prisma.photoRequest || prisma.PhotoRequest;
        if (shortlistModel) {
            const shortlists = await shortlistModel.findMany({
                where: { userId: requesterId },
                select: { targetUserId: true }
            });
            shortlistedIds = shortlists.map((s) => s.targetUserId);
        }
        if (interestModel) {
            const interests = await interestModel.findMany({
                where: { senderId: requesterId },
                select: { receiverId: true, status: true }
            });
            interests.forEach((i) => {
                interestStatusMap[i.receiverId] = i.status;
            });
        }
        if (photoRequestModel) {
            const photoRequests = await photoRequestModel.findMany({
                where: { requesterId: requesterId },
                select: { targetUserId: true, status: true }
            });
            photoRequests.forEach((pr) => {
                photoRequestStatusMap[pr.targetUserId] = pr.status;
            });
        }
    }
    const users = result.map((user) => {
        const { password, verificationOtp, verificationOtpExpires, ...userWithoutSensitiveData } = user;
        userWithoutSensitiveData.isShortlisted = shortlistedIds.includes(user.id);
        userWithoutSensitiveData.interestStatus = interestStatusMap[user.id] || null;
        userWithoutSensitiveData.photoRequestStatus = photoRequestStatusMap[user.id] || null;
        if (userWithoutSensitiveData.profile) {
            const { guardianMobile, guardianEmail, nidFront, nidBack, ...publicProfile } = userWithoutSensitiveData.profile;
            if (publicProfile.photoVisibility === 'PRIVATE' && userWithoutSensitiveData.photoRequestStatus !== 'ACCEPTED') {
                publicProfile.photos = [];
            }
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
const getMe = async (id) => {
    const result = await prisma.user.findUnique({
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
const toggleShortlist = async (userId, targetUserId) => {
    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
        throw new Error('Target user not found');
    }
    const shortlistModel = prisma.shortlist || prisma.Shortlist;
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
    }
    else {
        await shortlistModel.create({
            data: {
                userId,
                targetUserId
            }
        });
        return { message: 'Added to shortlist', isShortlisted: true };
    }
};
const getShortlistedProfiles = async (userId) => {
    const shortlistModel = prisma.shortlist || prisma.Shortlist;
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
    const profiles = result.map((item) => {
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
const sendInterest = async (senderId, receiverId) => {
    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver)
        throw new Error('Target user not found');
    const interestModel = prisma.interest || prisma.Interest;
    const existingInterest = await interestModel.findUnique({
        where: {
            senderId_receiverId: { senderId, receiverId }
        }
    });
    if (existingInterest)
        throw new Error('Interest already sent');
    const result = await interestModel.create({
        data: {
            senderId,
            receiverId,
            status: 'PENDING'
        }
    });
    return result;
};
const handleInterestResponse = async (userId, interestId, status) => {
    const interestModel = prisma.interest || prisma.Interest;
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
const getReceivedInterests = async (userId) => {
    const interestModel = prisma.interest || prisma.Interest;
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
    return result.map((item) => {
        const user = item.sender;
        const { password, verificationOtp, verificationOtpExpires, ...userWithoutSensitiveData } = user;
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
const getSentInterests = async (userId) => {
    const interestModel = prisma.interest || prisma.Interest;
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
    return result.map((item) => {
        const user = item.receiver;
        const { password, verificationOtp, verificationOtpExpires, ...userWithoutSensitiveData } = user;
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
    unlockContact,
    toggleShortlist,
    getShortlistedProfiles,
    sendInterest,
    handleInterestResponse,
    getReceivedInterests,
    getSentInterests
};
//# sourceMappingURL=user.service.js.map