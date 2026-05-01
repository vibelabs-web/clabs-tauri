// 비용/토큰 대시보드 스토어
import { create } from 'zustand';
import type { UsageSnapshot } from '@renderer/types/cost';

/**
 * 모델별 가격표 (USD / 1 token).
 * Anthropic 공식 가격 기준 (2025-Q4). 변동 가능.
 *
 * `long`: 200K input 토큰을 초과하는 1M context 모드 가격 (있는 모델만).
 */
export interface ModelPricing {
  label: string;
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number; // 5분 cache write 기준
  long?: {
    input: number;
    output: number;
    cacheRead: number;
    cacheWrite: number;
  };
}

const M = 1_000_000;

export const MODEL_PRICING: Record<string, ModelPricing> = {
  // Opus 4.x — 최고 성능 모델군 (Opus 4, 4.5, 4.6, 4.7).
  opus4: {
    label: 'Claude Opus 4',
    input: 15 / M,
    output: 75 / M,
    cacheRead: 1.5 / M,
    cacheWrite: 18.75 / M,
    // Opus 4 1M context: 입력/출력 모두 약 2배.
    long: {
      input: 30 / M,
      output: 150 / M,
      cacheRead: 3 / M,
      cacheWrite: 37.5 / M,
    },
  },
  // Sonnet 4.x — 균형 모델군.
  sonnet4: {
    label: 'Claude Sonnet 4',
    input: 3 / M,
    output: 15 / M,
    cacheRead: 0.3 / M,
    cacheWrite: 3.75 / M,
    long: {
      input: 6 / M,
      output: 22.5 / M,
      cacheRead: 0.6 / M,
      cacheWrite: 7.5 / M,
    },
  },
  // Haiku 4.x — 경량/고속.
  haiku4: {
    label: 'Claude Haiku 4',
    input: 1 / M,
    output: 5 / M,
    cacheRead: 0.1 / M,
    cacheWrite: 1.25 / M,
  },
};

const FALLBACK_FAMILY = 'sonnet4';

/**
 * model id 문자열에서 가격표 패밀리 추출.
 * "claude-opus-4-7" → "opus4"
 * "claude-sonnet-4-5" → "sonnet4"
 * "claude-haiku-4-5" → "haiku4"
 * 매칭 안 되면 sonnet4로 폴백.
 */
export function pricingFamily(modelId: string | null | undefined): string {
  if (!modelId) return FALLBACK_FAMILY;
  const m = modelId.toLowerCase();
  if (m.includes('opus')) return 'opus4';
  if (m.includes('sonnet')) return 'sonnet4';
  if (m.includes('haiku')) return 'haiku4';
  return FALLBACK_FAMILY;
}

export function getPricing(modelId: string | null | undefined, isLongContext = false): {
  label: string;
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  long: boolean;
} {
  const family = pricingFamily(modelId);
  const p = MODEL_PRICING[family];
  if (isLongContext && p.long) {
    return { label: p.label + ' (1M)', ...p.long, long: true };
  }
  return { label: p.label, input: p.input, output: p.output, cacheRead: p.cacheRead, cacheWrite: p.cacheWrite, long: false };
}

/**
 * 비용 계산. Cache Creation 토큰까지 포함.
 */
export function calculateCost(
  input: number,
  output: number,
  cacheRead: number,
  cacheCreation = 0,
  modelId: string | null | undefined = null,
  isLongContext = false,
): number {
  const p = getPricing(modelId, isLongContext);
  return (
    input * p.input +
    output * p.output +
    cacheRead * p.cacheRead +
    cacheCreation * p.cacheWrite
  );
}

interface CostState {
  snapshots: UsageSnapshot[];
  sessionStart: number;
  lastSnapshotTime: number;

  // 액션
  addSnapshot: (snapshot: Omit<UsageSnapshot, 'timestamp' | 'totalCost'>) => void;
  getSessionCost: () => number;
  getHourlyData: () => { hour: string; cost: number }[];
  loadFromStorage: () => void;
  saveToStorage: () => void;
  clearHistory: () => void;
}

const STORAGE_KEY = 'clabs-cost-history';
const SNAPSHOT_INTERVAL = 5 * 60 * 1000;       // 5분
const MAX_RETENTION = 7 * 24 * 60 * 60 * 1000; // 7일

export const useCostStore = create<CostState>((set, get) => ({
  snapshots: [],
  sessionStart: Date.now(),
  lastSnapshotTime: 0,

  addSnapshot: (data) => {
    const now = Date.now();
    const { lastSnapshotTime } = get();

    // 5분 간격으로만 스냅샷 저장
    if (now - lastSnapshotTime < SNAPSHOT_INTERVAL) return;

    const totalCost = calculateCost(
      data.inputTokens,
      data.outputTokens,
      data.cacheReadTokens,
      data.cacheCreationTokens || 0,
      (data as { model?: string | null }).model ?? null,
      Boolean((data as { isLongContext?: boolean }).isLongContext),
    );
    const snapshot: UsageSnapshot = {
      ...data,
      timestamp: now,
      totalCost,
    };

    set((state) => ({
      snapshots: [...state.snapshots, snapshot],
      lastSnapshotTime: now,
    }));

    // localStorage에 저장
    get().saveToStorage();
  },

  getSessionCost: () => {
    const { snapshots, sessionStart } = get();
    return snapshots
      .filter((s) => s.timestamp >= sessionStart)
      .reduce((sum, s) => sum + s.totalCost, 0);
  },

  getHourlyData: () => {
    const { snapshots } = get();
    const now = Date.now();
    const hours: { hour: string; cost: number }[] = [];

    // 최근 24시간, 1시간 단위
    for (let i = 23; i >= 0; i--) {
      const hourStart = now - (i + 1) * 3_600_000;
      const hourEnd = now - i * 3_600_000;
      const hourSnapshots = snapshots.filter(
        (s) => s.timestamp >= hourStart && s.timestamp < hourEnd
      );
      const cost = hourSnapshots.reduce((sum, s) => sum + s.totalCost, 0);
      const date = new Date(hourEnd);
      hours.push({
        hour: `${date.getHours()}시`,
        cost,
      });
    }

    return hours;
  },

  loadFromStorage: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        const cutoff = Date.now() - MAX_RETENTION;
        const snapshots = (data.snapshots || []).filter(
          (s: UsageSnapshot) => s.timestamp > cutoff
        );
        set({ snapshots });
      }
    } catch (e) {
      console.error('비용 히스토리 로드 실패:', e);
    }
  },

  saveToStorage: () => {
    try {
      const { snapshots } = get();
      const cutoff = Date.now() - MAX_RETENTION;
      const filtered = snapshots.filter((s) => s.timestamp > cutoff);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ snapshots: filtered }));
    } catch (e) {
      console.error('비용 히스토리 저장 실패:', e);
    }
  },

  clearHistory: () => {
    set({ snapshots: [] });
    localStorage.removeItem(STORAGE_KEY);
  },
}));
