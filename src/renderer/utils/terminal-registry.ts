// 터미널 인스턴스 레지스트리 — paneId별 xterm Terminal 참조
// 복사 기능에서 터미널 버퍼 직접 접근용

import type { Terminal } from 'xterm';

const terminals = new Map<string, Terminal>();

export function registerTerminal(paneId: string, terminal: Terminal): void {
  terminals.set(paneId, terminal);
}

export function unregisterTerminal(paneId: string): void {
  terminals.delete(paneId);
}

/**
 * 활성 터미널의 선택 텍스트 반환. 선택 없으면 빈 문자열.
 */
export function getTerminalSelection(paneId: string): string {
  const terminal = terminals.get(paneId);
  if (!terminal) return '';
  return terminal.getSelection();
}

/**
 * 터미널 버퍼에서 줄 배열 추출 (최근 N줄)
 */
function getBufferLines(terminal: Terminal, maxLines = 500): string[] {
  const buffer = terminal.buffer.active;
  const totalLines = buffer.length;
  const startLine = Math.max(0, totalLines - maxLines);
  const lines: string[] = [];

  for (let i = startLine; i < totalLines; i++) {
    const line = buffer.getLine(i);
    if (line) {
      lines.push(line.translateToString(true));
    }
  }

  return lines;
}

/**
 * Claude Code 터미널 출력에서 마지막 응답 블록 추출
 *
 * Claude Code 프롬프트 패턴: "❯ " (맨 앞에 ❯)
 * 사용자 입력은 ❯ 뒤에 오고, 그 다음 줄부터 Claude 응답.
 * 다음 ❯ 가 나오면 응답 끝.
 *
 * 전략: 뒤에서부터 ❯ 프롬프트를 2개 찾아서 그 사이가 마지막 응답.
 */
function extractLastResponse(lines: string[]): string[] {
  // Claude Code 프롬프트만 인식 (❯ 로 시작하는 줄)
  const isPrompt = (line: string) => /^\s*❯\s/.test(line);

  // 뒤에서 ❯ 프롬프트 위치들 수집 (최대 2개)
  const promptPositions: number[] = [];
  for (let i = lines.length - 1; i >= 0 && promptPositions.length < 2; i--) {
    if (isPrompt(lines[i])) {
      promptPositions.unshift(i); // 앞쪽에 삽입 (오름차순 유지)
    }
  }

  if (promptPositions.length === 0) {
    // 프롬프트 못 찾음 → 최근 50줄 반환
    return lines.slice(Math.max(0, lines.length - 50));
  }

  if (promptPositions.length === 1) {
    // 프롬프트 1개 → 그 다음 줄부터 끝까지가 응답
    const start = promptPositions[0] + 1;
    return lines.slice(start);
  }

  // 프롬프트 2개 → 두 번째(마지막) 프롬프트 다음 줄부터 끝까지
  // 마지막 ❯는 현재 대기 중인 프롬프트이고, 그 앞 ❯가 사용자 입력
  // 사용자 입력 다음 줄부터 현재 프롬프트 전까지가 응답
  const userInputLine = promptPositions[0];
  const currentPromptLine = promptPositions[1];
  const responseStart = userInputLine + 1;
  const responseEnd = currentPromptLine;

  // 응답이 비어있으면 (연속 프롬프트) → 두 번째 프롬프트 이후
  if (responseStart >= responseEnd) {
    return lines.slice(currentPromptLine + 1);
  }

  return lines.slice(responseStart, responseEnd);
}

/**
 * 터미널 플레인 텍스트를 마크다운으로 복원
 * Claude Code가 렌더링한 텍스트를 마크다운으로 변환
 */
