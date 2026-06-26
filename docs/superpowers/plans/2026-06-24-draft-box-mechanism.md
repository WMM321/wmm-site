# 草稿箱机制实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现一个轻量级的草稿箱机制，支持在本地暂存和编辑文章，审查通过后才发布到网站

**Architecture:** 使用 Node.js 脚本 + Obsidian Shell commands 插件，核心逻辑在脚本中，只用文件位置作为唯一事实源，避免状态管理复杂性

**Tech Stack:** Node.js, pnpm, Obsidian Shell commands 插件

---

## 文件结构

```
wmm-site/
├── scripts/
│   ├── draft-manager.js          # 核心脚本（创建、发布、取消发布、列表）
│   └── draft-manager.test.js     # 单元测试
├── 草稿箱/                        # 草稿存放目录
│   └── .gitkeep                  # 保持目录在 Git 中
├── .obsidian/
│   └── plugins/
│       └── shell-commands/       # Shell commands 插件配置
├── .gitignore                    # 更新：添加草稿箱相关忽略规则
└── docs/
    └── superpowers/
        └── plans/
            └── 2026-06-24-draft-box-mechanism.md  # 本计划
```

---

## Task 1: 创建草稿箱目录和基础结构

**Files:**
- Create: `草稿箱/.gitkeep`
- Modify: `.gitignore`

- [ ] **Step 1: 创建草稿箱目录**

```bash
mkdir -p 草稿箱
```

- [ ] **Step 2: 创建 .gitkeep 文件**

```bash
touch 草稿箱/.gitkeep
```

- [ ] **Step 3: 更新 .gitignore**

在 `.gitignore` 中添加以下内容：

```gitignore
# 草稿箱机制
草稿箱/*.md
!草稿箱/.gitkeep

# Shell commands 插件配置（可选，如果不想提交）
# .obsidian/plugins/shell-commands/
```

- [ ] **Step 4: 验证目录创建**

```bash
ls -la 草稿箱/
```

Expected: 看到 `.gitkeep` 文件

- [ ] **Step 5: 提交**

```bash
git add 草稿箱/.gitkeep .gitignore
git commit -m "feat: 创建草稿箱目录和 Git 配置"
```

---

## Task 2: 创建草稿管理脚本基础框架

**Files:**
- Create: `scripts/draft-manager.js`

- [ ] **Step 1: 创建脚本文件**

创建 `scripts/draft-manager.js`：

```javascript
#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

// 配置常量
const DRAFTS_FOLDER = path.join(__dirname, '..', '草稿箱');
const POSTS_FOLDER = path.join(__dirname, '..', 'src', 'content', 'posts');

// 命令行参数解析
const args = process.argv.slice(2);
const command = args[0];
const filename = args[1];
const title = args[1]; // 对于 create 命令，第二个参数是标题

// 显示帮助信息
function showHelp() {
  console.log(`
草稿箱管理工具

用法：
  node scripts/draft-manager.js <command> [arguments]

命令：
  create <title>           创建新草稿
  preview <filename>       预览草稿信息
  publish <filename>       发布草稿到 posts 目录
  unpublish <filename>     取消发布，移回草稿箱
  list                     显示所有草稿状态
  status <filename>        显示单个草稿详情
  help                     显示此帮助信息

