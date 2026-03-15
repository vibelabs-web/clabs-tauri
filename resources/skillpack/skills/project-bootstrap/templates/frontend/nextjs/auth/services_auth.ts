/**
 * Authentication API service.
 */
import { authLib } from '@/lib/auth';
import type { AuthResponse, LoginRequest, RegisterRequest, User, PasswordChangeRequest } from '@/types/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...authLib.getAuthHeader(),
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    authLib.removeToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  return response;
}

export const authService = {
  /**
   * Register a new user.
   */
  async register(data: RegisterRequest): Promise<User> {
    const response = await fetch(`${API_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Registration failed');
    }

    return response.json();
  },

  /**
   * Login and get access token.
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/api/v1/auth/login/json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    const result = await response.json();
    if (result.access_token) {
      authLib.setToken(result.access_token);
    }
    return result;
  },

  /**
   * Logout current user.
   */
  async logout(): Promise<void> {
    try {
      await fetchWithAuth('/api/v1/auth/logout', { method: 'POST' });
    } finally {
      authLib.removeToken();
    }
  },

  /**
   * Get current user profile.
   */
  async getCurrentUser(): Promise<User> {
    const response = await fetchWithAuth('/api/v1/users/me');

    if (!response.ok) {
      throw new Error('Failed to get user');
    }

    return response.json();
  },

  /**
   * Update current user profile.
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await fetchWithAuth('/api/v1/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Update failed');
    }

    return response.json();
  },

  /**
   * Change password.
   */
  async changePassword(data: PasswordChangeRequest): Promise<void> {
    const response = await fetchWithAuth('/api/v1/auth/password/change', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Password change failed');
    }
  },

  /**
   * Delete current user account.
   */
  async deleteAccount(): Promise<void> {
    const response = await fetchWithAuth('/api/v1/users/me', {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete account');
    }

    authLib.removeToken();
  },
};

export default authService;
