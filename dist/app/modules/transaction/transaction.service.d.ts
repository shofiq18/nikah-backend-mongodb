import { TTransaction } from './transaction.interface.js';
export declare const TransactionService: {
    createTransaction: (payload: TTransaction) => Promise<any>;
    approveTransaction: (transactionId: string) => Promise<any>;
    rejectTransaction: (transactionId: string) => Promise<any>;
    getAllTransactions: () => Promise<any>;
    getMyTransactions: (userId: string) => Promise<any>;
};
