import { NextFunction, Request, Response } from "express";
declare const globalErrorHandler: (err: any, req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export default globalErrorHandler;
