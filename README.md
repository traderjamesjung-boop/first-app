# 🎓 형법 마스터 (Criminal Law Master)

한국 변호사시험 및 공무원 시험 준비생을 위한 형법 전문 학습 플랫폼

## 📌 주요 기능

### 1. 문제 DB 시스템
- 공무원 시험 및 변호사시험 형법 기출문제 데이터베이스
- 키워드, 판례, 출제 경향별 분류
- 상세 해설 제공

### 2. 개인 맞춤형 학습
- 학습 분량 설정 (5/10/20/30문제)
- 일일 푸시 알림 학습 유도
- 학습 기록 및 정답률 분석
- 약점 영역 반복 학습 시스템

### 3. 강의 시스템
- 무료/유료 형법 강의 제공
- 진도 자동 연동
- 북마크 기능

### 4. 전자책 판매
- 앱 내 형법 교재 전자책 구매
- 강의-교재 연동 학습

### 5. 분석 리포트
- 개인별 학습량 추적
- 진도율 및 취약 분야 분석
- 반복 학습 통계 그래프

## 🛠 기술 스택

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Redux Toolkit (상태 관리)
- React Query (서버 상태 관리)
- Chart.js (통계 시각화)

### Backend
- Node.js + Express
- TypeScript
- PostgreSQL
- Prisma ORM
- JWT 인증
- Firebase Cloud Messaging (푸시 알림)

### DevOps
- Docker
- GitHub Actions
- AWS / Vercel

## 📂 프로젝트 구조

```
criminal-law-master/
├── backend/                 # 백엔드 API 서버
│   ├── src/
│   │   ├── controllers/    # 요청 핸들러
│   │   ├── models/         # 데이터 모델
│   │   ├── routes/         # API 라우트
│   │   ├── middleware/     # 미들웨어
│   │   ├── services/       # 비즈니스 로직
│   │   ├── config/         # 설정 파일
│   │   ├── types/          # TypeScript 타입
│   │   └── utils/          # 유틸리티
│   └── tests/              # 테스트
│
├── frontend/               # 프론트엔드 React 앱
│   ├── src/
│   │   ├── components/    # React 컴포넌트
│   │   ├── pages/         # 페이지 컴포넌트
│   │   ├── services/      # API 서비스
│   │   ├── hooks/         # 커스텀 훅
│   │   ├── store/         # Redux 스토어
│   │   ├── types/         # TypeScript 타입
│   │   └── utils/         # 유틸리티
│   └── public/            # 정적 파일
│
└── docs/                   # 문서

```

## 🚀 시작하기

### 백엔드 실행

```bash
cd backend
npm install
npm run dev
```

### 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
```

## 📝 라이선스

MIT License

## 👥 개발자

GenSpark AI Developer
