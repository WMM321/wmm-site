---
title: "使用 Cloudflare Pages 部署静态网站"
published: 2026-06-22
description: "Cloudflare Pages 提供免费的静态网站托管，本文介绍如何使用它部署 Astro 站点"
image: ""
tags: ["Cloudflare", "部署", "CI/CD"]
category: "技术"
draft: false
---

# 使用 Cloudflare Pages 部署静态网站

## 为什么选择 Cloudflare Pages？

Cloudflare Pages 是一个现代化的静态网站托管平台，具有以下优势：

- **免费额度充足**：每月 500 次构建，无限带宽
- **全球 CDN**：内容分发到全球 200+ 节点
- **自动 HTTPS**：免费的 SSL 证书
- **Git 集成**：推送代码自动部署

## 部署流程

### 1. 准备代码

确保你的项目已经推送到 GitHub。

### 2. 连接 Cloudflare

1. 登录 Cloudflare Dashboard
2. 进入 Pages 项目
3. 连接 GitHub 仓库

### 3. 配置构建设置

- **构建命令**：`npm run build` 或 `pnpm run build`
- **输出目录**：`dist`
- **Node.js 版本**：18 或更高

### 4. 部署

推送代码后，Cloudflare 会自动构建和部署。

## 自定义域名

Cloudflare Pages 支持自定义域名：
1. 在项目设置中添加自定义域名
2. 配置 DNS 记录
3. 等待 SSL 证书签发

## 总结

Cloudflare Pages 是部署静态网站的最佳选择之一，特别适合个人博客和项目文档。
