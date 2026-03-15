/**
 * 인증 API 계약
 *
 * 이 파일은 BE/FE 간의 인증 API 계약을 정의합니다.
 * - BE: 이 계약에 맞게 API를 구현
 * - FE: 이 계약에 맞게 API를 호출 + Mock 생성
 *
 * @see backend/app/schemas/auth.py (Pydantic 스키마)
 * @see frontend/src/mocks/handlers/auth.ts (MSW Mock)
 */

import { User, AuthResponse, ApiEndpoint } from './types';

// ============================================
// 요청/응답 타입
// ============================================

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LogoutResponse {
  message: string;
}

// ============================================
// API 계약 정의
// ============================================

export interface AuthAPI {
  /**
   * 회원가입
   *
   * @route POST /auth/register
   * @access Public
   */
  'POST /auth/register': ApiEndpoint<
    RegisterRequest,
    AuthResponse,
    {
      400: 'Invalid input - 입력값이 유효하지 않음';
      409: 'Email already exists - 이미 등록된 이메일';
    }
  >;

  /**
   * 로그인
   *
   * @route POST /auth/login
   * @access Public
   */
  'POST /auth/login': ApiEndpoint<
    LoginRequest,
    AuthResponse,
    {
      401: 'Invalid credentials - 이메일 또는 비밀번호가 틀림';
    }
  >;

  /**
   * 현재 사용자 정보 조회
   *
   * @route GET /auth/me
   * @access Private (Bearer Token)
   */
  'GET /auth/me': ApiEndpoint<
    void,
    User,
    {
      401: 'Unauthorized - 인증 토큰이 없거나 유효하지 않음';
    }
  > & {
    headers: {
      Authorization: `Bearer ${string}`;
    };
  };

  /**
   * 로그아웃
   *
   * @route POST /auth/logout
   * @access Private (Bearer Token)
   */
  'POST /auth/logout': ApiEndpoint<
    void,
    LogoutResponse,
    {
      401: 'Unauthorized';
    }
  > & {
    headers: {
      Authorization: `Bearer ${string}`;
    };
  };

  /**
   * 비밀번호 변경
   *
   * @route PUT /auth/password
   * @access Private (Bearer Token)
   */
  'PUT /auth/password': ApiEndpoint<
    {
      currentPassword: string;
      newPassword: string;
    },
    { message: string },
    {
      400: 'Invalid password - 비밀번호 형식이 유효하지 않음';
      401: 'Current password is incorrect - 현재 비밀번호가 틀림';
    }
  > & {
    headers: {
      Authorization: `Bearer ${string}`;
    };
  };
}

// ============================================
// 유효성 검사 규칙 (문서용)
// ============================================

/**
 * 비밀번호 규칙:
 * - 최소 8자 이상
 * - 영문, 숫자, 특수문자 포함
 *
 * 이메일 규칙:
 * - 유효한 이메일 형식 (RFC 5322)
 *
 * 이름 규칙:
 * - 최소 2자 이상
 * - 최대 50자 이하
 */
