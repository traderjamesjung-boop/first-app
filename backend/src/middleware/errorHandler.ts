import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message
    });
  }

  // Prisma 에러 처리
  if (err.name === 'PrismaClientKnownRequestError') {
    return res.status(400).json({
      status: 'error',
      message: '데이터베이스 요청 오류가 발생했습니다.'
    });
  }

  // 기타 에러
  console.error('❌ 서버 오류:', err);
  
  return res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' 
      ? '서버 오류가 발생했습니다.' 
      : err.message
  });
};
