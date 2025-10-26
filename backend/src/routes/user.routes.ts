import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// 모든 라우트에 인증 필요
router.use(authenticate);

// 내 프로필 조회
router.get('/me', userController.getMyProfile);

// 내 프로필 수정
router.put('/me', userController.updateMyProfile);

// 비밀번호 변경
router.put('/me/password', userController.changePassword);

// FCM 토큰 등록 (푸시 알림용)
router.post('/me/fcm-token', userController.registerFcmToken);

// 학습 설정 조회
router.get('/me/study-settings', userController.getStudySettings);

// 학습 설정 업데이트
router.put('/me/study-settings', userController.updateStudySettings);

// 회원 탈퇴
router.delete('/me', userController.deleteAccount);

// 관리자 전용 라우트
router.get('/', authorize('ADMIN'), userController.getAllUsers);
router.get('/:id', authorize('ADMIN'), userController.getUserById);
router.put('/:id', authorize('ADMIN'), userController.updateUser);
router.delete('/:id', authorize('ADMIN'), userController.deleteUser);

export default router;
