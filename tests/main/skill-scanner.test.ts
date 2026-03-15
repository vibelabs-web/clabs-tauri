import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SkillScanner, type SkillInfo, type SkillMetadata } from '../../src/main/skill-scanner';
import * as fs from 'fs';
import * as path from 'path';

vi.mock('fs');
vi.mock('path');

describe('SkillScanner', () => {
  let scanner: SkillScanner;
  const mockSkillsDir = '/mock/.claude/skills';

  beforeEach(() => {
    vi.clearAllMocks();
    scanner = new SkillScanner(mockSkillsDir);
  });

  describe('scan()', () => {
    it('should return empty array when skills directory does not exist', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = await scanner.scan();

      expect(result).toEqual([]);
    });

    it('should scan and return list of skills', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue([
        'auto-orchestrate',
        'desktop-bridge',
        'cost-router'
      ] as any);
      vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => true } as any);
      vi.mocked(path.join).mockImplementation((...args) => args.join('/'));

      const mockSkillMd1 = `---
name: auto-orchestrate
description: TASKS.md를 분석하여 의존성 기반 자동 실행
trigger: /orchestrate
category: 워크플로우
---

# Auto-Orchestrate`;

      const mockSkillMd2 = `---
name: desktop-bridge
description: Electron 앱 개발 전문가
trigger: /desktop-bridge
category: 전문가
---

# Desktop Bridge`;

      const mockSkillMd3 = `---
name: cost-router
description: AI 비용 최적화 라우터
trigger: /cost-router
category: 유틸리티
---

# Cost Router`;

      vi.mocked(fs.readFileSync)
        .mockReturnValueOnce(mockSkillMd1)
        .mockReturnValueOnce(mockSkillMd2)
        .mockReturnValueOnce(mockSkillMd3);

      const result = await scanner.scan();

      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({
        name: 'auto-orchestrate',
        description: 'TASKS.md를 분석하여 의존성 기반 자동 실행',
        trigger: '/orchestrate',
        category: '워크플로우',
        path: 'auto-orchestrate'
      });
    });

    it('should skip directories without SKILL.md', async () => {
      vi.mocked(fs.existsSync)
        .mockReturnValueOnce(true) // skills dir exists
        .mockReturnValueOnce(false) // no SKILL.md in first dir
        .mockReturnValueOnce(true); // SKILL.md exists in second dir

      vi.mocked(fs.readdirSync).mockReturnValue([
        'invalid-skill',
        'valid-skill'
      ] as any);
      vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => true } as any);
      vi.mocked(path.join).mockImplementation((...args) => args.join('/'));

      const mockSkillMd = `---
name: valid-skill
description: Valid skill with SKILL.md
trigger: /valid
---

# Valid Skill`;

      vi.mocked(fs.readFileSync).mockReturnValue(mockSkillMd);

      const result = await scanner.scan();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('valid-skill');
    });

    it('should handle corrupted SKILL.md gracefully', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue(['corrupted-skill'] as any);
      vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => true } as any);
      vi.mocked(path.join).mockImplementation((...args) => args.join('/'));
      vi.mocked(fs.readFileSync).mockReturnValue('Invalid YAML frontmatter');

      const result = await scanner.scan();

      expect(result).toHaveLength(0);
    });
  });

  describe('parseSkillMd()', () => {
    it('should parse SKILL.md with YAML frontmatter', () => {
      const content = `---
name: test-skill
description: Test skill description
trigger: /test
category: 테스트
version: 1.0.0
author: Claude Labs
---

# Test Skill

This is a test skill.`;

      const result = scanner.parseSkillMd(content);

      expect(result).toEqual({
        name: 'test-skill',
        description: 'Test skill description',
        trigger: '/test',
        category: '테스트',
        version: '1.0.0',
        author: 'Claude Labs'
      });
    });

    it('should handle missing optional fields', () => {
      const content = `---
name: minimal-skill
description: Minimal skill
trigger: /minimal
---

# Minimal`;

      const result = scanner.parseSkillMd(content);

      expect(result).toEqual({
        name: 'minimal-skill',
        description: 'Minimal skill',
        trigger: '/minimal',
        category: undefined,
        version: undefined,
        author: undefined
      });
    });

    it('should return null for invalid YAML', () => {
      const content = `---
invalid yaml: [
---

# Invalid`;

      const result = scanner.parseSkillMd(content);

      expect(result).toBeNull();
    });

    it('should return null for missing frontmatter', () => {
      const content = `# No Frontmatter

This skill has no YAML frontmatter.`;

      const result = scanner.parseSkillMd(content);

      expect(result).toBeNull();
    });
  });

  describe('categorize()', () => {
    it('should categorize skills by category field', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue([
        'skill1',
        'skill2',
        'skill3'
      ] as any);
      vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => true } as any);
      vi.mocked(path.join).mockImplementation((...args) => args.join('/'));

      const mockSkills = [
        `---
name: skill1
description: Skill 1
trigger: /s1
category: 워크플로우
---`,
        `---
name: skill2
description: Skill 2
trigger: /s2
category: 전문가
---`,
        `---
name: skill3
description: Skill 3
trigger: /s3
category: 워크플로우
---`
      ];

      vi.mocked(fs.readFileSync)
        .mockReturnValueOnce(mockSkills[0])
        .mockReturnValueOnce(mockSkills[1])
        .mockReturnValueOnce(mockSkills[2]);

      const skills = await scanner.scan();
      const categorized = scanner.categorize(skills);

      expect(categorized['워크플로우']).toHaveLength(2);
      expect(categorized['전문가']).toHaveLength(1);
      expect(categorized['워크플로우'].map(s => s.name)).toEqual(['skill1', 'skill3']);
    });

    it('should handle skills without category as "기타"', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue(['uncategorized'] as any);
      vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => true } as any);
      vi.mocked(path.join).mockImplementation((...args) => args.join('/'));

      const mockSkill = `---
name: uncategorized
description: No category
trigger: /unc
---`;

      vi.mocked(fs.readFileSync).mockReturnValue(mockSkill);

      const skills = await scanner.scan();
      const categorized = scanner.categorize(skills);

      expect(categorized['기타']).toHaveLength(1);
    });

    it('should return empty object for empty skills array', () => {
      const categorized = scanner.categorize([]);

      expect(categorized).toEqual({});
    });
  });

  describe('getSkillByName()', () => {
    it('should return skill info by name', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue(['target-skill', 'other-skill'] as any);
      vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => true } as any);
      vi.mocked(path.join).mockImplementation((...args) => args.join('/'));

      const mockSkills = [
        `---
name: target-skill
description: Target
trigger: /target
---`,
        `---
name: other-skill
description: Other
trigger: /other
---`
      ];

      vi.mocked(fs.readFileSync)
        .mockReturnValueOnce(mockSkills[0])
        .mockReturnValueOnce(mockSkills[1]);

      await scanner.scan();
      const result = scanner.getSkillByName('target-skill');

      expect(result).toBeDefined();
      expect(result?.name).toBe('target-skill');
    });

    it('should return undefined for non-existent skill', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue([] as any);

      await scanner.scan();
      const result = scanner.getSkillByName('non-existent');

      expect(result).toBeUndefined();
    });
  });

  describe('getReferences()', () => {
    it('should return list of reference files for a skill', () => {
      const skillPath = 'auto-orchestrate';
      const referencesPath = `${mockSkillsDir}/${skillPath}/references`;

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue([
        'workflow.md',
        'examples.md',
        'troubleshooting.md'
      ] as any);
      vi.mocked(path.join).mockImplementation((...args) => args.join('/'));

      const result = scanner.getReferences(skillPath);

      expect(result).toHaveLength(3);
      expect(result).toContain('workflow.md');
      expect(result).toContain('examples.md');
    });

    it('should return empty array if references directory does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = scanner.getReferences('no-references-skill');

      expect(result).toEqual([]);
    });
  });
});
