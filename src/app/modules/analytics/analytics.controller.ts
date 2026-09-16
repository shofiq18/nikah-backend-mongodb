import { Request, Response } from "express";
import { AnalyticsService } from "./analytics.service.js";

const recordVisit = async (req: Request, res: Response) => {
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
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || "Failed to record visit",
        });
    }
};

const getTrafficStats = async (req: Request, res: Response) => {
    try {
        const period = (req.query.period as string) || "1M";
        const result = await AnalyticsService.getTrafficStats(period);

        res.status(200).json({
            success: true,
            statusCode: 200,
            message: "Traffic stats fetched successfully",
            data: result,
        });
    } catch (error: any) {
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