示例：
  node scripts/draft-manager.js create "我的第一篇文章"
  node scripts/draft-manager.js publish "2026-06-24-我的第一篇文章.md"
  node scripts/draft-manager.js list
  `);
}

// 主函数
async function main() {
  if (!command || command === 'help') {
    showHelp();
    return;
  }

  try {
    switch (command) {
      case 'create':
        if (!title) {
          console.error('错误：请提供文章标题');
          process.exit(1);
        }
        await createDraft(title);
        break;

      case 'preview':
        if (!filename) {
          console.error('错误：请提供文件名');
          process.exit(1);
        }
        await previewDraft(filename);
        break;

      case 'publish':
        if (!filename) {
          console.error('错误：请提供文件名');
          process.exit(1);
        }
        await publishDraft(filename);
        break;

      case 'unpublish':
        if (!filename) {
          console.error('错误：请提供文件名');
          process.exit(1);
        }
        await unpublishDraft(filename);
        break;

      case 'list':
        await listDrafts();
        break;

      case 'status':
        if (!filename) {
          console.error('错误：请提供文件名');
          process.exit(1);
        }
        await showStatus(filename);
        break;

      default:
        console.error(`错误：未知命令 '${command}'`);
        showHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error(`错误：${error.message}`);
    process.exit(1);
  }
}

// 运行主函数
main();
```

- [ ] **Step 2: 测试脚本基础功能**

```bash
node scripts/draft-manager.js help
```

Expected: 显示帮助信息

- [ ] **Step 3: 提交**

```bash
git add scripts/draft-manager.js
git commit -m "feat: 创建草稿管理脚本基础框架"
```

---

## Task 3: 实现 Frontmatter 解析和生成函数

**Files:**
- Modify: `scripts/draft-manager.js`

- [ ] **Step 1: 添加 Frontmatter 解析函数**

在 `scripts/draft-manager.js` 中添加以下函数：

```javascript
// Frontmatter 解析 - 零外部依赖
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { data: {}, body: content };
  }

  const yamlStr = match[1];
  const body = match[2];

  // 简单的 YAML 解析（只支持基本格式）
  const data = {};
  const lines = yamlStr.split('\n');

  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.substring(0, colonIndex).trim();
    let value = line.substring(colonIndex + 1).trim();

    // 处理数组格式
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1).split(',').map(v => v.trim());
    }
    // 处理布尔值
    else if (value === 'true') {
      value = true;
    }
    else if (value === 'false') {
      value = false;
    }
    // 处理日期格式
    else if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      // 保持为字符串，后续验证时再转换
    }
    // 处理带引号的字符串
    else if ((value.startsWith('"') && value.endsWith('"')) ||
             (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    data[key] = value;
  }

  return { data, body };
}

// Frontmatter 生成
function generateFrontmatter(data, body) {
  const lines = [];

  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      lines.push(`${key}: [${value.join(', ')}]`);
    } else if (typeof value === 'boolean') {
      lines.push(`${key}: ${value}`);
    } else if (typeof value === 'string' && value.includes(':')) {
      // 包含冒号的字符串需要引号
      lines.push(`${key}: "${value}"`);
    } else {
      lines.push(`${key}: ${value}`);
    }
  }

  return `---\n${lines.join('\n')}\n---\n${body}`;
}
```

- [ ] **Step 2: 测试 Frontmatter 解析**

创建测试文件 `scripts/draft-manager.test.js`：

```javascript
const { parseFrontmatter, generateFrontmatter } = require('./draft-manager');

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
```

- [ ] **Step 3: 运行测试**

```bash
npm test -- scripts/draft-manager.test.js
```

Expected: 测试通过

- [ ] **Step 4: 提交**

```bash
git add scripts/draft-manager.js scripts/draft-manager.test.js
git commit -m "feat: 实现 Frontmatter 解析和生成功能"
```

---

## Task 4: 实现文件操作工具函数

**Files:**
- Modify: `scripts/draft-manager.js`

- [ ] **Step 1: 添加文件操作工具函数**

在 `scripts/draft-manager.js` 中添加以下函数：

