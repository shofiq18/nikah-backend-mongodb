import express from 'express';
import { NotificationController } from './notification.controller.js';
import auth from '../../middlewares/auth.js';

const router = express.Router();

router.get('/my-notifications', auth('USER', 'ADMIN'), NotificationController.getMyNotifications);
router.patch('/:id/read', auth('USER', 'ADMIN'), NotificationController.markAsRead);
router.patch('/read-all', auth('USER', 'ADMIN'), NotificationController.markAllAsRead);

export const NotificationRoutes = router;
