import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import axios from 'axios';
import env from './config/env.js';
import logger from './utils/logger.js';
import { checkDbHealth } from './db/pool.js';
import errorHandler from './middleware/errorHandler.js';
import ApiError from './utils/ApiError.js';
import authRoutes from './modules/auth/auth.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import analyticsRoutes from './modules/analytics/analytics.routes.js';
import reportsRoutes from './modules/reports/reports.routes.js';
import mapRoutes from './modules/map/map.routes.js';
import notificationsRoutes from './modules/notifications/notifications.routes.js';

const app = express();

// Trust reverse proxy (for Render/production IP rate limiting)
app.set('trust proxy', 1);

// Security headers
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (env.CORS_ORIGINS.includes(origin) || env.CORS_ORIGINS.includes('*')) {
      return callback(null, true);
    }
    return callback(new ApiError(403, `Origin ${origin} not allowed by CORS`, 'CORS_ERROR'));
  },
  credentials: true,
};
app.use(cors(corsOptions));

// HTTP Request Logger
app.use(
  pinoHttp({
    logger,
    autoLogging: {
      ignore: (req) => req.url === '/api/health' || req.url === '/health',
    },
  })
);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check handler
const healthHandler = async (req, res) => {
  const dbHealthy = await checkDbHealth();
  const dbStatus = dbHealthy ? 'up' : 'down';

  let aiStatus = 'down';
  try {
    const aiResponse = await axios.get(`${env.AI_SERVICE_URL}/health`, {
      timeout: Math.min(env.AI_REQUEST_TIMEOUT_MS, 3000),
      headers: {
        'X-API-Key': env.AI_SERVICE_API_KEY,
      },
    });
    if (aiResponse.status === 200 && aiResponse.data?.status === 'ok') {
      aiStatus = 'up';
    }
  } catch {
    aiStatus = 'down';
  }

  const overallStatus = dbHealthy ? 'ok' : 'degraded';
  const statusCode = 200;

  return res.status(statusCode).json({
    success: true,
    status: overallStatus,
    db: dbStatus,
    ai: aiStatus,
    data: {
      status: overallStatus,
      db: dbStatus,
      ai: aiStatus,
    },
  });
};

// Mount health routes on both /api/health and /health
app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

// API Modules
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/reports/map', (req, res, next) => {
  req.url = '/reports';
  mapRoutes(req, res, next);
});
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);

// 404 handler for unmatched routes
app.use((req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
});

// Centralized error handler
app.use(errorHandler);

export default app;

