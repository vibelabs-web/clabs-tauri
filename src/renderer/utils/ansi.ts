/**
 * ANSI 이스케이프 코드를 제거하되 Markdown 포맷은 유지하는 유틸리티
 */

// SGR, cursor, clear, OSC 등 모든 ANSI 이스케이프 시퀀스
const ANSI_ESCAPE_RE = /\x1b\[[0-9;]*[a-zA-Z]|\x1b\][^\x07]*\x07|\x1b\(B|\x1b\[[0-9;]*m/g;

// 제어 문자 (탭, 개행 제외)
const CONTROL_CHARS_RE = /[\x00-\x08\x0b\x0c\x0e-\x1f]/g;

export function stripAnsi(text: string): string {
  return text
    // ANSI 이스케이프 시퀀스 제거
    .replace(ANSI_ESCAPE_RE, '')
    // 제어 문자 제거 (탭/개행 유지)
    .replace(CONTROL_CHARS_RE, '')
    // \r\n → \n 정규화
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // 연속 빈 줄 3개 이상 → 2개로 압축
    .replace(/\n{3,}/g, '\n\n');
}
