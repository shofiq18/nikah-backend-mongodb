import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import config from "./config/index.js";
import globalErrorHandler from "./app/middlewares/globalErrorHandler.js";
import notFound from "./app/middlewares/notFound.js";
import { UserRoutes } from "./app/modules/user/user.route.js";
import { TransactionRoutes } from "./app/modules/transaction/transaction.route.js";
import { MessageRoutes } from "./app/modules/message/message.route.js";
import { PhotoRequestRoutes } from "./app/modules/photoRequest/photoRequest.route.js";
import { NotificationRoutes } from "./app/modules/notification/notification.route.js";
const app = express();
app.use(cors({
    origin: ["https://zawajbd.vercel.app", "http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.get("/", (req, res) => {
    res.send({
        message: "Server is running..",
        environment: config.node_env,
        uptime: process.uptime().toFixed(2) + " sec",
        timeStamp: new Date().toISOString(),
    });
});
app.use("/api/v1", UserRoutes);
app.use("/api/v1/notifications", NotificationRoutes);
app.use("/api/v1/transactions", TransactionRoutes);
app.use("/api/v1/messages", MessageRoutes);
app.use("/api/v1/photo-requests", PhotoRequestRoutes);
app.use(globalErrorHandler);
app.use(notFound);
export default app;
//# sourceMappingURL=app.js.map