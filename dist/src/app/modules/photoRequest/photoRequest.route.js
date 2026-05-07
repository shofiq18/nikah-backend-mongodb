import express from 'express';
import { PhotoRequestController } from './photoRequest.controller.js';
import auth from '../../middlewares/auth.js';
const router = express.Router();
router.post('/send', auth('USER', 'ADMIN'), PhotoRequestController.sendPhotoRequest);
router.patch('/:id', auth('USER', 'ADMIN'), PhotoRequestController.handlePhotoRequest);
router.get('/received', auth('USER', 'ADMIN'), PhotoRequestController.getReceivedPhotoRequests);
router.get('/sent', auth('USER', 'ADMIN'), PhotoRequestController.getSentPhotoRequests);
export const PhotoRequestRoutes = router;
//# sourceMappingURL=photoRequest.route.js.map