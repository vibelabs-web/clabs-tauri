/**
 * 공통 타입 정의
 *
 * BE/FE 간 공유되는 기본 타입을 정의합니다.
 * Pydantic 스키마와 동기화되어야 합니다.
 */

// ============================================
// User 관련 타입
// ============================================

export interface User {
  id: number;
  email: string;
  name: string;
  createdAt: string;  // ISO 8601
  updatedAt: string;  // ISO 8601
}

export interface UserCreate {
  email: string;
  password: string;
  name: string;
}

export interface UserUpdate {
  name?: string;
  email?: string;
}

// ============================================
// 인증 관련 타입
// ============================================

export interface AuthToken {
  accessToken: string;
  tokenType: 'bearer';
  expiresIn: number;  // seconds
}

export interface AuthResponse {
  user: User;
  token: string;
}

// ============================================
// 에러 응답 타입
// ============================================

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
  };
}

// ============================================
// 페이지네이션 타입
// ============================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// API 응답 래퍼
// ============================================

export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

// ============================================
// 유틸리티 타입
// ============================================

export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiEndpoint<
  TRequest = unknown,
  TResponse = unknown,
  TErrors extends Record<number, string> = Record<number, string>
> {
  request?: TRequest;
  response: TResponse;
  errors?: TErrors;
  headers?: Record<string, string>;
  params?: Record<string, string>;
}
