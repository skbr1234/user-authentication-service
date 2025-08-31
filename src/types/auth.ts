export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'buyer_renter' | 'seller_landlord';
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    role?: string;
    isVerified: boolean;
  };
  token: string;
  refreshToken?: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}