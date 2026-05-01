/**
 * KoreanComposer — WKWebView Korean IME workaround
 *
 * WKWebView does not route Korean IME composition events to xterm's helper
 * textarea, so individual jamo (ㄱ, ㄴ, ㅏ …) arrive via onData instead of
 * composed syllables. This class re-implements dubeolsik (두벌식) composition
 * in JavaScript so xterm can receive proper syllables.
 *
 * Usage:
 *   const r = composer.input(jamo);  // r.flush → PTY, r.pending → preview
 *   const r = composer.backspace();  // r.deleteCount → erase cols, r.pending
 *   const s = composer.flush();      // flush current syllable, reset state
 */

// ── 초성 (19) ─────────────────────────────────────────────────────────────
const CHO: readonly string[] = [
  'ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ',
  'ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ',
];

// ── 중성 (21) ─────────────────────────────────────────────────────────────
const JUNG: readonly string[] = [
  'ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ',
  'ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ',
];

// ── 종성 (28: 0 = 없음, 1-27 = 실제 자음) ────────────────────────────────
const JONG: readonly string[] = [
  '',    // 0: 없음
  'ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ',
  'ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ',
  'ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ',
];

// ── 자모 집합 ─────────────────────────────────────────────────────────────
const CONSONANTS = new Set<string>([
  'ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄸ','ㄹ',
  'ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅃ',
  'ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ',
]);

const VOWELS = new Set<string>([
  'ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ',
  'ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ',
]);

// ── 복합 모음 (중성) ──────────────────────────────────────────────────────
// key: base_vowel + '+' + second_vowel → combined_vowel
const COMPOUND_VOWEL: Record<string, string> = {
  'ㅗ+ㅏ': 'ㅘ',
  'ㅗ+ㅐ': 'ㅙ',
  'ㅗ+ㅣ': 'ㅚ',
  'ㅜ+ㅓ': 'ㅝ',
  'ㅜ+ㅔ': 'ㅞ',
  'ㅜ+ㅣ': 'ㅟ',
  'ㅡ+ㅣ': 'ㅢ',
};

// ── 복합 종성 ─────────────────────────────────────────────────────────────
// key: first_consonant + '+' + second_consonant → compound_jongseong
// value is the index in JONG[]
const COMPOUND_JONG: Record<string, number> = {
  'ㄱ+ㅅ':  3,  // ㄳ
  'ㄴ+ㅈ':  5,  // ㄵ
  'ㄴ+ㅎ':  6,  // ㄶ
  'ㄹ+ㄱ':  9,  // ㄺ
  'ㄹ+ㅁ': 10,  // ㄻ
  'ㄹ+ㅂ': 11,  // ㄼ
  'ㄹ+ㅅ': 12,  // ㄽ
  'ㄹ+ㅌ': 13,  // ㄾ
  'ㄹ+ㅍ': 14,  // ㄿ
  'ㄹ+ㅎ': 15,  // ㅀ
  'ㅂ+ㅅ': 18,  // ㅄ
};

// ── 헬퍼 ──────────────────────────────────────────────────────────────────

function choIdx(c: string): number {
  return CHO.indexOf(c);
}

function jungIdx(v: string): number {
  return JUNG.indexOf(v);
}

function jongIdx(c: string): number {
  return JONG.indexOf(c);
}

/** 초성+중성+종성 인덱스로 완성형 코드포인트 반환 */
function syllable(ci: number, vi: number, ji: number): string {
  return String.fromCodePoint(0xAC00 + (ci * 21 + vi) * 28 + ji);
}

/** 단일 종성 자음 → 초성으로 사용 가능한 자음 반환 (없으면 null) */
function jongToChoConsonant(jong: string): string | null {
  // 복합 종성은 초성으로 사용 불가 (split해서 두 번째를 초성으로)
  if (jong.length > 1) return null;
  return CHO.includes(jong) ? jong : null;
}

// ── 상태 머신 ─────────────────────────────────────────────────────────────
const enum State {
  EMPTY            = 'EMPTY',
  CHO              = 'CHO',            // 초성만
  CHO_JUNG         = 'CHO_JUNG',       // 초성 + 중성
  CHO_JUNG_JONG    = 'CHO_JUNG_JONG',  // 초성 + 중성 + 종성
  CHO_JUNG_JONG2   = 'CHO_JUNG_JONG2', // 초성 + 중성 + 복합 종성 (tentative)
}

export class KoreanComposer {
  private state: State = State.EMPTY;

  /** 현재 글자의 초성 (자음 문자, e.g. 'ㄱ') */
  private cho: string = '';
  /** 현재 글자의 중성 (모음 문자, e.g. 'ㅏ') */
  private jung: string = '';
  /** 현재 글자의 종성 (자음 문자, e.g. 'ㄹ') — JONG[] 내 문자열 */
  private jong: string = '';
  /**
   * tentative 두 번째 종성 (복합 종성을 이루는 두 번째 자음).
   * JONG2 상태에서만 사용.
   */
  private jong2: string = '';

  // ── 판별 ────────────────────────────────────────────────────────────────

