# CLAUDE.md — WMM 个人网站项目

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
│   ├── content/posts/     ← 文章目录（Markdown + frontmatter）
│   ├── pages/             ← 页面路由（文件式路由）
│   ├── components/        ← 组件（.astro 静态 + .svelte 交互）
│   ├── config.ts          ← 站点配置（标题/导航/个人信息）
│   └── styles/            ← 样式文件
├── public/images/         ← 图片附件
├── docs/                  ← 项目文档
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

文章放在 `src/content/posts/`，使用 Markdown + frontmatter：

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

## 注意事项

- 使用 pnpm，不要用 npm
- `.obsidian/` 目录已 gitignore，不会污染仓库
- 修改 `src/config.ts` 可以改站点标题、导航、个人信息
- 修改 `src/content/config.ts` 可以改文章 schema
