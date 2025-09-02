import { Request, Response } from 'express';
import { authService } from '../services/authService';
import { RegisterRequest, LoginRequest, PasswordResetRequest, PasswordResetConfirm } from '../types/auth';
import { logger } from '../utils/logger';
import crypto from 'crypto';

class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();
    
    try {
      const userData: RegisterRequest = req.body;
      
      logger.info('Registration attempt started', {
        email: userData.email,
        role: userData.role,
        hasPhone: !!userData.phone,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      }, { requestId });
      
      const result = await authService.register(userData);
      
      const duration = Date.now() - startTime;
      logger.info('Registration completed successfully', {
        userId: result.user.id,
        email: result.user.email,
        duration
      }, { requestId, userId: result.user.id });
      
      res.status(201).json({
        message: 'Registration successful. Please check your email for verification.',
        user: result.user
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error('Registration failed', error, {
        email: req.body?.email,
        duration,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      }, { requestId });
      
      res.status(400).json({ error: error.message });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();
    
    try {
      const loginData: LoginRequest = req.body;
      
      logger.info('Login attempt started', {
        email: loginData.email,
        rememberMe: loginData.rememberMe,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      }, { requestId });
      
      const result = await authService.login(loginData);
      
      const duration = Date.now() - startTime;
      logger.info('Login completed successfully', {
        userId: result.user.id,
        email: result.user.email,
        isVerified: result.user.isVerified,
        duration
      }, { requestId, userId: result.user.id });
      
      res.json({
        message: 'Login successful',
        ...result
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error('Login failed', error, {
        email: req.body?.email,
        duration,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      }, { requestId });
      
      res.status(401).json({ error: error.message });
    }
  }

  async verifyEmail(req: Request, res: Response): Promise<void> {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();
    
    try {
      const { token } = req.params;
      
      logger.info('Email verification attempt started', {
        tokenLength: token?.length,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      }, { requestId });
      
      const result = await authService.verifyEmail(token);
      
      const duration = Date.now() - startTime;
      logger.info('Email verification completed successfully', {
        userId: result?.userId,
        duration
      }, { requestId, userId: result?.userId });
      
      res.json({ message: 'Email verified successfully' });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error('Email verification failed', error, {
        tokenLength: req.params?.token?.length,
        duration,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      }, { requestId });
      
      res.status(400).json({ error: error.message });
    }
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();
    
    try {
      const { email }: PasswordResetRequest = req.body;
      
      logger.info('Password reset request started', {
        email,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      }, { requestId });
      
      await authService.forgotPassword(email);
      
      const duration = Date.now() - startTime;
      logger.info('Password reset request completed', {
        email,
        duration
      }, { requestId });
      
      res.json({ message: 'Password reset email sent' });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error('Password reset request failed', error, {
        email: req.body?.email,
        duration,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      }, { requestId });
      
      res.status(400).json({ error: error.message });
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();
    
    try {
      const resetData: PasswordResetConfirm = req.body;
      
      logger.info('Password reset confirmation started', {
        tokenLength: resetData.token?.length,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      }, { requestId });
      
      const result = await authService.resetPassword(resetData);
      
      const duration = Date.now() - startTime;
      logger.info('Password reset completed successfully', {
        userId: result?.userId,
        duration
      }, { requestId, userId: result?.userId });
      
      res.json({ message: 'Password reset successful' });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error('Password reset failed', error, {
        tokenLength: req.body?.token?.length,
        duration,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      }, { requestId });
      
      res.status(400).json({ error: error.message });
    }
  }
}

export const authController = new AuthController();