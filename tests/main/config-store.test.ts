import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ConfigStore } from '../../src/main/stores/config-store';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('ConfigStore', () => {
  let configStore: ConfigStore;
  let testConfigPath: string;

  beforeEach(() => {
    // Create a temporary directory for test config
    testConfigPath = path.join(os.tmpdir(), `test-config-${Date.now()}`);
    fs.mkdirSync(testConfigPath, { recursive: true });

    configStore = new ConfigStore({
      cwd: testConfigPath,
      name: 'test-config'
    });
  });

  afterEach(() => {
    // Clean up test config files
    if (fs.existsSync(testConfigPath)) {
      fs.rmSync(testConfigPath, { recursive: true, force: true });
    }
  });

  describe('get()', () => {
    it('should return default value when key does not exist', () => {
      const result = configStore.get('nonexistent', 'default-value');
      expect(result).toBe('default-value');
    });

    it('should return stored value when key exists', () => {
      configStore.set('theme', 'dark');
      const result = configStore.get('theme');
      expect(result).toBe('dark');
    });

    it('should return undefined when key does not exist and no default provided', () => {
      const result = configStore.get('nonexistent');
      expect(result).toBeUndefined();
    });

    it('should retrieve nested values using dot notation', () => {
      configStore.set('user.name', 'John Doe');
      const result = configStore.get('user.name');
      expect(result).toBe('John Doe');
    });
  });

  describe('set()', () => {
    it('should store a simple value', () => {
      configStore.set('language', 'en');
      expect(configStore.get('language')).toBe('en');
    });

    it('should store a nested object value', () => {
      configStore.set('editor.fontSize', 14);
      expect(configStore.get('editor.fontSize')).toBe(14);
    });

    it('should overwrite existing value', () => {
      configStore.set('theme', 'light');
      configStore.set('theme', 'dark');
      expect(configStore.get('theme')).toBe('dark');
    });

    it('should store complex objects', () => {
      const complexObj = {
        name: 'Test',
        settings: {
          enabled: true,
          count: 42
        }
      };
      configStore.set('complex', complexObj);
      expect(configStore.get('complex')).toEqual(complexObj);
    });
  });

  describe('defaults', () => {
    it('should use default values when initialized', () => {
      const storeWithDefaults = new ConfigStore({
        cwd: testConfigPath,
        name: 'test-defaults',
        defaults: {
          theme: 'light',
          language: 'en',
          editor: {
            fontSize: 12,
            fontFamily: 'monospace'
          }
        }
      });

      expect(storeWithDefaults.get('theme')).toBe('light');
      expect(storeWithDefaults.get('language')).toBe('en');
      expect(storeWithDefaults.get('editor.fontSize')).toBe(12);
      expect(storeWithDefaults.get('editor.fontFamily')).toBe('monospace');
    });

    it('should not overwrite existing values with defaults', () => {
      configStore.set('theme', 'dark');

      const storeWithDefaults = new ConfigStore({
        cwd: testConfigPath,
        name: 'test-config',
        defaults: {
          theme: 'light'
        }
      });

      expect(storeWithDefaults.get('theme')).toBe('dark');
    });
  });

  describe('has()', () => {
    it('should return true when key exists', () => {
      configStore.set('exists', true);
      expect(configStore.has('exists')).toBe(true);
    });

    it('should return false when key does not exist', () => {
      expect(configStore.has('nonexistent')).toBe(false);
    });
  });

  describe('delete()', () => {
    it('should remove a key', () => {
      configStore.set('toDelete', 'value');
      expect(configStore.has('toDelete')).toBe(true);

      configStore.delete('toDelete');
      expect(configStore.has('toDelete')).toBe(false);
    });
  });

  describe('clear()', () => {
    it('should remove all keys', () => {
      configStore.set('key1', 'value1');
      configStore.set('key2', 'value2');

      configStore.clear();

      expect(configStore.has('key1')).toBe(false);
      expect(configStore.has('key2')).toBe(false);
    });
  });

  describe('persistence', () => {
    it('should persist data across instances', () => {
      configStore.set('persistent', 'value');

      // Create a new instance pointing to same config
      const newInstance = new ConfigStore({
        cwd: testConfigPath,
        name: 'test-config'
      });

      expect(newInstance.get('persistent')).toBe('value');
    });
  });
});
