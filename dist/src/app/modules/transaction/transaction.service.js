import { PrismaClient } from '@prisma/client';
import { NotificationService } from '../notification/notification.service.js';
import { sendTelegramMessage } from '../../utils/sendTelegramMessage.js';
const prisma = new PrismaClient();
const SUBSCRIPTION_PLANS = {
    'Gold (3 Months)': { durationMonths: 3, contactLimit: 40, type: 'GOLD' },
    'Gold (6 Months)': { durationMonths: 6, contactLimit: 80, type: 'GOLD' },
    'Gold (12 Months)': { durationMonths: 12, contactLimit: 160, type: 'GOLD' },
    'Diamond (3 Months)': { durationMonths: 3, contactLimit: 55, type: 'DIAMOND' },
    'Diamond (6 Months)': { durationMonths: 6, contactLimit: 110, type: 'DIAMOND' },
    'Diamond (12 Months)': { durationMonths: 12, contactLimit: 220, type: 'DIAMOND' },
    'Platinum (3 Months)': { durationMonths: 3, contactLimit: 70, type: 'PLATINUM' },
    'Platinum (6 Months)': { durationMonths: 6, contactLimit: 140, type: 'PLATINUM' },
    'Platinum (12 Months)': { durationMonths: 12, contactLimit: 280, type: 'PLATINUM' },
};
const TOKEN_PACKS = {
    '2 Tokens': { tokens: 2 },
    '5 Tokens': { tokens: 5 },
    '15 Tokens': { tokens: 15 },
};
const createTransaction = async (payload) => {
    const existingTransaction = await prisma.transaction.findUnique({
        where: { trxId: payload.trxId }
    });
    if (existingTransaction) {
        throw new Error('Transaction ID (TrxID) already exists. Please use a unique one.');
    }
    const result = await prisma.transaction.create({
        data: payload,
        include: {
            user: true
        }
    });
    const message = `
━━━━━━━━━━━━━━━━━━━━━━━━
🔥 <b>NEW MATRIMONY PAYMENT SUBMITTED</b>
━━━━━━━━━━━━━━━━━━━━━━━━

👤 <b>User Info:</b>
• <b>Name:</b> ${result.user?.fullName || 'N/A'}
• <b>Email:</b> ${result.user?.email || 'N/A'}
• <b>Member ID:</b> ${result.user?.memberId || 'N/A'}
• <b>User ID:</b> <code>${result.userId}</code>

💳 <b>Payment Details:</b>
• <b>Package:</b> ${result.packageName} (${result.productType})
• <b>Amount:</b> ${result.amount} BDT
• <b>Sender Number:</b> ${result.senderNumber}
• <b>TrxID:</b> <code>${result.trxId}</code>

🕒 <b>Submitted At:</b> ${new Date(result.createdAt).toLocaleString('en-US', { timeZone: 'Asia/Dhaka' })}
━━━━━━━━━━━━━━━━━━━━━━━━
`;
    await sendTelegramMessage(message);
    return result;
};
const approveTransaction = async (transactionId) => {
    console.log(`[Transaction] Attempting to approve: ${transactionId}`);
    const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: { user: true }
    });
    if (!transaction) {
        console.error(`[Transaction] Not found: ${transactionId}`);
        throw new Error('Transaction not found');
    }
    if (transaction.status !== 'PENDING') {
        console.warn(`[Transaction] Already processed: ${transactionId} (Status: ${transaction.status})`);
        throw new Error('Transaction already processed');
    }
    const user = transaction.user;
    if (!user)
        throw new Error('User associated with transaction not found');
    const userId = transaction.userId;
    let userUpdateData = {};
    console.log(`[Transaction] Current tokens: ${user.availableTokens}`);
    if (transaction.productType === 'TOKEN') {
        const packKey = Object.keys(TOKEN_PACKS).find(k => k.toLowerCase() === transaction.packageName.trim().toLowerCase());
        const pack = packKey ? TOKEN_PACKS[packKey] : null;
        if (!pack)
            throw new Error(`Invalid Token Pack: ${transaction.packageName}`);
        userUpdateData = {
            availableTokens: (user.availableTokens || 0) + pack.tokens
        };
        console.log(`[Transaction] New token balance will be: ${userUpdateData.availableTokens}`);
    }
    else if (transaction.productType === 'SUBSCRIPTION') {
        const planKey = Object.keys(SUBSCRIPTION_PLANS).find(k => k.toLowerCase() === transaction.packageName.trim().toLowerCase());
        const plan = planKey ? SUBSCRIPTION_PLANS[planKey] : null;
        if (!plan)
            throw new Error(`Invalid Subscription Plan: ${transaction.packageName}`);
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + plan.durationMonths);
        userUpdateData = {
            planType: plan.type,
            planExpiry: expiryDate,
            remainingNumbers: (user.remainingNumbers || 0) + plan.contactLimit
        };
        console.log(`[Transaction] New remainingNumbers will be: ${userUpdateData.remainingNumbers}`);
    }
    const result = await prisma.$transaction([
        prisma.transaction.update({
            where: { id: transactionId },
            data: { status: 'SUCCESS' }
        }),
        prisma.user.update({
            where: { id: userId },
            data: userUpdateData
        })
    ]);
    console.log(`[Transaction] Update successful. New balance in DB: ${result[1].availableTokens}`);
    await NotificationService.createNotification({
        userId: userId,
        type: 'PAYMENT_SUCCESS',
        title: 'Payment Successful',
        message: `Your payment for ${transaction.packageName} has been approved.`,
        path: '/dashboard/user/plans',
    });
    return result[0];
};
const rejectTransaction = async (transactionId) => {
    const result = await prisma.transaction.update({
        where: { id: transactionId },
        data: { status: 'REJECTED' }
    });
    await NotificationService.createNotification({
        userId: result.userId,
        type: 'PAYMENT_REJECTED',
        title: 'Payment Rejected',
        message: `Your payment for ${result.packageName} was rejected. Please contact support.`,
        path: '/dashboard/user/plans',
    });
    return result;
};
const getAllTransactions = async () => {
    return await prisma.transaction.findMany({
        include: { user: true },
        orderBy: { createdAt: 'desc' }
    });
};
const getMyTransactions = async (userId) => {
    return await prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
    });
};
export const TransactionService = {
    createTransaction,
    approveTransaction,
    rejectTransaction,
    getAllTransactions,
    getMyTransactions
};
//# sourceMappingURL=transaction.service.js.map