import { NotificationService } from './notification.service.js';
import catchAsync from '../../utils/catchAsync.js';
const getMyNotifications = catchAsync(async (req, res) => {
    const userId = req.user.id;
    let realNotifications = [];
    let errorMsg = '';
    try {
        realNotifications = await NotificationService.getMyNotifications(userId);
    }
    catch (error) {
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
const markAsRead = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await NotificationService.markAsRead(id);
    res.status(200).json({
        success: true,
        message: 'Notification marked as read',
        data: result,
    });
});
const markAllAsRead = catchAsync(async (req, res) => {
    const userId = req.user.id;
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
//# sourceMappingURL=notification.controller.js.map