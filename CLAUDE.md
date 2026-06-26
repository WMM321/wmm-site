# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# WMM 个人网站项目

## 项目概述

个人网站（博客 + 作品集 + 知识花园），基于 Astro + Fuwari 模板，部署在 Cloudflare Pages。

- **线上地址:** https://wmm-site.pages.dev
- **GitHub:** https://github.com/WMM321/wmm-site
- **框架:** Astro 5.13.10 + Tailwind CSS 3.4.19 + Svelte 5.x
- **包管理器:** pnpm（Fuwari 强制要求）

## 目录结构

```
wmm-site/
├── src/
│   ├── content/posts/     ← 文章目录（支持平铺和文件夹两种格式）
│   ├── pages/             ← 页面路由（文件式路由）
│   ├── components/        ← 组件（.astro 静态 + .svelte 交互）
│   ├── config.ts          ← 站点配置（标题/导航/个人信息）
│   └── styles/            ← 样式文件
├── public/
│   └── reports/           ← HTML 附件（可被 iframe 嵌入）
├── docs/                  ← 设计文档与使用指南（中文命名，供人审阅）
├── scripts/               ← 工具脚本（草稿箱管理、新建文章）
├── 草稿箱/                ← 文章草稿工作区（Obsidian 中审阅修改）
├── .obsidian/             ← Obsidian 配置（已 gitignore）
└── dist/                  ← 构建输出（已 gitignore）
```

## 常用命令

```bash
# 本地开发
pnpm run dev              # 启动开发服务器 localhost:4321

# 构建
pnpm run build            # 构建 + Pagefind 索引

# 部署
npx wrangler pages deploy dist --project-name wmm-site

# Git
git add . && git commit -m "feat: 描述" && git push origin master
```

## 文章格式

文章放在 `src/content/posts/`，支持两种组织方式（Astro 生成相同的 slug）：

### 平铺格式（简单文章）
```
src/content/posts/
├── hello-world.md              ← slug: hello-world
└── another-post.md
```

### 文件夹格式（有附件的文章，推荐）
```
src/content/posts/
└── ai-memory-system-30-days/   ← slug: ai-memory-system-30-days
    ├── index.md                ← 文章正文（必须命名为 index.md）
    ├── 01-hero-overview.png    ← 文章配图（用相对路径引用）
    ├── 2026-05月度报告.html    ← 附件（月度报告、交互页面等）
    └── ...                     ← 其他附件
```

**规则：** 有附件的文章必须用文件夹格式。文件夹名 = slug，正文必须是 `index.md`。

### Frontmatter 规范

```yaml
---
title: "文章标题"
published: 2026-06-22
description: "简介"
tags: ["标签1", "标签2"]
category: "分类"
draft: false
# 来源信息
source_type: "original"  # original=原创 | curated=整理 | translated=翻译
source_url: ""
source_author: ""
source_platform: ""
---
```

### 附件管理

| 附件类型 | 存放位置 | 在文章中的引用方式 |
|----------|----------|-------------------|
| 文章配图 | 文章文件夹内（同 `index.md` 同级） | `![](./xxx.png)` |
| HTML 报告/交互页面 | 文章文件夹 + `public/reports/`（两份） | `<iframe src="/reports/xxx.html">` |
| 普通下载文件 | 文章文件夹 | `[下载](/reports/xxx.pdf)` |

**HTML 附件操作规范：**
1. 将 HTML 文件放入文章文件夹（源文件留存）
2. 复制一份到 `public/reports/`（Astro 构建时会原样输出，供 iframe 引用）
3. 在文章中用 `<iframe>` 嵌入

```html
<iframe src="/reports/xxx.html"
  style="width:100%;height:80vh;border:1px solid var(--border,#e2e6ee);border-radius:12px"
  loading="lazy"
  title="报告标题">
</iframe>
```

## 来源标注规则

- **原创文章:** `source_type: "original"`
- **整理文章:** `source_type: "curated"` + 填写 source_url/source_author
- **翻译文章:** `source_type: "translated"` + 填写 source_url/source_author

## 用户角色

用户是架构师，负责：
- 内容创作和审核
- 技术选型决策
- 质量把控

Claude 是执行者，负责：
- 代码实现
- 构建部署
- 问题排查

## 工作流程

1. 用户在 Obsidian 中写文章或提出需求
2. Claude 执行代码修改、构建、部署
3. 验证线上效果

## 架构说明

- **内容管线:** `src/content/config.ts` 定义 schema → `src/content/posts/` 存放文章 → `src/pages/posts/[...slug].astro` 生成静态页面
- **两个 content collection:** `posts`（文章，有完整 schema）和 `spec`（仅 `about.md`，无 schema 约束）
- **路由:** 文件式路由，`[...slug].astro` 捕获所有文章路径，`[...page].astro` 处理分页
- **图片处理:** 文章文件夹内的图片用相对路径 `![](./xxx.png)`，Astro 自动处理；`public/` 下的静态文件直接按原路径输出

## 注意事项

- 使用 pnpm，不要用 npm
- `.obsidian/` 目录已 gitignore，不会污染仓库
- `草稿箱/*.md` 已 gitignore，草稿内容仅本地可见（`.gitkeep` 保底）
- 修改 `src/config.ts` 可以改站点标题、导航、个人信息
- 修改 `src/content/config.ts` 可以改文章 schema
- `草稿箱/` 是 Obsidian 工作区，供人审阅修改；`src/content/posts/` 是网站正式内容
