import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import config from '../../config/index.js';

const prisma = new PrismaClient();

export const seedSuperAdmin = async () => {
    try {
        const superAdminEmail = 'admin@zawajbd.com';
        const exists = await (prisma.user as any).findUnique({
            where: { email: superAdminEmail }
        });

        if (!exists) {
            console.log('🌱 Seeding Super Admin...');
            const hashedPassword = await bcrypt.hash('admin123', 12);

            await (prisma.user as any).create({
                data: {
                    fullName: 'Systems Admin',
                    email: superAdminEmail,
                    password: hashedPassword,
                    role: 'ADMIN',
                    isEmailVerified: true,
                    memberId: 'ADMIN001',
                    availableTokens: 999999,
                    profileFor: 'SELF',
                    onboardingStep: 7,
                    profile: {
                        create: {
                            gender: 'MALE',
                            maritalStatus: 'SINGLE',
                            religion: 'ISLAM'
                        }
                    }
                }
            });
            console.log('✅ Super Admin created successfully!');
            console.log(`📧 Email: ${superAdminEmail}`);
            console.log('🔑 Password: admin123');
        }
    } catch (error) {
        console.error('❌ Error seeding Super Admin:', error);
    }
};
