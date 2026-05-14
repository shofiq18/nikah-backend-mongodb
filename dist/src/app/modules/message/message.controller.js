import { MessageService } from './message.service.js';
const sendMessage = async (req, res) => {
    try {
        const senderId = req.user.id;
        const result = await MessageService.sendMessage({
            ...req.body,
            senderId,
        });
        res.status(200).json({
            success: true,
            message: 'Message sent successfully',
            data: result,
        });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
const getMyInbox = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await MessageService.getMyInbox(userId);
        res.status(200).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
const getSentMessages = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await MessageService.getSentMessages(userId);
        res.status(200).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
const getConversation = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await MessageService.getConversation(userId, req.params.otherUserId);
        res.status(200).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
const deleteConversation = async (req, res) => {
    try {
        const userId = req.user.id;
        const otherUserId = req.params.otherUserId;
        await MessageService.deleteConversation(userId, otherUserId);
        res.status(200).json({
            success: true,
            message: 'Conversation deleted successfully'
        });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
export const MessageController = {
    sendMessage,
    getMyInbox,
    getSentMessages,
    getConversation,
    deleteConversation
};
//# sourceMappingURL=message.controller.js.map