```javascript
// 检查文件是否存在
async function fileExists(filepath) {
  try {
    await fs.access(filepath);
    return true;
  } catch {
    return false;
  }
}

// 确保目录存在
async function ensureDir(dirpath) {
  try {
    await fs.mkdir(dirpath, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

// 生成文件名
function generateFilename(title) {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9一-龥]+/g, '-') // 保留中文和英文数字
    .replace(/^-+|-+$/g, ''); // 移除首尾的连字符

  return `${date}-${slug}.md`;
}

// 验证 frontmatter 必填字段
function validateFrontmatter(data) {
  const requiredFields = ['title', 'published', 'description', 'tags', 'category'];
  const missing = [];

  for (const field of requiredFields) {
    if (!data[field] || (Array.isArray(data[field]) && data[field].length === 0)) {
      missing.push(field);
    }
  }

  return {
    valid: missing.length === 0,
    missing
  };
}
```

- [ ] **Step 2: 测试文件操作函数**

在 `scripts/draft-manager.test.js` 中添加：

```javascript
const path = require('path');
const fs = require('fs').promises;

describe('文件操作工具函数', () => {
  const testDir = path.join(__dirname, 'test-temp');

  beforeEach(async () => {
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  test('fileExists - 文件存在', async () => {
    const testFile = path.join(testDir, 'test.txt');
    await fs.writeFile(testFile, 'test');

    const exists = await fileExists(testFile);
    expect(exists).toBe(true);
  });

  test('fileExists - 文件不存在', async () => {
    const testFile = path.join(testDir, 'nonexistent.txt');

    const exists = await fileExists(testFile);
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
});
```

- [ ] **Step 3: 运行测试**

```bash
npm test -- scripts/draft-manager.test.js
```

Expected: 测试通过

- [ ] **Step 4: 提交**

```bash
git add scripts/draft-manager.js scripts/draft-manager.test.js
git commit -m "feat: 实现文件操作工具函数"
```

---

## Task 5: 实现创建草稿功能

**Files:**
- Modify: `scripts/draft-manager.js`

- [ ] **Step 1: 实现 createDraft 函数**

在 `scripts/draft-manager.js` 中添加：

```javascript
// 创建草稿
async function createDraft(title) {
  // 1. 确保草稿箱目录存在
  await ensureDir(DRAFTS_FOLDER);

  // 2. 生成文件名
  const filename = generateFilename(title);
  const filepath = path.join(DRAFTS_FOLDER, filename);

  // 3. 检查文件是否已存在
  if (await fileExists(filepath)) {
    console.error(`错误：草稿已存在：${filename}`);
    process.exit(1);
  }

  // 4. 创建 frontmatter 模板
  const today = new Date().toISOString().split('T')[0];
  const data = {
    title: title,
    published: today,
    description: '',
    image: '',
    tags: [],
    category: '',
    draft: true,
    source_type: 'original',
    source_url: '',
    source_author: '',
    source_platform: ''
  };

  const body = '\n\n在此处开始写作...\n';
  const content = generateFrontmatter(data, body);

  // 5. 写入文件
  await fs.writeFile(filepath, content, 'utf-8');

  // 6. 显示成功信息
  console.log(`✅ 草稿已创建：${filename}`);
  console.log(`📁 位置：${filepath}`);
  console.log(`\n下一步：`);
  console.log(`  1. 在 Obsidian 中打开文件`);
  console.log(`  2. 编辑 frontmatter（标题、描述、标签等）`);
  console.log(`  3. 开始写作`);
  console.log(`  4. 完成后运行：node scripts/draft-manager.js publish "${filename}"`);
}
```

- [ ] **Step 2: 测试创建草稿**

```bash
node scripts/draft-manager.js create "测试文章标题"
```

Expected: 看到成功信息，`草稿箱/` 目录下创建了新文件

- [ ] **Step 3: 验证文件内容**

```bash
cat 草稿箱/$(ls 草稿箱/ | head -1)
```

Expected: 看到正确的 frontmatter 和正文

- [ ] **Step 4: 提交**

```bash
git add scripts/draft-manager.js
git commit -m "feat: 实现创建草稿功能"
```

---

## Task 6: 实现预览草稿功能

**Files:**
- Modify: `scripts/draft-manager.js`

- [ ] **Step 1: 实现 previewDraft 函数**

在 `scripts/draft-manager.js` 中添加：

