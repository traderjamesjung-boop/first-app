import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';

// 내 프로필 조회
export const getMyProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        profileImage: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      throw new AppError('사용자를 찾을 수 없습니다.', 404);
    }

    res.status(200).json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// 내 프로필 수정
export const updateMyProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, phone, profileImage } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(profileImage && { profileImage })
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        profileImage: true,
        updatedAt: true
      }
    });

    res.status(200).json({
      status: 'success',
      message: '프로필이 업데이트되었습니다.',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// 비밀번호 변경
export const changePassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new AppError('현재 비밀번호와 새 비밀번호를 입력해주세요.', 400);
    }

    // 현재 사용자 조회
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id }
    });

    if (!user) {
      throw new AppError('사용자를 찾을 수 없습니다.', 404);
    }

    // 현재 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      throw new AppError('현재 비밀번호가 일치하지 않습니다.', 401);
    }

    // 새 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 비밀번호 업데이트
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { password: hashedPassword }
    });

    res.status(200).json({
      status: 'success',
      message: '비밀번호가 변경되었습니다.'
    });
  } catch (error) {
    next(error);
  }
};

// FCM 토큰 등록
export const registerFcmToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { fcmToken } = req.body;

    if (!fcmToken) {
      throw new AppError('FCM 토큰이 필요합니다.', 400);
    }

    await prisma.user.update({
      where: { id: req.user!.id },
      data: { fcmToken }
    });

    res.status(200).json({
      status: 'success',
      message: 'FCM 토큰이 등록되었습니다.'
    });
  } catch (error) {
    next(error);
  }
};

// 학습 설정 조회
export const getStudySettings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const settings = await prisma.studySetting.findUnique({
      where: { userId: req.user!.id }
    });

    if (!settings) {
      throw new AppError('학습 설정을 찾을 수 없습니다.', 404);
    }

    res.status(200).json({
      status: 'success',
      data: { settings }
    });
  } catch (error) {
    next(error);
  }
};

// 학습 설정 업데이트
export const updateStudySettings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      dailyQuestionCount,
      notificationTime,
      notificationEnabled,
      difficulty,
      categories
    } = req.body;

    const settings = await prisma.studySetting.upsert({
      where: { userId: req.user!.id },
      update: {
        ...(dailyQuestionCount && { dailyQuestionCount }),
        ...(notificationTime && { notificationTime }),
        ...(notificationEnabled !== undefined && { notificationEnabled }),
        ...(difficulty && { difficulty }),
        ...(categories && { categories })
      },
      create: {
        userId: req.user!.id,
        dailyQuestionCount: dailyQuestionCount || 10,
        notificationTime: notificationTime || '09:00',
        notificationEnabled: notificationEnabled !== undefined ? notificationEnabled : true,
        difficulty: difficulty || 'MEDIUM',
        categories: categories || []
      }
    });

    res.status(200).json({
      status: 'success',
      message: '학습 설정이 업데이트되었습니다.',
      data: { settings }
    });
  } catch (error) {
    next(error);
  }
};

// 회원 탈퇴
export const deleteAccount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    await prisma.user.delete({
      where: { id: req.user!.id }
    });

    res.status(200).json({
      status: 'success',
      message: '회원 탈퇴가 완료되었습니다.'
    });
  } catch (error) {
    next(error);
  }
};

// 관리자 - 모든 사용자 조회
export const getAllUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = 1, limit = 20, role, isActive } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          emailVerified: true,
          createdAt: true
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        users,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// 관리자 - 사용자 상세 조회
export const getUserById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        profileImage: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        studySettings: true
      }
    });

    if (!user) {
      throw new AppError('사용자를 찾을 수 없습니다.', 404);
    }

    res.status(200).json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// 관리자 - 사용자 수정
export const updateUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { role, isActive } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(role && { role }),
        ...(isActive !== undefined && { isActive })
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    });

    res.status(200).json({
      status: 'success',
      message: '사용자 정보가 업데이트되었습니다.',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// 관리자 - 사용자 삭제
export const deleteUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id }
    });

    res.status(200).json({
      status: 'success',
      message: '사용자가 삭제되었습니다.'
    });
  } catch (error) {
    next(error);
  }
};
