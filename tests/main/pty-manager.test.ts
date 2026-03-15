import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as pty from 'node-pty';
import { PtyManager } from '../../src/main/pty-manager';

// Mock node-pty
vi.mock('node-pty');

describe('PtyManager', () => {
  let ptyManager: PtyManager;
  let mockPtyProcess: any;

  beforeEach(() => {
    // Create mock pty process
    mockPtyProcess = {
      onData: vi.fn(),
      onExit: vi.fn(),
      write: vi.fn(),
      kill: vi.fn(),
      pid: 12345,
    };

    // Mock pty.spawn to return our mock process
    vi.mocked(pty.spawn).mockReturnValue(mockPtyProcess);

    ptyManager = new PtyManager();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('spawn', () => {
    it('should spawn Claude Code CLI process with correct command', () => {
      ptyManager.spawn();

      expect(pty.spawn).toHaveBeenCalledWith(
        'claude',
        [],
        expect.objectContaining({
          name: 'xterm-256color',
          cwd: process.cwd(),
        })
      );
    });

    it('should return process ID', () => {
      const pid = ptyManager.spawn();

      expect(pid).toBe(12345);
    });

    it('should throw error if process already running', () => {
      ptyManager.spawn();

      expect(() => ptyManager.spawn()).toThrow('Process already running');
    });

    it('should set up data handler', () => {
      ptyManager.spawn();

      expect(mockPtyProcess.onData).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should set up exit handler', () => {
      ptyManager.spawn();

      expect(mockPtyProcess.onExit).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('write', () => {
    it('should write input to pty process', () => {
      ptyManager.spawn();
      ptyManager.write('/help\r');

      expect(mockPtyProcess.write).toHaveBeenCalledWith('/help\r');
    });

    it('should throw error if process not running', () => {
      expect(() => ptyManager.write('/help\r')).toThrow('Process not running');
    });

    it('should handle multiple writes', () => {
      ptyManager.spawn();
      ptyManager.write('line1\r');
      ptyManager.write('line2\r');

      expect(mockPtyProcess.write).toHaveBeenCalledTimes(2);
      expect(mockPtyProcess.write).toHaveBeenNthCalledWith(1, 'line1\r');
      expect(mockPtyProcess.write).toHaveBeenNthCalledWith(2, 'line2\r');
    });
  });

  describe('onData', () => {
    it('should register data callback', () => {
      const callback = vi.fn();
      ptyManager.spawn();
      ptyManager.onData(callback);

      // Trigger the data handler
      const dataHandler = mockPtyProcess.onData.mock.calls[0][0];
      dataHandler('test output');

      expect(callback).toHaveBeenCalledWith('test output');
    });

    it('should throw error if process not running', () => {
      const callback = vi.fn();

      expect(() => ptyManager.onData(callback)).toThrow('Process not running');
    });

    it('should handle multiple data callbacks', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      ptyManager.spawn();
      ptyManager.onData(callback1);
      ptyManager.onData(callback2);

      // Trigger the data handler
      const dataHandler = mockPtyProcess.onData.mock.calls[0][0];
      dataHandler('test output');

      expect(callback1).toHaveBeenCalledWith('test output');
      expect(callback2).toHaveBeenCalledWith('test output');
    });

    it('should receive streamed output', () => {
      const callback = vi.fn();
      ptyManager.spawn();
      ptyManager.onData(callback);

      const dataHandler = mockPtyProcess.onData.mock.calls[0][0];
      dataHandler('chunk1');
      dataHandler('chunk2');
      dataHandler('chunk3');

      expect(callback).toHaveBeenCalledTimes(3);
      expect(callback).toHaveBeenNthCalledWith(1, 'chunk1');
      expect(callback).toHaveBeenNthCalledWith(2, 'chunk2');
      expect(callback).toHaveBeenNthCalledWith(3, 'chunk3');
    });
  });

  describe('kill', () => {
    it('should kill the pty process', () => {
      ptyManager.spawn();
      ptyManager.kill();

      expect(mockPtyProcess.kill).toHaveBeenCalled();
    });

    it('should throw error if process not running', () => {
      expect(() => ptyManager.kill()).toThrow('Process not running');
    });

    it('should allow spawning after kill', () => {
      ptyManager.spawn();
      ptyManager.kill();

      // Should not throw
      expect(() => ptyManager.spawn()).not.toThrow();
    });

    it('should clear process reference after kill', () => {
      ptyManager.spawn();
      ptyManager.kill();

      // Should throw because process is not running
      expect(() => ptyManager.write('test')).toThrow('Process not running');
    });
  });

  describe('onExit', () => {
    it('should trigger callbacks when process exits', () => {
      const exitCallback = vi.fn();
      ptyManager.spawn();

      // Register exit callback through the exit handler
      const exitHandler = mockPtyProcess.onExit.mock.calls[0][0];

      // Mock exit
      exitHandler({ exitCode: 0, signal: undefined });

      // After exit, process should be cleaned up
      expect(() => ptyManager.write('test')).toThrow('Process not running');
    });

    it('should handle process crash', () => {
      ptyManager.spawn();

      const exitHandler = mockPtyProcess.onExit.mock.calls[0][0];

      // Simulate crash (non-zero exit code)
      exitHandler({ exitCode: 1, signal: undefined });

      // Process should be cleaned up
      expect(() => ptyManager.write('test')).toThrow('Process not running');
    });
  });

  describe('isRunning', () => {
    it('should return false when process not spawned', () => {
      expect(ptyManager.isRunning()).toBe(false);
    });

    it('should return true when process is running', () => {
      ptyManager.spawn();

      expect(ptyManager.isRunning()).toBe(true);
    });

    it('should return false after process is killed', () => {
      ptyManager.spawn();
      ptyManager.kill();

      expect(ptyManager.isRunning()).toBe(false);
    });
  });

  describe('resize', () => {
    it('should resize pty terminal', () => {
      mockPtyProcess.resize = vi.fn();
      ptyManager.spawn();

      ptyManager.resize(80, 24);

      expect(mockPtyProcess.resize).toHaveBeenCalledWith(80, 24);
    });

    it('should throw error if process not running', () => {
      expect(() => ptyManager.resize(80, 24)).toThrow('Process not running');
    });
  });
});