```javascript
// 预览草稿
async function previewDraft(filename) {
  // 1. 检查文件是否存在（草稿箱或 posts 目录）
  const draftPath = path.join(DRAFTS_FOLDER, filename);
  const postPath = path.join(POSTS_FOLDER, filename);

  let filepath;
  let location;

  if (await fileExists(draftPath)) {
    filepath = draftPath;
    location = '草稿箱';
  } else if (await fileExists(postPath)) {
    filepath = postPath;
    location = '已发布';
  } else {
    console.error(`错误：文件不存在：${filename}`);
    process.exit(1);
  }

  // 2. 读取文件内容
  const content = await fs.readFile(filepath, 'utf-8');
  const { data, body } = parseFrontmatter(content);

  // 3. 验证 frontmatter
  const validation = validateFrontmatter(data);

  // 4. 统计信息
  const wordCount = body.trim().split(/\s+/).length;
  const charCount = body.length;

  // 5. 显示预览信息
  console.log(`\n📄 文件预览：${filename}`);
  console.log(`📁 位置：${location}`);
  console.log(`\n--- Frontmatter ---`);
  console.log(`标题：${data.title || '(未设置)'}`);
  console.log(`发布日期：${data.published || '(未设置)'}`);
  console.log(`描述：${data.description || '(未设置)'}`);
  console.log(`标签：${Array.isArray(data.tags) ? data.tags.join(', ') : '(未设置)'}`);
  console.log(`分类：${data.category || '(未设置)'}`);
  console.log(`草稿状态：${data.draft ? '是' : '否'}`);
  console.log(`来源类型：${data.source_type || 'original'}`);

  if (!validation.valid) {
    console.log(`\n⚠️  缺少必填字段：${validation.missing.join(', ')}`);
  } else {
    console.log(`\n✅ Frontmatter 验证通过`);
  }

  console.log(`\n--- 统计信息 ---`);
  console.log(`字数：${wordCount}`);
  console.log(`字符数：${charCount}`);
  console.log(`\n--- 正文预览 ---`);
  console.log(body.substring(0, 500) + (body.length > 500 ? '...' : ''));
}
```

- [ ] **Step 2: 测试预览功能**

```bash
node scripts/draft-manager.js preview "测试文章标题.md"
```

Expected: 显示文件预览信息

- [ ] **Step 3: 提交**

```bash
git add scripts/draft-manager.js
git commit -m "feat: 实现预览草稿功能"
```

---

## Task 7: 实现发布草稿功能（原子性操作）

**Files:**
- Modify: `scripts/draft-manager.js`

- [ ] **Step 1: 实现 publishDraft 函数**

在 `scripts/draft-manager.js` 中添加：

