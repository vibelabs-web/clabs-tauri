/**
 * Server-side auth service for Remix.
 */
import type { User, LoginRequest, RegisterRequest, AuthResponse, ChangePasswordRequest, UpdateProfileRequest } from '~/types/auth';

const API_URL = process.env.API_URL || 'http://localhost:8000';

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || `Request failed: ${response.status}`);
  }

  return response.json();
}

export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  return fetchAPI<AuthResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  return fetchAPI<AuthResponse>('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function logoutAPI(token: string): Promise<void> {
  try {
    await fetchAPI('/api/v1/auth/logout', { method: 'POST' }, token);
  } catch {
    // Ignore logout errors
  }
}

export async function getUser(token: string): Promise<User> {
  return fetchAPI<User>('/api/v1/users/me', {}, token);
}

export async function updateProfile(token: string, data: UpdateProfileRequest): Promise<User> {
  return fetchAPI<User>('/api/v1/users/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  }, token);
}

export async function changePassword(token: string, data: ChangePasswordRequest): Promise<void> {
  await fetchAPI('/api/v1/auth/password/change', {
    method: 'POST',
    body: JSON.stringify(data),
  }, token);
}

export async function deleteAccount(token: string): Promise<void> {
  await fetchAPI('/api/v1/users/me', { method: 'DELETE' }, token);
}
