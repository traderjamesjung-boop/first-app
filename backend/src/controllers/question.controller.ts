import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';

// 문제 목록 조회
export const getQuestions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      page = 1,
      limit = 20,
      categoryId,
      examType,
      examYear,
      difficulty,
      keyword
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { isPublic: true };
    if (categoryId) where.categoryId = categoryId;
    if (examType) where.examType = examType;
    if (examYear) where.examYear = Number(examYear);
    if (difficulty) where.difficulty = difficulty;
    if (keyword) {
      where.OR = [
        { content: { contains: String(keyword) } },
        { keywords: { has: String(keyword) } }
      ];
    }

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true
            }
          }
        },
        skip,
        take: Number(limit),
        orderBy: [{ examYear: 'desc' }, { questionNumber: 'asc' }]
      }),
      prisma.question.count({ where })
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        questions,
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

// 문제 상세 조회
export const getQuestionById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        category: true
      }
    });

    if (!question) {
      throw new AppError('문제를 찾을 수 없습니다.', 404);
    }

    // 조회수 증가
    await prisma.question.update({
      where: { id },
      data: { viewCount: { increment: 1 } }
    });

    res.status(200).json({
      status: 'success',
      data: { question }
    });
  } catch (error) {
    next(error);
  }
};

// 랜덤 문제 가져오기 (일일 학습용)
export const getRandomQuestions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { count = 10, categoryIds, difficulty } = req.query;

    // 학습 설정 가져오기
    const studySettings = await prisma.studySetting.findUnique({
      where: { userId: req.user!.id }
    });

    const where: any = { isPublic: true };

    // 카테고리 필터
    if (categoryIds) {
      where.categoryId = {
        in: Array.isArray(categoryIds) ? categoryIds : [categoryIds]
      };
    } else if (studySettings?.categories.length) {
      where.categoryId = { in: studySettings.categories };
    }

    // 난이도 필터
    if (difficulty) {
      where.difficulty = difficulty;
    } else if (studySettings?.difficulty) {
      where.difficulty = studySettings.difficulty;
    }

    // 전체 문제 중에서 랜덤하게 선택
    const totalQuestions = await prisma.question.count({ where });
    const skip = Math.max(0, Math.floor(Math.random() * (totalQuestions - Number(count))));

    const questions = await prisma.question.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      },
      skip,
      take: Number(count),
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      status: 'success',
      data: { questions }
    });
  } catch (error) {
    next(error);
  }
};

// 카테고리 목록 조회
export const getCategories = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { questions: true }
        }
      }
    });

    res.status(200).json({
      status: 'success',
      data: { categories }
    });
  } catch (error) {
    next(error);
  }
};

// 문제 풀이 제출
export const submitAnswer = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { selectedAnswer, timeSpent } = req.body;

    if (selectedAnswer === undefined || timeSpent === undefined) {
      throw new AppError('답안과 소요 시간을 입력해주세요.', 400);
    }

    // 문제 조회
    const question = await prisma.question.findUnique({
      where: { id }
    });

    if (!question) {
      throw new AppError('문제를 찾을 수 없습니다.', 404);
    }

    // 정답 확인
    const isCorrect = selectedAnswer === question.correctAnswer;

    // 풀이 기록 저장
    const attempt = await prisma.questionAttempt.create({
      data: {
        userId: req.user!.id,
        questionId: id,
        selectedAnswer,
        isCorrect,
        timeSpent
      }
    });

    // 오늘의 학습 기록 업데이트
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const studyRecord = await prisma.studyRecord.upsert({
      where: {
        userId_date: {
          userId: req.user!.id,
          date: today
        }
      },
      update: {
        questionCount: { increment: 1 },
        correctCount: isCorrect ? { increment: 1 } : undefined,
        totalTime: { increment: timeSpent }
      },
      create: {
        userId: req.user!.id,
        date: today,
        questionCount: 1,
        correctCount: isCorrect ? 1 : 0,
        totalTime: timeSpent
      }
    });

    res.status(200).json({
      status: 'success',
      message: isCorrect ? '정답입니다!' : '오답입니다.',
      data: {
        isCorrect,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        attempt
      }
    });
  } catch (error) {
    next(error);
  }
};

// 북마크 추가/제거
export const toggleBookmark = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    // 기존 북마크 확인
    const existingBookmark = await prisma.bookmark.findUnique({
      where: {
        userId_questionId: {
          userId: req.user!.id,
          questionId: id
        }
      }
    });

    if (existingBookmark) {
      // 북마크 제거
      await prisma.bookmark.delete({
        where: {
          userId_questionId: {
            userId: req.user!.id,
            questionId: id
          }
        }
      });

      return res.status(200).json({
        status: 'success',
        message: '북마크가 제거되었습니다.',
        data: { bookmarked: false }
      });
    } else {
      // 북마크 추가
      await prisma.bookmark.create({
        data: {
          userId: req.user!.id,
          questionId: id,
          note: note || null
        }
      });

      return res.status(200).json({
        status: 'success',
        message: '북마크에 추가되었습니다.',
        data: { bookmarked: true }
      });
    }
  } catch (error) {
    next(error);
  }
};

// 내 북마크 목록
export const getMyBookmarks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [bookmarks, total] = await Promise.all([
      prisma.bookmark.findMany({
        where: { userId: req.user!.id },
        include: {
          question: {
            include: {
              category: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.bookmark.count({ where: { userId: req.user!.id } })
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        bookmarks,
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

// 문제 생성 (관리자/강사)
export const createQuestion = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      categoryId,
      examType,
      examYear,
      questionNumber,
      content,
      choices,
      correctAnswer,
      explanation,
      caseLaw,
      keywords,
      difficulty
    } = req.body;

    const question = await prisma.question.create({
      data: {
        categoryId,
        examType,
        examYear,
        questionNumber,
        content,
        choices,
        correctAnswer,
        explanation,
        caseLaw,
        keywords,
        difficulty: difficulty || 'MEDIUM'
      }
    });

    res.status(201).json({
      status: 'success',
      message: '문제가 생성되었습니다.',
      data: { question }
    });
  } catch (error) {
    next(error);
  }
};

// 문제 수정 (관리자/강사)
export const updateQuestion = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const question = await prisma.question.update({
      where: { id },
      data: updateData
    });

    res.status(200).json({
      status: 'success',
      message: '문제가 수정되었습니다.',
      data: { question }
    });
  } catch (error) {
    next(error);
  }
};

// 문제 삭제 (관리자)
export const deleteQuestion = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    await prisma.question.delete({
      where: { id }
    });

    res.status(200).json({
      status: 'success',
      message: '문제가 삭제되었습니다.'
    });
  } catch (error) {
    next(error);
  }
};
