import app from './app';
import { config } from './config/environment';
import prisma from './config/database';
import { logger } from './utils/logger';

const startServer = async (): Promise<void> => {
  const startTime = Date.now();
  
  logger.info('Starting server initialization', {
    nodeEnv: config.nodeEnv,
    port: config.port,
    logLevel: process.env.LOG_LEVEL || 'INFO'
  });
  
  try {
    // Test database connection
    logger.info('Connecting to database');
    await prisma.$connect();
    logger.info('Database connected successfully', {
      provider: 'postgresql' // or whatever your DB provider is
    });

    // Start server
    logger.info('Starting HTTP server');
    app.listen(config.port, () => {
      const duration = Date.now() - startTime;
      logger.info('Server started successfully', {
        port: config.port,
        environment: config.nodeEnv,
        startupDuration: duration,
        processId: process.pid,
        nodeVersion: process.version
      });
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Failed to start server', error as Error, {
      port: config.port,
      environment: config.nodeEnv,
      failureDuration: duration
    });
    process.exit(1);
  }
};

// Graceful shutdown handlers
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info('Graceful shutdown initiated', {
    signal,
    processId: process.pid
  });
  
  try {
    logger.info('Disconnecting from database');
    await prisma.$disconnect();
    logger.info('Database disconnected successfully');
    
    logger.info('Server shutdown completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown', error as Error, {
      signal
    });
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught exception', error, {
    processId: process.pid
  });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled promise rejection', reason instanceof Error ? reason : new Error(String(reason)), {
    promise: promise.toString(),
    processId: process.pid
  });
  process.exit(1);
});

startServer();