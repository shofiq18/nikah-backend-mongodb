import express from 'express';
import { UserController } from './user.controller.js';
import { UserValidation } from './user.validation.js';
import validateRequest from '../../middlewares/validateRequest.js';
const router = express.Router();
router.post('/auth/register', validateRequest(UserValidation.registerValidationSchema), UserController.registerUser);
router.post('/auth/login', validateRequest(UserValidation.loginValidationSchema), UserController.loginUser);
router.post('/auth/verify-email', validateRequest(UserValidation.verifyEmailValidationSchema), UserController.verifyEmail);
router.post('/auth/resend-otp', UserController.resendOtp);
router.patch('/users/profile', validateRequest(UserValidation.updateProfileValidationSchema), UserController.updateProfile);
router.post('/connections/buy', validateRequest(UserValidation.buyConnectionsValidationSchema), UserController.buyConnections);
router.get('/users/profiles', UserController.getAllUserProfiles);
router.get('/users/:id/profile', UserController.getProfile);
router.post('/users/:id/unlock', UserController.unlockContact);
export const UserRoutes = router;
//# sourceMappingURL=user.route.js.map