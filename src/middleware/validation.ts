import { Request, Response, NextFunction } from 'express';
import { Schema } from 'joi';
import { logger } from '../utils/logger';
import crypto from 'crypto';

export const validateRequest = (schema: Schema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();
    
    logger.debug('Request validation started', {
      method: req.method,
      path: req.path,
      hasBody: !!req.body,
      bodyKeys: req.body ? Object.keys(req.body) : [],
      requestId
    });
    
    const { error } = schema.validate(req.body);
    
    if (error) {
      const duration = Date.now() - startTime;
      const validationErrors = error.details.map(detail => detail.message);
      
      logger.warn('Request validation failed', {
        method: req.method,
        path: req.path,
        errors: validationErrors,
        duration,
        requestId
      });
      
      res.status(400).json({
        error: 'Validation failed',
        details: validationErrors
      });
      return;
    }
    
    const duration = Date.now() - startTime;
    logger.debug('Request validation passed', {
      method: req.method,
      path: req.path,
      duration,
      requestId
    });
    
    next();
  };
};