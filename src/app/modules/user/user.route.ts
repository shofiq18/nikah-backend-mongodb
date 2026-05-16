import express from 'express';
import { UserController } from './user.controller.js';
import auth from '../../middlewares/auth.js';

const router = express.Router();

// Auth routes (Mounted at /api/v1/auth)
router.post('/register', UserController.registerUser);
router.post('/login', UserController.loginUser);
router.post('/verify-email', UserController.verifyEmail);
router.post('/resend-otp', UserController.resendOtp);
router.get('/me', auth('USER', 'ADMIN', 'MODERATOR'), UserController.getMe);
router.post('/logout', UserController.logout);

// User Profile routes (Mounted at /api/v1/users)
router.patch('/profile', auth('USER'), UserController.updateProfile);
router.get('/:id/profile', auth('USER', 'ADMIN'), UserController.getProfile);
router.get('/profiles', auth('USER', 'ADMIN'), UserController.getAllUserProfiles);

// Admin routes
router.get('/all-users', auth('ADMIN'), UserController.getAllUsers);
router.patch('/:id/nid-status', auth('ADMIN'), UserController.updateNidStatus);
router.patch('/:id/block', auth('ADMIN'), UserController.blockUser);
router.delete('/:id', auth('ADMIN'), UserController.deleteUser);

// Interactions
router.post('/:id/unlock', auth('USER'), UserController.unlockContact);
router.post('/:id/shortlist', auth('USER'), UserController.toggleShortlist);
router.get('/shortlisted', auth('USER'), UserController.getShortlistedProfiles);

// Interests
router.post('/:id/interest', auth('USER'), UserController.sendInterest);
router.patch('/interests/:interestId', auth('USER'), UserController.handleInterestResponse);
router.get('/interests/received', auth('USER'), UserController.getReceivedInterests);
router.get('/interests/sent', auth('USER'), UserController.getSentInterests);

// Matches & Premium
router.get('/matches', auth('USER'), UserController.getMatches);
router.get('/get-premium', auth('USER', 'ADMIN'), UserController.getPremiumMembers);

export const UserRoutes = router;
