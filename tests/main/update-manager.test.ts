import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { UpdateManager } from '../../src/main/update-manager';

// Mock electron
vi.mock('electron', () => ({
  app: {
    quit: vi.fn(),
  },
}));

// Mock child_process
vi.mock('child_process', () => ({
  spawn: vi.fn(),
}));

describe('UpdateManager', () => {
  let updateManager: UpdateManager;

  beforeEach(() => {
    vi.clearAllMocks();
    updateManager = new UpdateManager({
      owner: 'test-owner',
      repo: 'test-repo',
      currentVersion: '1.0.0',
    });
  });

  afterEach(() => {
    updateManager.disableAutoCheck();
  });

  describe('checkForUpdates', () => {
    it('should return null when no updates available', async () => {
      // Mock GitHub API response - latest version is same as current
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          tag_name: 'v1.0.0',
          name: 'Version 1.0.0',
          body: 'Release notes',
          published_at: '2024-01-01T00:00:00Z',
        }),
      });

      const update = await updateManager.checkForUpdates();
      expect(update).toBeNull();
    });

    it('should return update info when newer version available', async () => {
      // Mock GitHub API response - latest version is newer
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          tag_name: 'v2.0.0',
          name: 'Version 2.0.0',
          body: '## New Features\n- Feature A\n- Feature B',
          published_at: '2024-02-01T00:00:00Z',
          assets: [
            {
              name: 'clabs-2.0.0-mac.dmg',
              browser_download_url: 'https://github.com/test/releases/download/v2.0.0/clabs-2.0.0-mac.dmg',
              size: 104857600,
            },
          ],
        }),
      });

      const update = await updateManager.checkForUpdates();
      expect(update).not.toBeNull();
      expect(update?.version).toBe('2.0.0');
      expect(update?.releaseNotes).toContain('Feature A');
      expect(update?.downloadUrl).toContain('clabs-2.0.0-mac.dmg');
    });

    it('should handle API errors gracefully', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const update = await updateManager.checkForUpdates();
      expect(update).toBeNull();
    });

    it('should handle rate limit errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({
          message: 'API rate limit exceeded',
        }),
      });

      const update = await updateManager.checkForUpdates();
      expect(update).toBeNull();
    });
  });

  describe('downloadUpdate', () => {
    it('should download update file and report progress', async () => {
      const downloadUrl = 'https://github.com/test/releases/download/v2.0.0/clabs-2.0.0-mac.dmg';
      const progressCallback = vi.fn();

      // Mock fetch for download
      const mockResponse = {
        ok: true,
        headers: new Headers({ 'content-length': '1024' }),
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({ done: false, value: new Uint8Array(512) })
              .mockResolvedValueOnce({ done: false, value: new Uint8Array(512) })
              .mockResolvedValueOnce({ done: true }),
          }),
        },
      };

      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const filePath = await updateManager.downloadUpdate(downloadUrl, progressCallback);

      expect(filePath).toBeTruthy();
      expect(filePath).toContain('.dmg');
      expect(progressCallback).toHaveBeenCalled();
      expect(progressCallback).toHaveBeenCalledWith(expect.objectContaining({
        percent: expect.any(Number),
        transferred: expect.any(Number),
        total: 1024,
      }));
    });

    it('should handle download failures', async () => {
      const downloadUrl = 'https://github.com/test/releases/download/v2.0.0/clabs-2.0.0-mac.dmg';
      const progressCallback = vi.fn();

      global.fetch = vi.fn().mockRejectedValue(new Error('Download failed'));

      await expect(
        updateManager.downloadUpdate(downloadUrl, progressCallback)
      ).rejects.toThrow('Download failed');
    });
  });

  describe('installUpdate', () => {
    it('should install update and quit app on macOS', async () => {
      const filePath = '/tmp/clabs-2.0.0-mac.dmg';
      const { spawn } = await import('child_process');

      // Mock spawn for opening dmg
      vi.mocked(spawn).mockReturnValue({
        on: vi.fn((event: string, callback: any) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 0);
          }
          return this;
        }),
      } as any);

      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        configurable: true,
      });

      const result = await updateManager.installUpdate(filePath);
      expect(result).toBe(true);

      // Restore platform
      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
        configurable: true,
      });
    });

    it('should install update on Windows', async () => {
      const filePath = 'C:\\temp\\clabs-2.0.0-setup.exe';
      const { spawn } = await import('child_process');

      vi.mocked(spawn).mockReturnValue({
        unref: vi.fn(),
      } as any);

      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        configurable: true,
      });

      const result = await updateManager.installUpdate(filePath);
      expect(result).toBe(true);

      // Restore platform
      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
        configurable: true,
      });
    });

    it('should handle installation failures', async () => {
      const filePath = '/invalid/path/installer.dmg';
      const { spawn } = await import('child_process');

      vi.mocked(spawn).mockReturnValue({
        on: vi.fn((event: string, callback: any) => {
          if (event === 'error') {
            setTimeout(() => callback(new Error('Installation failed')), 0);
          }
          return this;
        }),
      } as any);

      await expect(
        updateManager.installUpdate(filePath)
      ).rejects.toThrow();
    });
  });

  describe('version comparison', () => {
    it('should correctly compare semantic versions', () => {
      const manager1 = new UpdateManager({
        owner: 'test',
        repo: 'test',
        currentVersion: '1.0.0',
      });

      expect(manager1['isNewerVersion']('2.0.0')).toBe(true);
      expect(manager1['isNewerVersion']('1.1.0')).toBe(true);
      expect(manager1['isNewerVersion']('1.0.1')).toBe(true);
      expect(manager1['isNewerVersion']('1.0.0')).toBe(false);
      expect(manager1['isNewerVersion']('0.9.9')).toBe(false);
    });

    it('should handle version strings with v prefix', () => {
      const manager = new UpdateManager({
        owner: 'test',
        repo: 'test',
        currentVersion: '1.0.0',
      });

      expect(manager['isNewerVersion']('v2.0.0')).toBe(true);
    });
  });

  describe('auto-update check', () => {
    it('should respect check interval', async () => {
      const checkSpy = vi.spyOn(updateManager, 'checkForUpdates');

      // Enable auto-check with 1 hour interval
      updateManager.enableAutoCheck(3600000);

      // Should not check immediately (uses setTimeout)
      expect(checkSpy).not.toHaveBeenCalled();

      // Clean up
      updateManager.disableAutoCheck();
    });

    it('should stop auto-check when disabled', () => {
      updateManager.enableAutoCheck(1000);
      updateManager.disableAutoCheck();

      // Should clear the interval
      expect(updateManager['checkInterval']).toBeUndefined();
    });
  });
});
