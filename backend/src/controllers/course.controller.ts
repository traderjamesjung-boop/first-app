import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';

export const getCourses = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const courses = await prisma.course.findMany({ where: { isPublished: true } });
    res.json({ status: 'success', data: { courses } });
  } catch (error) {
    next(error);
  }
};

export const getCourseById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const course = await prisma.course.findUnique({ where: { id: req.params.id }, include: { lessons: true } });
    if (!course) throw new AppError('강의를 찾을 수 없습니다.', 404);
    res.json({ status: 'success', data: { course } });
  } catch (error) {
    next(error);
  }
};

export const enrollCourse = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const enrollment = await prisma.courseEnrollment.create({
      data: { userId: req.user!.id, courseId: req.params.id }
    });
    res.json({ status: 'success', message: '수강 신청이 완료되었습니다.', data: { enrollment } });
  } catch (error) {
    next(error);
  }
};

export const getMyEnrollments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { userId: req.user!.id },
      include: { course: true }
    });
    res.json({ status: 'success', data: { enrollments } });
  } catch (error) {
    next(error);
  }
};

export const getCourseProgress = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const enrollment = await prisma.courseEnrollment.findFirst({
      where: { userId: req.user!.id, courseId: req.params.id },
      include: { lessonProgress: true }
    });
    res.json({ status: 'success', data: { progress: enrollment } });
  } catch (error) {
    next(error);
  }
};

export const completeLesson = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { courseId, lessonId } = req.params;
    const enrollment = await prisma.courseEnrollment.findFirst({
      where: { userId: req.user!.id, courseId }
    });
    if (!enrollment) throw new AppError('수강 정보를 찾을 수 없습니다.', 404);

    await prisma.lessonProgress.upsert({
      where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId } },
      update: { completed: true, completedAt: new Date() },
      create: { enrollmentId: enrollment.id, lessonId, completed: true, completedAt: new Date() }
    });

    res.json({ status: 'success', message: '레슨이 완료되었습니다.' });
  } catch (error) {
    next(error);
  }
};

export const updateLessonProgress = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { courseId, lessonId } = req.params;
    const { watchedTime, lastPosition } = req.body;
    
    const enrollment = await prisma.courseEnrollment.findFirst({
      where: { userId: req.user!.id, courseId }
    });
    if (!enrollment) throw new AppError('수강 정보를 찾을 수 없습니다.', 404);

    await prisma.lessonProgress.upsert({
      where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId } },
      update: { watchedTime, lastPosition },
      create: { enrollmentId: enrollment.id, lessonId, watchedTime, lastPosition }
    });

    res.json({ status: 'success', message: '진도가 저장되었습니다.' });
  } catch (error) {
    next(error);
  }
};

export const createCourse = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const course = await prisma.course.create({ data: req.body });
    res.status(201).json({ status: 'success', message: '강의가 생성되었습니다.', data: { course } });
  } catch (error) {
    next(error);
  }
};

export const updateCourse = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const course = await prisma.course.update({ where: { id: req.params.id }, data: req.body });
    res.json({ status: 'success', message: '강의가 수정되었습니다.', data: { course } });
  } catch (error) {
    next(error);
  }
};

export const deleteCourse = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.course.delete({ where: { id: req.params.id } });
    res.json({ status: 'success', message: '강의가 삭제되었습니다.' });
  } catch (error) {
    next(error);
  }
};

export const addLesson = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const lesson = await prisma.lesson.create({ data: { ...req.body, courseId: req.params.id } });
    res.status(201).json({ status: 'success', message: '레슨이 추가되었습니다.', data: { lesson } });
  } catch (error) {
    next(error);
  }
};
