import prisma from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { RegisterRequest, LoginRequest, AuthResponse, PasswordResetConfirm } from '../types/auth';
import { TokenType } from '@prisma/client';
import crypto from 'crypto';

class AuthService {
  async register(userData: RegisterRequest): Promise<{ user: any }> {
    const { email, password, firstName, lastName } = userData;

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
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
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

    // TODO: Send verification email
    console.log(`Verification token for ${email}: ${verificationToken}`);

    return { user };
  }

  async login(loginData: LoginRequest): Promise<AuthResponse> {
    const { email, password } = loginData;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || !user.passwordHash) {
      throw new Error('Invalid email or password');
    }

    // Check password
    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isVerified: user.isVerified,
      },
      token,
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

    // TODO: Send reset email
    console.log(`Password reset token for ${email}: ${resetToken}`);
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