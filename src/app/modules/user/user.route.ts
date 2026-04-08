import express from 'express';
import { UserController } from './user.controller.js';
// import auth from '../../middlewares/auth.js';
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
  '/auth/verify-email',
  validateRequest(UserValidation.verifyEmailValidationSchema),
  UserController.verifyEmail
);
router.post(
  '/auth/resend-otp',
  UserController.resendOtp
);

// Protected routes (Assume auth middleware is added like auth('USER', 'ADMIN'))
router.patch(
  '/users/profile',
  validateRequest(UserValidation.updateProfileValidationSchema),
  UserController.updateProfile
);

router.post(
  '/connections/buy',
  validateRequest(UserValidation.buyConnectionsValidationSchema),
  UserController.buyConnections
);

router.get('/users/:id/profile', UserController.getProfile);
router.post('/users/:id/unlock', UserController.unlockContact);

// Also exporting under /api/ structure if mounted like this
export const UserRoutes = router;
