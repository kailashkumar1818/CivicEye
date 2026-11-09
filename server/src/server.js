import app from './app.js';
import env from './config/env.js';
import logger from './utils/logger.js';
import { pool } from './db/pool.js';

const PORT = env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`CivicEye Server running in ${env.NODE_ENV} mode on port ${PORT}`);
  logger.info(`Health check available at http://localhost:${PORT}/api/health`);
});

// Graceful shutdown handling
const shutdown = (signal) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    logger.info('HTTP server closed.');
    try {
      await pool.end();
      logger.info('PostgreSQL pool drained.');
      process.exit(0);
    } catch (err) {
      logger.error({ err: err.message }, 'Error closing database pool');
      process.exit(1);
    }
  });

  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

