import jwt from 'jsonwebtoken';
import config from '../../config/index.js';
import catchAsync from '../utils/catchAsync.js';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const auth = (...roles) => {
    return catchAsync(async (req, res, next) => {
        let token = req.headers.authorization;
        console.log('--- Auth Middleware ---');
        console.log('Header Token:', token);
        console.log('Cookies Token:', req.cookies?.token);
        if (!token && req.cookies && req.cookies.token) {
            token = req.cookies.token;
            console.log('Using token from cookies');
        }
        if (token && token.startsWith('Bearer ')) {
            token = token.split(' ')[1];
            console.log('Extracted JWT from Bearer:', token);
        }
        if (!token) {
            console.log('Auth Failed: No token found');
            throw new Error('You are not authorized');
        }
        let decoded;
        try {
            decoded = jwt.verify(token, config.jwt_secret);
            console.log('JWT Verified:', decoded);
        }
        catch (error) {
            console.log('Auth Failed: JWT verification error:', error.message);
            throw new Error('You are not authorized');
        }
        const { id, role } = decoded;
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
            console.log('Auth Failed: User with this ID no longer exists');
            throw new Error('You are not authorized');
        }
        if (roles.length && !roles.some(r => r.toUpperCase() === role.toUpperCase())) {
            console.log('Auth Failed: Role mismatch. Required:', roles, 'Actual:', role);
            throw new Error('You are not authorized');
        }
        req.user = decoded;
        console.log('Auth Success');
        next();
    });
};
export default auth;
//# sourceMappingURL=auth.js.map