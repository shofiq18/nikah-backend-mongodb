import { NextFunction, Request, Response } from "express";
declare const notFound: (req: Request, res: Response, next: NextFunction) => void;
export default notFound;
