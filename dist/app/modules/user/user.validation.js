import { z } from 'zod';
const loginValidationSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string(),
    })
});
const registerValidationSchema = z.object({
    body: z.object({
        profileFor: z.string().min(1, "Profile For is required"),
        fullName: z.string().min(1, "Full Name is required"),
        email: z.string().email(),
        password: z.string().min(6, "Password must be at least 6 characters"),
        gender: z.string().min(1, "Gender is required"),
    })
});
const verifyEmailValidationSchema = z.object({
    body: z.object({
        email: z.string().email(),
        otp: z.string().length(6, "OTP must be 6 characters"),
    })
});
const step3GuardianSchema = z.object({
    body: z.object({
        guardianName: z.string().min(1, "Guardian Name is required"),
        guardianRelation: z.string().min(1, "Guardian Relation is required"),
        guardianMobile: z.string().min(1, "Guardian Mobile is required"),
        guardianEmail: z.string().email().optional(),
    })
});
const step4BasicProfileSchema = z.object({
    body: z.object({
        religion: z.string().min(1, "Religion is required"),
        sect: z.string().optional(),
        motherTongue: z.string().min(1, "Mother Tongue is required"),
        dob: z.string().min(1, "Date of Birth is required"),
        maritalStatus: z.string().min(1, "Marital Status is required"),
        height: z.string().min(1, "Height is required"),
        physicalStatus: z.string().optional(),
        country: z.string().min(1, "Country is required"),
        division: z.string().optional(),
        district: z.string().optional(),
        subDistrict: z.string().optional(),
        state: z.string().min(1, "State is required"),
        citizenship: z.string().optional(),
        highestEducation: z.string().min(1, "Highest Education is required"),
        employedIn: z.string().optional(),
        occupation: z.string().optional(),
        annualIncome: z.string().optional(),
        bio: z.string().optional(),
    })
});
const step5PortraitsSchema = z.object({
    body: z.object({
        photos: z.array(z.string()).min(1, "At least one photo is required"),
    })
});
const step6LifestyleFamilySchema = z.object({
    body: z.object({
        weight: z.string().optional(),
        bodyType: z.string().optional(),
        nativePlace: z.string().optional(),
        fatherOccupation: z.string().optional(),
        motherOccupation: z.string().optional(),
        brothers: z.string().optional(),
        brothersMarried: z.string().optional(),
        sisters: z.string().optional(),
        sistersMarried: z.string().optional(),
        familyBio: z.string().optional(),
        eatingHabits: z.string().optional(),
        drinkingHabits: z.string().optional(),
        smokingHabits: z.string().optional(),
        interests: z.array(z.string()).optional(),
        favMusic: z.array(z.string()).optional(),
        favSports: z.array(z.string()).optional(),
        favFood: z.array(z.string()).optional(),
    })
});
const step7PartnerPreferencesSchema = z.object({
    body: z.object({
        partnerAgeMin: z.number().optional(),
        partnerAgeMax: z.number().optional(),
        partnerHeightMin: z.string().optional(),
        partnerHeightMax: z.string().optional(),
        partnerMaritalStatus: z.array(z.string()).optional(),
        partnerReligions: z.array(z.string()).optional(),
        partnerEducation: z.string().optional(),
        partnerBio: z.string().optional(),
    })
});
const step8SecurityNidSchema = z.object({
    body: z.object({
        nidFront: z.string().min(1, "NID Front is required"),
        nidBack: z.string().min(1, "NID Back is required"),
    })
});
const buyConnectionsValidationSchema = z.object({
    body: z.object({
        amount: z.number().positive("Amount must be a positive number"),
    })
});
const updateProfileValidationSchema = z.object({
    body: z.object({
        gender: z.string().optional(),
        division: z.string().optional(),
        district: z.string().optional(),
        subDistrict: z.string().optional(),
        guardianName: z.string().optional(),
        guardianRelation: z.string().optional(),
        guardianMobile: z.string().optional(),
        guardianEmail: z.string().optional(),
        religion: z.string().optional(),
        sect: z.string().optional(),
        motherTongue: z.string().optional(),
        dob: z.union([z.string(), z.date()]).optional(),
        maritalStatus: z.string().optional(),
        height: z.string().optional(),
        physicalStatus: z.string().optional(),
        country: z.string().optional(),
        state: z.string().optional(),
        citizenship: z.string().optional(),
        highestEducation: z.string().optional(),
        employedIn: z.string().optional(),
        occupation: z.string().optional(),
        annualIncome: z.string().optional(),
        bio: z.string().optional(),
        photos: z.array(z.string()).optional(),
        weight: z.string().optional(),
        bodyType: z.string().optional(),
        nativePlace: z.string().optional(),
        fatherOccupation: z.string().optional(),
        motherOccupation: z.string().optional(),
        brothers: z.string().optional(),
        brothersMarried: z.string().optional(),
        sisters: z.string().optional(),
        sistersMarried: z.string().optional(),
        familyBio: z.string().optional(),
        eatingHabits: z.string().optional(),
        drinkingHabits: z.string().optional(),
        smokingHabits: z.string().optional(),
        interests: z.array(z.string()).optional(),
        favMusic: z.array(z.string()).optional(),
        favSports: z.array(z.string()).optional(),
        favFood: z.array(z.string()).optional(),
        partnerAgeMin: z.number().optional(),
        partnerAgeMax: z.number().optional(),
        partnerHeightMin: z.string().optional(),
        partnerHeightMax: z.string().optional(),
        partnerMaritalStatus: z.array(z.string()).optional(),
        partnerReligions: z.array(z.string()).optional(),
        partnerEducation: z.string().optional(),
        partnerBio: z.string().optional(),
        nidFront: z.string().optional(),
        nidBack: z.string().optional(),
    })
});
export const UserValidation = {
    loginValidationSchema,
    registerValidationSchema,
    verifyEmailValidationSchema,
    step3GuardianSchema,
    step4BasicProfileSchema,
    step5PortraitsSchema,
    step6LifestyleFamilySchema,
    step7PartnerPreferencesSchema,
    step8SecurityNidSchema,
    buyConnectionsValidationSchema,
    updateProfileValidationSchema
};
//# sourceMappingURL=user.validation.js.map