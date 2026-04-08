# NikahBD API Onboarding Flow Documentation

This document explains the 8-step onboarding flow for the NikahBD platform, designed for frontend integration.

**Base URL:** `http://localhost:<PORT>/api/v1`

---

## ⚡ Step-by-Step Flow

### 1. Account Creation (Landing Page + Step 1)
**Endpoint:** `POST /auth/register`
**Payload:**
```json
{
  "profileFor": "Myself",
  "fullName": "Abdullah Rahman",
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

### 2. Email Verification
**Endpoint:** `POST /auth/verify-email`
**Payload:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

### 2a. Resend OTP
**Endpoint:** `POST /auth/resend-otp`
**Payload:**
```json
{
  "email": "user@example.com"
}
```

### 3. Guardian Information (Phase 1)
**Endpoint:** `PATCH /users/profile`
**Headers:** `Authorization: Bearer <token>`
**Payload:**
```json
{
  "guardianName": "Mohammad Karim",
  "guardianRelation": "Father", 
  "guardianMobile": "017XXXXXXXX",
  "guardianEmail": "guardian@example.com"
}
```

### 4. Basic Profile (Phases 2 & 3)
**Endpoint:** `PATCH /users/profile`
**Payload:**
```json
{
  "religion": "Islam",
  "sect": "Sunni",
  "motherTongue": "Bengali",
  "dob": "1995-10-25T00:00:00.000Z",
  "maritalStatus": "Never Married",
  "height": "5 ft 8 in",
  "physicalStatus": "Normal",
  "country": "Bangladesh",
  "state": "Dhaka",
  "citizenship": "Bangladeshi",
  "highestEducation": "Bachelors",
  "employedIn": "Private Sector",
  "occupation": "Software Engineer",
  "annualIncome": "500,000 - 1,000,000 BDT",
  "bio": "I am a simple..."
}
```

### 5. Portraits (Phase 4)
**Endpoint:** `PATCH /users/profile`
**Payload:**
```json
{
  "photos": ["https://url-to-img.jpg"]
}
```

### 6. Lifestyle & Family (Phase 5)
**Endpoint:** `PATCH /users/profile`
**Payload:**
```json
{
  "weight": "70 kg",
  "bodyType": "Athletic",
  "nativePlace": "Comilla",
  "fatherOccupation": "Retired",
  "motherOccupation": "Homemaker",
  "brothers": "2",
  "familyBio": "Values...",
  "eatingHabits": "Halal Only",
  "drinkingHabits": "No",
  "smokingHabits": "No"
}
```

### 7. Partner Preferences (Phase 6)
**Endpoint:** `PATCH /users/profile`
**Payload:**
```json
{
  "partnerAgeMin": 20,
  "partnerAgeMax": 26,
  "partnerHeightMin": "5 ft 0 in",
  "partnerHeightMax": "5 ft 6 in",
  "partnerMaritalStatus": ["Never Married"],
  "partnerReligions": ["Islam"],
  "partnerEducation": "Bachelors",
  "partnerBio": "Looking for..."
}
```

### 8. Security (NID) (Phase 7)
**Endpoint:** `PATCH /users/profile`
**Payload:**
```json
{
  "nidFront": "url_nid_front.jpg",
  "nidBack": "url_nid_back.jpg"
}
```

---

## 🔒 Business Logic Highlights

1.  **Authorization**: All `PATCH` and `GET` (private) requests require a valid JWT in the cookies or as a Bearer token.
2.  **Connections**:
    *   `POST /connections/buy`: Increment wallet balance.
    *   `POST /users/:id/unlock`: Deduct 1 connection to view the target user's guardian contact info.
3.  **Privacy**: `GET /users/:id/profile` automatically strips `guardianMobile` and `guardianEmail` if the profile has not been unlocked by the requester.
