import nodemailer from 'nodemailer';
import { translationService } from './translationService';

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendVerificationEmail(email: string, token: string, locale?: string): Promise<void> {
    const detectedLocale = locale || translationService.detectLocaleFromEmail(email);
    const t = translationService.getEmailTranslations(detectedLocale);
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
    const isRTL = detectedLocale === 'ar';
    
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: t.verification.subject,
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; direction: ${isRTL ? 'rtl' : 'ltr'};">
          <h2 style="color: #333; text-align: center;">${t.verification.title}</h2>
          <p>${t.verification.greeting}</p>
          <p>${t.verification.instruction}</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              ${t.verification.button}
            </a>
          </div>
          <p>${t.verification.alternative}</p>
          <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            ${t.verification.footer}
          </p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendPasswordResetEmail(email: string, token: string, locale?: string): Promise<void> {
    const detectedLocale = locale || translationService.detectLocaleFromEmail(email);
    const t = translationService.getEmailTranslations(detectedLocale);
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    const isRTL = detectedLocale === 'ar';
    
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: t.passwordReset.subject,
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; direction: ${isRTL ? 'rtl' : 'ltr'};">
          <h2 style="color: #333; text-align: center;">${t.passwordReset.title}</h2>
          <p>${t.passwordReset.greeting}</p>
          <p>${t.passwordReset.instruction}</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              ${t.passwordReset.button}
            </a>
          </div>
          <p>${t.passwordReset.alternative}</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            ${t.passwordReset.footer}
          </p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }
}

export const emailService = new EmailService();