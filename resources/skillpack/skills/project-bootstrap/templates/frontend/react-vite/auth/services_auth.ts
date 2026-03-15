/**
 * Authentication API service.
 */
import api from './api';
import type { AuthResponse, LoginRequest, RegisterRequest, User, PasswordChangeRequest } from '../types/auth';

const TOKEN_KEY = 'access_token';

export const authService = {
  /**
   * Register a new user.
   */
  async register(data: RegisterRequest): Promise<User> {
    const response = await api.post<User>('/api/v1/auth/register', data);
    return response.data;
  },

  /**
   * Login and get access token.
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/v1/auth/login/json', data);
    if (response.data.access_token) {
      this.setToken(response.data.access_token);
    }
    return response.data;
  },

  /**
   * Logout current user.
   */
  async logout(): Promise<void> {
    try {
      await api.post('/api/v1/auth/logout');
    } finally {
      this.removeToken();
    }
  },

  /**
   * Get current user profile.
   */
  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/api/v1/users/me');
    return response.data;
  },

  /**
   * Update current user profile.
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.patch<User>('/api/v1/users/me', data);
    return response.data;
  },

  /**
   * Change password.
   */
  async changePassword(data: PasswordChangeRequest): Promise<void> {
    await api.post('/api/v1/auth/password/change', data);
  },

  /**
   * Delete current user account.
   */
  async deleteAccount(): Promise<void> {
    await api.delete('/api/v1/users/me');
    this.removeToken();
  },

  /**
   * Get stored token.
   */
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Store token.
   */
  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },

  /**
   * Remove stored token.
   */
  removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  },

  /**
   * Check if user is authenticated.
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};

export default authService;
