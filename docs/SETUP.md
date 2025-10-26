# 형법 마스터 설치 가이드

## 사전 요구사항

- Node.js 18.x 이상
- PostgreSQL 14.x 이상
- npm 또는 yarn

## 설치 단계

### 1. 저장소 클론

```bash
git clone <repository-url>
cd webapp
```

### 2. 백엔드 설정

```bash
cd backend
npm install
```

환경 변수 설정:
```bash
cp .env.example .env
# .env 파일을 편집하여 데이터베이스 연결 정보 등을 설정
```

데이터베이스 마이그레이션:
```bash
npx prisma migrate dev
npx prisma generate
```

백엔드 서버 실행:
```bash
npm run dev
```

### 3. 프론트엔드 설정

```bash
cd ../frontend
npm install
```

환경 변수 설정:
```bash
cp .env.example .env
# .env 파일을 편집하여 API URL 등을 설정
```

프론트엔드 개발 서버 실행:
```bash
npm run dev
```

## 접속

- 프론트엔드: http://localhost:5173
- 백엔드 API: http://localhost:5000/api/v1
- API Health Check: http://localhost:5000/health

## 초기 데이터

초기 문제 데이터를 추가하려면:

```bash
cd backend
npm run seed
```

## 문제 해결

### PostgreSQL 연결 오류

1. PostgreSQL이 실행 중인지 확인
2. .env 파일의 DATABASE_URL이 올바른지 확인
3. 데이터베이스가 생성되었는지 확인

### Port 충돌

이미 사용 중인 포트가 있다면:
- 백엔드: .env의 PORT 변경
- 프론트엔드: vite.config.ts의 server.port 변경
