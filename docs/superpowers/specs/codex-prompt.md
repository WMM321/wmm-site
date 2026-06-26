IMPORTANT: Do NOT read or execute any files under ~/.claude/, ~/.agents/, .claude/skills/, or agents/. These are Claude Code skill definitions meant for a different AI system. Do NOT modify agents/openai.yaml. Stay focused on repository code only.

You are a brutally honest technical reviewer. Review this plan for: logical gaps and unstated assumptions, missing error handling or edge cases, overcomplexity (is there a simpler approach?), feasibility risks (what could go wrong?), and missing dependencies or sequencing issues. Be direct. Be terse. No compliments. Just the problems.

THE PLAN:
# 草稿箱机制设计文档

**项目：** WMM 个人网站
**日期：** 2026-06-24
**状态：** 设计完成，待实现
**方案：** 方案A（完整 Obsidian 插件）

---

## 1. 架构概览

### 整体架构

```
┌─────────────────────────────────────────────────┐
│  Obsidian 插件 (draft-box-plugin)               │
│  ┌─────────────────────────────────────────────┐│
│  │  插件主界面                                  ││
│  │  - 侧边栏：草稿箱视图（显示所有草稿）       ││
│  │  - 状态栏：当前草稿状态                      ││
│  │  - 设置面板：配置选项                        ││
│  └─────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────┐│
│  │  命令面板 (Ctrl+P)                          ││
│  │  - Draft: 新建草稿                          ││
│  │  - Draft: 发布草稿                          ││
│  │  - Draft: 取消发布                          ││
│  │  - Draft: 预览草稿                          ││
│  │  - Draft: 查看状态                          ││
│  └─────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────┐│
│  │  右键菜单                                    ││
│  │  - 发布到网站                                ││
│  │  - 取消发布                                  ││
│  │  - 查看草稿状态                              ││
│  └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│  插件核心逻辑 (TypeScript)                       │
│  - 文件操作：移动、复制、删除                   │
│  - Frontmatter 解析：读取、修改、验证          │
│  - 状态管理：追踪草稿状态                       │
│  - UI 组件：侧边栏、弹窗、通知                 │
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

1. **Obsidian 插件** (`draft-box-plugin/`)
   - 完整的 Obsidian 插件
   - 侧边栏视图：显示草稿箱内容
   - 命令面板：快捷操作
   - 右键菜单：上下文操作
   - 设置面板：配置选项

2. **插件核心逻辑** (TypeScript)
   - 文件操作：移动、复制、删除
   - Frontmatter 解析：使用 gray-matter 库
   - 状态管理：追踪草稿状态
   - UI 组件：侧边栏、弹窗、通知

3. **草稿箱目录** (`草稿箱/`)
   - 存放所有未发布的草稿
   - 文件名格式：`YYYY-MM-DD-标题.md`
   - 插件自动管理

---

## 2. 工作流

### 完整工作流

```
新建草稿 → 编辑草稿 → 预览草稿 → 发布草稿 → 审查与正式发布
```

### 状态转换图

```
新建草稿 ──→ 草稿箱 ──→ 编辑中 ──→ 预览 ──→ 发布(草稿) ──→ 正式发布
    │           │           │          │            │
    └───────────┴───────────┴──────────┘            │
                ↓                                   │
           删除/放弃                                │
                                                   ↓
                                              取消发布 ──→ 草稿箱
