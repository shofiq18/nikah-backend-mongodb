import { PrismaClient } from '@prisma/client';
import { NotificationService } from '../notification/notification.service.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '../../../config/index.js';
import { sendEmail } from '../../utils/sendEmail.js';
import { QueryHelpers } from '../../utils/queryHelpers.js';
import { calculateMatchScore } from '../../utils/match-logic.js';
import { getOtpEmailTemplate } from '../../utils/emailTemplates.js';
const prisma = new PrismaClient();
const registerUser = async (payload) => {
    const existingUser = await prisma.user.findUnique({
        where: { email: payload.email },
    });
    if (existingUser) {
        if (existingUser.status === 'Deleted') {
            await prisma.user.update({
                where: { id: existingUser.id },
                data: {
                    email: `${existingUser.email}.deleted.${Date.now()}`
                }
            });
        }
        else {
            const error = new Error('An account with this email already exists.');
            error.statusCode = 400;
            throw error;
        }
    }
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
    try {
        await sendEmail(payload.email, getOtpEmailTemplate(payload.fullName, otp, 'register'));
    }
    catch (emailError) {
        await prisma.user.delete({
            where: { id: result.id }
        }).catch(() => { });
        throw emailError;
    }
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
    if (payload.nidFront || payload.nidBack) {
        payload.nidStatus = 'PENDING';
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
    if (requesterId) {
        const profileViewModel = prisma.profileView || prisma.ProfileView;
        if (profileViewModel) {
            const existingView = await profileViewModel.findUnique({
                where: {
                    viewerId_targetUserId: {
                        viewerId: requesterId,
                        targetUserId: targetUserId
                    }
                }
            });
            const now = new Date();
            const ONE_HOUR = 60 * 60 * 1000;
            const shouldNotify = !existingView || (now.getTime() - new Date(existingView.lastViewedAt).getTime() > ONE_HOUR);
            await profileViewModel.upsert({
                where: {
                    viewerId_targetUserId: {
                        viewerId: requesterId,
                        targetUserId: targetUserId
                    }
                },
                update: {
                    lastViewedAt: now
                },
                create: {
                    viewerId: requesterId,
                    targetUserId: targetUserId,
                    lastViewedAt: now
                }
            });
            if (shouldNotify) {
                const requester = await prisma.user.findUnique({ where: { id: requesterId } });
                if (requester) {
                    await NotificationService.createNotification({
                        userId: targetUserId,
                        type: 'PROFILE_VIEW_RECEIVED',
                        title: requester.fullName,
                        message: 'viewed your profile.',
                        path: `/dashboard/user/profile-details/${requesterId}`,
                        senderId: requesterId,
                    });
                }
            }
        }
    }
    let hasUnlocked = null;
    let matchScore = 0;
    if (requesterId) {
        const requester = await prisma.user.findUnique({
            where: { id: requesterId },
            include: { profile: true }
        });
        if (requester?.profile && user.profile) {
            matchScore = calculateMatchScore(requester.profile, user.profile);
        }
    }
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
    if (!hasUnlocked) {
        if (publicProfile.guardianMobile)
            publicProfile.guardianMobile = '+8801XXXXXXXXX';
        if (publicProfile.guardianEmail)
            publicProfile.guardianEmail = 'hidden@locked.com';
        const { email, ...publicUser } = userWithoutSensitiveData;
        publicUser.profile = publicProfile;
        return { ...publicUser, isUnlocked: false, isShortlisted, interestStatus, photoRequestStatus, matchScore };
    }
    return { ...userWithoutSensitiveData, isUnlocked: true, isShortlisted, interestStatus, photoRequestStatus, matchScore };
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
    await sendEmail(email, getOtpEmailTemplate(user.fullName, otp, 'resend'));
    return { message: 'OTP resent successfully' };
};
const getAllUsers = async (query) => {
    const { searchTerm, role, planType, nidStatus, hasTokens, limit, page, status } = query;
    const where = {};
    if (status)
        where.status = status;
    if (searchTerm) {
        where.OR = [
            { fullName: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } },
            { memberId: { contains: searchTerm, mode: 'insensitive' } }
        ];
    }
    if (role)
        where.role = role;
    if (planType)
        where.planType = planType;
    if (nidStatus) {
        where.profile = { nidStatus };
    }
    if (hasTokens === 'true') {
        where.availableTokens = { gt: 0 };
    }
    const queryOptions = {
        where,
        include: { profile: true },
        orderBy: { createdAt: 'desc' }
    };
    if (limit && page) {
        queryOptions.skip = (Number(page) - 1) * Number(limit);
        queryOptions.take = Number(limit);
    }
    const result = await prisma.user.findMany(queryOptions);
    const total = await prisma.user.count({ where });
    return {
        meta: {
            total,
            page: Number(page || 1),
            limit: Number(limit || total)
        },
        data: result
    };
};
const updateNidStatus = async (id, nidStatus) => {
    return await prisma.user.update({
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
const blockUser = async (id, status) => {
    return await prisma.user.update({
        where: { id },
        data: { status }
    });
};
const deleteUser = async (id) => {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
        throw new Error('User not found');
    }
    return await prisma.user.update({
        where: { id },
        data: {
            status: 'Deleted',
            email: `${user.email}.deleted.${Date.now()}`
        }
    });
};
const getAllUserProfiles = async (query, requesterId) => {
    const { page, limit, skip, sortBy, sortOrder } = QueryHelpers.calculatePagination(query);
    const { maritalStatus, gender, country, division, district, subDistrict, minAge, maxAge, highestEducation, religion, profileFor, searchTerm } = query;
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
    }
    catch (e) {
    }
    const where = {
        role: 'USER',
        status: 'Active'
    };
    if (profileFor)
        where.profileFor = profileFor;
    let oppositeGender;
    if (requesterId) {
        const requester = await prisma.user.findUnique({
            where: { id: requesterId },
            include: { profile: true }
        });
        if (requester?.profile?.gender) {
            oppositeGender = requester.profile.gender.toLowerCase() === 'male' ? 'Female' : 'Male';
        }
    }
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
    const profileFilters = {};
    if (gender) {
        profileFilters.gender = { equals: gender, mode: 'insensitive' };
    }
    else if (oppositeGender) {
        profileFilters.gender = { equals: oppositeGender, mode: 'insensitive' };
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
        const unlockedContacts = await prisma.contactUnlock.findMany({
            where: { unlockedById: requesterId },
            select: { targetUserId: true }
        });
        var unlockedIds = unlockedContacts.map((uc) => uc.targetUserId);
    }
    const users = result.map((user) => {
        const { password, verificationOtp, verificationOtpExpires, ...userWithoutSensitiveData } = user;
        userWithoutSensitiveData.isShortlisted = shortlistedIds.includes(user.id);
        userWithoutSensitiveData.interestStatus = interestStatusMap[user.id] || null;
        userWithoutSensitiveData.photoRequestStatus = photoRequestStatusMap[user.id] || null;
        userWithoutSensitiveData.isUnlocked = (unlockedIds || []).includes(user.id);
        if (userWithoutSensitiveData.profile) {
            const { guardianMobile, guardianEmail, nidFront, nidBack, ...publicProfile } = userWithoutSensitiveData.profile;
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
        const sender = await prisma.user.findUnique({ where: { id: userId } });
        await NotificationService.createNotification({
            userId: targetUserId,
            type: 'SHORTLIST_RECEIVED',
            title: sender.fullName,
            message: 'shortlisted your profile.',
            path: `/dashboard/user/profile-details/${userId}`,
            senderId: userId,
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
        },
        orderBy: { createdAt: 'desc' }
    });
    const unlockedContacts = await prisma.contactUnlock.findMany({
        where: { unlockedById: userId },
        select: { targetUserId: true }
    });
    const unlockedIds = unlockedContacts.map((uc) => uc.targetUserId);
    const interestModel = prisma.interest || prisma.Interest;
    const photoRequestModel = prisma.photoRequest || prisma.PhotoRequest;
    let interestStatusMap = {};
    let photoRequestStatusMap = {};
    if (interestModel) {
        const interests = await interestModel.findMany({
            where: { senderId: userId },
            select: { receiverId: true, status: true }
        });
        interests.forEach((i) => {
            interestStatusMap[i.receiverId] = i.status;
        });
    }
    if (photoRequestModel) {
        const photoRequests = await photoRequestModel.findMany({
            where: { requesterId: userId },
            select: { targetUserId: true, status: true }
        });
        photoRequests.forEach((pr) => {
            photoRequestStatusMap[pr.targetUserId] = pr.status;
        });
    }
    const profiles = result.map((item) => {
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
    const sender = await prisma.user.findUnique({ where: { id: senderId } });
    await NotificationService.createNotification({
        userId: receiverId,
        type: 'INTEREST_RECEIVED',
        title: sender.fullName,
        message: 'sent you an interest request.',
        path: `/dashboard/user/profile-details/${senderId}`,
        senderId: senderId,
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
    if (status === 'ACCEPTED') {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        await NotificationService.createNotification({
            userId: interest.senderId,
            type: 'INTEREST_ACCEPTED',
            title: user.fullName,
            message: 'accepted your interest request.',
            path: `/dashboard/user/profile-details/${userId}`,
            senderId: userId,
        });
    }
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
    const unlockedContacts = await prisma.contactUnlock.findMany({
        where: { unlockedById: userId },
        select: { targetUserId: true }
    });
    const unlockedIds = unlockedContacts.map((uc) => uc.targetUserId);
    return result.map((item) => {
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
    const unlockedContacts = await prisma.contactUnlock.findMany({
        where: { unlockedById: userId },
        select: { targetUserId: true }
    });
    const unlockedIds = unlockedContacts.map((uc) => uc.targetUserId);
    return result.map((item) => {
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
const getMatches = async (userId) => {
    const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true }
    });
    if (!currentUser || !currentUser.profile) {
        throw new Error('User profile not found. Please complete your profile to see matches.');
    }
    const { gender } = currentUser.profile;
    const candidates = await prisma.user.findMany({
        where: {
            id: { not: userId },
            status: 'Active',
            profile: {
                gender: {
                    equals: gender?.toUpperCase() === 'MALE' ? 'FEMALE' : 'MALE',
                    mode: 'insensitive'
                }
            }
        },
        include: {
            profile: true
        }
    });
    let shortlistedIds = [];
    let interestStatusMap = {};
    let photoRequestStatusMap = {};
    let unlockedIds = [];
    const shortlistModel = prisma.shortlist || prisma.Shortlist;
    const interestModel = prisma.interest || prisma.Interest;
    const photoRequestModel = prisma.photoRequest || prisma.PhotoRequest;
    if (shortlistModel) {
        const shortlists = await shortlistModel.findMany({
            where: { userId },
            select: { targetUserId: true }
        });
        shortlistedIds = shortlists.map((s) => s.targetUserId);
    }
    if (interestModel) {
        const interests = await interestModel.findMany({
            where: { senderId: userId },
            select: { receiverId: true, status: true }
        });
        interests.forEach((i) => {
            interestStatusMap[i.receiverId] = i.status;
        });
    }
    if (photoRequestModel) {
        const photoRequests = await photoRequestModel.findMany({
            where: { requesterId: userId },
            select: { targetUserId: true, status: true }
        });
        photoRequests.forEach((pr) => {
            photoRequestStatusMap[pr.targetUserId] = pr.status;
        });
    }
    const unlockedContacts = await prisma.contactUnlock.findMany({
        where: { unlockedById: userId },
        select: { targetUserId: true }
    });
    unlockedIds = unlockedContacts.map((uc) => uc.targetUserId);
    const results = await Promise.all(candidates.map(async (candidate) => {
        if (candidate.profile.religion !== 'Islam') {
            await prisma.profile.update({
                where: { userId: candidate.id },
                data: { religion: 'Islam' }
            });
            candidate.profile.religion = 'Islam';
        }
        const score = calculateMatchScore(currentUser.profile, candidate.profile);
        return {
            userId: candidate.id,
            memberId: candidate.memberId,
            fullName: candidate.fullName,
            matchScore: score,
            age: candidate.profile.age,
            division: candidate.profile.division,
            district: candidate.profile.district,
            religion: candidate.profile.religion,
            maritalStatus: candidate.profile.maritalStatus,
            occupation: candidate.profile.occupation,
            highestEducation: candidate.profile.highestEducation,
            height: candidate.profile.height,
            photo: candidate.profile.photos?.[0] || null,
            isShortlisted: shortlistedIds.includes(candidate.id),
            interestStatus: interestStatusMap[candidate.id] || null,
            photoRequestStatus: photoRequestStatusMap[candidate.id] || null,
            isUnlocked: unlockedIds.includes(candidate.id)
        };
    }));
    const totalUsers = await prisma.user.count();
    const oppositeGender = gender?.toUpperCase() === 'MALE' ? 'FEMALE' : 'MALE';
    const filteredMatches = results
        .filter(m => m.matchScore >= 0)
        .sort((a, b) => b.matchScore - a.matchScore);
    return {
        total: filteredMatches.length,
        matches: filteredMatches,
        debug: {
            totalUsersInDb: totalUsers,
            currentUserGender: gender,
            targetGender: oppositeGender,
            candidatesFound: candidates.length
        }
    };
};
const getPremiumMembers = async (params, requesterId) => {
    const { limit = 10, page = 1, gender } = params;
    const skip = (Number(page) - 1) * Number(limit);
    const where = {
        status: 'Active',
        planType: { in: ['GOLD', 'DIAMOND', 'PLATINUM'] }
    };
    let oppositeGender;
    if (requesterId && !gender) {
        const requester = await prisma.user.findUnique({
            where: { id: requesterId },
            include: { profile: true }
        });
        if (requester?.profile?.gender) {
            oppositeGender = requester.profile.gender.toLowerCase() === 'male' ? 'Female' : 'Male';
        }
    }
    if (gender) {
        where.profile = {
            gender: {
                equals: gender,
                mode: 'insensitive'
            }
        };
    }
    else if (oppositeGender) {
        where.profile = {
            gender: {
                equals: oppositeGender,
                mode: 'insensitive'
            }
        };
    }
    const users = await prisma.user.findMany({
        where,
        include: { profile: true },
        take: Number(limit),
        skip: Number(skip),
        orderBy: { createdAt: 'desc' }
    });
    const total = await prisma.user.count({ where });
    let shortlistedIds = [];
    let interestStatusMap = {};
    let photoRequestStatusMap = {};
    let unlockedIds = [];
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
        const unlockedContacts = await prisma.contactUnlock.findMany({
            where: { unlockedById: requesterId },
            select: { targetUserId: true }
        });
        unlockedIds = unlockedContacts.map((uc) => uc.targetUserId);
    }
    const sanitizedUsers = users.map((user) => {
        const { password, verificationOtp, verificationOtpExpires, ...userWithoutSensitiveData } = user;
        userWithoutSensitiveData.isShortlisted = shortlistedIds.includes(user.id);
        userWithoutSensitiveData.interestStatus = interestStatusMap[user.id] || null;
        userWithoutSensitiveData.photoRequestStatus = photoRequestStatusMap[user.id] || null;
        userWithoutSensitiveData.isUnlocked = unlockedIds.includes(user.id);
        return userWithoutSensitiveData;
    });
    return {
        meta: { page: Number(page), limit: Number(limit), total },
        data: sanitizedUsers
    };
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
    getSentInterests,
    getMatches,
    getPremiumMembers
};
//# sourceMappingURL=user.service.js.map