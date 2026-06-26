# 草稿箱管理工具使用指南

## 命名约定

**文件命名规则：**
- 格式：`YYYY-MM-DD-文章标题.md`
- 示例：`2026-06-26-我的第一篇文章.md`
- **建议使用中文命名**，方便审阅和管理
- 英文标题会保留原始大小写（如 `React`、`Astro`）
- 空格会自动转换为连字符

**Frontmatter 字段：**
- `title` - 文章标题（必填）
- `published` - 发布日期（必填）
- `description` - 文章简介（必填）
- `tags` - 标签数组（必填）
- `category` - 分类（必填）
- `draft` - 草稿状态（自动管理）

---

## 快速开始

### 1. 创建新草稿

```bash
node scripts/draft-manager.js create "文章标题"
```

或者使用 pnpm 脚本：

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

或者使用 pnpm 脚本：

```bash
pnpm run draft:publish "文件名.md"
```

### 5. 取消发布

```bash
node scripts/draft-manager.js unpublish "文件名.md"
```

### 6. 查看所有草稿

```bash
node scripts/draft-manager.js list
```

或者使用 pnpm 脚本：

```bash
pnpm run draft:list
```

## pnpm 脚本快捷命令

| 命令 | 说明 |
|------|------|
| `pnpm run draft` | 显示帮助信息 |
| `pnpm run draft:create "标题"` | 创建新草稿 |
| `pnpm run draft:publish "文件名"` | 发布草稿 |
| `pnpm run draft:list` | 列出所有草稿 |

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
- 支持文件夹格式的草稿（如 `文章标题/index.md`）

## 常见问题

### Q: 如何查看草稿状态？

```bash
node scripts/draft-manager.js status "文件名.md"
```

### Q: 发布失败怎么办？

发布失败时会自动回滚操作。检查以下常见原因：
- 缺少必填字段（title, published, description, tags, category）
- 目标文件已存在
- 文件权限问题

### Q: 如何批量发布？

目前不支持批量发布，需要逐个发布。

### Q: 文件夹格式的草稿如何处理？

文件夹格式的草稿（如 `文章标题/index.md`）支持 `list` 和 `status` 命令。`publish` 和 `unpublish` 命令暂不支持文件夹格式，需要手动处理。
