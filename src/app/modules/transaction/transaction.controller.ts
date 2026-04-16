import { Request, Response } from 'express';
import { TransactionService } from './transaction.service.js';

const createTransaction = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const result = await TransactionService.createTransaction({
        ...req.body,
        userId
    });
    res.status(200).json({
      success: true,
      message: 'Transaction submitted for approval',
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const approveTransaction = async (req: Request, res: Response) => {
  try {
    const result = await TransactionService.approveTransaction(req.params.id as string);
    res.status(200).json({
      success: true,
      message: 'Transaction approved successfully',
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const rejectTransaction = async (req: Request, res: Response) => {
  try {
    const result = await TransactionService.rejectTransaction(req.params.id as string);
    res.status(200).json({
      success: true,
      message: 'Transaction rejected successfully',
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getAllTransactions = async (req: Request, res: Response) => {
  try {
    const result = await TransactionService.getAllTransactions();
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getMyTransactions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const result = await TransactionService.getMyTransactions(userId);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const TransactionController = {
  createTransaction,
  approveTransaction,
  rejectTransaction,
  getAllTransactions,
  getMyTransactions
};
