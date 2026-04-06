import httpStatus from "http-status";
const globalErrorHandler = (err, req, res, next) => {
    let statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    let success = false;
    let message = err.message || "Something went wrong!";
    let error = err;
    res.status(statusCode).json({
        success,
        message,
        error
    });
};
export default globalErrorHandler;
//# sourceMappingURL=globalErrorHandler.js.map