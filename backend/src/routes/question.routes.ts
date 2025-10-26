import { Router } from 'express';
import * as questionController from '../controllers/question.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// 인증 필요
router.use(authenticate);

// 문제 목록 조회 (필터링, 페이지네이션)
router.get('/', questionController.getQuestions);

// 문제 상세 조회
router.get('/:id', questionController.getQuestionById);

// 랜덤 문제 가져오기 (일일 학습용)
router.get('/random/daily', questionController.getRandomQuestions);

// 카테고리 목록 조회
router.get('/categories/list', questionController.getCategories);

// 문제 풀이 제출
router.post('/:id/submit', questionController.submitAnswer);

// 북마크 추가/제거
router.post('/:id/bookmark', questionController.toggleBookmark);

// 내 북마크 목록
router.get('/bookmarks/my', questionController.getMyBookmarks);

// 관리자 전용 - 문제 생성
router.post('/', authorize('ADMIN', 'TEACHER'), questionController.createQuestion);

// 관리자 전용 - 문제 수정
router.put('/:id', authorize('ADMIN', 'TEACHER'), questionController.updateQuestion);

// 관리자 전용 - 문제 삭제
router.delete('/:id', authorize('ADMIN'), questionController.deleteQuestion);

export default router;
