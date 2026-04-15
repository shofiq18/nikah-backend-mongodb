import express from 'express';
import { UserController } from './user.controller.js';
import auth from '../../middlewares/auth.js';
import { UserValidation } from './user.validation.js';
import validateRequest from '../../middlewares/validateRequest.js';

const router = express.Router();

// Public routes
router.post(
  '/auth/register',
  validateRequest(UserValidation.registerValidationSchema),
  UserController.registerUser
);
router.post(
  '/auth/login',
  validateRequest(UserValidation.loginValidationSchema),
  UserController.loginUser
);
router.post(
  '/auth/logout',
  UserController.logout
);
router.post(
  '/auth/verify-email',
  validateRequest(UserValidation.verifyEmailValidationSchema),
  UserController.verifyEmail
);
router.post(
  '/auth/resend-otp',
  UserController.resendOtp
);

// Protected routes
router.get(
  '/auth/me',
  auth('USER', 'ADMIN'),
  UserController.getMe
);

router.patch(
  '/users/profile',
  auth('USER', 'ADMIN'),
  validateRequest(UserValidation.updateProfileValidationSchema),
  UserController.updateProfile
);

router.post(
  '/connections/buy',
  validateRequest(UserValidation.buyConnectionsValidationSchema),
  UserController.buyConnections
);

router.get('/users/profiles', auth('USER', 'ADMIN'), UserController.getAllUserProfiles);
router.get('/users/:id/profile', auth('USER', 'ADMIN'), UserController.getProfile);
router.post('/users/:id/unlock', auth('USER', 'ADMIN'), UserController.unlockContact);

// Shortlist Routes
router.post('/users/:id/shortlist', auth('USER', 'ADMIN'), UserController.toggleShortlist);
router.get('/users/shortlisted', auth('USER', 'ADMIN'), UserController.getShortlistedProfiles);

// Interest Routes
router.post('/users/:id/interest', auth('USER', 'ADMIN'), UserController.sendInterest);
router.patch('/users/interests/:interestId', auth('USER', 'ADMIN'), UserController.handleInterestResponse);
router.get('/users/interests/received', auth('USER', 'ADMIN'), UserController.getReceivedInterests);
router.get('/users/interests/sent', auth('USER', 'ADMIN'), UserController.getSentInterests);

// Also exporting under /api/ structure if mounted like this
export const UserRoutes = router;
