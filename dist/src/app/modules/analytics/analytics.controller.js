import { AnalyticsService } from "./analytics.service.js";
const recordVisit = async (req, res) => {
    try {
        const { referrer, path, deviceType } = req.body;
        const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
        const result = await AnalyticsService.recordVisit({
            referrer,
            path,
            deviceType,
            ip: typeof ip === "string" ? ip : Array.isArray(ip) ? ip[0] : undefined,
        });
        res.status(201).json({
            success: true,
            statusCode: 201,
            message: "Visit recorded successfully",
            data: result,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Failed to record visit",
        });
    }
};
const getTrafficStats = async (req, res) => {
    try {
        const period = req.query.period || "1M";
        const result = await AnalyticsService.getTrafficStats(period);
        res.status(200).json({
            success: true,
            statusCode: 200,
            message: "Traffic stats fetched successfully",
            data: result,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch traffic stats",
        });
    }
};
export const AnalyticsController = {
    recordVisit,
    getTrafficStats,
};
//# sourceMappingURL=analytics.controller.js.map