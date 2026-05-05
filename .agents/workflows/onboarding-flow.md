---
description: How to execute and test the zawajbd account onboarding flow
---

# zawajbd Onboarding Flow Workflow

Follow these steps to successfully onboard a user and verify the progressive completion of their profile.

### Step 1: User Registration
**Endpoint:** `POST /api/v1/auth/register`
**Action:** Send a request with `profileFor`, `fullName`, `email`, and `password`.
// turbo
1. Register a new user and capture the `accessToken`.

### Step 2: Email Verification
**Endpoint:** `POST /api/v1/auth/verify-email`
**Action:** Send a request with `email` and `otp` (default: `123456`).
// turbo
2. Verify the email using the captured email and default OTP.

### Step 3: Guardian Contact Information
**Endpoint:** `PATCH /api/v1/users/profile`
**Header:** `Authorization: Bearer <token>`
**Action:** Send guardian details.
// turbo
3. Update guardian info.

### Step 4: Basic Profile Completion
**Endpoint:** `PATCH /api/v1/users/profile`
**Header:** `Authorization: Bearer <token>`
**Action:** Send religion, sect, motherTongue, dob, maritalStatus, height, country, etc.
// turbo
4. Update basic profile.

### Step 5: Upload Photos
**Endpoint:** `PATCH /api/v1/users/profile`
**Action:** Send an array of `photos` URLs.
// turbo
5. Update photos.

### Step 6-8: Complete Lifestyle, Partner Preferences, and NID
**Endpoint:** `PATCH /api/v1/users/profile`
**Action:** Send final onboarding data.
// turbo
6. Finalize onboarding details.

### Step 9: Verify Onboarding Status
// turbo
7. Fetch the profile using `GET /api/v1/users/:id/profile` to ensure `onboardingStep` has advanced.