```javascript
// 发布草稿 - 原子性操作
async function publishDraft(filename) {
  const draftPath = path.join(DRAFTS_FOLDER, filename);
  const targetPath = path.join(POSTS_FOLDER, filename);

  try {
    // 1. 检查源文件是否存在
    if (!await fileExists(draftPath)) {
      console.error(`错误：草稿文件不存在：${filename}`);
      process.exit(1);
    }

    // 2. 读取草稿文件
    const content = await fs.readFile(draftPath, 'utf-8');
    const { data, body } = parseFrontmatter(content);

    // 3. 修改 draft 状态
    data.draft = false;

    // 4. 验证必填字段
    const validation = validateFrontmatter(data);
    if (!validation.valid) {
      console.error(`错误：缺少必填字段：${validation.missing.join(', ')}`);
      console.error('请先完善 frontmatter 再发布');
      process.exit(1);
    }

    // 5. 生成新内容
    const newContent = generateFrontmatter(data, body);

    // 6. 确保 posts 目录存在
    await ensureDir(POSTS_FOLDER);

    // 7. 检查目标文件是否已存在
    if (await fileExists(targetPath)) {
      console.error(`错误：目标文件已存在：${filename}`);
      console.error('如果要覆盖，请先手动删除目标文件');
      process.exit(1);
    }

    // 8. 写入目标文件（先 modify）
    await fs.writeFile(targetPath, newContent, 'utf-8');

    // 9. 验证写入成功
    const verifyContent = await fs.readFile(targetPath, 'utf-8');
    if (verifyContent !== newContent) {
      throw new Error('文件写入验证失败');
    }

    // 10. 删除源文件（后 delete）
    await fs.unlink(draftPath);

    // 11. 显示成功信息
    console.log(`✅ 文章已发布：${data.title}`);
    console.log(`📁 位置：${targetPath}`);
    console.log(`\n下一步：`);
    console.log(`  1. 运行 pnpm run build 验证构建`);
    console.log(`  2. 运行 git add . && git commit -m "feat: 添加文章 ${filename}"`);
    console.log(`  3. 运行 git push origin master 推送到远程`);

  } catch (error) {
    console.error(`❌ 发布失败：${error.message}`);

    // 如果目标文件已写入但源文件未删除，尝试回滚
    if (await fileExists(targetPath) && await fileExists(draftPath)) {
      await fs.unlink(targetPath);
      console.log('↩️  已回滚操作');
    }

    process.exit(1);
  }
}
```

- [ ] **Step 2: 测试发布功能**

首先创建一个测试草稿：

```bash
node scripts/draft-manager.js create "发布测试文章"
```

然后编辑文件，添加必要的 frontmatter 字段，再发布：

```bash
node scripts/draft-manager.js publish "发布测试文章.md"
```

Expected: 看到成功信息，文件从 `草稿箱/` 移动到 `src/content/posts/`

- [ ] **Step 3: 验证文件位置**

```bash
ls -la 草稿箱/
ls -la src/content/posts/ | grep 发布测试
```

Expected: 文件不在草稿箱，在 posts 目录

- [ ] **Step 4: 提交**

```bash
git add scripts/draft-manager.js
git commit -m "feat: 实现发布草稿功能（原子性操作）"
```

---

## Task 8: 实现取消发布功能

**Files:**
- Modify: `scripts/draft-manager.js`

- [ ] **Step 1: 实现 unpublishDraft 函数**

在 `scripts/draft-manager.js` 中添加：

```javascript
// 取消发布 - 原子性操作
async function unpublishDraft(filename) {
  const postPath = path.join(POSTS_FOLDER, filename);
  const targetPath = path.join(DRAFTS_FOLDER, filename);

  try {
    // 1. 检查源文件是否存在
    if (!await fileExists(postPath)) {
      console.error(`错误：已发布文件不存在：${filename}`);
      process.exit(1);
    }

    // 2. 读取已发布文件
    const content = await fs.readFile(postPath, 'utf-8');
    const { data, body } = parseFrontmatter(content);

    // 3. 修改 draft 状态
    data.draft = true;

    // 4. 生成新内容
    const newContent = generateFrontmatter(data, body);

    // 5. 确保草稿箱目录存在
    await ensureDir(DRAFTS_FOLDER);

    // 6. 检查目标文件是否已存在
    if (await fileExists(targetPath)) {
      console.error(`错误：草稿箱中已存在同名文件：${filename}`);
      console.error('请先处理草稿箱中的文件');
      process.exit(1);
    }

    // 7. 写入草稿箱（先 modify）
    await fs.writeFile(targetPath, newContent, 'utf-8');

    // 8. 验证写入成功
    const verifyContent = await fs.readFile(targetPath, 'utf-8');
    if (verifyContent !== newContent) {
      throw new Error('文件写入验证失败');
    }

    // 9. 删除源文件（后 delete）
    await fs.unlink(postPath);

    // 10. 显示成功信息
    console.log(`✅ 已取消发布：${data.title}`);
    console.log(`📁 位置：${targetPath}`);
    console.log(`\n文章已移回草稿箱，可以继续编辑`);

  } catch (error) {
    console.error(`❌ 取消发布失败：${error.message}`);

    // 如果目标文件已写入但源文件未删除，尝试回滚
    if (await fileExists(targetPath) && await fileExists(postPath)) {
      await fs.unlink(targetPath);
      console.log('↩️  已回滚操作');
    }

    process.exit(1);
  }
}
```

