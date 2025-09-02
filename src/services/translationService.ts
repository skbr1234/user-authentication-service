import { logger } from '../utils/logger';

interface EmailTranslations {
  verification: {
    subject: string;
    title: string;
    greeting: string;
    instruction: string;
    button: string;
    alternative: string;
    footer: string;
  };
  passwordReset: {
    subject: string;
    title: string;
    greeting: string;
    instruction: string;
    button: string;
    alternative: string;
    footer: string;
  };
}

const translations: Record<string, EmailTranslations> = {
  en: {
    verification: {
      subject: 'Verify Your Email - MyGolya',
      title: 'Verify Your Email Address',
      greeting: 'Thank you for registering with MyGolya!',
      instruction: 'Please click the button below to verify your email address:',
      button: 'Verify Email',
      alternative: 'Or copy and paste this link in your browser:',
      footer: 'This link will expire in 24 hours. If you didn\'t create an account, please ignore this email.'
    },
    passwordReset: {
      subject: 'Reset Your Password - MyGolya',
      title: 'Reset Your Password',
      greeting: 'You requested to reset your password for MyGolya.',
      instruction: 'Please click the button below to reset your password:',
      button: 'Reset Password',
      alternative: 'Or copy and paste this link in your browser:',
      footer: 'This link will expire in 1 hour. If you didn\'t request this, please ignore this email.'
    }
  },
  ar: {
    verification: {
      subject: 'تحقق من بريدك الإلكتروني - MyGolya',
      title: 'تحقق من عنوان بريدك الإلكتروني',
      greeting: 'شكراً لك على التسجيل في MyGolya!',
      instruction: 'يرجى النقر على الزر أدناه للتحقق من عنوان بريدك الإلكتروني:',
      button: 'تحقق من البريد الإلكتروني',
      alternative: 'أو انسخ والصق هذا الرابط في متصفحك:',
      footer: 'ستنتهي صلاحية هذا الرابط خلال 24 ساعة. إذا لم تقم بإنشاء حساب، يرجى تجاهل هذا البريد الإلكتروني.'
    },
    passwordReset: {
      subject: 'إعادة تعيين كلمة المرور - MyGolya',
      title: 'إعادة تعيين كلمة المرور',
      greeting: 'لقد طلبت إعادة تعيين كلمة المرور الخاصة بك في MyGolya.',
      instruction: 'يرجى النقر على الزر أدناه لإعادة تعيين كلمة المرور:',
      button: 'إعادة تعيين كلمة المرور',
      alternative: 'أو انسخ والصق هذا الرابط في متصفحك:',
      footer: 'ستنتهي صلاحية هذا الرابط خلال ساعة واحدة. إذا لم تطلب هذا، يرجى تجاهل هذا البريد الإلكتروني.'
    }
  }
};

class TranslationService {
  getEmailTranslations(locale: string = 'en'): EmailTranslations {
    logger.debug('Getting email translations', { locale, available: Object.keys(translations) });
    
    const translation = translations[locale] || translations.en;
    const usedLocale = translations[locale] ? locale : 'en';
    
    if (usedLocale !== locale) {
      logger.warn('Requested locale not available, falling back to English', {
        requestedLocale: locale,
        usedLocale,
        availableLocales: Object.keys(translations)
      });
    }
    
    return translation;
  }

  detectLocaleFromEmail(email: string): string {
    logger.debug('Detecting locale from email', { email });
    
    // Simple heuristic - could be enhanced with user preferences from DB
    const domain = email.split('@')[1]?.toLowerCase();
    
    logger.debug('Extracted domain for locale detection', { domain });
    
    // Arabic domains
    const arabicDomains = ['.sa', '.ae', '.eg', '.jo', '.lb', '.sy', '.iq', '.kw', '.qa', '.bh', '.om', '.ye', '.ly', '.dz', '.ma', '.tn', '.sd'];
    const isArabicDomain = arabicDomains.some(arabicDomain => domain?.includes(arabicDomain));
    
    if (isArabicDomain) {
      logger.debug('Arabic locale detected from domain', { domain, detectedLocale: 'ar' });
      return 'ar';
    }
    
    logger.debug('Default English locale used', { domain, detectedLocale: 'en' });
    return 'en'; // Default to English
  }
}

export const translationService = new TranslationService();

logger.info('Translation service initialized', {
  supportedLocales: Object.keys(translations),
  defaultLocale: 'en'
});