function toMarkdown(lines: string[]): string {
  const result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trimEnd();

    // ── 박스 테이블 감지 (┌ 로 시작하는 블록) ──
    if (/^\s*┌/.test(trimmed)) {
      const tableLines = collectBoxTable(lines, i);
      if (tableLines.length > 0) {
        result.push(...convertBoxTableToMarkdown(tableLines));
        i += tableLines.length;
        continue;
      }
    }

    // ── Claude Code 코드 블록 (│ 접두사, 테이블 아님) ──
    if (/^\s*│\s/.test(trimmed) && !isBoxTableRow(trimmed)) {
      const codeLines: string[] = [];
      // 이전 줄에서 파일명 추출
      const prevLine = result.length > 0 ? result[result.length - 1].trim() : '';
      const langMatch = prevLine.match(/(\w+\.\w+)\s*$/);
      let lang = '';
      if (langMatch) {
        lang = extToLang(langMatch[1].split('.').pop() || '');
        // 파일명 줄을 제거하고 코드 블록에 포함
        result.pop();
        result.push(`**${langMatch[1]}**`);
      }

      while (i < lines.length && /^\s*│/.test(lines[i].trimEnd())) {
        const content = lines[i].trimEnd().replace(/^\s*│\s?/, '');
        codeLines.push(content);
        i++;
      }
      result.push('```' + lang);
      result.push(...codeLines);
      result.push('```');
      continue;
    }

    // ── ⏺ 블릿 → 마크다운 헤더 또는 불릿 ──
    const bulletMatch = trimmed.match(/^\s*⏺\s+(.*)/);
    if (bulletMatch) {
      const content = bulletMatch[1];
      // 도구 호출 패턴: "Explore(...)" "Read(...)" 등 → 접기 블록
      if (/^(Explore|Read|Write|Edit|Bash|Grep|Glob|Agent)\(/.test(content)) {
        result.push(`> **${content}**`);
      } else {
        // 들여쓰기 레벨로 헤더/불릿 결정
        const indent = line.length - line.trimStart().length;
        if (indent <= 2) {
          result.push(`## ${content}`);
        } else {
          result.push(`- ${content}`);
        }
      }
      i++;
      continue;
    }

    // ── ⎿ 접기 라인 (도구 결과) ──
    if (/^\s*⎿/.test(trimmed)) {
      const content = trimmed.replace(/^\s*⎿\s*/, '');
      if (content) {
        result.push(`> ${content}`);
      }
      i++;
      continue;
    }

    // ── 구분선 ──
    if (/^\s*-{3,}\s*$/.test(trimmed) || /^\s*[─━═]{3,}\s*$/.test(trimmed)) {
      result.push('---');
      i++;
      continue;
    }

    // ── 박스 상단/하단 (╭╮╰╯) → 무시 ──
    if (/^[╭╰]/.test(trimmed) || /[╮╯]$/.test(trimmed)) {
      i++;
      continue;
    }

    // ── 파일 트리 (├── └──) → 코드 블록으로 ──
    if (/^\s*[├└│]──/.test(trimmed) || /^\s*[├└│]\s*[─]/.test(trimmed)) {
      const treeLines: string[] = [];
      while (i < lines.length) {
        const tl = lines[i].trimEnd();
        if (/^\s*[├└│]/.test(tl) || /^\s*$/.test(tl)) {
          if (tl.trim()) treeLines.push(tl);
          i++;
          if (/^\s*└/.test(tl)) {
            // └ 이후에도 연속 트리 줄이면 계속
            if (i < lines.length && /^\s*[├└│]/.test(lines[i].trimEnd())) continue;
            break;
          }
        } else {
          break;
        }
      }
      if (treeLines.length > 0) {
        result.push('```');
        result.push(...treeLines);
        result.push('```');
      }
      continue;
    }

    // ── (ctrl+o to expand) → 무시 ──
    if (/\(ctrl\+o to expand\)/.test(trimmed)) {
      i++;
      continue;
    }

    // ── ✻ 타이머 라인 → 무시 ──
    if (/^\s*✻/.test(trimmed)) {
      i++;
      continue;
    }

    // ── 불릿 리스트 (•●◦▪) ──
    const listMatch = trimmed.match(/^\s*[•●◦▪]\s+(.*)/);
    if (listMatch) {
      result.push(`- ${listMatch[1]}`);
      i++;
      continue;
    }

    // ── 번호 리스트 ──
    const numListMatch = trimmed.match(/^\s*(\d+)[.)]\s+(.*)/);
    if (numListMatch) {
      result.push(`${numListMatch[1]}. ${numListMatch[2]}`);
      i++;
      continue;
    }

    // ── 빈 줄 ──
    if (trimmed === '') {
      result.push('');
      i++;
      continue;
    }

    // ── 일반 텍스트 ──
    result.push(trimmed);
    i++;
  }

  return result.join('\n').trimEnd();
}

