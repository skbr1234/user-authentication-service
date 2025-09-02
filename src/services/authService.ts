import prisma from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken, generateRefreshToken } from '../utils/jwt';
import { RegisterRequest, LoginRequest, AuthResponse, PasswordResetConfirm } from '../types/auth';
import { TokenType } from '@prisma/client';
import { emailService } from './emailService';
import { logger } from '../utils/logger';
import crypto from 'crypto';

class AuthService {
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const { email, password, firstName, lastName, phone, role } = userData;
    const operationId = crypto.randomUUID();

    logger.info('User registration process started', {
      email,
      role,
      hasPhone: !!phone,
      operationId
    });

    try {
      // Check if user exists
      logger.debug('Checking for existing user', { email, operationId });
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        logger.warn('Registration attempt with existing email', {
          email,
          existingUserId: existingUser.id,
          operationId
        });
        throw new Error('User already exists with this email');
      }

      // Hash password
      logger.debug('Hashing password', { operationId });
      const passwordHash = await hashPassword(password);

      // Create user
      logger.debug('Creating user in database', { email, role, operationId });
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          phone,
          role: role === 'buyer_renter' ? 'BUYER_RENTER' : 'SELLER_LANDLORD',
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isVerified: true,
          createdAt: true,
        }
      });

      logger.info('User created successfully', {
        userId: user.id,
        email: user.email,
        role: user.role,
        operationId
      });

      // Generate verification token
      logger.debug('Generating verification token', { userId: user.id, operationId });
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const tokenRecord = await prisma.token.create({
        data: {
          token: verificationToken,
          type: TokenType.EMAIL_VERIFICATION,
          userId: user.id,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        }
      });
      
      logger.debug('Token created in database', {
        tokenId: tokenRecord.id,
        token: verificationToken,
        userId: user.id,
        expiresAt: tokenRecord.expiresAt,
        operationId
      });

      logger.info('Verification token created', {
        userId: user.id,
        tokenType: 'EMAIL_VERIFICATION',
        expiresIn: '24h',
        operationId
      });

      // Send verification email
      try {
        logger.debug('Sending verification email', { userId: user.id, email, operationId });
        await emailService.sendVerificationEmail(email, verificationToken);
        logger.info('Verification email sent successfully', { userId: user.id, email, operationId });
      } catch (error) {
        logger.error('Failed to send verification email', error as Error, {
          userId: user.id,
          email,
          operationId
        });
        // Continue with registration even if email fails
      }

      // Generate JWT tokens for immediate login
      logger.debug('Generating JWT tokens for new user', {
        userId: user.id,
        operationId
      });
      
      const payload = {
        userId: user.id,
        email: user.email,
      };

      const token = generateToken(payload, false);
      const refreshToken = generateRefreshToken(payload);

      logger.info('User registration completed successfully', {
        userId: user.id,
        email: user.email,
        tokenGenerated: true,
        operationId
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          phone: user.phone || undefined,
          role: user.role === 'BUYER_RENTER' ? 'buyer_renter' : 'seller_landlord',
          isVerified: user.isVerified,
        },
        token,
        refreshToken,
      };
    } catch (error) {
      logger.error('User registration failed', error as Error, {
        email,
        role,
        operationId
      });
      throw error;
    }
  }

  async login(loginData: LoginRequest): Promise<AuthResponse> {
    const { email, password, rememberMe = false } = loginData;
    const operationId = crypto.randomUUID();

    logger.info('User login process started', {
      email,
      rememberMe,
      operationId
    });

    try {
      // Find user
      logger.debug('Looking up user in database', { email, operationId });
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          passwordHash: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isVerified: true,
        }
      });

      if (!user || !user.passwordHash) {
        logger.warn('Login attempt with invalid email', { email, operationId });
        throw new Error('Invalid email or password');
      }

      logger.debug('User found, verifying password', {
        userId: user.id,
        email: user.email,
        isVerified: user.isVerified,
        operationId
      });

      // Check password
      const isValidPassword = await comparePassword(password, user.passwordHash);
      if (!isValidPassword) {
        logger.warn('Login attempt with invalid password', {
          userId: user.id,
          email,
          operationId
        });
        throw new Error('Invalid email or password');
      }

      logger.info('Password verified successfully', {
        userId: user.id,
        email,
        operationId
      });

      // Generate JWT tokens
      logger.debug('Generating JWT tokens', {
        userId: user.id,
        rememberMe,
        operationId
      });
      
      const payload = {
        userId: user.id,
        email: user.email,
      };

      const token = generateToken(payload, rememberMe);
      const refreshToken = generateRefreshToken(payload);

      logger.info('Login completed successfully', {
        userId: user.id,
        email,
        isVerified: user.isVerified,
        tokenGenerated: true,
        operationId
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          phone: user.phone || undefined,
          role: user.role === 'BUYER_RENTER' ? 'buyer_renter' : 'seller_landlord',
          isVerified: user.isVerified,
        },
        token,
        refreshToken,
      };
    } catch (error) {
      logger.error('User login failed', error as Error, {
        email,
        operationId
      });
      throw error;
    }
  }

  async verifyEmail(token: string): Promise<{ userId: string }> {
    const operationId = crypto.randomUUID();

    logger.info('Email verification process started', {
      tokenLength: token?.length,
      operationId
    });

    try {
      logger.debug('Looking up verification token', { operationId });
      const tokenRecord = await prisma.token.findUnique({
        where: { token },
        include: { user: true }
      });

      if (!tokenRecord || tokenRecord.type !== TokenType.EMAIL_VERIFICATION) {
        logger.warn('Invalid verification token provided', {
          tokenExists: !!tokenRecord,
          tokenType: tokenRecord?.type,
          operationId
        });
        throw new Error('Invalid verification token');
      }

      if (tokenRecord.expiresAt < new Date()) {
        logger.warn('Expired verification token used', {
          userId: tokenRecord.userId,
          expiresAt: tokenRecord.expiresAt,
          operationId
        });
        throw new Error('Verification token has expired');
      }

      logger.debug('Valid token found, updating user verification status', {
        userId: tokenRecord.userId,
        email: tokenRecord.user.email,
        operationId
      });

      // Update user as verified
      await prisma.user.update({
        where: { id: tokenRecord.userId },
        data: { isVerified: true }
      });

      logger.info('User email verified successfully', {
        userId: tokenRecord.userId,
        email: tokenRecord.user.email,
        operationId
      });

      // Delete used token
      logger.debug('Deleting used verification token', {
        tokenId: tokenRecord.id,
        userId: tokenRecord.userId,
        operationId
      });
      
      await prisma.token.delete({
        where: { id: tokenRecord.id }
      });

      logger.info('Email verification completed successfully', {
        userId: tokenRecord.userId,
        operationId
      });

      return { userId: tokenRecord.userId };
    } catch (error) {
      logger.error('Email verification failed', error as Error, {
        tokenLength: token?.length,
        operationId
      });
      throw error;
    }
  }

  async forgotPassword(email: string): Promise<void> {
    const operationId = crypto.randomUUID();

    logger.info('Password reset request started', {
      email,
      operationId
    });

    try {
      logger.debug('Looking up user for password reset', { email, operationId });
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        logger.info('Password reset requested for non-existent email', {
          email,
          operationId
        });
        // Don't reveal if email exists
        return;
      }

      logger.debug('User found, generating reset token', {
        userId: user.id,
        email,
        operationId
      });

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      await prisma.token.create({
        data: {
          token: resetToken,
          type: TokenType.PASSWORD_RESET,
          userId: user.id,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        }
      });

      logger.info('Password reset token created', {
        userId: user.id,
        email,
        tokenType: 'PASSWORD_RESET',
        expiresIn: '1h',
        operationId
      });

      // Send reset email
      try {
        logger.debug('Sending password reset email', {
          userId: user.id,
          email,
          operationId
        });
        await emailService.sendPasswordResetEmail(email, resetToken);
        logger.info('Password reset email sent successfully', {
          userId: user.id,
          email,
          operationId
        });
      } catch (error) {
        logger.error('Failed to send password reset email', error as Error, {
          userId: user.id,
          email,
          operationId
        });
        // Don't throw error to avoid revealing if email exists
      }

      logger.info('Password reset request completed', {
        userId: user.id,
        email,
        operationId
      });
    } catch (error) {
      logger.error('Password reset request failed', error as Error, {
        email,
        operationId
      });
      throw error;
    }
  }

  async resendVerificationEmail(email: string): Promise<void> {
    const operationId = crypto.randomUUID();

    logger.info('Resend verification email request started', {
      email,
      operationId
    });

    try {
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (user.isVerified) {
        throw new Error('Email is already verified');
      }

      // Delete existing verification tokens
      await prisma.token.deleteMany({
        where: {
          userId: user.id,
          type: TokenType.EMAIL_VERIFICATION
        }
      });

      // Generate new verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      await prisma.token.create({
        data: {
          token: verificationToken,
          type: TokenType.EMAIL_VERIFICATION,
          userId: user.id,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        }
      });

      // Send verification email
      await emailService.sendVerificationEmail(email, verificationToken);

      logger.info('Verification email resent successfully', {
        userId: user.id,
        email,
        operationId
      });
    } catch (error) {
      logger.error('Resend verification email failed', error as Error, {
        email,
        operationId
      });
      throw error;
    }
  }

  async resetPassword(resetData: PasswordResetConfirm): Promise<{ userId: string }> {
    const { token, newPassword } = resetData;
    const operationId = crypto.randomUUID();

    logger.info('Password reset confirmation started', {
      tokenLength: token?.length,
      operationId
    });

    try {
      logger.debug('Looking up password reset token', { operationId });
      const tokenRecord = await prisma.token.findUnique({
        where: { token }
      });

      if (!tokenRecord || tokenRecord.type !== TokenType.PASSWORD_RESET) {
        logger.warn('Invalid password reset token provided', {
          tokenExists: !!tokenRecord,
          tokenType: tokenRecord?.type,
          operationId
        });
        throw new Error('Invalid reset token');
      }

      if (tokenRecord.expiresAt < new Date()) {
        logger.warn('Expired password reset token used', {
          userId: tokenRecord.userId,
          expiresAt: tokenRecord.expiresAt,
          operationId
        });
        throw new Error('Reset token has expired');
      }

      logger.debug('Valid reset token found, hashing new password', {
        userId: tokenRecord.userId,
        operationId
      });

      // Hash new password
      const passwordHash = await hashPassword(newPassword);

      logger.debug('Updating user password', {
        userId: tokenRecord.userId,
        operationId
      });

      // Update user password
      await prisma.user.update({
        where: { id: tokenRecord.userId },
        data: { passwordHash }
      });

      logger.info('User password updated successfully', {
        userId: tokenRecord.userId,
        operationId
      });

      // Delete used token
      logger.debug('Deleting used reset token', {
        tokenId: tokenRecord.id,
        userId: tokenRecord.userId,
        operationId
      });
      
      await prisma.token.delete({
        where: { id: tokenRecord.id }
      });

      logger.info('Password reset completed successfully', {
        userId: tokenRecord.userId,
        operationId
      });

      return { userId: tokenRecord.userId };
    } catch (error) {
      logger.error('Password reset failed', error as Error, {
        tokenLength: token?.length,
        operationId
      });
      throw error;
    }
  }
}

export const authService = new AuthService();