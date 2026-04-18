import express from 'express';
import { MessageController } from './message.controller.js';
import auth from '../../middlewares/auth.js';

const router = express.Router();

router.post(
  '/',
  auth('USER', 'ADMIN'),
  MessageController.sendMessage
);

router.get(
  '/inbox',
  auth('USER', 'ADMIN'),
  MessageController.getMyInbox
);

router.get(
  '/sent',
  auth('USER', 'ADMIN'),
  MessageController.getSentMessages
);

router.get(
  '/conversation/:otherUserId',
  auth('USER', 'ADMIN'),
  MessageController.getConversation
);

export const MessageRoutes = router;
