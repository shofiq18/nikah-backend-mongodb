import express, { Application, NextFunction, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import config from './config/index.js';
import { uptime } from 'process';
import { timeStamp } from 'console';
import globalErrorHandler from './app/middlewares/globalErrorHandler.js';
import notFound from './app/middlewares/notFound.js';
import { UserRoutes } from './app/modules/user/user.route.js';
const app: Application = express();
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

//parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


app.get('/', (req: Request, res: Response) => {
    res.send({
        message: "Server is running..",
        environment: config.node_env,
        uptime: process.uptime().toFixed(2) + " sec",
        timeStamp: new Date().toISOString()
    })
});

// ─── API ROUTES ──────────────────────────────────────────────────────
app.use('/api/v1', UserRoutes);



app.use(globalErrorHandler);

app.use(notFound);

export default app;