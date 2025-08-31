import jwt from 'jsonwebtoken';
import { config } from '../config/environment';
import { JwtPayload } from '../types/auth';

export const generateToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>, rememberMe: boolean = false): string => {
  const expiresIn = rememberMe ? '30d' : config.jwt.expiresIn;
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn,
  } as jwt.SignOptions);
};

export const generateRefreshToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: '30d',
  } as jwt.SignOptions);
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.jwt.secret) as JwtPayload;
};