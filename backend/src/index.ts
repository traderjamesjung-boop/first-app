import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';

// Routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import questionRoutes from './routes/question.routes';
import studyRoutes from './routes/study.routes';
import courseRoutes from './routes/course.routes';
import ebookRoutes from './routes/ebook.routes';
import paymentRoutes from './routes/payment.routes';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;
const API_VERSION = process.env.API_VERSION || 'v1';

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: '형법 마스터 API 서버가 정상 작동 중입니다.',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/users`, userRoutes);
app.use(`/api/${API_VERSION}/questions`, questionRoutes);
app.use(`/api/${API_VERSION}/study`, studyRoutes);
app.use(`/api/${API_VERSION}/courses`, courseRoutes);
app.use(`/api/${API_VERSION}/ebooks`, ebookRoutes);
app.use(`/api/${API_VERSION}/payments`, paymentRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║         🎓 형법 마스터 (Criminal Law Master)             ║
║                                                           ║
║         백엔드 API 서버가 시작되었습니다!                ║
║                                                           ║
║         포트: ${PORT}                                      ║
║         환경: ${process.env.NODE_ENV || 'development'}   ║
║         API: /api/${API_VERSION}                          ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

export default app;