- [ ] **Step 2: 测试取消发布功能**

```bash
node scripts/draft-manager.js unpublish "发布测试文章.md"
```

Expected: 看到成功信息，文件从 `src/content/posts/` 移动回 `草稿箱/`

- [ ] **Step 3: 验证文件位置**

```bash
ls -la 草稿箱/ | grep 发布测试
ls -la src/content/posts/ | grep 发布测试
```

Expected: 文件在草稿箱，不在 posts 目录

- [ ] **Step 4: 提交**

```bash
git add scripts/draft-manager.js
git commit -m "feat: 实现取消发布功能"
```

---

## Task 9: 实现列表和状态查看功能

**Files:**
- Modify: `scripts/draft-manager.js`

- [ ] **Step 1: 实现 listDrafts 函数**

在 `scripts/draft-manager.js` 中添加：

```javascript
// 列出所有草稿
async function listDrafts() {
  console.log('\n📋 草稿箱列表：\n');

  // 1. 读取草稿箱目录
  let draftFiles = [];
  try {
    const files = await fs.readdir(DRAFTS_FOLDER);
    draftFiles = files.filter(f => f.endsWith('.md') && f !== '.gitkeep');
  } catch (error) {
    console.log('草稿箱目录为空或不存在');
  }

  // 2. 读取 posts 目录中的草稿（draft: true）
  let postFiles = [];
  try {
    const files = await fs.readdir(POSTS_FOLDER);
    postFiles = files.filter(f => f.endsWith('.md'));
  } catch (error) {
    // posts 目录可能不存在，忽略
  }

  // 3. 显示草稿箱中的文件
  if (draftFiles.length > 0) {
    console.log('📁 草稿箱：');
    for (const file of draftFiles) {
      const filepath = path.join(DRAFTS_FOLDER, file);
      const content = await fs.readFile(filepath, 'utf-8');
      const { data } = parseFrontmatter(content);
      const title = data.title || '(无标题)';
      console.log(`  📝 ${file} - ${title}`);
    }
    console.log('');
  }

  // 4. 显示 posts 目录中的草稿
  const draftPosts = [];
  for (const file of postFiles) {
    const filepath = path.join(POSTS_FOLDER, file);
    const content = await fs.readFile(filepath, 'utf-8');
    const { data } = parseFrontmatter(content);
    if (data.draft === true) {
      draftPosts.push({ file, title: data.title || '(无标题)' });
    }
  }

  if (draftPosts.length > 0) {
    console.log('📝 已发布但标记为草稿：');
    for (const { file, title } of draftPosts) {
      console.log(`  📄 ${file} - ${title}`);
    }
    console.log('');
  }

  // 5. 显示统计信息
  console.log(`\n📊 统计：`);
  console.log(`  草稿箱中：${draftFiles.length} 个文件`);
  console.log(`  已发布草稿：${draftPosts.length} 个文件`);
  console.log(`  总计：${draftFiles.length + draftPosts.length} 个草稿`);

  if (draftFiles.length === 0 && draftPosts.length === 0) {
    console.log('\n✨ 暂无草稿');
    console.log('运行 node scripts/draft-manager.js create "文章标题" 创建新草稿');
  }
}
```

- [ ] **Step 2: 实现 showStatus 函数**

在 `scripts/draft-manager.js` 中添加：

