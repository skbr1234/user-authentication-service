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
    return translations[locale] || translations.en;
  }

  detectLocaleFromEmail(email: string): string {
    // Simple heuristic - could be enhanced with user preferences from DB
    const domain = email.split('@')[1]?.toLowerCase();
    
    // Arabic domains
    if (domain?.includes('.sa') || domain?.includes('.ae') || domain?.includes('.eg') || 
        domain?.includes('.jo') || domain?.includes('.lb') || domain?.includes('.sy') ||
        domain?.includes('.iq') || domain?.includes('.kw') || domain?.includes('.qa') ||
        domain?.includes('.bh') || domain?.includes('.om') || domain?.includes('.ye') ||
        domain?.includes('.ly') || domain?.includes('.dz') || domain?.includes('.ma') ||
        domain?.includes('.tn') || domain?.includes('.sd')) {
      return 'ar';
    }
    
    return 'en'; // Default to English
  }
}

export const translationService = new TranslationService();