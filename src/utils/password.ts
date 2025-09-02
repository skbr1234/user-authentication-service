import bcrypt from 'bcrypt';
import { logger } from './logger';

const SALT_ROUNDS = 12;

export const hashPassword = async (password: string): Promise<string> => {
  const startTime = Date.now();
  
  logger.debug('Hashing password', {
    passwordLength: password?.length,
    saltRounds: SALT_ROUNDS
  });
  
  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const duration = Date.now() - startTime;
    
    logger.debug('Password hashed successfully', {
      hashLength: hash.length,
      duration
    });
    
    return hash;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Password hashing failed', error as Error, {
      passwordLength: password?.length,
      duration
    });
    throw error;
  }
};

export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  const startTime = Date.now();
  
  logger.debug('Comparing password with hash', {
    passwordLength: password?.length,
    hashLength: hash?.length
  });
  
  try {
    const isMatch = await bcrypt.compare(password, hash);
    const duration = Date.now() - startTime;
    
    logger.debug('Password comparison completed', {
      isMatch,
      duration
    });
    
    return isMatch;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Password comparison failed', error as Error, {
      passwordLength: password?.length,
      hashLength: hash?.length,
      duration
    });
    throw error;
  }
};