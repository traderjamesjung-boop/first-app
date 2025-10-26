import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// 인증 필요
router.use(authenticate);

// 결제 요청
router.post('/request', paymentController.requestPayment);

// 결제 승인
router.post('/approve', paymentController.approvePayment);

// 결제 취소
router.post('/:id/cancel', paymentController.cancelPayment);

// 내 결제 내역
router.get('/my', paymentController.getMyPayments);

// 결제 상세 조회
router.get('/:id', paymentController.getPaymentById);

export default router;
