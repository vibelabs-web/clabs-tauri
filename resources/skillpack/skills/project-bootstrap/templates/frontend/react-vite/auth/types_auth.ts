/**
 * Authentication type definitions.
 */

export interface User {
  id: string;
  email: string;
  name: string | null;
  is_active: boolean;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
