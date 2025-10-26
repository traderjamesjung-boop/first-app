import { Router } from 'express';
import * as courseController from '../controllers/course.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// 공개 라우트
router.get('/', courseController.getCourses);
router.get('/:id', courseController.getCourseById);

// 인증 필요
router.use(authenticate);

// 강의 수강 신청
router.post('/:id/enroll', courseController.enrollCourse);

// 내 수강 목록
router.get('/enrollments/my', courseController.getMyEnrollments);

// 강의 진도 조회
router.get('/:id/progress', courseController.getCourseProgress);

// 레슨 완료 처리
router.post('/:courseId/lessons/:lessonId/complete', courseController.completeLesson);

// 레슨 진도 업데이트
router.put('/:courseId/lessons/:lessonId/progress', courseController.updateLessonProgress);

// 관리자/강사 전용 - 강의 생성
router.post('/', authorize('ADMIN', 'TEACHER'), courseController.createCourse);

// 관리자/강사 전용 - 강의 수정
router.put('/:id', authorize('ADMIN', 'TEACHER'), courseController.updateCourse);

// 관리자/강사 전용 - 강의 삭제
router.delete('/:id', authorize('ADMIN'), courseController.deleteCourse);

// 관리자/강사 전용 - 레슨 추가
router.post('/:id/lessons', authorize('ADMIN', 'TEACHER'), courseController.addLesson);

export default router;