  isJamo(c: string): boolean {
    if (c.length !== 1) return false;
    const cp = c.codePointAt(0)!;
    // 호환 자모: U+3131–U+314E (자음), U+314F–U+3163 (모음)
    return cp >= 0x3131 && cp <= 0x3163;
  }

  isConsonant(c: string): boolean {
    return CONSONANTS.has(c);
  }

  isVowel(c: string): boolean {
    return VOWELS.has(c);
  }

  // ── 현재 pending 글자 ────────────────────────────────────────────────────

  getPending(): string {
    switch (this.state) {
      case State.EMPTY:
        return '';
      case State.CHO:
        return this.cho;
      case State.CHO_JUNG: {
        const ci = choIdx(this.cho);
        const vi = jungIdx(this.jung);
        if (ci < 0 || vi < 0) return this.cho + this.jung;
        return syllable(ci, vi, 0);
      }
      case State.CHO_JUNG_JONG: {
        const ci = choIdx(this.cho);
        const vi = jungIdx(this.jung);
        const ji = jongIdx(this.jong);
        if (ci < 0 || vi < 0 || ji < 0) return this.cho + this.jung + this.jong;
        return syllable(ci, vi, ji);
      }
      case State.CHO_JUNG_JONG2: {
        // tentative compound jong — display with compound jong index
        const compoundKey = `${this.jong}+${this.jong2}`;
        const compoundJi = COMPOUND_JONG[compoundKey];
        if (compoundJi === undefined) return this.cho + this.jung + this.jong + this.jong2;
        const ci = choIdx(this.cho);
        const vi = jungIdx(this.jung);
        if (ci < 0 || vi < 0) return this.cho + this.jung + this.jong + this.jong2;
        return syllable(ci, vi, compoundJi);
      }
    }
  }

  getPendingWidth(): number {
    const p = this.getPending();
    if (!p) return 0;
    // CJK 완성형 음절: 2 컬럼, 자모 단독: 1 컬럼
    let w = 0;
    for (const ch of p) {
      const cp = ch.codePointAt(0)!;
      w += cp >= 0xAC00 && cp <= 0xD7A3 ? 2 : 1;
    }
    return w;
  }

  // ── 입력 ────────────────────────────────────────────────────────────────

  input(jamo: string): { flush: string; pending: string } {
    if (this.isVowel(jamo)) {
      return this._inputVowel(jamo);
    } else if (this.isConsonant(jamo)) {
      return this._inputConsonant(jamo);
    }
    // 알 수 없는 자모: flush 후 그대로
    const f = this.flush();
    return { flush: f, pending: jamo };
  }

  private _inputConsonant(c: string): { flush: string; pending: string } {
    switch (this.state) {
      case State.EMPTY:
        // 새 초성 시작
        this.cho = c;
        this.state = State.CHO;
        return { flush: '', pending: this.getPending() };

      case State.CHO:
        // 초성만 있을 때 자음 → 이전 초성 flush, 새 초성
        {
          const f = this.cho;
          this.cho = c;
          this.state = State.CHO;
          this.jung = '';
          this.jong = '';
          this.jong2 = '';
          return { flush: f, pending: this.getPending() };
        }

      case State.CHO_JUNG:
        // 초성+중성 → 종성 후보
        {
          const ji = jongIdx(c);
          if (ji > 0) {
            // 종성으로 사용 가능
            this.jong = c;
            this.state = State.CHO_JUNG_JONG;
          } else {
            // 종성 불가 (ㄸ, ㅃ, ㅉ 등 쌍자음 초성 전용)
            // 현재 글자 flush, 새 초성
            const f = this.getPending();
            this._resetFields();
            this.cho = c;
            this.state = State.CHO;
            return { flush: f, pending: this.getPending() };
          }
          return { flush: '', pending: this.getPending() };
        }

      case State.CHO_JUNG_JONG:
        // 종성 있을 때 자음 → 복합 종성 가능?
        {
          const compoundKey = `${this.jong}+${c}`;
          if (COMPOUND_JONG[compoundKey] !== undefined) {
            // tentative 복합 종성
            this.jong2 = c;
            this.state = State.CHO_JUNG_JONG2;
            return { flush: '', pending: this.getPending() };
          } else {
            // 복합 불가: 현재 글자 flush, 새 초성 시작
            const f = this.getPending();
            const prevJong = this.jong; // unused here, new cho = c
            void prevJong;
            this._resetFields();
            this.cho = c;
            this.state = State.CHO;
            return { flush: f, pending: this.getPending() };
          }
        }

      case State.CHO_JUNG_JONG2:
        // tentative 복합 종성 상태에서 또 자음
        // 복합 종성으로 확정 후 flush, 새 초성
        {
          const f = this.getPending(); // includes compound jong
          const newCho = c;
          this._resetFields();
          this.cho = newCho;
          this.state = State.CHO;
          return { flush: f, pending: this.getPending() };
        }
    }
  }