```javascript
// 显示单个草稿状态
async function showStatus(filename) {
  // 检查文件位置
  const draftPath = path.join(DRAFTS_FOLDER, filename);
  const postPath = path.join(POSTS_FOLDER, filename);

  let filepath;
  let location;
  let status;

  if (await fileExists(draftPath)) {
    filepath = draftPath;
    location = '草稿箱';
    status = '草稿';
  } else if (await fileExists(postPath)) {
    filepath = postPath;
    location = '已发布';
    status = '已发布';
  } else {
    console.error(`错误：文件不存在：${filename}`);
    process.exit(1);
  }

  // 读取文件内容
  const content = await fs.readFile(filepath, 'utf-8');
  const { data, body } = parseFrontmatter(content);

  // 验证 frontmatter
  const validation = validateFrontmatter(data);

  // 统计信息
  const wordCount = body.trim().split(/\s+/).length;
  const charCount = body.length;
  const lineCount = body.split('\n').length;

  // 显示状态信息
  console.log(`\n📊 文件状态：${filename}`);
  console.log(`\n--- 基本信息 ---`);
  console.log(`位置：${location}`);
  console.log(`状态：${status}`);
  console.log(`标题：${data.title || '(未设置)'}`);
  console.log(`发布日期：${data.published || '(未设置)'}`);
  console.log(`描述：${data.description || '(未设置)'}`);
  console.log(`标签：${Array.isArray(data.tags) ? data.tags.join(', ') : '(未设置)'}`);
  console.log(`分类：${data.category || '(未设置)'}`);
  console.log(`来源类型：${data.source_type || 'original'}`);

  console.log(`\n--- 验证状态 ---`);
  if (!validation.valid) {
    console.log(`⚠️  缺少必填字段：${validation.missing.join(', ')}`);
    console.log(`\n建议：发布前请先完善这些字段`);
  } else {
    console.log(`✅ Frontmatter 验证通过`);
    if (status === '草稿') {
      console.log(`\n可以发布：node scripts/draft-manager.js publish "${filename}"`);
    }
  }

  console.log(`\n--- 统计信息 ---`);
  console.log(`字数：${wordCount}`);
  console.log(`字符数：${charCount}`);
  console.log(`行数：${lineCount}`);
}
```

- [ ] **Step 3: 测试列表功能**

```bash
node scripts/draft-manager.js list
```

Expected: 显示所有草稿列表

- [ ] **Step 4: 测试状态查看功能**

```bash
node scripts/draft-manager.js status "测试文章标题.md"
```

Expected: 显示文件详细状态

- [ ] **Step 5: 提交**

```bash
git add scripts/draft-manager.js
git commit -m "feat: 实现列表和状态查看功能"
```

---

## Task 10: 添加 npm 脚本和依赖

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 添加 npm 脚本**

在 `package.json` 的 `scripts` 中添加：

```json
{
  "scripts": {
    "draft": "node scripts/draft-manager.js",
    "draft:create": "node scripts/draft-manager.js create",
    "draft:publish": "node scripts/draft-manager.js publish",
    "draft:list": "node scripts/draft-manager.js list"
  }
}
```

- [ ] **Step 2: 测试 npm 脚本**

```bash
pnpm run draft list
```

Expected: 显示草稿列表

- [ ] **Step 3: 提交**

```bash
git add package.json
git commit -m "feat: 添加草稿管理 npm 脚本"
```

---

## Task 11: 创建使用说明文档

**Files:**
- Create: `docs/draft-manager-guide.md`

- [ ] **Step 1: 创建使用说明文档**

创建 `docs/draft-manager-guide.md`：

