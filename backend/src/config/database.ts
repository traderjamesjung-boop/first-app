import { PrismaClient } from '@prisma/client';

// Prisma 클라이언트 싱글톤 인스턴스
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
});

// 연결 테스트
export const connectDatabase = async () => {
  try {
    await prisma.$connect();
    console.log('✅ 데이터베이스 연결 성공');
  } catch (error) {
    console.error('❌ 데이터베이스 연결 실패:', error);
    process.exit(1);
  }
};

// 연결 종료
export const disconnectDatabase = async () => {
  await prisma.$disconnect();
  console.log('🔌 데이터베이스 연결 종료');
};

// Graceful shutdown
process.on('SIGINT', async () => {
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDatabase();
  process.exit(0);
});

export default prisma;
