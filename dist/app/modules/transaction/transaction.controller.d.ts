import { Request, Response } from 'express';
export declare const TransactionController: {
    createTransaction: (req: Request, res: Response) => Promise<void>;
    approveTransaction: (req: Request, res: Response) => Promise<void>;
    rejectTransaction: (req: Request, res: Response) => Promise<void>;
    getAllTransactions: (req: Request, res: Response) => Promise<void>;
    getMyTransactions: (req: Request, res: Response) => Promise<void>;
};
