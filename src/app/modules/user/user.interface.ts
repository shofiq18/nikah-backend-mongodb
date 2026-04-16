

export type TLoginUser = {
  email: string;
  password?: string;
};

export type TRegisterUser = {
  email: string;
  password?: string;
  profileFor: string;
  fullName: string;
  gender: string; // Sex
};

export type TUpdateProfile = {
  gender?: string;
  division?: string;
  district?: string;
  subDistrict?: string;
  guardianName?: string;
  guardianRelation?: string;
  guardianMobile?: string;
  guardianEmail?: string;
  religion?: string;
  sect?: string;
  motherTongue?: string;
  dob?: string | Date;
  age?: number;
  maritalStatus?: string;
  height?: string;
  physicalStatus?: string;
  country?: string;
  state?: string;
  citizenship?: string;
  highestEducation?: string;
  employedIn?: string;
  occupation?: string;
  annualIncome?: string;
  bio?: string;
  photos?: string[];
  weight?: string;
  bodyType?: string;
  nativePlace?: string;
  fatherOccupation?: string;
  motherOccupation?: string;
  brothers?: string;
  familyBio?: string;
  eatingHabits?: string;
  drinkingHabits?: string;
  smokingHabits?: string;
  partnerAgeMin?: number;
  partnerAgeMax?: number;
  partnerHeightMin?: string;
  partnerHeightMax?: string;
  partnerMaritalStatus?: string;
  partnerReligions?: string;
  partnerEducation?: string;
  partnerBio?: string;
  nidFront?: string;
  nidBack?: string;
};
