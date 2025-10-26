import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

// JWT 토큰 생성
const generateToken = (userId: string, email: string, role: string) => {
  return jwt.sign(
    { id: userId, email, role },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const generateRefreshToken = (userId: string) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );
};

// 회원가입
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, name, phone } = req.body;

    // 유효성 검사
    if (!email || !password || !name) {
      throw new AppError('필수 정보를 입력해주세요.', 400);
    }

    // 이메일 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new AppError('이미 가입된 이메일입니다.', 409);
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 생성
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        studySettings: {
          create: {
            dailyQuestionCount: 10,
            notificationTime: '09:00',
            notificationEnabled: true,
            difficulty: 'MEDIUM',
            categories: []
          }
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    // 토큰 생성
    const token = generateToken(user.id, user.email, user.role);
    const refreshToken = generateRefreshToken(user.id);

    res.status(201).json({
      status: 'success',
      message: '회원가입이 완료되었습니다.',
      data: {
        user,
        token,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

// 로그인
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    // 유효성 검사
    if (!email || !password) {
      throw new AppError('이메일과 비밀번호를 입력해주세요.', 400);
    }

    // 사용자 찾기
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new AppError('이메일 또는 비밀번호가 올바르지 않습니다.', 401);
    }

    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new AppError('이메일 또는 비밀번호가 올바르지 않습니다.', 401);
    }

    // 계정 활성화 확인
    if (!user.isActive) {
      throw new AppError('비활성화된 계정입니다. 관리자에게 문의하세요.', 403);
    }

    // 토큰 생성
    const token = generateToken(user.id, user.email, user.role);
    const refreshToken = generateRefreshToken(user.id);

    // 민감 정보 제외
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      status: 'success',
      message: '로그인되었습니다.',
      data: {
        user: userWithoutPassword,
        token,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

// 토큰 갱신
export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('리프레시 토큰이 필요합니다.', 400);
    }

    // 토큰 검증
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET!
    ) as { id: string };

    // 사용자 찾기
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user || !user.isActive) {
      throw new AppError('유효하지 않은 사용자입니다.', 401);
    }

    // 새 토큰 생성
    const newToken = generateToken(user.id, user.email, user.role);
    const newRefreshToken = generateRefreshToken(user.id);

    res.status(200).json({
      status: 'success',
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('유효하지 않은 리프레시 토큰입니다.', 401));
    } else {
      next(error);
    }
  }
};

// 로그아웃
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 클라이언트에서 토큰 삭제 처리
    res.status(200).json({
      status: 'success',
      message: '로그아웃되었습니다.'
    });
  } catch (error) {
    next(error);
  }
};

// 비밀번호 재설정 요청
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // 보안을 위해 사용자가 없어도 성공 응답
      return res.status(200).json({
        status: 'success',
        message: '비밀번호 재설정 이메일이 발송되었습니다.'
      });
    }

    // TODO: 이메일 발송 로직 구현

    res.status(200).json({
      status: 'success',
      message: '비밀번호 재설정 이메일이 발송되었습니다.'
    });
  } catch (error) {
    next(error);
  }
};

// 비밀번호 재설정
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      throw new AppError('토큰과 새 비밀번호를 입력해주세요.', 400);
    }

    // TODO: 토큰 검증 및 비밀번호 재설정 로직 구현

    res.status(200).json({
      status: 'success',
      message: '비밀번호가 재설정되었습니다.'
    });
  } catch (error) {
    next(error);
  }
};

// 이메일 인증
export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token } = req.params;

    // TODO: 이메일 인증 로직 구현

    res.status(200).json({
      status: 'success',
      message: '이메일이 인증되었습니다.'
    });
  } catch (error) {
    next(error);
  }
};
