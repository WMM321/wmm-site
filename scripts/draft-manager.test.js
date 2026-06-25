import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseFrontmatter, generateFrontmatter, fileExists, generateFilename, validateFrontmatter, ensureDir } from './draft-manager.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('Frontmatter 解析', () => {
  test('解析正确格式的 frontmatter', () => {
    const content = `---
title: "测试文章"
published: 2026-06-24
draft: true
tags: ["标签1", "标签2"]
---
正文内容`;

    const { data, body } = parseFrontmatter(content);

    expect(data.title).toBe('测试文章');
    expect(data.published).toBe('2026-06-24');
    expect(data.draft).toBe(true);
    expect(data.tags).toEqual(['标签1', '标签2']);
    expect(body).toBe('正文内容');
  });

  test('解析没有 frontmatter 的内容', () => {
    const content = '纯文本内容，没有 frontmatter';

    const { data, body } = parseFrontmatter(content);

    expect(data).toEqual({});
    expect(body).toBe(content);
  });

  test('生成 frontmatter', () => {
    const data = {
      title: '测试文章',
      published: '2026-06-24',
      draft: true,
      tags: ['标签1', '标签2']
    };
    const body = '正文内容';

    const result = generateFrontmatter(data, body);

    expect(result).toContain('title: 测试文章');
    expect(result).toContain('published: 2026-06-24');
    expect(result).toContain('draft: true');
    expect(result).toContain('tags: [标签1, 标签2]');
    expect(result).toContain('正文内容');
  });
});

describe('文件操作工具函数', () => {
  const testDir = path.join(__dirname, 'test-temp');

  beforeEach(() => {
    // 使用 recursive: true 确保幂等创建，兼容 Windows 环境
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  test('fileExists - 文件存在', () => {
    const testFile = path.join(testDir, 'test.txt');
    fs.writeFileSync(testFile, 'test');

    const exists = fileExists(testFile);
    expect(exists).toBe(true);
  });

  test('fileExists - 文件不存在', () => {
    const testFile = path.join(testDir, 'nonexistent.txt');

    const exists = fileExists(testFile);
    expect(exists).toBe(false);
  });

  test('generateFilename - 生成文件名', () => {
    const filename = generateFilename('我的第一篇文章');

    expect(filename).toMatch(/^\d{4}-\d{2}-\d{2}-.+\.md$/);
    expect(filename).toContain('我的第一篇文章');
  });

  test('validateFrontmatter - 验证完整数据', () => {
    const data = {
      title: '测试',
      published: '2026-06-24',
      description: '测试描述',
      tags: ['标签'],
      category: '分类'
    };

    const validation = validateFrontmatter(data);
    expect(validation.valid).toBe(true);
    expect(validation.missing).toEqual([]);
  });

  test('validateFrontmatter - 验证缺少字段', () => {
    const data = {
      title: '测试',
      published: '2026-06-24'
    };

    const validation = validateFrontmatter(data);
    expect(validation.valid).toBe(false);
    expect(validation.missing).toContain('description');
    expect(validation.missing).toContain('tags');
    expect(validation.missing).toContain('category');
  });

  test('ensureDir - 目录不存在时创建', () => {
    const newDir = path.join(testDir, 'new-folder', 'sub-folder');
    ensureDir(newDir);
    expect(fs.existsSync(newDir)).toBe(true);
  });

  test('ensureDir - 目录已存在时不报错', () => {
    const existingDir = path.join(testDir, 'existing-folder');
    // 使用 recursive: true 幂等创建，确保不依赖 beforeEach 的清理状态
    fs.mkdirSync(existingDir, { recursive: true });
    // 不应抛出异常
    expect(() => ensureDir(existingDir)).not.toThrow();
    expect(fs.existsSync(existingDir)).toBe(true);
  });
});
