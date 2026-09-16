import express from "express";
import { AnalyticsController } from "./analytics.controller.js";

const router = express.Router();

router.post("/track", AnalyticsController.recordVisit);
router.get("/traffic", AnalyticsController.getTrafficStats);

export const AnalyticsRoutes: express.Router = router;
