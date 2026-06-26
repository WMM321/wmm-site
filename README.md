# WMM 个人网站

个人网站（博客 + 作品集 + 知识花园），基于 [Astro](https://astro.build) + [Fuwari](https://github.com/saicaca/fuwari) 模板。

- **线上地址:** https://wmm-site.pages.dev
- **框架:** Astro 5.x + Tailwind CSS + Svelte 5
- **部署:** Cloudflare Pages
- **包管理:** pnpm

## 快速开始

```bash
pnpm install          # 安装依赖
pnpm run dev          # 本地开发 localhost:4321
pnpm run build        # 构建 + Pagefind 索引
```

## 文章管理

文章放在 `src/content/posts/`，支持两种格式：

- **平铺:** `hello-world.md`
- **文件夹（推荐）:** `文章slug/index.md` + 附件（图片、HTML 报告等）

详见 `CLAUDE.md`。

## 项目结构

```
src/content/posts/    文章（Markdown + frontmatter）
src/pages/            页面路由
src/components/       组件
public/reports/       HTML 附件（iframe 嵌入用）
docs/                 设计文档与使用指南
草稿箱/               文章草稿工作区
```

## 部署

```bash
npx wrangler pages deploy dist --project-name wmm-site
```
