# 草稿箱机制设计文档

**项目：** WMM 个人网站
**日期：** 2026-06-24
**状态：** 设计完成，待实现
**方案：** 方案C（脚本 + Obsidian 配置）
**Codex 审查：** 已完成，方案已调整

---

## 0. 方案调整说明

### 为什么从方案A（完整插件）调整为方案C（脚本+配置）

**Codex 审查发现的关键问题：**

1. **P0 - 原子性问题**：`publishDraft` 先 move 再 modify，两步之间无原子性保证，失败时文件位置和状态不一致
2. **P0 - 兼容性问题**：`gray-matter` 库在 Obsidian 沙箱环境中不可用，需要额外打包处理
3. **P0 - 状态一致性问题**：metadata.json 和 frontdraft 的 `draft` 字段存在双重事实源，容易产生矛盾
4. **P1 - 测试困难**：Obsidian 插件没有官方测试框架，自动化测试极难实现
5. **P3 - 过度工程化**：核心功能只是文件移动和 frontmatter 修改，完整插件方案严重过度工程化

**方案C的优势：**

- ✅ 核心逻辑在 Node.js 脚本中，易于测试和维护
- ✅ 不依赖 Obsidian 插件 API，避免沙箱兼容性问题
- ✅ 零状态管理（只用文件位置作为唯一事实源）
- ✅ 开发成本低（1-2小时 vs 1-2天）
- ✅ 可渐进式增强（先脚本，后插件）

---

## 1. 架构概览

### 整体架构

```
┌─────────────────────────────────────────────────┐
│  Obsidian 界面                                  │
│  ┌─────────────────────────────────────────────┐│
│  │  草稿箱文件夹 (Obsidian 原生视图)           ││
│  │  - 显示所有草稿文件                         ││
│  │  - 支持搜索和标签                           ││
│  └─────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────┐│
│  │  快捷键命令 (Shell commands 插件)           ││
│  │  - Ctrl+Shift+N: 新建草稿                   ││
│  │  - Ctrl+Shift+Enter: 发布草稿               ││
│  │  - Ctrl+Shift+Backspace: 取消发布           ││
│  │  - Ctrl+Shift+L: 查看草稿列表              ││
│  └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│  Node.js 脚本 (scripts/draft-manager.js)        │
│  - 核心逻辑：文件操作、frontmatter 处理        │
│  - 命令行接口：可独立使用                       │
│  - 无状态管理：只用文件位置作为事实源          │
└─────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│  文件系统                                        │
│  ┌──────────────────┐  ┌──────────────────────┐ │
│  │  草稿箱/          │  │  src/content/posts/  │ │
│  │  - draft-1.md     │→ │  - draft-1.md        │ │
│  │  - draft-2.md     │  │  (draft: false)      │ │
│  └──────────────────┘  └──────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### 核心组件

1. **草稿箱目录** (`草稿箱/`)
   - 存放所有未发布的草稿
   - 文件名格式：`YYYY-MM-DD-标题.md`
   - Obsidian 原生显示，支持搜索和标签

2. **脚本引擎** (`scripts/draft-manager.js`)
   - 处理文件移动和 frontmatter 更新
   - 提供命令行接口
   - 无状态管理（避免状态一致性问题）

3. **Obsidian 集成**
   - 使用 "Shell commands" 插件调用脚本
   - 配置快捷键绑定
   - 无需开发 Obsidian 插件

---

## 2. 工作流

### 完整工作流

```
新建草稿 → 编辑草稿 → 预览草稿 → 发布草稿 → 审查与正式发布
```

### 状态转换图

```
新建草稿 ──→ 草稿箱 ──→ 编辑中 ──→ 预览 ──→ 发布 ──→ 正式发布
    │           │           │          │        │
    └───────────┴───────────┴──────────┘        │
                ↓                               │
           删除/放弃                            │
                                               ↓
                                          取消发布 ──→ 草稿箱
```

**唯一事实源：文件位置**
- 在 `草稿箱/` = 草稿
- 在 `src/content/posts/` = 已发布

### 命令列表

| 命令 | 快捷键 | 说明 |
|------|--------|------|
| `draft create "标题"` | `Ctrl+Shift+N` | 创建新草稿文件 |
| `draft preview <文件名>` | `Ctrl+Shift+P` | 检查草稿状态和内容 |
| `draft publish <文件名>` | `Ctrl+Shift+Enter` | 发布草稿到 posts 目录 |
| `draft unpublish <文件名>` | `Ctrl+Shift+Backspace` | 取消发布，移回草稿箱 |
| `draft list` | `Ctrl+Shift+L` | 显示所有草稿状态 |

---

## 3. 数据结构

### 草稿文件格式

**文件命名规范：**
```
草稿箱/YYYY-MM-DD-简短标题.md
```

**Frontmatter 模板：**
```yaml
---
title: "文章标题"
published: 2026-06-24
description: "文章简介（一句话描述）"
image: ""
tags: ["标签1", "标签2"]
category: "分类"
draft: true
source_type: "original"
source_url: ""
source_author: ""
source_platform: ""
---
```

### 状态定义

**唯一事实源：文件位置**

| 位置 | 状态 | 说明 |
|------|------|------|
| `草稿箱/` | 草稿 | 未发布的文章 |
| `src/content/posts/` | 已发布 | 已发布到网站（draft: false） |

**不使用 metadata.json** - 避免双重事实源问题

---

## 4. 实现细节

### 脚本接口

```bash
# 新建草稿
node scripts/draft-manager.js create "文章标题"

