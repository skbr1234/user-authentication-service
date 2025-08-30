import { Request, Response } from 'express';
import { authService } from '../services/authService';
import { RegisterRequest, LoginRequest, PasswordResetRequest, PasswordResetConfirm } from '../types/auth';

class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const userData: RegisterRequest = req.body;
      const result = await authService.register(userData);
      
      res.status(201).json({
        message: 'Registration successful. Please check your email for verification.',
        user: result.user
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const loginData: LoginRequest = req.body;
      const result = await authService.login(loginData);
      
      res.json({
        message: 'Login successful',
        ...result
      });
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }

  async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.params;
      await authService.verifyEmail(token);
      
      res.json({ message: 'Email verified successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email }: PasswordResetRequest = req.body;
      await authService.forgotPassword(email);
      
      res.json({ message: 'Password reset email sent' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const resetData: PasswordResetConfirm = req.body;
      await authService.resetPassword(resetData);
      
      res.json({ message: 'Password reset successful' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const authController = new AuthController();