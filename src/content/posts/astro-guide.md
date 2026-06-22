---
title: "Astro 框架入门指南"
published: 2026-06-22
description: "Astro 是一个现代的静态站点生成器，本文介绍其核心概念和基本用法"
image: ""
tags: ["Astro", "前端", "教程"]
category: "技术"
draft: false
source_type: "curated"
source_url: "https://docs.astro.build"
source_author: "Astro 官方"
source_platform: "Astro Docs"
---

# Astro 框架入门指南

## 什么是 Astro？

Astro 是一个专为内容驱动网站设计的静态站点生成器。它的核心理念是"零 JavaScript 默认"——生成的网站在客户端只加载最少的 JavaScript。

## 核心特性

### 1. 岛屿架构（Islands Architecture）

Astro 的岛屿架构允许你：
- 在页面中嵌入交互式组件
- 只有交互式组件才会加载 JavaScript
- 静态内容保持零 JS

### 2. 内容集合（Content Collections）

Astro 5 引入了内容集合 API，让你可以：
- 类型安全地管理 Markdown 内容
- 自动生成路由
- 验证 frontmatter 数据

### 3. 多框架支持

Astro 支持多种前端框架：
- React
- Vue
- Svelte
- Solid
- Preact

## 为什么选择 Astro？

对于博客和内容网站，Astro 有以下优势：
- **性能优秀**：生成的网站加载速度极快
- **SEO 友好**：静态 HTML 对搜索引擎友好
- **易于部署**：可以部署到任何静态托管服务
- **开发体验好**：热重载、TypeScript 支持

## 总结

Astro 是搭建个人网站的理想选择，特别是对于内容驱动的博客和文档站点。