# 预览草稿
node scripts/draft-manager.js preview "2026-06-24-学习Astro的心得.md"

# 发布草稿（自动设置 draft: false）
node scripts/draft-manager.js publish "2026-06-24-学习Astro的心得.md"

# 取消发布（自动设置 draft: true）
node scripts/draft-manager.js unpublish "文章标题.md"

# 查看所有草稿状态
node scripts/draft-manager.js list

# 查看单个草稿详情
node scripts/draft-manager.js status "2026-06-24-学习Astro的心得.md"
```

### 核心函数实现

**关键设计原则：先 modify 再 rename**

```javascript
// 发布草稿 - 原子性操作
async function publishDraft(filename) {
  // 1. 读取草稿文件
  const draftPath = path.join(DRAFTS_FOLDER, filename);
  const content = await fs.readFile(draftPath, 'utf-8');

  // 2. 解析并修改 frontmatter
  const { data, body } = parseFrontmatter(content);
  data.draft = false;
  const newContent = generateFrontmatter(data, body);

  // 3. 验证必填字段
  const validation = validateFrontmatter(data);
  if (!validation.valid) {
    console.error(`缺少必填字段：${validation.missing.join(', ')}`);
    return;
  }

  // 4. 写入目标文件（先 modify）
  const targetPath = path.join(POSTS_FOLDER, filename);
  await fs.writeFile(targetPath, newContent, 'utf-8');

  // 5. 验证写入成功
  const verifyContent = await fs.readFile(targetPath, 'utf-8');
  if (verifyContent !== newContent) {
    throw new Error('文件写入验证失败');
  }

  // 6. 删除源文件（后 delete）
  await fs.unlink(draftPath);

  console.log(`文章已发布：${data.title}`);
}

// 取消发布 - 原子性操作
async function unpublishDraft(filename) {
  // 1. 读取已发布文件
  const postPath = path.join(POSTS_FOLDER, filename);
  const content = await fs.readFile(postPath, 'utf-8');

  // 2. 解析并修改 frontmatter
  const { data, body } = parseFrontmatter(content);
  data.draft = true;
  const newContent = generateFrontmatter(data, body);

  // 3. 写入草稿箱（先 modify）
  const targetPath = path.join(DRAFTS_FOLDER, filename);
  await fs.writeFile(targetPath, newContent, 'utf-8');

  // 4. 验证写入成功
  const verifyContent = await fs.readFile(targetPath, 'utf-8');
  if (verifyContent !== newContent) {
    throw new Error('文件写入验证失败');
  }

  // 5. 删除源文件（后 delete）
  await fs.unlink(postPath);

  console.log(`已取消发布：${data.title}`);
}
```

### Frontmatter 解析

**使用 Obsidian 自带的 parseYaml，不依赖 gray-matter**

```javascript
// Frontmatter 解析 - 零外部依赖
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { data: {}, body: content };
  }

  const yamlStr = match[1];
  const body = match[2];

  // 使用 Obsidian 自带的 parseYaml 或简单的 YAML 解析
  const data = parseYaml(yamlStr);

  return { data, body };
}

// Frontmatter 生成
function generateFrontmatter(data, body) {
  const yamlStr = Object.entries(data)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}: [${value.join(', ')}]`;
      }
      return `${key}: ${value}`;
    })
    .join('\n');

  return `---\n${yamlStr}\n---\n${body}`;
}
```

### 错误处理

```javascript
// 完整的错误处理
async function publishDraft(filename) {
  try {
    // 检查源文件是否存在
    const draftPath = path.join(DRAFTS_FOLDER, filename);
    if (!await fileExists(draftPath)) {
      console.error(`草稿文件不存在：${filename}`);
      return;
    }

    // 检查目标文件是否已存在
    const targetPath = path.join(POSTS_FOLDER, filename);
    if (await fileExists(targetPath)) {
      const answer = await askUser(`目标文件已存在：${filename}，是否覆盖？(y/N)`);
      if (answer.toLowerCase() !== 'y') {
        console.log('操作已取消');
        return;
      }
    }

    // 执行发布
    await publishDraftCore(draftPath, targetPath);

  } catch (error) {
    console.error(`发布失败：${error.message}`);
    // 如果目标文件已写入但源文件未删除，尝试回滚
    if (await fileExists(targetPath) && await fileExists(draftPath)) {
      await fs.unlink(targetPath);
      console.log('已回滚操作');
    }
  }
}
```

