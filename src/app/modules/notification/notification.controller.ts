import { Request, Response } from 'express';
import { NotificationService } from './notification.service.js';
import catchAsync from '../../utils/catchAsync.js';

const getMyNotifications = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  let realNotifications = [];

  let errorMsg = '';
  try {
    realNotifications = await NotificationService.getMyNotifications(userId);
  } catch (error: any) {
    console.error("Notification Service Error:", error);
    errorMsg = error.message;
  }

  let result = [...realNotifications];

  if (result.length === 0) {
    result = [{
      id: 'system-online-v4',
      type: 'ACCOUNT_ALERT',
      title: 'Signal Matrix',
      message: errorMsg ? `Error: ${errorMsg}` : `System Online for User: ${userId}. Send a NEW interest to test.`,
      isRead: false,
      createdAt: new Date().toISOString()
    }];
  }


  res.status(200).json({
    success: true,
    message: 'Notifications retrieved successfully',
    data: result,
  });
});

const markAsRead = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await NotificationService.markAsRead(id as string);
  res.status(200).json({
    success: true,
    message: 'Notification marked as read',
    data: result,
  });
});

const markAllAsRead = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const result = await NotificationService.markAllAsRead(userId);
  res.status(200).json({
    success: true,
    message: 'All notifications marked as read',
    data: result,
  });
});

export const NotificationController = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
};
