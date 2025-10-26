import { Request, Response } from 'express';

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: '요청하신 리소스를 찾을 수 없습니다.',
    path: req.originalUrl
  });
};
