import { describe, it, expect, beforeEach, vi } from 'vitest';
import { safeStorage } from 'electron';

// Mock electron safeStorage
vi.mock('electron', () => ({
  safeStorage: {
    isEncryptionAvailable: vi.fn(() => true),
    encryptString: vi.fn((plainText: string) => Buffer.from(plainText + '_encrypted')),
    decryptString: vi.fn((encrypted: Buffer) => {
      const str = encrypted.toString();
      return str.replace('_encrypted', '');
    }),
  },
  app: {
    getPath: vi.fn(() => '/mock/path'),
  },
}));

// Mock electron-store
vi.mock('electron-store', () => {
  return {
    default: class Store {
      private data: Record<string, any> = {};

      get(key: string): any {
        return this.data[key];
      }

      set(key: string, value: any): void {
        this.data[key] = value;
      }

      delete(key: string): void {
        delete this.data[key];
      }

      clear(): void {
        this.data = {};
      }
    },
  };
});

describe('LicenseStore', () => {
  let LicenseStore: any;
  let licenseStore: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Reset isEncryptionAvailable to true by default
    vi.mocked(safeStorage.isEncryptionAvailable).mockReturnValue(true);

    // Dynamically import the module to reset state
    const module = await import('../../src/main/stores/license-store');
    LicenseStore = module.LicenseStore;
    licenseStore = new LicenseStore();
  });

  describe('set() - 라이선스 저장 (암호화)', () => {
    it('유효한 라이선스를 암호화하여 저장해야 함', () => {
      const license = 'CLABS-1234-5678-ABCD';

      licenseStore.set(license);

      expect(safeStorage.encryptString).toHaveBeenCalledWith(license);
    });

    it('빈 문자열은 저장하지 않아야 함', () => {
      expect(() => licenseStore.set('')).toThrow('License cannot be empty');
    });

    it('null은 저장하지 않아야 함', () => {
      expect(() => licenseStore.set(null)).toThrow('License cannot be empty');
    });
  });

  describe('get() - 라이선스 조회 (복호화)', () => {
    it('저장된 라이선스를 복호화하여 반환해야 함', () => {
      const license = 'CLABS-1234-5678-ABCD';

      licenseStore.set(license);
      const retrieved = licenseStore.get();

      expect(safeStorage.decryptString).toHaveBeenCalled();
      expect(retrieved).toBe(license);
    });

    it('저장된 라이선스가 없으면 null을 반환해야 함', () => {
      const retrieved = licenseStore.get();

      expect(retrieved).toBeNull();
    });

    it('암호화를 사용할 수 없으면 에러를 던져야 함', () => {
      vi.mocked(safeStorage.isEncryptionAvailable).mockReturnValue(false);

      const newLicenseStore = new LicenseStore();

      expect(() => newLicenseStore.get()).toThrow('Encryption is not available');
    });
  });

  describe('isValid() - 유효성 검사', () => {
    it('올바른 형식의 라이선스는 유효해야 함', () => {
      const license = 'CLABS-1234-5678-ABCD';

      licenseStore.set(license);

      expect(licenseStore.isValid()).toBe(true);
    });

    it('잘못된 형식의 라이선스는 무효해야 함', () => {
      const invalidLicense = 'INVALID-FORMAT';

      licenseStore.set(invalidLicense);

      expect(licenseStore.isValid()).toBe(false);
    });

    it('라이선스가 없으면 무효해야 함', () => {
      expect(licenseStore.isValid()).toBe(false);
    });

    it('CLABS-XXXX-XXXX-XXXX 형식이어야 함', () => {
      const validFormats = [
        'CLABS-1234-5678-ABCD',
        'CLABS-0000-0000-0000',
        'CLABS-AAAA-BBBB-CCCC',
      ];

      const invalidFormats = [
        'CLABS-123-456-789',      // 잘못된 길이
        'CLABS-12345-678-ABC',    // 불균형
        'WRONGPREFIX-1234-5678-ABCD', // 잘못된 접두사
        'CLABS1234-5678-ABCD',    // 대시 누락
      ];

      validFormats.forEach((license) => {
        licenseStore.set(license);
        expect(licenseStore.isValid()).toBe(true);
      });

      invalidFormats.forEach((license) => {
        licenseStore.set(license);
        expect(licenseStore.isValid()).toBe(false);
      });
    });
  });

  describe('validate(key) - 서버 검증', () => {
    it('서버 검증 API를 호출해야 함', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ valid: true }),
        } as Response)
      );

      const license = 'CLABS-1234-5678-ABCD';
      licenseStore.set(license);

      const result = await licenseStore.validate(license);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/license/validate'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: expect.stringContaining(license),
        })
      );
      expect(result).toBe(true);
    });

    it('서버가 유효하지 않다고 응답하면 false를 반환해야 함', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ valid: false }),
        } as Response)
      );

      const license = 'CLABS-1234-5678-ABCD';

      const result = await licenseStore.validate(license);

      expect(result).toBe(false);
    });

    it('네트워크 오류 시 false를 반환해야 함', async () => {
      global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

      const license = 'CLABS-1234-5678-ABCD';

      const result = await licenseStore.validate(license);

      expect(result).toBe(false);
    });

    it('서버 응답이 4xx/5xx이면 false를 반환해야 함', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 404,
        } as Response)
      );

      const license = 'CLABS-1234-5678-ABCD';

      const result = await licenseStore.validate(license);

      expect(result).toBe(false);
    });
  });

  describe('delete() - 라이선스 삭제', () => {
    it('저장된 라이선스를 삭제해야 함', () => {
      const license = 'CLABS-1234-5678-ABCD';

      licenseStore.set(license);
      expect(licenseStore.get()).toBe(license);

      licenseStore.delete();
      expect(licenseStore.get()).toBeNull();
    });
  });
});
