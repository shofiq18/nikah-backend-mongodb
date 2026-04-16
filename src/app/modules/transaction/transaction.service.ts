import { PrismaClient } from '@prisma/client';
import { TTransaction } from './transaction.interface.js';

const prisma = new PrismaClient();

// Plan Configurations (This should ideally be in a central config or database)
const SUBSCRIPTION_PLANS: Record<string, { durationMonths: number; contactLimit: number; type: any }> = {
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

const TOKEN_PACKS: Record<string, { tokens: number }> = {
  '2 Tokens': { tokens: 2 },
  '5 Tokens': { tokens: 5 },
  '15 Tokens': { tokens: 15 },
};

const createTransaction = async (payload: TTransaction) => {
  const result = await (prisma as any).transaction.create({
    data: payload
  });
  return result;
};

const approveTransaction = async (transactionId: string) => {
  console.log(`[Transaction] Attempting to approve: ${transactionId}`);
  
  const transaction = await (prisma as any).transaction.findUnique({
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

  // 1. Fetch user to get current balance/status
  const user = transaction.user;
  if (!user) throw new Error('User associated with transaction not found');

  const userId = transaction.userId;
  let userUpdateData: any = {};

  console.log(`[Transaction] Current tokens: ${user.availableTokens}`);

  if (transaction.productType === 'TOKEN') {
    const packKey = Object.keys(TOKEN_PACKS).find(
      k => k.toLowerCase() === transaction.packageName.trim().toLowerCase()
    );
    const pack = packKey ? TOKEN_PACKS[packKey] : null;

    if (!pack) throw new Error(`Invalid Token Pack: ${transaction.packageName}`);
    
    // Explicitly calculate new balance
    userUpdateData = {
      availableTokens: (user.availableTokens || 0) + pack.tokens
    };
    console.log(`[Transaction] New token balance will be: ${userUpdateData.availableTokens}`);
  } else if (transaction.productType === 'SUBSCRIPTION') {
    const planKey = Object.keys(SUBSCRIPTION_PLANS).find(
      k => k.toLowerCase() === transaction.packageName.trim().toLowerCase()
    );
    const plan = planKey ? SUBSCRIPTION_PLANS[planKey] : null;

    if (!plan) throw new Error(`Invalid Subscription Plan: ${transaction.packageName}`);

    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + plan.durationMonths);

    // Explicitly calculate new contact limit
    userUpdateData = {
      planType: plan.type,
      planExpiry: expiryDate,
      remainingNumbers: (user.remainingNumbers || 0) + plan.contactLimit
    };
    console.log(`[Transaction] New remainingNumbers will be: ${userUpdateData.remainingNumbers}`);
  }

  // Update transaction and user
  const result = await prisma.$transaction([
    (prisma as any).transaction.update({
      where: { id: transactionId },
      data: { status: 'SUCCESS' }
    }),
    (prisma.user as any).update({
      where: { id: userId },
      data: userUpdateData
    })
  ]);

  console.log(`[Transaction] Update successful. New balance in DB: ${result[1].availableTokens}`);
  return result[0];
};

const rejectTransaction = async (transactionId: string) => {
  const result = await (prisma as any).transaction.update({
    where: { id: transactionId },
    data: { status: 'REJECTED' }
  });
  return result;
};

const getAllTransactions = async () => {
  return await (prisma as any).transaction.findMany({
    include: { user: true },
    orderBy: { createdAt: 'desc' }
  });
};

const getMyTransactions = async (userId: string) => {
  return await (prisma as any).transaction.findMany({
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
