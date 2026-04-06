import { NextFunction, Request, RequestHandler, Response } from 'express';
declare const catchAsync: (fn: RequestHandler) => (req: Request, res: Response, next: NextFunction) => void;
export default catchAsync;