```

### 命令列表

| 命令 | 快捷键 | 说明 |
|------|--------|------|
| `Draft: 新建草稿` | `Ctrl+Shift+N` | 创建新草稿文件 |
| `Draft: 预览草稿` | `Ctrl+Shift+P` | 检查草稿状态和内容 |
| `Draft: 发布草稿` | `Ctrl+Shift+Enter` | 移动草稿到 posts 目录 |
| `Draft: 取消发布` | `Ctrl+Shift+Backspace` | 将已发布草稿移回草稿箱 |
| `Draft: 查看状态` | `Ctrl+Shift+S` | 显示所有草稿状态 |

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

### 元数据文件

**位置：** `草稿箱/.draft-metadata.json`

```json
{
  "drafts": {
    "2026-06-24-学习Astro的心得.md": {
      "created": "2026-06-24T10:30:00Z",
      "lastModified": "2026-06-24T15:45:00Z",
      "status": "editing",
      "wordCount": 1250,
      "version": 3
    }
  },
  "config": {
    "draftsFolder": "草稿箱",
    "postsFolder": "src/content/posts",
    "autoBackup": true
  }
}
```

### 状态定义

| 状态 | 说明 | 对应操作 |
|------|------|----------|
| `editing` | 正在编辑中 | 新建/修改草稿 |
| `ready` | 已完成，待发布 | 预览通过 |
| `published` | 已发布到 posts 目录 | 执行发布命令 |
| `archived` | 已取消发布 | 执行取消发布命令 |

---

## 4. 实现细节

### 插件结构

```
draft-box-plugin/
├── main.ts                 # 插件入口
├── manifest.json           # 插件清单
├── styles.css              # 样式文件
├── package.json            # 依赖配置
├── src/
│   ├── DraftManager.ts     # 草稿管理核心逻辑
│   ├── FrontmatterParser.ts# Frontmatter 解析
│   ├── DraftSidebarView.ts # 侧边栏视图
│   ├── DraftModal.ts       # 弹窗组件
│   └── utils.ts            # 工具函数
└── docs/
    └── README.md           # 使用说明
```

### 核心命令

```typescript
// 命令注册
this.addCommand({
  id: 'create-draft',
  name: '新建草稿',
  callback: () => this.createDraft()
});

this.addCommand({
  id: 'publish-draft',
  name: '发布草稿',
  editorCallback: (editor, view) => this.publishDraft(view.file)
});

this.addCommand({
  id: 'unpublish-draft',
  name: '取消发布',
  editorCallback: (editor, view) => this.unpublishDraft(view.file)
});

this.addCommand({
  id: 'preview-draft',
  name: '预览草稿',
  editorCallback: (editor, view) => this.previewDraft(view.file)
});

this.addCommand({
  id: 'list-drafts',
  name: '查看所有草稿',
  callback: () => this.listDrafts()
});
```

### 核心功能实现

**1. 新建草稿**
```typescript
async createDraft(): Promise<void> {
  // 1. 弹出输入框，获取文章标题
  const title = await this.showInputModal('请输入文章标题');

  // 2. 生成文件名：YYYY-MM-DD-简短标题.md
  const filename = this.generateFilename(title);

  // 3. 创建 frontmatter 模板
  const content = this.generateFrontmatter(title);

  // 4. 写入草稿箱目录
  const file = await this.app.vault.create(
    `${this.settings.draftsFolder}/${filename}`,
    content
  );

  // 5. 打开新创建的文件
  await this.app.workspace.openLinkText(file.path, '', true);

  // 6. 显示成功通知
  new Notice(`草稿已创建：${title}`);
}
```

**2. 发布草稿**
```typescript
async publishDraft(file: TFile): Promise<void> {
  // 1. 验证是否在草稿箱目录
  if (!this.isInDraftsFolder(file)) {
    new Notice('当前文件不在草稿箱中');
    return;
  }

  // 2. 解析 frontmatter
  const content = await this.app.vault.read(file);
  const { data, content: body } = this.parseFrontmatter(content);

  // 3. 验证必填字段
  const validation = this.validateFrontmatter(data);
  if (!validation.valid) {
    new Notice(`缺少必填字段：${validation.missing.join(', ')}`);
    return;
  }

  // 4. 修改 draft 为 false
  data.draft = false;

  // 5. 生成新内容
  const newContent = this.generateFrontmatterFromData(data, body);

  // 6. 移动到 posts 目录
  const newPath = `${this.settings.postsFolder}/${file.name}`;
  await this.app.vault.rename(file, newPath);

  // 7. 更新内容
  const newFile = this.app.vault.getAbstractFileByPath(newPath);
  if (newFile instanceof TFile) {
    await this.app.vault.modify(newFile, newContent);
  }

  // 8. 显示成功通知
  new Notice(`文章已发布：${data.title}`);
}
```

**3. 取消发布**
```typescript
async unpublishDraft(file: TFile): Promise<void> {
  // 1. 验证是否在 posts 目录
  if (!this.isInPostsFolder(file)) {
    new Notice('当前文件不在 posts 目录中');
    return;
  }

  // 2. 解析 frontmatter
  const content = await this.app.vault.read(file);
  const { data, content: body } = this.parseFrontmatter(content);

  // 3. 修改 draft 为 true
  data.draft = true;

  // 4. 生成新内容
  const newContent = this.generateFrontmatterFromData(data, body);

  // 5. 移动到草稿箱目录
  const newPath = `${this.settings.draftsFolder}/${file.name}`;
  await this.app.vault.rename(file, newPath);

  // 6. 更新内容
  const newFile = this.app.vault.getAbstractFileByPath(newPath);
  if (newFile instanceof TFile) {
    await this.app.vault.modify(newFile, newContent);
  }

  // 7. 显示成功通知
  new Notice(`已取消发布：${data.title}`);
}
```

### 侧边栏视图

```typescript
class DraftSidebarView extends ItemView {
  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType(): string {
    return 'draft-sidebar-view';
  }