/** 박스 테이블 행인지 확인 (│ 가 2개 이상) */
function isBoxTableRow(line: string): boolean {
  return (line.match(/│/g) || []).length >= 2;
}

/** ┌ 로 시작하는 박스 테이블 블록 수집 */
function collectBoxTable(lines: string[], start: number): string[] {
  const collected: string[] = [];
  for (let i = start; i < lines.length; i++) {
    const t = lines[i].trimEnd();
    if (/^\s*[┌├└│]/.test(t) || /^\s*```/.test(t)) {
      collected.push(t);
      if (/^\s*└/.test(t)) {
        // └ 다음 줄도 테이블 연속인지 확인
        if (i + 1 < lines.length && /^\s*[┌├└│]/.test(lines[i + 1].trimEnd())) {
          continue;
        }
        break;
      }
    } else {
      // 테이블이 아닌 줄 → 수집 중단
      break;
    }
  }
  return collected;
}

/** 박스 테이블 → 마크다운 테이블 변환 */
function convertBoxTableToMarkdown(tableLines: string[]): string[] {
  // 데이터 행 추출 (│ 로 시작하는 줄, ``` 가 아닌 줄)
  const dataRows = tableLines.filter(l => {
    const t = l.trim();
    return /^│/.test(t) && !(/^[┌├└]/.test(t)) && !(/^```/.test(t));
  });

  if (dataRows.length === 0) return [];

  const mdRows: string[] = [];
  for (let ri = 0; ri < dataRows.length; ri++) {
    const row = dataRows[ri];
    // │ 로 분리
    const cells = row.split('│')
      .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1) // 앞뒤 빈 셀 제거
      .map(c => c.trim());

    mdRows.push('| ' + cells.join(' | ') + ' |');

    // 첫 번째 데이터 행 뒤에 구분선 삽입
    if (ri === 0) {
      mdRows.push('| ' + cells.map(() => '---').join(' | ') + ' |');
    }
  }

  return mdRows;
}

/** 파일 확장자 → 언어 ID */
function extToLang(ext: string): string {
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'tsx', js: 'javascript', jsx: 'jsx',
    py: 'python', rs: 'rust', go: 'go', rb: 'ruby',
    java: 'java', kt: 'kotlin', swift: 'swift', cs: 'csharp',
    cpp: 'cpp', c: 'c', h: 'c', hpp: 'cpp',
    sh: 'bash', bash: 'bash', zsh: 'bash',
    json: 'json', yaml: 'yaml', yml: 'yaml', toml: 'toml',
    md: 'markdown', html: 'html', css: 'css', scss: 'scss',
    sql: 'sql', graphql: 'graphql', dockerfile: 'dockerfile',
    xml: 'xml', svg: 'xml',
  };
  return map[ext.toLowerCase()] || ext.toLowerCase();
}

/**
 * 복사용: 선택 텍스트 → 그대로 / 없으면 → 마지막 응답을 마크다운으로
 */
export function getTerminalTextForCopy(paneId: string): string {
  const selection = getTerminalSelection(paneId);
  if (selection) return selection;

  const terminal = terminals.get(paneId);
  if (!terminal) return '';

  const lines = getBufferLines(terminal, 500);
  const responseLines = extractLastResponse(lines);
  if (responseLines.length === 0) return '';

  return toMarkdown(responseLines);
}
