import { Router } from 'express';
import { authController } from '../controllers/authController';
import { validateRequest } from '../middleware/validation';
import { registerSchema, loginSchema, passwordResetSchema, passwordResetConfirmSchema } from '../utils/validators';

const router = Router();

// Register
router.post('/register', validateRequest(registerSchema), authController.register);

// Login
router.post('/login', validateRequest(loginSchema), authController.login);

// Email verification
router.get('/verify-email/:token', authController.verifyEmail);

// Password reset request
router.post('/forgot-password', validateRequest(passwordResetSchema), authController.forgotPassword);

// Password reset confirm
router.post('/reset-password', validateRequest(passwordResetConfirmSchema), authController.resetPassword);

export default router;