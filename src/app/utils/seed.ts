import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import config from '../../config/index.js';

const prisma = new PrismaClient();

export const seedSuperAdmin = async () => {
    try {
        const superAdminEmail = 'admin@zawajbd.com';
        const superAdminMemberId = 'ADMIN001';

        const exists = await (prisma.user as any).findFirst({
            where: {
                OR: [
                    { email: superAdminEmail },
                    { memberId: superAdminMemberId }
                ]
            }
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
                    memberId: superAdminMemberId,
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
        } else {
            // console.log('Super Admin already exists. Skipping seed.');
        }
    } catch (error) {
        console.error('❌ Error seeding Super Admin:', error);
    }
};

export const cleanupData = async () => {
    try {
        console.log('🧹 Cleaning up inconsistent data (v3)...');
        
        const arrayFields = ['partnerMaritalStatus', 'interests', 'favMusic', 'favSports', 'favFood', 'photos'];
        const collections = ['Profile', 'User'];

        for (const collection of collections) {
            // Fetch raw documents to avoid Prisma validation errors
            const res: any = await (prisma as any).$runCommandRaw({
                find: collection
            });

            if (!res || !res.cursor || !res.cursor.firstBatch) continue;

            const docs = res.cursor.firstBatch;
            for (const doc of docs) {
                let needsUpdate = false;
                const updateData: any = {};

                for (const field of arrayFields) {
                    const val = doc[field];
                    if (val !== undefined && val !== null) {
                        if (typeof val === 'string') {
                            updateData[field] = [val];
                            needsUpdate = true;
                        } else if (Array.isArray(val)) {
                            // Recursively flatten and filter strings
                            const flatten = (arr: any[]): string[] => {
                                let result: string[] = [];
                                for (const item of arr) {
                                    if (Array.isArray(item)) {
                                        result = result.concat(flatten(item));
                                    } else if (typeof item === 'string') {
                                        result.push(item);
                                    }
                                }
                                return result;
                            };
                            const flat = flatten(val);
                            if (JSON.stringify(val) !== JSON.stringify(flat)) {
                                updateData[field] = flat;
                                needsUpdate = true;
                            }
                        }
                    }
                }

                if (needsUpdate) {
                    // Extract string ID from MongoDB's _id (which might be an object { $oid: "..." })
                    const id = typeof doc._id === 'object' && doc._id.$oid ? doc._id.$oid : doc._id;

                    // RESTORATION LOGIC: If photos is empty but nidFront exists, use it as a placeholder
                    if (collection === 'Profile' && (!updateData.photos || updateData.photos.length === 0) && doc.nidFront) {
                        updateData.photos = [doc.nidFront];
                    }

                    // Use model name for Prisma update
                    const modelName = collection.charAt(0).toLowerCase() + collection.slice(1);
                    try {
                        await (prisma as any)[modelName].update({
                            where: { id }, 
                            data: updateData
                        });
                        console.log(`✅ Fixed & Restored ${collection} ID: ${id}`);
                    } catch (err) {
                        // console.error(`Failed to update ${id}:`, err);
                    }
                } else if (collection === 'Profile' && (!doc.photos || doc.photos.length === 0) && doc.nidFront) {
                    // Even if no cleanup needed, restore photo if missing
                    const id = typeof doc._id === 'object' && doc._id.$oid ? doc._id.$oid : doc._id;
                    await (prisma.profile as any).update({
                        where: { id },
                        data: { photos: [doc.nidFront] }
                    });
                    console.log(`✅ Restored photo from NID for Profile ID: ${id}`);
                }
            }
        }
        
        console.log('✅ Data cleanup completed!');
    } catch (error) {
        console.error('❌ Error during data cleanup:', error);
    }
};



