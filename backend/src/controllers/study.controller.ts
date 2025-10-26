import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';

// 학습 통계 조회
export const getStudyStatistics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;

    // 총 학습 통계
    const [totalAttempts, totalCorrect, totalTime, uniqueQuestions] = await Promise.all([
      prisma.questionAttempt.count({ where: { userId } }),
      prisma.questionAttempt.count({ where: { userId, isCorrect: true } }),
      prisma.questionAttempt.aggregate({
        where: { userId },
        _sum: { timeSpent: true }
      }),
      prisma.questionAttempt.findMany({
        where: { userId },
        distinct: ['questionId']
      })
    ]);

    const correctRate = totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0;
    const avgTimePerQuestion = totalAttempts > 0 ? (totalTime._sum.timeSpent || 0) / totalAttempts : 0;

    res.status(200).json({
      status: 'success',
      data: {
        statistics: {
          totalAttempts,
          totalCorrect,
          totalWrong: totalAttempts - totalCorrect,
          correctRate: Math.round(correctRate * 100) / 100,
          uniqueQuestionsSolved: uniqueQuestions.length,
          totalTimeSpent: totalTime._sum.timeSpent || 0,
          avgTimePerQuestion: Math.round(avgTimePerQuestion)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// 일일 학습 기록 조회
export const getStudyRecords = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { startDate, endDate, limit = 30 } = req.query;

    const where: any = { userId: req.user!.id };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const records = await prisma.studyRecord.findMany({
      where,
      orderBy: { date: 'desc' },
      take: Number(limit)
    });

    res.status(200).json({
      status: 'success',
      data: { records }
    });
  } catch (error) {
    next(error);
  }
};

// 오늘의 학습 기록 조회
export const getTodayRecord = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const record = await prisma.studyRecord.findUnique({
      where: {
        userId_date: {
          userId: req.user!.id,
          date: today
        }
      }
    });

    // 학습 설정 가져오기
    const studySettings = await prisma.studySetting.findUnique({
      where: { userId: req.user!.id }
    });

    const dailyGoal = studySettings?.dailyQuestionCount || 10;
    const currentCount = record?.questionCount || 0;
    const completedDaily = currentCount >= dailyGoal;

    res.status(200).json({
      status: 'success',
      data: {
        record: record || {
          questionCount: 0,
          correctCount: 0,
          totalTime: 0,
          completedDaily: false
        },
        dailyGoal,
        progress: Math.min(100, Math.round((currentCount / dailyGoal) * 100)),
        completedDaily
      }
    });
  } catch (error) {
    next(error);
  }
};

// 학습 기록 생성
export const createStudyRecord = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { date, questionCount, correctCount, totalTime } = req.body;

    const recordDate = date ? new Date(date) : new Date();
    recordDate.setHours(0, 0, 0, 0);

    const record = await prisma.studyRecord.upsert({
      where: {
        userId_date: {
          userId: req.user!.id,
          date: recordDate
        }
      },
      update: {
        questionCount,
        correctCount,
        totalTime
      },
      create: {
        userId: req.user!.id,
        date: recordDate,
        questionCount,
        correctCount,
        totalTime
      }
    });

    res.status(201).json({
      status: 'success',
      message: '학습 기록이 저장되었습니다.',
      data: { record }
    });
  } catch (error) {
    next(error);
  }
};

// 내 문제 풀이 기록 조회
export const getMyAttempts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = 1, limit = 20, isCorrect, categoryId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { userId: req.user!.id };
    if (isCorrect !== undefined) where.isCorrect = isCorrect === 'true';
    if (categoryId) {
      where.question = {
        categoryId: categoryId as string
      };
    }

    const [attempts, total] = await Promise.all([
      prisma.questionAttempt.findMany({
        where,
        include: {
          question: {
            select: {
              id: true,
              content: true,
              correctAnswer: true,
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
      prisma.questionAttempt.count({ where })
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        attempts,
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

// 약점 분석 (틀린 문제 많은 카테고리)
export const getWeaknesses = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;

    // 카테고리별 정답률 계산
    const attempts = await prisma.questionAttempt.findMany({
      where: { userId },
      include: {
        question: {
          select: {
            categoryId: true,
            category: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    // 카테고리별 통계 집계
    const categoryStats: { [key: string]: any } = {};

    attempts.forEach((attempt) => {
      const categoryId = attempt.question.categoryId;
      const categoryName = attempt.question.category.name;

      if (!categoryStats[categoryId]) {
        categoryStats[categoryId] = {
          categoryId,
          categoryName,
          total: 0,
          correct: 0,
          wrong: 0,
          correctRate: 0
        };
      }

      categoryStats[categoryId].total += 1;
      if (attempt.isCorrect) {
        categoryStats[categoryId].correct += 1;
      } else {
        categoryStats[categoryId].wrong += 1;
      }
    });

    // 정답률 계산 및 정렬
    const weaknesses = Object.values(categoryStats)
      .map((stat: any) => ({
        ...stat,
        correctRate: (stat.correct / stat.total) * 100
      }))
      .sort((a: any, b: any) => a.correctRate - b.correctRate)
      .slice(0, 5); // 상위 5개 약점 카테고리

    res.status(200).json({
      status: 'success',
      data: { weaknesses }
    });
  } catch (error) {
    next(error);
  }
};

// 학습 진도율 조회
export const getProgress = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;

    // 전체 문제 수
    const totalQuestions = await prisma.question.count({ where: { isPublic: true } });

    // 풀어본 문제 수 (고유 문제)
    const solvedQuestions = await prisma.questionAttempt.findMany({
      where: { userId },
      distinct: ['questionId']
    });

    const progressRate = totalQuestions > 0 
      ? (solvedQuestions.length / totalQuestions) * 100 
      : 0;

    res.status(200).json({
      status: 'success',
      data: {
        progress: {
          totalQuestions,
          solvedQuestions: solvedQuestions.length,
          remainingQuestions: totalQuestions - solvedQuestions.length,
          progressRate: Math.round(progressRate * 100) / 100
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// 연속 학습 일수 (streak) 조회
export const getStreak = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const records = await prisma.studyRecord.findMany({
      where: {
        userId: req.user!.id,
        completedDaily: true
      },
      orderBy: { date: 'desc' },
      take: 365 // 최근 1년
    });

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate: Date | null = null;

    for (const record of records) {
      const recordDate = new Date(record.date);

      if (!lastDate) {
        // 첫 레코드
        tempStreak = 1;
        lastDate = recordDate;
      } else {
        // 전날인지 확인
        const diffTime = lastDate.getTime() - recordDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          // 연속
          tempStreak += 1;
        } else {
          // 연속 끊김
          if (tempStreak > longestStreak) {
            longestStreak = tempStreak;
          }
          tempStreak = 1;
        }

        lastDate = recordDate;
      }
    }

    // 마지막 tempStreak 확인
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }

    // 현재 연속 일수 계산
    if (records.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const lastRecordDate = new Date(records[0].date);
      lastRecordDate.setHours(0, 0, 0, 0);

      const diffTime = today.getTime() - lastRecordDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0 || diffDays === 1) {
        // 오늘 또는 어제까지 학습한 경우
        currentStreak = tempStreak;
      }
    }

    res.status(200).json({
      status: 'success',
      data: {
        streak: {
          current: currentStreak,
          longest: longestStreak
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
