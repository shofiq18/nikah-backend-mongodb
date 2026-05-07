import { PhotoRequestService } from './photoRequest.service.js';
import catchAsync from '../../utils/catchAsync.js';
import sendResponse from '../../utils/sendResponse.js';
const sendPhotoRequest = catchAsync(async (req, res) => {
    const requesterId = req.user.id;
    const { targetUserId } = req.body;
    const result = await PhotoRequestService.sendPhotoRequest(requesterId, targetUserId);
    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: 'Photo request sent successfully',
        data: result
    });
});
const handlePhotoRequest = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;
    const { status } = req.body;
    const result = await PhotoRequestService.handlePhotoRequest(userId, id, status);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: `Photo request ${status.toLowerCase()} successfully`,
        data: result
    });
});
const getReceivedPhotoRequests = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const result = await PhotoRequestService.getReceivedPhotoRequests(userId);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Received photo requests retrieved successfully',
        data: result
    });
});
const getSentPhotoRequests = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const result = await PhotoRequestService.getSentPhotoRequests(userId);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Sent photo requests retrieved successfully',
        data: result
    });
});
export const PhotoRequestController = {
    sendPhotoRequest,
    handlePhotoRequest,
    getReceivedPhotoRequests,
    getSentPhotoRequests
};
//# sourceMappingURL=photoRequest.controller.js.map