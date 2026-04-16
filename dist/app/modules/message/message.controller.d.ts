import { Request, Response } from 'express';
export declare const MessageController: {
    sendMessage: (req: Request, res: Response) => Promise<void>;
    getMyInbox: (req: Request, res: Response) => Promise<void>;
    getConversation: (req: Request, res: Response) => Promise<void>;
};
