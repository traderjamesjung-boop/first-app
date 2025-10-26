import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';

export const getEbooks = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const ebooks = await prisma.ebook.findMany({ where: { isPublished: true } });
    res.json({ status: 'success', data: { ebooks } });
  } catch (error) {
    next(error);
  }
};

export const getEbookById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const ebook = await prisma.ebook.findUnique({ where: { id: req.params.id } });
    if (!ebook) throw new AppError('전자책을 찾을 수 없습니다.', 404);
    res.json({ status: 'success', data: { ebook } });
  } catch (error) {
    next(error);
  }
};

export const purchaseEbook = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // 이미 구매했는지 확인
    const existing = await prisma.ebookPurchase.findUnique({
      where: { userId_ebookId: { userId: req.user!.id, ebookId: req.params.id } }
    });
    if (existing) throw new AppError('이미 구매한 전자책입니다.', 400);

    const ebook = await prisma.ebook.findUnique({ where: { id: req.params.id } });
    if (!ebook) throw new AppError('전자책을 찾을 수 없습니다.', 404);

    const purchase = await prisma.ebookPurchase.create({
      data: { userId: req.user!.id, ebookId: req.params.id, price: ebook.price }
    });

    res.json({ status: 'success', message: '전자책 구매가 완료되었습니다.', data: { purchase } });
  } catch (error) {
    next(error);
  }
};

export const getMyEbooks = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const purchases = await prisma.ebookPurchase.findMany({
      where: { userId: req.user!.id },
      include: { ebook: true }
    });
    res.json({ status: 'success', data: { purchases } });
  } catch (error) {
    next(error);
  }
};

export const getDownloadLink = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const purchase = await prisma.ebookPurchase.findUnique({
      where: { userId_ebookId: { userId: req.user!.id, ebookId: req.params.id } },
      include: { ebook: true }
    });
    if (!purchase) throw new AppError('구매한 전자책이 아닙니다.', 403);

    await prisma.ebook.update({
      where: { id: req.params.id },
      data: { downloadCount: { increment: 1 } }
    });

    res.json({ status: 'success', data: { downloadUrl: purchase.ebook.fileUrl } });
  } catch (error) {
    next(error);
  }
};

export const createEbook = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const ebook = await prisma.ebook.create({ data: req.body });
    res.status(201).json({ status: 'success', message: '전자책이 생성되었습니다.', data: { ebook } });
  } catch (error) {
    next(error);
  }
};

export const updateEbook = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const ebook = await prisma.ebook.update({ where: { id: req.params.id }, data: req.body });
    res.json({ status: 'success', message: '전자책이 수정되었습니다.', data: { ebook } });
  } catch (error) {
    next(error);
  }
};

export const deleteEbook = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.ebook.delete({ where: { id: req.params.id } });
    res.json({ status: 'success', message: '전자책이 삭제되었습니다.' });
  } catch (error) {
    next(error);
  }
};
