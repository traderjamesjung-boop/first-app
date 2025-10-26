import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// 회원가입
router.post('/register', authController.register);

// 로그인
router.post('/login', authController.login);

// 토큰 갱신
router.post('/refresh', authController.refreshToken);

// 로그아웃
router.post('/logout', authenticate, authController.logout);

// 비밀번호 재설정 요청
router.post('/forgot-password', authController.forgotPassword);

// 비밀번호 재설정
router.post('/reset-password', authController.resetPassword);

// 이메일 인증
router.get('/verify-email/:token', authController.verifyEmail);

export default router;
