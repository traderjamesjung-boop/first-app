import { Router } from 'express';
import * as ebookController from '../controllers/ebook.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// 공개 라우트
router.get('/', ebookController.getEbooks);
router.get('/:id', ebookController.getEbookById);

// 인증 필요
router.use(authenticate);

// 전자책 구매
router.post('/:id/purchase', ebookController.purchaseEbook);

// 내 전자책 목록
router.get('/purchases/my', ebookController.getMyEbooks);

// 전자책 다운로드 링크 생성
router.get('/:id/download', ebookController.getDownloadLink);

// 관리자 전용 - 전자책 생성
router.post('/', authorize('ADMIN'), ebookController.createEbook);

// 관리자 전용 - 전자책 수정
router.put('/:id', authorize('ADMIN'), ebookController.updateEbook);

// 관리자 전용 - 전자책 삭제
router.delete('/:id', authorize('ADMIN'), ebookController.deleteEbook);

export default router;
