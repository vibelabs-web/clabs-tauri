import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { UsageStore } from '../../src/main/stores/usage-store';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('UsageStore', () => {
  let usageStore: UsageStore;
  let testStorePath: string;

  beforeEach(() => {
    // Create a temporary directory for test store
    testStorePath = path.join(os.tmpdir(), `test-usage-${Date.now()}`);
    fs.mkdirSync(testStorePath, { recursive: true });

    usageStore = new UsageStore({
      cwd: testStorePath,
      name: 'test-usage'
    });
  });

  afterEach(() => {
    // Clean up test store files
    if (fs.existsSync(testStorePath)) {
      fs.rmSync(testStorePath, { recursive: true, force: true });
    }
  });

  describe('parseTokenUsage()', () => {
    it('should parse token usage from PTY output with standard format', () => {
      const ptyData = 'Token usage: input=1234 output=5678';
      const result = usageStore.parseTokenUsage(ptyData);

      expect(result).toEqual({
        input: 1234,
        output: 5678,
        total: 6912
      });
    });

    it('should parse token usage from PTY output with JSON format', () => {
      const ptyData = '{"tokens":{"input":2000,"output":3000}}';
      const result = usageStore.parseTokenUsage(ptyData);

      expect(result).toEqual({
        input: 2000,
        output: 3000,
        total: 5000
      });
    });

    it('should return null for data without token information', () => {
      const ptyData = 'Some random output without tokens';
      const result = usageStore.parseTokenUsage(ptyData);

      expect(result).toBeNull();
    });

    it('should parse partial token data', () => {
      const ptyData = 'Input tokens: 1500';
      const result = usageStore.parseTokenUsage(ptyData);

      expect(result).toEqual({
        input: 1500,
        output: 0,
        total: 1500
      });
    });

    it('should handle malformed data gracefully', () => {
      const ptyData = 'Token usage: input=abc output=xyz';
      const result = usageStore.parseTokenUsage(ptyData);

      expect(result).toBeNull();
    });
  });

  describe('addTokens()', () => {
    it('should add token usage to today\'s total', () => {
      usageStore.addTokens(1000, 2000);

      const today = usageStore.getToday();
      expect(today.input).toBe(1000);
      expect(today.output).toBe(2000);
      expect(today.total).toBe(3000);
    });

    it('should accumulate multiple token additions', () => {
      usageStore.addTokens(1000, 2000);
      usageStore.addTokens(500, 1500);

      const today = usageStore.getToday();
      expect(today.input).toBe(1500);
      expect(today.output).toBe(3500);
      expect(today.total).toBe(5000);
    });

    it('should handle zero tokens', () => {
      usageStore.addTokens(0, 0);

      const today = usageStore.getToday();
      expect(today.input).toBe(0);
      expect(today.output).toBe(0);
      expect(today.total).toBe(0);
    });

    it('should handle negative tokens as zero', () => {
      usageStore.addTokens(-100, -200);

      const today = usageStore.getToday();
      expect(today.input).toBe(0);
      expect(today.output).toBe(0);
      expect(today.total).toBe(0);
    });
  });

  describe('getToday()', () => {
    it('should return zero usage when no tokens added', () => {
      const today = usageStore.getToday();

      expect(today).toEqual({
        input: 0,
        output: 0,
        total: 0
      });
    });

    it('should return today\'s usage after adding tokens', () => {
      usageStore.addTokens(3000, 4000);

      const today = usageStore.getToday();
      expect(today.input).toBe(3000);
      expect(today.output).toBe(4000);
      expect(today.total).toBe(7000);
    });

    it('should persist usage across store instances on same day', () => {
      usageStore.addTokens(1000, 2000);

      // Create a new store instance on the same day
      const newStore = new UsageStore({
        cwd: testStorePath,
        name: 'test-usage'
      });

      const today = newStore.getToday();
      // Should show same day's data
      expect(today.input).toBe(1000);
      expect(today.output).toBe(2000);
    });
  });

  describe('startTask()', () => {
    it('should record task start time', () => {
      const taskId = 'test-task-1';
      const startTime = usageStore.startTask(taskId);

      expect(startTime).toBeInstanceOf(Date);
      expect(startTime.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should allow multiple concurrent tasks', () => {
      const taskId1 = 'task-1';
      const taskId2 = 'task-2';

      const start1 = usageStore.startTask(taskId1);
      const start2 = usageStore.startTask(taskId2);

      expect(start1).toBeInstanceOf(Date);
      expect(start2).toBeInstanceOf(Date);
      expect(start2.getTime()).toBeGreaterThanOrEqual(start1.getTime());
    });

    it('should overwrite start time if task started again', () => {
      const taskId = 'test-task';

      const start1 = usageStore.startTask(taskId);

      // Wait a bit
      const delay = new Promise(resolve => setTimeout(resolve, 10));

      return delay.then(() => {
        const start2 = usageStore.startTask(taskId);
        expect(start2.getTime()).toBeGreaterThan(start1.getTime());
      });
    });
  });

  describe('endTask()', () => {
    it('should calculate task duration in seconds', () => {
      const taskId = 'test-task';

      usageStore.startTask(taskId);

      // Wait a bit
      return new Promise(resolve => setTimeout(resolve, 100)).then(() => {
        const duration = usageStore.endTask(taskId);

        expect(duration).toBeGreaterThanOrEqual(0.1);
        expect(duration).toBeLessThan(1);
      });
    });

    it('should return 0 for task that was not started', () => {
      const duration = usageStore.endTask('nonexistent-task');

      expect(duration).toBe(0);
    });

    it('should remove task from active tasks after ending', () => {
      const taskId = 'test-task';

      usageStore.startTask(taskId);
      usageStore.endTask(taskId);

      // Ending again should return 0
      const duration = usageStore.endTask(taskId);
      expect(duration).toBe(0);
    });

    it('should handle multiple tasks independently', () => {
      const task1 = 'task-1';
      const task2 = 'task-2';

      usageStore.startTask(task1);

      return new Promise(resolve => setTimeout(resolve, 50)).then(() => {
        usageStore.startTask(task2);

        return new Promise(resolve => setTimeout(resolve, 100));
      }).then(() => {
        const duration1 = usageStore.endTask(task1);
        const duration2 = usageStore.endTask(task2);

        expect(duration1).toBeGreaterThan(duration2);
        expect(duration1).toBeGreaterThanOrEqual(0.15);
        expect(duration2).toBeGreaterThanOrEqual(0.1);
      });
    });
  });

  describe('persistence', () => {
    it('should persist token usage across instances', () => {
      usageStore.addTokens(5000, 7000);

      // Create a new instance pointing to same store
      const newInstance = new UsageStore({
        cwd: testStorePath,
        name: 'test-usage'
      });

      const today = newInstance.getToday();
      expect(today.input).toBe(5000);
      expect(today.output).toBe(7000);
      expect(today.total).toBe(12000);
    });
  });

  describe('integration with PTY parsing', () => {
    it('should parse and add tokens from PTY output', () => {
      const ptyData = 'Token usage: input=2500 output=3500';
      const parsed = usageStore.parseTokenUsage(ptyData);

      if (parsed) {
        usageStore.addTokens(parsed.input, parsed.output);
      }

      const today = usageStore.getToday();
      expect(today.input).toBe(2500);
      expect(today.output).toBe(3500);
      expect(today.total).toBe(6000);
    });

    it('should handle continuous PTY output stream', () => {
      const ptyOutputs = [
        'Starting task...',
        'Token usage: input=1000 output=1500',
        'Processing...',
        'Token usage: input=500 output=800',
        'Task completed!'
      ];

      ptyOutputs.forEach(line => {
        const parsed = usageStore.parseTokenUsage(line);
        if (parsed) {
          usageStore.addTokens(parsed.input, parsed.output);
        }
      });

      const today = usageStore.getToday();
      expect(today.input).toBe(1500);
      expect(today.output).toBe(2300);
      expect(today.total).toBe(3800);
    });
  });
});