```markdown
# 草稿箱管理工具使用指南

## 快速开始

### 1. 创建新草稿

```bash
node scripts/draft-manager.js create "文章标题"
```

或者使用 npm 脚本：

```bash
pnpm run draft:create "文章标题"
```

### 2. 编辑草稿

在 Obsidian 中打开 `草稿箱/` 目录，找到刚创建的文件并编辑。

### 3. 预览草稿

```bash
node scripts/draft-manager.js preview "文件名.md"
```

### 4. 发布草稿

```bash
node scripts/draft-manager.js publish "文件名.md"
```

### 5. 取消发布

```bash
node scripts/draft-manager.js unpublish "文件名.md"
```

### 6. 查看所有草稿

```bash
node scripts/draft-manager.js list
```

## 命令列表

| 命令 | 说明 | 示例 |
|------|------|------|
| `create <title>` | 创建新草稿 | `create "我的文章"` |
| `preview <filename>` | 预览草稿 | `preview "2026-06-24-我的文章.md"` |
| `publish <filename>` | 发布草稿 | `publish "2026-06-24-我的文章.md"` |
| `unpublish <filename>` | 取消发布 | `unpublish "2026-06-24-我的文章.md"` |
| `list` | 列出所有草稿 | `list` |
| `status <filename>` | 查看状态 | `status "2026-06-24-我的文章.md"` |

## Obsidian 集成

### 安装 Shell commands 插件

1. 在 Obsidian 中打开设置
2. 进入"第三方插件"
3. 搜索"Shell commands"
4. 安装并启用

### 配置命令

在 Shell commands 插件设置中添加以下命令：

```json
{
  "commands": {
    "draft-create": {
      "name": "Draft: 新建草稿",
      "command": "node scripts/draft-manager.js create \"{{input}}\"",
      "input": "prompt",
      "inputPrompt": "请输入文章标题"
    },
    "draft-publish": {
      "name": "Draft: 发布草稿",
      "command": "node scripts/draft-manager.js publish \"{{note_name}}\"",
      "input": "note_name"
    },
    "draft-list": {
      "name": "Draft: 查看所有草稿",
      "command": "node scripts/draft-manager.js list"
    }
  }
}
```

### 配置快捷键

在 Obsidian 设置中配置快捷键：

- `Ctrl+Shift+N` → Draft: 新建草稿
- `Ctrl+Shift+Enter` → Draft: 发布草稿
- `Ctrl+Shift+L` → Draft: 查看所有草稿

## 工作流程

1. **创建草稿** - 使用命令或快捷键创建新草稿
2. **编辑草稿** - 在 Obsidian 中编辑文件
3. **预览草稿** - 检查 frontmatter 和内容
4. **发布草稿** - 将草稿移动到 posts 目录
5. **构建验证** - 运行 `pnpm run build` 验证
6. **提交推送** - Git 提交并推送到远程

## 注意事项

- 唯一事实源是文件位置（草稿箱 vs posts 目录）
- 发布前会自动验证 frontmatter 必填字段
- 如果发布失败，会自动回滚操作
- 文件名格式：`YYYY-MM-DD-简短标题.md`
```

- [ ] **Step 2: 提交**

```bash
git add docs/draft-manager-guide.md
git commit -m "docs: 添加草稿箱管理工具使用指南"
```

---

## Task 12: 最终测试和验证

**Files:**
- None (testing only)

- [ ] **Step 1: 完整工作流测试**

```bash
# 1. 创建草稿
node scripts/draft-manager.js create "最终测试文章"

# 2. 列出草稿
node scripts/draft-manager.js list

# 3. 预览草稿
node scripts/draft-manager.js preview "最终测试文章.md"

# 4. 发布草稿
node scripts/draft-manager.js publish "最终测试文章.md"

# 5. 验证构建
pnpm run build

# 6. 取消发布
node scripts/draft-manager.js unpublish "最终测试文章.md"

# 7. 再次列出草稿
node scripts/draft-manager.js list
```

Expected: 所有命令正常执行，无错误

- [ ] **Step 2: 运行单元测试**

```bash
npm test -- scripts/draft-manager.test.js
```

Expected: 所有测试通过

- [ ] **Step 3: 最终提交**

```bash
git add .
git commit -m "feat: 完成草稿箱机制实现"
```

---

## 执行选项

**Plan complete and saved to `docs/superpowers/plans/2026-06-24-draft-box-mechanism.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
