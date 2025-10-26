import { Router } from 'express';
import * as studyController from '../controllers/study.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// 인증 필요
router.use(authenticate);

// 학습 통계 조회
router.get('/statistics', studyController.getStudyStatistics);

// 일일 학습 기록 조회
router.get('/records', studyController.getStudyRecords);

// 오늘의 학습 기록 조회
router.get('/records/today', studyController.getTodayRecord);

// 학습 기록 생성
router.post('/records', studyController.createStudyRecord);

// 내 문제 풀이 기록 조회
router.get('/attempts', studyController.getMyAttempts);

// 약점 분석 (틀린 문제 많은 카테고리)
router.get('/weaknesses', studyController.getWeaknesses);

// 학습 진도율 조회
router.get('/progress', studyController.getProgress);

// 연속 학습 일수 (streak) 조회
router.get('/streak', studyController.getStreak);

export default router;
