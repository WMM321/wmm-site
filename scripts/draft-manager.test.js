import { describe, test, expect } from 'vitest';
import { parseFrontmatter, generateFrontmatter } from './draft-manager.js';

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
