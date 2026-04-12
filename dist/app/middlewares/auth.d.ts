import { NextFunction, Request, Response } from 'express';
declare const auth: (...roles: string[]) => (req: Request, res: Response, next: NextFunction) => void;
export default auth;