### Obsidian 集成

**使用 "Shell commands" 插件配置命令：**

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

---

## 5. 技术约束

### 依赖要求
- Node.js >= 18.0.0（脚本运行）
- pnpm（包管理器）
- Obsidian >= 1.0.0（安装 Shell commands 插件）

### 脚本依赖
```json
{
  "dependencies": {
    "chalk": "^5.3.0"
  }
}
```

### 文件系统约束
- 草稿箱目录：`草稿箱/`
- 编码：UTF-8

### Astro 集成约束
- 草稿必须放在 `src/content/posts/` 才会被构建
- Frontmatter 必须符合 `src/content/config.ts` schema
- `draft: true` 的文章会出现在网站上但标记为草稿
- `draft: false` 的文章正式发布，对所有用户可见

### Git 约束
- 草稿箱目录加入版本控制
- 发布操作需要手动 git commit

---

## 6. 测试策略

### 单元测试
- 测试创建草稿功能
- 测试发布/取消发布功能
- 测试 frontmatter 验证
- 测试错误处理
- 测试文件路径处理

### 测试方法
```javascript
// 使用 Jest 测试纯函数
describe('Draft Manager', () => {
  test('parseFrontmatter - 解析正确格式', () => {
    const content = `---
title: "测试文章"
draft: true
---
正文内容`;

    const { data, body } = parseFrontmatter(content);
    expect(data.title).toBe('测试文章');
    expect(data.draft).toBe(true);
    expect(body).toBe('正文内容');
  });

  test('validateFrontmatter - 验证必填字段', () => {
    const data = { title: '测试', published: '2026-06-24' };
    const validation = validateFrontmatter(data);
    expect(validation.valid).toBe(false);
    expect(validation.missing).toContain('description');
  });
});
```

### 用户验收测试
- 新建草稿 → 文件创建，frontmatter 正确
- 编辑草稿 → 实时保存，版本历史正常
- 预览草稿 → 显示状态和验证结果
- 发布草稿 → 文件移动，状态更新
- 取消发布 → 文件移回草稿箱
- 查看列表 → 显示所有草稿状态

---

## 7. 部署流程

### 开发阶段
1. 创建脚本文件 `scripts/draft-manager.js`
2. 安装依赖（pnpm add chalk）
3. 测试脚本功能

### 配置阶段
1. 创建草稿箱目录 `草稿箱/`
2. 更新 `.gitignore`
3. 在 Obsidian 中安装 Shell commands 插件
4. 配置命令和快捷键

### 文档和培训
1. 创建使用说明文档
2. 培训用户使用新工作流

---

## 8. 未来扩展

### 短期扩展（1-2周）
- 添加草稿模板管理
- 支持草稿分类和标签筛选
- 添加草稿统计功能

### 中期扩展（1-2月）
- 开发简单 Obsidian 插件（只提供命令面板，不提供侧边栏）
- 支持批量发布
- 添加草稿预览窗口

### 长期扩展（3-6月）
- 多设备同步（通过 Git）
- 自动化发布流程（CI/CD 集成）

---

## 9. 风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| Obsidian 插件不兼容 | 低 | 提供命令行备选方案 |
| 文件冲突 | 低 | 发布前检查，询问覆盖 |
| 数据丢失 | 中 | Git 版本控制，原子性操作 |
| 性能问题 | 低 | 草稿数量有限，无需优化 |

---

## 10. 总结

这个设计提供了一个**轻量、可靠的草稿箱机制**：

✅ **核心功能完整**：新建、编辑、预览、发布、取消发布
✅ **技术方案可靠**：脚本+配置，避免 Obsidian 插件开发的复杂性
✅ **状态管理简单**：只用文件位置作为唯一事实源
✅ **原子性操作**：先 modify 再 delete，失败时可回滚
✅ **易于测试**：纯函数封装，可独立测试
✅ **开发成本低**：1-2小时可完成

### 方案对比

| 方案 | 开发内容 | 用户体验 | 开发成本 | 维护成本 |
|------|----------|----------|----------|----------|
| 方案A（完整插件） | Obsidian 插件 | ⭐⭐⭐⭐⭐ | 高 | 高 |
| **方案C（脚本+配置）** | **Node.js 脚本** | **⭐⭐⭐⭐** | **低** | **低** |

**选择方案C的理由：**
- 开发成本低（1-2小时 vs 1-2天）
- 维护成本低（无状态管理问题）
- 技术风险低（避免 Obsidian 插件 API 的复杂性）
- 可渐进式增强（后续有需要再开发插件）

---

**设计完成日期：** 2026-06-24
**设计者：** Claudian (AI Assistant)
**方案：** 方案C（脚本 + Obsidian 配置）
**Codex 审查：** 已完成，方案已调整
**待实现：** 是
