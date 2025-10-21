import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/error-handler';
import { rateLimiter } from './middleware/rate-limiter';
import { logger } from './utils/logger';
import authRoutes from './routes/auth.routes';
import testRoutes from './routes/test.routes';
import userRoutes from './routes/user.routes';
import lessonRoutes from './routes/lesson.routes';
import achievementRoutes from './routes/achievement.routes';
import gameRoutes from './routes/game.routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const API_VERSION = process.env.API_VERSION || 'v1';

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/tests`, testRoutes);
app.use(`/api/${API_VERSION}/users`, userRoutes);
app.use(`/api/${API_VERSION}/lessons`, lessonRoutes);
app.use(`/api/${API_VERSION}/achievements`, achievementRoutes);
app.use(`/api/${API_VERSION}/games`, gameRoutes);

// 404 handler
app.use((req, res) => {
  void req;
  res.status(404).json({ error: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📡 Environment: ${process.env.NODE_ENV}`);
  logger.info(`🔗 API Version: ${API_VERSION}`);
});

export default app;
