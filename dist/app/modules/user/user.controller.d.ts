import { Request, Response } from 'express';
export declare const UserController: {
    loginUser: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getMe: (req: Request, res: Response, next: import("express").NextFunction) => void;
    logout: (req: Request, res: Response, next: import("express").NextFunction) => void;
    registerUser: (req: Request, res: Response, next: import("express").NextFunction) => void;
    verifyEmail: (req: Request, res: Response, next: import("express").NextFunction) => void;
    resendOtp: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateProfile: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getProfile: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getAllUserProfiles: (req: Request, res: Response, next: import("express").NextFunction) => void;
    unlockContact: (req: Request, res: Response, next: import("express").NextFunction) => void;
    toggleShortlist: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getShortlistedProfiles: (req: Request, res: Response, next: import("express").NextFunction) => void;
    sendInterest: (req: Request, res: Response, next: import("express").NextFunction) => void;
    handleInterestResponse: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getReceivedInterests: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getSentInterests: (req: Request, res: Response, next: import("express").NextFunction) => void;
};
