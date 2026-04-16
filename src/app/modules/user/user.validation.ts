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
    email: z.string().email(), // Added email to match user request
    otp: z.string().length(6, "OTP must be 6 characters"),
  })
});

// Step 3: Guardian Information
const step3GuardianSchema = z.object({
  body: z.object({
    guardianName: z.string().min(1, "Guardian Name is required"),
    guardianRelation: z.string().min(1, "Guardian Relation is required"),
    guardianMobile: z.string().min(1, "Guardian Mobile is required"),
    guardianEmail: z.string().email().optional(),
  })
});

// Step 4: Basic Profile (Combined Identity, Location & Profession)
const step4BasicProfileSchema = z.object({
  body: z.object({
    religion: z.string().min(1, "Religion is required"),
    sect: z.string().optional(),
    motherTongue: z.string().min(1, "Mother Tongue is required"),
    dob: z.string().min(1, "Date of Birth is required"), 
    age: z.number().int().positive().optional(),
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

// Step 5: Portraits
const step5PortraitsSchema = z.object({
  body: z.object({
    photos: z.array(z.string()).min(1, "At least one photo is required"),
  })
});

// Step 6: Lifestyle & Family
const step6LifestyleFamilySchema = z.object({
  body: z.object({
    weight: z.string().nullable().optional(),
    bodyType: z.string().nullable().optional(),
    nativePlace: z.string().nullable().optional(),
    fatherOccupation: z.string().nullable().optional(),
    motherOccupation: z.string().nullable().optional(),
    brothers: z.string().nullable().optional(),
    brothersMarried: z.string().nullable().optional(),
    sisters: z.string().nullable().optional(),
    sistersMarried: z.string().nullable().optional(),
    familyBio: z.string().nullable().optional(),
    eatingHabits: z.string().nullable().optional(),
    drinkingHabits: z.string().nullable().optional(),
    smokingHabits: z.string().nullable().optional(),
    interests: z.array(z.string()).nullable().optional(),
    favMusic: z.array(z.string()).nullable().optional(),
    favSports: z.array(z.string()).nullable().optional(),
    favFood: z.array(z.string()).nullable().optional(),
  })
});

// Step 7: Partner Preferences
const step7PartnerPreferencesSchema = z.object({
  body: z.object({
    partnerAgeMin: z.number().nullable().optional(),
    partnerAgeMax: z.number().nullable().optional(),
    partnerHeightMin: z.string().nullable().optional(),
    partnerHeightMax: z.string().nullable().optional(),
    partnerMaritalStatus: z.string().nullable().optional(),
    partnerReligions: z.string().nullable().optional(),
    partnerEducation: z.string().nullable().optional(),
    partnerBio: z.string().nullable().optional(),
  })
});

// Step 8: Security (NID)
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
    gender: z.string().nullable().optional(),
    division: z.string().nullable().optional(),
    district: z.string().nullable().optional(),
    subDistrict: z.string().nullable().optional(),
    guardianName: z.string().nullable().optional(),
    guardianRelation: z.string().nullable().optional(),
    guardianMobile: z.string().nullable().optional(),
    guardianEmail: z.string().nullable().optional(),
    religion: z.string().nullable().optional(),
    sect: z.string().nullable().optional(),
    motherTongue: z.string().nullable().optional(),
    dob: z.union([z.string(), z.date(), z.null()]).optional(),
    age: z.number().int().positive().nullable().optional(),
    maritalStatus: z.string().nullable().optional(),
    height: z.string().nullable().optional(),
    physicalStatus: z.string().nullable().optional(),
    country: z.string().nullable().optional(),
    state: z.string().nullable().optional(),
    citizenship: z.string().nullable().optional(),
    highestEducation: z.string().nullable().optional(),
    employedIn: z.string().nullable().optional(),
    occupation: z.string().nullable().optional(),
    annualIncome: z.string().nullable().optional(),
    bio: z.string().nullable().optional(),
    photos: z.array(z.string()).nullable().optional(),
    weight: z.string().nullable().optional(),
    bodyType: z.string().nullable().optional(),
    nativePlace: z.string().nullable().optional(),
    fatherOccupation: z.string().nullable().optional(),
    motherOccupation: z.string().nullable().optional(),
    brothers: z.string().nullable().optional(),
    brothersMarried: z.string().nullable().optional(),
    sisters: z.string().nullable().optional(),
    sistersMarried: z.string().nullable().optional(),
    familyBio: z.string().nullable().optional(),
    eatingHabits: z.string().nullable().optional(),
    drinkingHabits: z.string().nullable().optional(),
    smokingHabits: z.string().nullable().optional(),
    interests: z.array(z.string()).nullable().optional(),
    favMusic: z.array(z.string()).nullable().optional(),
    favSports: z.array(z.string()).nullable().optional(),
    favFood: z.array(z.string()).nullable().optional(),
    partnerAgeMin: z.number().nullable().optional(),
    partnerAgeMax: z.number().nullable().optional(),
    partnerHeightMin: z.string().nullable().optional(),
    partnerHeightMax: z.string().nullable().optional(),
    partnerMaritalStatus: z.string().nullable().optional(),
    partnerReligions: z.string().nullable().optional(),
    partnerEducation: z.string().nullable().optional(),
    partnerBio: z.string().nullable().optional(),
    nidFront: z.string().nullable().optional(),
    nidBack: z.string().nullable().optional(),
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
