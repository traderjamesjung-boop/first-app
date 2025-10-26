import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';

export const requestPayment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { paymentType, itemId, amount } = req.body;
    
    const orderId = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const payment = await prisma.payment.create({
      data: {
        userId: req.user!.id,
        paymentType,
        itemId,
        amount,
        orderId,
        status: 'PENDING'
      }
    });

    res.json({
      status: 'success',
      message: '결제 요청이 생성되었습니다.',
      data: { payment, orderId }
    });
  } catch (error) {
    next(error);
  }
};

export const approvePayment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { orderId, paymentKey, method } = req.body;
    
    const payment = await prisma.payment.update({
      where: { orderId },
      data: {
        status: 'COMPLETED',
        paymentKey,
        method,
        approvedAt: new Date()
      }
    });

    res.json({
      status: 'success',
      message: '결제가 승인되었습니다.',
      data: { payment }
    });
  } catch (error) {
    next(error);
  }
};

export const cancelPayment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { cancelReason } = req.body;

    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) throw new AppError('결제 정보를 찾을 수 없습니다.', 404);
    if (payment.userId !== req.user!.id) throw new AppError('권한이 없습니다.', 403);

    await prisma.payment.update({
      where: { id },
      data: {
        status: 'CANCELED',
        cancelReason,
        canceledAt: new Date()
      }
    });

    res.json({
      status: 'success',
      message: '결제가 취소되었습니다.'
    });
  } catch (error) {
    next(error);
  }
};

export const getMyPayments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      status: 'success',
      data: { payments }
    });
  } catch (error) {
    next(error);
  }
};

export const getPaymentById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const payment = await prisma.payment.findUnique({ where: { id: req.params.id } });
    if (!payment) throw new AppError('결제 정보를 찾을 수 없습니다.', 404);
    if (payment.userId !== req.user!.id) throw new AppError('권한이 없습니다.', 403);

    res.json({
      status: 'success',
      data: { payment }
    });
  } catch (error) {
    next(error);
  }
};
