/**
 * Auth store using Svelte 5 runes.
 */
import { browser } from '$app/environment';
import type { User, LoginRequest, RegisterRequest, AuthResponse, ChangePasswordRequest, UpdateProfileRequest } from '$lib/types/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Reactive state using Svelte 5 runes
let user = $state<User | null>(null);
let token = $state<string | null>(null);
let isLoading = $state(true);
let error = $state<string | null>(null);

// Derived state
const isAuthenticated = $derived(!!token && !!user);

// Initialize from localStorage
if (browser) {
  const storedToken = localStorage.getItem('token');
  if (storedToken) {
    token = storedToken;
    fetchUser();
  } else {
    isLoading = false;
  }
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || `Request failed: ${response.status}`);
  }

  return response.json();
}

async function login(credentials: LoginRequest): Promise<void> {
  isLoading = true;
  error = null;

  try {
    const data: AuthResponse = await fetchWithAuth('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    token = data.access_token;
    if (browser) {
      localStorage.setItem('token', data.access_token);
    }
    await fetchUser();
  } catch (e) {
    error = e instanceof Error ? e.message : 'Login failed';
    throw e;
  } finally {
    isLoading = false;
  }
}

async function register(data: RegisterRequest): Promise<void> {
  isLoading = true;
  error = null;

  try {
    const response: AuthResponse = await fetchWithAuth('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    token = response.access_token;
    if (browser) {
      localStorage.setItem('token', response.access_token);
    }
    await fetchUser();
  } catch (e) {
    error = e instanceof Error ? e.message : 'Registration failed';
    throw e;
  } finally {
    isLoading = false;
  }
}

async function logout(): Promise<void> {
  try {
    await fetchWithAuth('/api/v1/auth/logout', { method: 'POST' });
  } catch {
    // Ignore logout errors
  } finally {
    token = null;
    user = null;
    if (browser) {
      localStorage.removeItem('token');
    }
  }
}

async function fetchUser(): Promise<void> {
  if (!token) {
    isLoading = false;
    return;
  }

  try {
    user = await fetchWithAuth('/api/v1/users/me');
  } catch {
    token = null;
    user = null;
    if (browser) {
      localStorage.removeItem('token');
    }
  } finally {
    isLoading = false;
  }
}

async function updateProfile(data: UpdateProfileRequest): Promise<void> {
  user = await fetchWithAuth('/api/v1/users/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

async function changePassword(data: ChangePasswordRequest): Promise<void> {
  await fetchWithAuth('/api/v1/auth/password/change', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

async function deleteAccount(): Promise<void> {
  await fetchWithAuth('/api/v1/users/me', { method: 'DELETE' });
  token = null;
  user = null;
  if (browser) {
    localStorage.removeItem('token');
  }
}

export const auth = {
  get user() { return user; },
  get token() { return token; },
  get isLoading() { return isLoading; },
  get error() { return error; },
  get isAuthenticated() { return isAuthenticated; },
  login,
  register,
  logout,
  fetchUser,
  updateProfile,
  changePassword,
  deleteAccount,
  clearError: () => { error = null; },
};
