import { NextFunction, Request, Response } from 'express';
import { ZodObject } from 'zod';
declare const validateRequest: (schema: ZodObject<any, any>) => (req: Request, res: Response, next: NextFunction) => void;
export default validateRequest;
