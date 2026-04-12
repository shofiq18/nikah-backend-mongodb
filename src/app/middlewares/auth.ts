import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import jwt, { JwtPayload } from 'jsonwebtoken';
import config from '../../config/index.js';
import catchAsync from '../utils/catchAsync.js';

const auth = (...roles: string[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    let token = req.headers.authorization;
    console.log('--- Auth Middleware ---');
    console.log('Header Token:', token);
    console.log('Cookies Token:', req.cookies?.token);

    // If token is not in header, check cookies
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
      console.log('Using token from cookies');
    }

    // if token includes "Bearer ", strip it
    if (token && token.startsWith('Bearer ')) {
      token = token.split(' ')[1];
      console.log('Extracted JWT from Bearer:', token);
    }

    // checking if the token is missing
    if (!token) {
        console.log('Auth Failed: No token found');
      throw new Error('You are not authorized');
    }

    // checking if the given token is valid
    let decoded;
    try {
      decoded = jwt.verify(
        token,
        config.jwt_secret as string,
      ) as JwtPayload;
      console.log('JWT Verified:', decoded);
    } catch (error: any) {
        console.log('Auth Failed: JWT verification error:', error.message);
      throw new Error('You are not authorized');
    }

    const { role } = decoded;

    // case-insensitive role check
    if (roles.length && !roles.some(r => r.toUpperCase() === role.toUpperCase())) {
        console.log('Auth Failed: Role mismatch. Required:', roles, 'Actual:', role);
      throw new Error('You are not authorized');
    }

    (req as any).user = decoded as JwtPayload;
    console.log('Auth Success');
    next();
  });
};

export default auth;
