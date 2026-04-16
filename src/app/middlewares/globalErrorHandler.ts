import { NextFunction, Request, Response } from "express"
import httpStatus from "http-status"

const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    let statusCode = (err.status || err.statusCode || httpStatus.INTERNAL_SERVER_ERROR);
    let success = false;
    let message = err.message || "Something went wrong!";

    // Handle authentication error specifically
    if (err.message === 'You are not authorized' || err.status === 401) {
        statusCode = httpStatus.UNAUTHORIZED;
    }

    // Handle Zod validation error specifically
    if (err.name === 'ZodError' || err.issues) {
        statusCode = httpStatus.BAD_REQUEST;
        message = "Validation Error";
        const errors = err.issues?.map((issue: any) => ({
            path: issue.path[issue.path.length - 1],
            message: issue.message
        }));
        return res.status(statusCode).json({
            success,
            message,
            errors,
            error: process.env.NODE_ENV === 'development' ? err : undefined
        });
    }

    res.status(statusCode).json({
        success,
        message,
        error: process.env.NODE_ENV === 'development' ? err : undefined
    })
};

export default globalErrorHandler;