import prisma from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken, generateRefreshToken } from '../utils/jwt';
import { RegisterRequest, LoginRequest, AuthResponse, PasswordResetConfirm } from '../types/auth';
import { TokenType } from '@prisma/client';
import { emailService } from './emailService';
import crypto from 'crypto';

class AuthService {
  async register(userData: RegisterRequest): Promise<{ user: any }> {
    const { email, password, firstName, lastName, phone, role } = userData;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
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

    // Generate verification token
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
    try {
      await emailService.sendVerificationEmail(email, verificationToken);
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // Continue with registration even if email fails
    }

    return { user };
  }

  async login(loginData: LoginRequest): Promise<AuthResponse> {
    const { email, password, rememberMe = false } = loginData;

    // Find user
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
      throw new Error('Invalid email or password');
    }

    // Check password
    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Generate JWT tokens
    const payload = {
      userId: user.id,
      email: user.email,
    };

    const token = generateToken(payload, rememberMe);
    const refreshToken = generateRefreshToken(payload);

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
  }

  async verifyEmail(token: string): Promise<void> {
    const tokenRecord = await prisma.token.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!tokenRecord || tokenRecord.type !== TokenType.EMAIL_VERIFICATION) {
      throw new Error('Invalid verification token');
    }

    if (tokenRecord.expiresAt < new Date()) {
      throw new Error('Verification token has expired');
    }

    // Update user as verified
    await prisma.user.update({
      where: { id: tokenRecord.userId },
      data: { isVerified: true }
    });

    // Delete used token
    await prisma.token.delete({
      where: { id: tokenRecord.id }
    });
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Don't reveal if email exists
      return;
    }

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

    // Send reset email
    try {
      await emailService.sendPasswordResetEmail(email, resetToken);
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      // Don't throw error to avoid revealing if email exists
    }
  }

  async resetPassword(resetData: PasswordResetConfirm): Promise<void> {
    const { token, newPassword } = resetData;

    const tokenRecord = await prisma.token.findUnique({
      where: { token }
    });

    if (!tokenRecord || tokenRecord.type !== TokenType.PASSWORD_RESET) {
      throw new Error('Invalid reset token');
    }

    if (tokenRecord.expiresAt < new Date()) {
      throw new Error('Reset token has expired');
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update user password
    await prisma.user.update({
      where: { id: tokenRecord.userId },
      data: { passwordHash }
    });

    // Delete used token
    await prisma.token.delete({
      where: { id: tokenRecord.id }
    });
  }
}

export const authService = new AuthService();