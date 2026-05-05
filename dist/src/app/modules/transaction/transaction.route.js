import express from 'express';
import { TransactionController } from './transaction.controller.js';
import auth from '../../middlewares/auth.js';
const router = express.Router();
router.post('/', auth('USER', 'ADMIN'), TransactionController.createTransaction);
router.get('/my-transactions', auth('USER', 'ADMIN'), TransactionController.getMyTransactions);
router.get('/', auth('ADMIN'), TransactionController.getAllTransactions);
router.patch('/:id/approve', auth('ADMIN'), TransactionController.approveTransaction);
router.patch('/:id/reject', auth('ADMIN'), TransactionController.rejectTransaction);
export const TransactionRoutes = router;
//# sourceMappingURL=transaction.route.js.map