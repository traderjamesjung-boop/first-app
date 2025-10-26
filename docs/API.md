# 형법 마스터 API 문서

## 인증 (Authentication)

### POST /api/v1/auth/register
회원가입

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "홍길동",
  "phone": "010-1234-5678"
}
```

### POST /api/v1/auth/login
로그인

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "user": { ... },
    "token": "jwt-token",
    "refreshToken": "refresh-token"
  }
}
```

## 문제 (Questions)

### GET /api/v1/questions
문제 목록 조회

**Query Parameters:**
- page: 페이지 번호 (default: 1)
- limit: 페이지당 항목 수 (default: 20)
- categoryId: 카테고리 ID
- examType: 시험 유형 (CIVIL_SERVICE, BAR_EXAM, JUDICIAL_EXAM)
- difficulty: 난이도 (EASY, MEDIUM, HARD, EXPERT)
- keyword: 검색 키워드

### GET /api/v1/questions/:id
문제 상세 조회

### GET /api/v1/questions/random/daily
랜덤 문제 가져오기 (일일 학습용)

**Query Parameters:**
- count: 문제 개수 (default: 10)
- categoryIds: 카테고리 ID 배열
- difficulty: 난이도

### POST /api/v1/questions/:id/submit
답안 제출

**Request Body:**
```json
{
  "selectedAnswer": 1,
  "timeSpent": 120
}
```

## 학습 (Study)

### GET /api/v1/study/statistics
학습 통계 조회

### GET /api/v1/study/records/today
오늘의 학습 기록

### GET /api/v1/study/weaknesses
약점 분석

### GET /api/v1/study/streak
연속 학습 일수

## 강의 (Courses)

### GET /api/v1/courses
강의 목록 조회

### GET /api/v1/courses/:id
강의 상세 조회

### POST /api/v1/courses/:id/enroll
강의 수강 신청

## 전자책 (Ebooks)

### GET /api/v1/ebooks
전자책 목록 조회

### POST /api/v1/ebooks/:id/purchase
전자책 구매

### GET /api/v1/ebooks/:id/download
전자책 다운로드

## 결제 (Payments)

### POST /api/v1/payments/request
결제 요청

### POST /api/v1/payments/approve
결제 승인
