import express from "express";
import { AnalyticsController } from "./analytics.controller.js";
const router = express.Router();
router.post("/track", AnalyticsController.recordVisit);
router.get("/traffic", AnalyticsController.getTrafficStats);
export const AnalyticsRoutes = router;
//# sourceMappingURL=analytics.route.js.map