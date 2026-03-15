/**
 * {{FEATURE_NAME}} API 계약 템플릿
 *
 * 이 파일을 복사하여 새 기능의 API 계약을 정의합니다.
 * 사용법:
 *   1. 이 파일을 복사하여 {{feature}}.contract.ts로 이름 변경
 *   2. {{FEATURE_NAME}}, {{Feature}}, {{feature}}, {{ENTITY}} 등을 실제 값으로 치환
 *   3. 필요한 엔드포인트 추가/수정
 *
 * @see backend/app/schemas/{{feature}}.py (Pydantic 스키마)
 * @see frontend/src/mocks/handlers/{{feature}}.ts (MSW Mock)
 */

import { ApiEndpoint, PaginatedResponse, PaginationParams } from './types';

// ============================================
// 엔티티 타입
// ============================================

export interface {{Feature}} {
  id: number;
  // TODO: 엔티티 필드 정의
  title: string;
  content: string;
  userId: number;
  createdAt: string;  // ISO 8601
  updatedAt: string;  // ISO 8601
}

export interface {{Feature}}Create {
  // TODO: 생성 시 필요한 필드
  title: string;
  content: string;
}

export interface {{Feature}}Update {
  // TODO: 수정 시 필요한 필드 (모두 optional)
  title?: string;
  content?: string;
}

// ============================================
// API 계약 정의
// ============================================

export interface {{Feature}}API {
  /**
   * 목록 조회
   *
   * @route GET /{{feature}}s
   * @access Private
   */
  'GET /{{feature}}s': ApiEndpoint<
    PaginationParams,
    PaginatedResponse<{{Feature}}>,
    {
      401: 'Unauthorized';
    }
  > & {
    headers: {
      Authorization: `Bearer ${string}`;
    };
  };

  /**
   * 단일 조회
   *
   * @route GET /{{feature}}s/:id
   * @access Private
   */
  'GET /{{feature}}s/:id': ApiEndpoint<
    void,
    {{Feature}},
    {
      401: 'Unauthorized';
      403: 'Forbidden - 접근 권한 없음';
      404: 'Not found - 리소스를 찾을 수 없음';
    }
  > & {
    params: { id: string };
    headers: {
      Authorization: `Bearer ${string}`;
    };
  };

  /**
   * 생성
   *
   * @route POST /{{feature}}s
   * @access Private
   */
  'POST /{{feature}}s': ApiEndpoint<
    {{Feature}}Create,
    {{Feature}},
    {
      400: 'Invalid input - 입력값이 유효하지 않음';
      401: 'Unauthorized';
    }
  > & {
    headers: {
      Authorization: `Bearer ${string}`;
    };
  };

  /**
   * 수정
   *
   * @route PUT /{{feature}}s/:id
   * @access Private (Owner only)
   */
  'PUT /{{feature}}s/:id': ApiEndpoint<
    {{Feature}}Update,
    {{Feature}},
    {
      400: 'Invalid input';
      401: 'Unauthorized';
      403: 'Forbidden - 본인의 리소스만 수정 가능';
      404: 'Not found';
    }
  > & {
    params: { id: string };
    headers: {
      Authorization: `Bearer ${string}`;
    };
  };

  /**
   * 삭제
   *
   * @route DELETE /{{feature}}s/:id
   * @access Private (Owner only)
   */
  'DELETE /{{feature}}s/:id': ApiEndpoint<
    void,
    { message: string },
    {
      401: 'Unauthorized';
      403: 'Forbidden - 본인의 리소스만 삭제 가능';
      404: 'Not found';
    }
  > & {
    params: { id: string };
    headers: {
      Authorization: `Bearer ${string}`;
    };
  };
}

// ============================================
// 추가 엔드포인트 예시 (필요 시 추가)
// ============================================

/*
// 검색
'GET /{{feature}}s/search': ApiEndpoint<
  { q: string } & PaginationParams,
  PaginatedResponse<{{Feature}}>,
  { 401: 'Unauthorized' }
>;

// 일괄 삭제
'DELETE /{{feature}}s/batch': ApiEndpoint<
  { ids: number[] },
  { deletedCount: number },
  { 401: 'Unauthorized'; 403: 'Forbidden' }
>;

// 상태 변경
'PATCH /{{feature}}s/:id/status': ApiEndpoint<
  { status: 'active' | 'archived' },
  {{Feature}},
  { 401: 'Unauthorized'; 403: 'Forbidden'; 404: 'Not found' }
>;
*/
