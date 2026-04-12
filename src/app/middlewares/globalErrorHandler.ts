import { NextFunction, Request, Response } from "express"
import httpStatus from "http-status"

const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    let statusCode = (err.message === 'You are not authorized' || err.status === 401) ? httpStatus.UNAUTHORIZED : (err.statusCode || httpStatus.INTERNAL_SERVER_ERROR);
    let success = false;
    let message = err.message || "Something went wrong!";

    res.status(statusCode).json({
        success,
        message,
        error: process.env.NODE_ENV === 'development' ? err : undefined
    })
};

export default globalErrorHandler;