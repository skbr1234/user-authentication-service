import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth';
import prisma from './config/database';
import { logger } from './utils/logger';
import crypto from 'crypto';

const app = express();

logger.info('Initializing Express application');

// Request logging middleware
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  
  // Add requestId to request for tracking
  (req as any).requestId = requestId;
  
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    requestId
  });
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      requestId
    });
  });
  
  next();
});

// Security middleware
logger.debug('Setting up security middleware');
app.use(helmet());

// CORS - Allow everything for development
logger.debug('Setting up CORS middleware');
app.use(cors({
  origin: '*',
  credentials: true,
  methods: '*',
  allowedHeaders: '*',
}));

// Rate limiting
logger.debug('Setting up rate limiting middleware');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  onLimitReached: (req) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path
    });
  }
});
app.use(limiter);

// Body parsing
logger.debug('Setting up body parsing middleware');
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
logger.debug('Setting up routes');
app.use('/api/auth', authRoutes);

// Health check
app.get('/health', async (req, res) => {
  const requestId = (req as any).requestId || crypto.randomUUID();
  const startTime = Date.now();
  
  logger.debug('Health check requested', { requestId });
  
  try {
    // Check database connectivity
    logger.debug('Testing database connection', { requestId });
    await prisma.$queryRaw`SELECT 1`;
    
    const duration = Date.now() - startTime;
    logger.info('Health check passed', {
      status: 'OK',
      databaseStatus: 'connected',
      duration,
      requestId
    });
    
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Health check failed', error as Error, {
      status: 'ERROR',
      databaseStatus: 'disconnected',
      duration,
      requestId
    });
    
    res.status(503).json({ 
      status: 'ERROR', 
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: 'Database connection failed'
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  const requestId = (req as any).requestId || crypto.randomUUID();
  
  logger.warn('Route not found', {
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    requestId
  });
  
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const requestId = (req as any).requestId || crypto.randomUUID();
  
  logger.error('Unhandled application error', err, {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.body,
    requestId
  });
  
  res.status(500).json({ error: 'Something went wrong!' });
});

logger.info('Express application setup completed');

export default app;