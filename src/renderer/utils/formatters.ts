// @TASK P2-S4-T1 - 포맷팅 유틸리티 함수

/**
 * 숫자를 천 단위 구분자 포맷으로 변환
 * @param num - 포맷할 숫자
 * @returns 천 단위 구분자가 추가된 문자열
 * @example formatNumber(150000) // "150,000"
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString('en-US');
};

/**
 * 초 단위 시간을 분:초 형식으로 변환
 * @param seconds - 초 단위 시간
 * @returns 포맷된 시간 문자열
 * @example formatDuration(125) // "2m 5s"
 * @example formatDuration(45) // "45s"
 */
export const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

/**
 * 사용률에 따라 스펙트럼 색상 클래스 반환
 * @param percentage - 사용률 (0-100)
 * @returns Tailwind CSS 배경색 클래스
 * @example getColorClass(45) // "bg-green-500"
 * @example getColorClass(92) // "bg-red-500"
 */
export const getColorClass = (percentage: number): string => {
  if (percentage < 50) return 'bg-green-500';
  if (percentage < 75) return 'bg-yellow-500';
  if (percentage < 90) return 'bg-orange-500';
  return 'bg-red-500';
};