  getDisplayText(): string {
    return '草稿箱';
  }

  getIcon(): string {
    return 'file-edit';
  }

  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1];
    container.empty();
    container.createEl('h2', { text: '草稿箱' });

    // 显示草稿列表
    await this.renderDraftList(container);
  }

  async renderDraftList(container: HTMLElement): Promise<void> {
    const drafts = await this.plugin.listDrafts();

    if (drafts.length === 0) {
      container.createEl('p', { text: '暂无草稿' });
      return;
    }

    const list = container.createEl('div', { cls: 'draft-list' });

    for (const draft of drafts) {
      const item = list.createEl('div', { cls: 'draft-item' });
      item.createEl('span', { text: draft.title, cls: 'draft-title' });
      item.createEl('span', { text: draft.status, cls: 'draft-status' });

      // 点击打开草稿
      item.addEventListener('click', async () => {
        await this.app.workspace.openLinkText(draft.path, '', true);
      });
    }
  }
}
```

### 设置面板

```typescript
interface DraftBoxSettings {
  draftsFolder: string;
  postsFolder: string;
  autoBackup: boolean;
  showNotifications: boolean;
}

const DEFAULT_SETTINGS: DraftBoxSettings = {
  draftsFolder: '草稿箱',
  postsFolder: 'src/content/posts',
  autoBackup: true,
  showNotifications: true
};

