# 项目修复设计文档

> 日期：2026-06-27
> 状态：已批准
> 方案：顺序修复（方案 A）

## 背景

个人网站项目（Astro + Fuwari）在某次操作中，整个项目被移入 `wmm-site/` 子目录，导致：

- Git 工作树与仓库记录完全脱节（~100+ 文件显示为 deleted，wmm-site/ 显示为 untracked）
- 构建失败（`@astrojs/sitemap` 与 zod 版本冲突）
- 两个 Dependabot 依赖更新 PR 待处理
- 根目录残留旧文件（package.json、docs/）

## 目标

1. 恢复正常的 Git 工作树状态
2. 修复构建，确保 `pnpm build` 成功
3. 关闭无法合并的 Dependabot PR，手动更新依赖
4. 最小化清理残留文件

## 设计

### 阶段 1：目录迁移

**操作**：将 `wmm-site/` 下所有文件移回 Git 仓库根目录

- 发现 wmm-site/ 有独立 `.git` 目录（独立仓库），不能用 `git mv` 跨仓库操作
- 改用文件系统 `mv` 移动 src/、public/、scripts/、草稿箱/ 回根目录
- 跳过 node_modules/、dist/、.git 等构建产物和工具目录
- 根目录的配置文件（package.json 等）已确认与 wmm-site/ 完全一致，无需覆盖
- `docs/` 目录：根目录 docs/ = wmm-site/docs/ + superpowers/，无冲突

**验证**：`git status` 显示新增文件，`ls` 确认目录结构完整

### 阶段 2：残留清理

**操作**：删除迁移后不再需要的残留文件

- 删除空的 `wmm-site/` 目录
- 检查 `.claudian/sessions/` 是否已在 .gitignore，如否则添加
- 不删除 `docs/`（用户选择最小清理）

**验证**：`git status` 无意外删除，目录结构干净

### 阶段 3：关闭 Dependabot PR 并手动更新依赖

**变更原因**：两个 Dependabot PR 的 merge base 是初始 commit `10ddcc5`，与当前 master 有 9 个 commit 的差距，合并将产生海量冲突，技术上不可行。

**操作**：

1. 关闭两个 Dependabot PR（附说明原因）
2. 依赖更新将在阶段 4 通过 `pnpm update` 手动完成

**验证**：PR 已关闭，无待处理的 Dependabot 分支

### 阶段 4：修复构建

**操作**：解决 `@astrojs/sitemap` 与 zod 的版本冲突

1. 运行 `pnpm update @astrojs/sitemap`
2. 如果问题仍存在，检查 zod 版本并升级到兼容版本
3. 运行 `pnpm build` 验证
4. 运行 `pnpm build` 确认 Pagefind 索引生成

**验证**：`pnpm build` 退出码为 0，`dist/` 目录生成正确

### 阶段 5：最终验证与提交

**操作**：

1. 运行 `pnpm dev` 快速验证开发服务器启动
2. 运行 `pnpm build` 最终确认
3. 提交所有更改到 master
4. 推送到 origin

**验证**：`git push` 成功，线上 https://wmm-site.pages.dev 可正常访问

## 风险与应对

| 风险 | 影响 | 应对 |
|------|------|------|
| git mv 路径中文编码问题 | 文件移动失败 | 改用文件系统 mv + git add |
| ~~Dependabot PR 合并冲突~~ | ~~合并失败~~ | 已改为关闭 PR + 手动更新 |
| sitemap 升级引入 breaking change | 构建仍然失败 | 回退版本，锁定 zod 版本 |
| Cloudflare Pages 自动部署失败 | 线上不可用 | 检查构建日志，手动触发部署 |
