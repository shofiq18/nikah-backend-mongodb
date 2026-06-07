import httpStatus from "http-status";
const globalErrorHandler = (err, req, res, next) => {
    let statusCode = (err.status || err.statusCode || httpStatus.INTERNAL_SERVER_ERROR);
    let success = false;
    let message = err.message || "Something went wrong!";
    if (err.message === 'You are not authorized' || err.status === 401) {
        statusCode = httpStatus.UNAUTHORIZED;
    }
    if (err.code === 'P2002') {
        statusCode = httpStatus.BAD_REQUEST;
        const target = err.meta?.target;
        if (typeof target === 'string' && target.includes('email')) {
            message = "An account with this email already exists.";
        }
        else if (Array.isArray(target) && target.includes('email')) {
            message = "An account with this email already exists.";
        }
        else {
            message = "A record with this value already exists.";
        }
    }
    if (err.name === 'ZodError' || err.issues) {
        statusCode = httpStatus.BAD_REQUEST;
        message = "Validation Error";
        const errors = err.issues?.map((issue) => ({
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
    });
};
export default globalErrorHandler;
//# sourceMappingURL=globalErrorHandler.js.map