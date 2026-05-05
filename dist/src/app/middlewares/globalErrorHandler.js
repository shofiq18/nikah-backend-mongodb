import httpStatus from "http-status";
const globalErrorHandler = (err, req, res, next) => {
    let statusCode = (err.status || err.statusCode || httpStatus.INTERNAL_SERVER_ERROR);
    let success = false;
    let message = err.message || "Something went wrong!";
    if (err.message === 'You are not authorized' || err.status === 401) {
        statusCode = httpStatus.UNAUTHORIZED;
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