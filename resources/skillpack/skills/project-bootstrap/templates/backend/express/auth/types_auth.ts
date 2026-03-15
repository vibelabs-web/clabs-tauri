/**
 * Authentication type definitions.
 */

export interface User {
  id: string;
  email: string;
  password: string;
  name?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPayload {
  id: string;
  email: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}
