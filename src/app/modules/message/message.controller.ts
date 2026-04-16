import { Request, Response } from 'express';
import { MessageService } from './message.service.js';

const sendMessage = async (req: Request, res: Response) => {
  try {
    const senderId = (req as any).user.id;
    const result = await MessageService.sendMessage({
      ...req.body,
      senderId,
    });
    res.status(200).json({
      success: true,
      message: 'Message sent successfully',
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getMyInbox = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const result = await MessageService.getMyInbox(userId);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getConversation = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const result = await MessageService.getConversation(userId, req.params.otherUserId as string);
        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const MessageController = {
  sendMessage,
  getMyInbox,
  getConversation
};
