import { TLoginUser, TRegisterUser, TUpdateProfile } from './user.interface.js';
export declare const UserService: {
    loginUser: (payload: TLoginUser) => Promise<{
        accessToken: string;
        user: {
            id: any;
            memberId: any;
            email: any;
            fullName: any;
            role: any;
            profile: any;
        };
    }>;
    getMe: (id: string) => Promise<any>;
    registerUser: (payload: TRegisterUser) => Promise<{
        accessToken: string;
        user: any;
    }>;
    verifyEmail: (email: string, otp: string) => Promise<{
        accessToken: string;
        user: {
            id: any;
            memberId: any;
            email: any;
            fullName: any;
            role: any;
        };
    }>;
    resendOtp: (email: string) => Promise<{
        message: string;
    }>;
    updateProfile: (userId: string, payload: TUpdateProfile) => Promise<{
        id: string;
        userId: string;
        guardianName: string | null;
        guardianRelation: string | null;
        guardianMobile: string | null;
        guardianEmail: string | null;
        gender: string | null;
        religion: string | null;
        sect: string | null;
        motherTongue: string | null;
        dob: Date | null;
        age: number | null;
        maritalStatus: string | null;
        height: string | null;
        physicalStatus: string | null;
        country: string | null;
        division: string | null;
        district: string | null;
        subDistrict: string | null;
        state: string | null;
        citizenship: string | null;
        highestEducation: string | null;
        employedIn: string | null;
        occupation: string | null;
        annualIncome: string | null;
        bio: string | null;
        photos: string[];
        weight: string | null;
        bodyType: string | null;
        nativePlace: string | null;
        fatherOccupation: string | null;
        motherOccupation: string | null;
        brothers: string | null;
        brothersMarried: string | null;
        sisters: string | null;
        sistersMarried: string | null;
        familyBio: string | null;
        eatingHabits: string | null;
        drinkingHabits: string | null;
        smokingHabits: string | null;
        interests: string[];
        favMusic: string[];
        favSports: string[];
        favFood: string[];
        partnerAgeMin: number | null;
        partnerAgeMax: number | null;
        partnerHeightMin: string | null;
        partnerHeightMax: string | null;
        partnerMaritalStatus: string[];
        partnerReligions: string[];
        partnerEducation: string | null;
        partnerBio: string | null;
        nidFront: string | null;
        nidBack: string | null;
        isNidVerified: boolean;
    }>;
    getProfile: (requesterId: string | undefined, targetUserId: string) => Promise<any>;
    getAllUserProfiles: (query: Record<string, any>, requesterId?: string) => Promise<{
        meta: {
            page: number;
            limit: number;
            total: any;
        };
        data: any;
    }>;
    unlockContact: (requesterId: string, targetUserId: string) => Promise<{
        id: string;
        unlockedById: string;
        targetUserId: string;
        unlockedAt: Date;
    }>;
    buyConnections: (userId: string, amount: number) => Promise<any>;
    toggleShortlist: (userId: string, targetUserId: string) => Promise<{
        message: string;
        isShortlisted: boolean;
    }>;
    getShortlistedProfiles: (userId: string) => Promise<any>;
};