  private _inputVowel(v: string): { flush: string; pending: string } {
    switch (this.state) {
      case State.EMPTY:
        // 모음 단독 → ㅇ 초성
        this.cho = 'ㅇ';
        this.jung = v;
        this.state = State.CHO_JUNG;
        return { flush: '', pending: this.getPending() };

      case State.CHO:
        // 초성 + 모음
        this.jung = v;
        this.state = State.CHO_JUNG;
        return { flush: '', pending: this.getPending() };

      case State.CHO_JUNG:
        // 복합 모음 시도
        {
          const compoundKey = `${this.jung}+${v}`;
          if (COMPOUND_VOWEL[compoundKey]) {
            this.jung = COMPOUND_VOWEL[compoundKey];
            // state stays CHO_JUNG
            return { flush: '', pending: this.getPending() };
          }
          // 복합 불가: 현재 글자 flush, 새 ㅇ+모음
          const f = this.getPending();
          this._resetFields();
          this.cho = 'ㅇ';
          this.jung = v;
          this.state = State.CHO_JUNG;
          return { flush: f, pending: this.getPending() };
        }

      case State.CHO_JUNG_JONG:
        // 종성 + 모음 → 종성을 다음 글자의 초성으로
        {
          const prevJong = this.jong;
          const nextCho = jongToChoConsonant(prevJong);
          if (nextCho !== null && choIdx(nextCho) >= 0) {
            // 현재 글자는 종성 없이 flush
            const fCi = choIdx(this.cho);
            const fVi = jungIdx(this.jung);
            const f = fCi >= 0 && fVi >= 0 ? syllable(fCi, fVi, 0) : this.cho + this.jung;
            // 새 글자: 종성 → 초성, 모음
            this._resetFields();
            this.cho = nextCho;
            this.jung = v;
            this.state = State.CHO_JUNG;
            return { flush: f, pending: this.getPending() };
          }
          // 종성이 초성으로 사용 불가 (이론상 없음)
          const f = this.getPending();
          this._resetFields();
          this.cho = 'ㅇ';
          this.jung = v;
          this.state = State.CHO_JUNG;
          return { flush: f, pending: this.getPending() };
        }

      case State.CHO_JUNG_JONG2:
        // tentative 복합 종성 + 모음
        // → jong2를 다음 글자의 초성으로, 현재 글자는 single jong으로 확정
        {
          const fCi = choIdx(this.cho);
          const fVi = jungIdx(this.jung);
          const fJi = jongIdx(this.jong); // single jong (first part of compound)
          const f = fCi >= 0 && fVi >= 0 && fJi >= 0
            ? syllable(fCi, fVi, fJi)
            : this.cho + this.jung + this.jong;
          const nextCho = this.jong2;
          this._resetFields();
          this.cho = nextCho;
          this.jung = v;
          this.state = State.CHO_JUNG;
          return { flush: f, pending: this.getPending() };
        }
    }
  }

  // ── 백스페이스 ───────────────────────────────────────────────────────────

  backspace(): { deleteCount: number; pending: string } {
    switch (this.state) {
      case State.EMPTY:
        return { deleteCount: 0, pending: '' };

      case State.CHO:
        {
          const w = this.getPendingWidth();
          this._resetFields();
          this.state = State.EMPTY;
          return { deleteCount: w, pending: '' };
        }

      case State.CHO_JUNG:
        // 복합 모음이면 분해, 아니면 중성 제거
        {
          const prevWidth = this.getPendingWidth();
          // 복합 모음 역분해
          const decomposed = this._decomposeVowel(this.jung);
          if (decomposed) {
            this.jung = decomposed;
            // state stays CHO_JUNG
            return { deleteCount: prevWidth, pending: this.getPending() };
          }
          // 단순 모음 제거 → CHO 상태
          this.jung = '';
          this.state = State.CHO;
          return { deleteCount: prevWidth, pending: this.getPending() };
        }

      case State.CHO_JUNG_JONG:
        {
          const prevWidth = this.getPendingWidth();
          this.jong = '';
          this.state = State.CHO_JUNG;
          return { deleteCount: prevWidth, pending: this.getPending() };
        }

      case State.CHO_JUNG_JONG2:
        {
          const prevWidth = this.getPendingWidth();
          this.jong2 = '';
          this.state = State.CHO_JUNG_JONG;
          return { deleteCount: prevWidth, pending: this.getPending() };
        }
    }
  }

  /** 복합 모음 → 첫 번째 모음으로 역분해. 단순 모음이면 null */
  private _decomposeVowel(v: string): string | null {
    for (const [key, compound] of Object.entries(COMPOUND_VOWEL)) {
      if (compound === v) {
        return key.split('+')[0];
      }
    }
    return null;
  }

  // ── flush ────────────────────────────────────────────────────────────────

  flush(): string {
    const p = this.getPending();
    this.reset();
    return p;
  }

  // ── 초기화 ───────────────────────────────────────────────────────────────

  reset(): void {
    this._resetFields();
    this.state = State.EMPTY;
  }

  private _resetFields(): void {
    this.cho   = '';
    this.jung  = '';
    this.jong  = '';
    this.jong2 = '';
  }
}
