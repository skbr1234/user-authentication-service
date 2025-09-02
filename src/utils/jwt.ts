import jwt from 'jsonwebtoken';
import { config } from '../config/environment';
import { JwtPayload } from '../types/auth';
import { logger } from './logger';

export const generateToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>, rememberMe: boolean = false): string => {
  const expiresIn = rememberMe ? '30d' : config.jwt.expiresIn;
  
  logger.debug('Generating JWT token', {
    userId: payload.userId,
    email: payload.email,
    expiresIn,
    rememberMe
  });
  
  try {
    const token = jwt.sign(payload, config.jwt.secret, {
      expiresIn,
    } as jwt.SignOptions);
    
    logger.debug('JWT token generated successfully', {
      userId: payload.userId,
      tokenLength: token.length
    });
    
    return token;
  } catch (error) {
    logger.error('Failed to generate JWT token', error as Error, {
      userId: payload.userId,
      email: payload.email
    });
    throw error;
  }
};

export const generateRefreshToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string => {
  logger.debug('Generating refresh token', {
    userId: payload.userId,
    email: payload.email
  });
  
  try {
    const token = jwt.sign(payload, config.jwt.secret, {
      expiresIn: '30d',
    } as jwt.SignOptions);
    
    logger.debug('Refresh token generated successfully', {
      userId: payload.userId,
      tokenLength: token.length
    });
    
    return token;
  } catch (error) {
    logger.error('Failed to generate refresh token', error as Error, {
      userId: payload.userId,
      email: payload.email
    });
    throw error;
  }
};

export const verifyToken = (token: string): JwtPayload => {
  logger.debug('Verifying JWT token', {
    tokenLength: token?.length
  });
  
  try {
    const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;
    
    logger.debug('JWT token verified successfully', {
      userId: payload.userId,
      email: payload.email
    });
    
    return payload;
  } catch (error) {
    logger.warn('JWT token verification failed', {
      tokenLength: token?.length,
      error: (error as Error).message
    });
    throw error;
  }
};