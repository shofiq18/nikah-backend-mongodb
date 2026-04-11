import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '../../../config/index.js';
import { sendEmail } from '../../utils/sendEmail.js';
const prisma = new PrismaClient();
const registerUser = async (payload) => {
    const hashedPassword = payload.password ? await bcrypt.hash(payload.password, 12) : '';
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    const result = await prisma.user.create({
        data: {
            email: payload.email,
            password: hashedPassword,
            profileFor: payload.profileFor,
            fullName: payload.fullName,
            verificationOtp: otp,
            verificationOtpExpires: otpExpires,
            profile: {
                create: {}
            }
        },
        include: {
            profile: true
        }
    });
    await sendEmail(payload.email, `<div>
      <h1>Welcome to NikahBD</h1>
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
            email: updatedUser.email,
            fullName: updatedUser.fullName,
            role: updatedUser.role
        }
    };
};
const loginUser = async (payload) => {
    const user = await prisma.user.findUnique({
        where: { email: payload.email }
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
            email: user.email,
            fullName: user.fullName,
            role: user.role
        }
    };
};
const updateProfile = async (userId, payload) => {
    if (payload.dob && typeof payload.dob === 'string') {
        payload.dob = new Date(payload.dob);
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
    const profile = await prisma.profile.findUnique({
        where: { userId: targetUserId }
    });
    if (!profile) {
        throw new Error('Profile not found');
    }
    if (requesterId === targetUserId) {
        return { data: profile, isUnlocked: true };
    }
    const hasUnlocked = await prisma.contactUnlock.findUnique({
        where: {
            unlockedById_targetUserId: {
                unlockedById: requesterId,
                targetUserId: targetUserId
            }
        }
    });
    if (!hasUnlocked) {
        const { guardianMobile, guardianEmail, ...publicProfile } = profile;
        return { data: publicProfile, isUnlocked: false };
    }
    return { data: profile, isUnlocked: true };
};
const unlockContact = async (requesterId, targetUserId) => {
    const user = await prisma.user.findUnique({ where: { id: requesterId } });
    if (!user || user.connections < 1) {
        throw new Error('Insufficient Balance');
    }
    const result = await prisma.$transaction([
        prisma.user.update({
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
const buyConnections = async (userId, amount) => {
    const result = await prisma.user.update({
        where: { id: userId },
        data: { connections: { increment: amount } }
    });
    return result;
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
      <h1>New Verification OTP for NikahBD</h1>
      <p>Your new verification OTP is: <strong>${otp}</strong></p>
      <p>This OTP will expire in 10 minutes.</p>
    </div>`);
    return { message: 'OTP resent successfully' };
};
export const UserService = {
    loginUser,
    registerUser,
    verifyEmail,
    resendOtp,
    updateProfile,
    getProfile,
    unlockContact,
    buyConnections
};
//# sourceMappingURL=user.service.js.map