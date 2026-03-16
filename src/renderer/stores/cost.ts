// 비용/토큰 대시보드 스토어
import { create } from 'zustand';
import type { UsageSnapshot } from '@renderer/types/cost';

// Claude Sonnet 4 가격 (USD per token)
const PRICE_INPUT = 3 / 1_000_000;        // $3/MTok
const PRICE_OUTPUT = 15 / 1_000_000;      // $15/MTok
const PRICE_CACHE_READ = 0.30 / 1_000_000; // $0.30/MTok

export function calculateCost(input: number, output: number, cacheRead: number): number {
  return input * PRICE_INPUT + output * PRICE_OUTPUT + cacheRead * PRICE_CACHE_READ;
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

    const totalCost = calculateCost(data.inputTokens, data.outputTokens, data.cacheReadTokens);
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
