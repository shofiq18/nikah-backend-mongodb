import { NextFunction, Request, Response } from 'express';
import { ZodObject } from 'zod';
import catchAsync from '../utils/catchAsync.js';

const validateRequest = (schema: ZodObject<any, any>) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    await schema.parseAsync({
      body: req.body,
      cookies: req.cookies,
    });
    next();
  });
};

export default validateRequest;
