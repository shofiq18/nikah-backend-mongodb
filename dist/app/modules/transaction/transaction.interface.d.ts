export type TProductType = 'TOKEN' | 'SUBSCRIPTION';
export type TTransactionStatus = 'PENDING' | 'SUCCESS' | 'REJECTED';
export type TTransaction = {
    userId: string;
    amount: number;
    productType: TProductType;
    packageName: string;
    senderNumber: string;
    trxId: string;
    status?: TTransactionStatus;
};
