import { Response } from 'express';
type TResponse<T> = {
    statusCode: number;
    success: boolean;
    message?: string;
    meta?: {
        page: number;
        limit: number;
        total: number;
        totalPage: number;
    };
    data: T;
};
declare const sendResponse: <T>(res: Response, data: TResponse<T>) => void;
export default sendResponse;