class DraftBoxSettingTab extends PluginSettingTab {
  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName('草稿箱目录')
      .setDesc('草稿存放的目录路径')
      .addText(text => text
        .setPlaceholder('草稿箱')
        .setValue(this.plugin.settings.draftsFolder)
        .onChange(async (value) => {
          this.plugin.settings.draftsFolder = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('文章目录')
      .setDesc('已发布文章存放的目录路径')
      .addText(text => text
        .setPlaceholder('src/content/posts')
        .setValue(this.plugin.settings.postsFolder)
        .onChange(async (value) => {
          this.plugin.settings.postsFolder = value;
          await this.plugin.saveSettings();
        }));
  }
}
```

### 发布规则

- 发布时自动将 `draft: true` 改为 `draft: false`
- 文件从 `草稿箱/` 移动到 `src/content/posts/`
- 发布后文章正式出现在网站上
- 支持批量发布（选择多个草稿）

---

## 5. 技术约束

### 依赖要求
- Node.js >= 18.0.0（插件开发）
- pnpm（包管理器）
- Obsidian >= 1.0.0（插件运行环境）
- TypeScript >= 5.0（插件开发语言）

### 插件开发依赖
```json
{
  "dependencies": {
    "gray-matter": "^4.0.3"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "obsidian": "latest",
    "typescript": "^5.0.0",
    "esbuild": "^0.19.0"
  }
}
```

### 文件系统约束
- 草稿箱目录：`草稿箱/`
- 元数据文件：`草稿箱/.draft-metadata.json`（插件内部管理）
- 编码：UTF-8

### Astro 集成约束
- 草稿必须放在 `src/content/posts/` 才会被构建
- Frontmatter 必须符合 `src/content/config.ts` schema
- `draft: true` 的文章会出现在网站上但标记为草稿
- `draft: false` 的文章正式发布，对所有用户可见

### Git 约束
- 草稿箱目录加入版本控制
- 插件目录加入版本控制（可选，建议作为子模块）
- 发布操作需要手动 git commit

---

## 6. 测试策略

### 单元测试
- 测试创建草稿功能
- 测试发布/取消发布功能
- 测试 frontmatter 验证
- 测试错误处理
- 测试文件路径处理

### 集成测试
- 测试插件加载和卸载
- 测试命令注册和执行
- 测试侧边栏视图渲染
- 测试设置面板保存
- 测试 Obsidian API 调用

### 用户验收测试
- 新建草稿 → 文件创建，frontmatter 正确
- 编辑草稿 → 实时保存，版本历史正常
- 预览草稿 → 显示状态和验证结果
- 发布草稿 → 文件移动，状态更新
- 取消发布 → 文件移回草稿箱
- 查看列表 → 显示所有草稿状态
- 侧边栏视图 → 实时更新草稿列表
- 设置面板 → 配置保存和生效

### 测试工具
- Jest（单元测试）
- Obsidian 插件测试框架（集成测试）
- 手动测试（用户验收测试）

---

## 7. 部署流程

### 插件开发阶段
1. 创建插件项目 `draft-box-plugin/`
2. 安装依赖（pnpm install）
3. 开发核心功能（草稿管理、frontmatter 解析）
4. 开发 UI 组件（侧边栏、弹窗、设置面板）
5. 本地测试（使用 Obsidian 开发者模式）

### 插件打包阶段
1. 编译 TypeScript（esbuild）
2. 生成 `main.js`、`manifest.json`、`styles.css`
3. 打包为 `.zip` 文件（可选）

### 插件安装阶段
1. 将插件文件复制到 Obsidian 插件目录
   ```
   .obsidian/plugins/draft-box-plugin/
   ├── main.js
   ├── manifest.json
   └── styles.css
   ```
2. 在 Obsidian 设置中启用插件
3. 配置插件设置（草稿箱目录、文章目录等）

### 项目集成阶段
1. 创建草稿箱目录 `草稿箱/`
2. 更新 `.gitignore`（排除插件构建文件）
3. 测试完整工作流

### 文档和培训
1. 创建插件使用说明文档
2. 录制操作演示视频（可选）
3. 培训用户使用新工作流

### 插件发布（可选）
1. 提交到 Obsidian 插件社区
2. 或者私有分发（手动安装）

---

## 8. 未来扩展

### 短期扩展（1-2周）
- 添加草稿模板管理
- 支持草稿分类和标签筛选
- 添加草稿统计功能

### 中期扩展（1-2月）
- 开发完整 Obsidian 插件
- 支持拖拽发布
- 添加草稿预览窗口

### 长期扩展（3-6月）
- 多设备同步（通过 Git）
- 协作编辑支持
- 自动化发布流程（CI/CD 集成）

---

## 9. 风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| Obsidian 插件不兼容 | 中 | 提供命令行备选方案 |
| 文件冲突 | 低 | 发布前检查，询问覆盖 |
| 数据丢失 | 高 | Git 版本控制，自动备份 |
| 性能问题 | 低 | 草稿数量有限，无需优化 |

---

## 10. 总结

这个设计提供了一个**完整的 Obsidian 插件**，实现草稿箱机制：

✅ **核心功能完整**：新建、编辑、预览、发布、取消发布
✅ **用户体验优秀**：原生 Obsidian 插件，侧边栏、命令面板、右键菜单
✅ **技术方案成熟**：Obsidian 插件 API，TypeScript 开发
✅ **可维护性强**：模块化设计，易于测试和扩展
✅ **可扩展性好**：支持后续功能增强（批量操作、模板管理等）

### 方案对比

| 方案 | 开发内容 | 用户体验 | 开发成本 |
|------|----------|----------|----------|
| 方案A（完整插件） | Obsidian 插件 | ⭐⭐⭐⭐⭐ | 中高 |
| 方案C（混合方案） | 脚本+配置 | ⭐⭐⭐ | 低 |

**选择方案A的理由：**
- 用户体验更好（原生插件界面）
- 功能更强大（侧边栏、弹窗、设置面板）
- 可扩展性更好（支持后续功能增强）
- 开发成本可接受（使用 Context7 获取文档）

---

**设计完成日期：** 2026-06-24
**设计者：** Claudian (AI Assistant)
**方案：** 方案A（完整 Obsidian 插件）
**待实现：** 是
