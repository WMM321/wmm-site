# 项目修复实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复个人网站项目的 Git 工作树状态、清理重复文件、修复构建，使项目恢复正常开发和部署流程。

**Architecture:** 顺序修复。项目文件（src/、public/、scripts/、草稿箱/）已存在于根目录，但 Git 索引显示 110 个文件为 ` D`（deleted-in-working-tree）。`wmm-site/` 是包含完整项目副本的独立 Git 仓库（有自己的 `.git`），根目录配置文件与 wmm-site/ 完全一致（diff 无差异）。需要重新同步 Git 索引、将 wmm-site/ 加入 .gitignore、关闭不可合并的 Dependabot PR、修复 sitemap 构建错误。

**Tech Stack:** Git, pnpm, Astro 5.13.10, @astrojs/sitemap, zod, Cloudflare Wrangler

---

## 关键发现

| 发现 | 详情 |
|------|------|
| 文件位置 | src/、public/、scripts/、草稿箱/ 已在根目录，不需要移动 |
| Git 索引异常 | 110 个文件显示 ` D`，但文件实际存在（Windows 路径编码/stat cache 问题） |
| wmm-site/ | 独立 Git 仓库（有 `.git`），内容与根目录完全一致（diff 无差异） |
| Dependabot PR | merge base 是初始 commit，与 master 差 9 个 commit，合并不可行 |
| 构建错误 | `z.function(...).args is not a function`，@astrojs/sitemap 与 zod 不兼容 |

---

### Task 1: 修复 Git 索引状态

**Background:** 110 个文件在 `git status` 中显示为 ` D`（deleted in working tree, unstaged），但文件实际存在于根目录。需要重新同步 Git 索引。

**Files:**
- No files created or modified — index repair only

- [ ] **Step 1: 刷新 Git stat cache**

```bash
cd "E:\Obsidian知识库\10-Projects\个人网站"
git update-index --refresh
```

Expected: 输出一些 "needs update" 行。

- [ ] **Step 2: 强制重新暂存所有文件**

```bash
cd "E:\Obsidian知识库\10-Projects\个人网站"
git add -A
```

Expected: 所有 110 个 ` D` 文件变为 staged additions（`A`）。

- [ ] **Step 3: 验证 Git 状态**

```bash
cd "E:\Obsidian知识库\10-Projects\个人网站"
git status --short | head -30
```

Expected: 不再有 ` D` 文件。应该看到：
- `A` — 重新添加的 src/、public/、scripts/、草稿箱/ 文件
- `??` — .claudian/sessions/、docs/superpowers/（工具生成的目录）
- ` M` — .claudian/claudian-settings.json
- wmm-site/ 不应出现（将在 Task 2 中 gitignore）

If still showing ` D`: run `git rm --cached -r . && git add -A` to fully rebuild the index.

- [ ] **Step 4: 确认文件数量合理**

```bash
cd "E:\Obsidian知识库\10-Projects\个人网站"
git diff --cached --stat | tail -5
```

Expected: 约 110+ 文件变更。

---

### Task 2: 将 wmm-site/ 加入 .gitignore

**Background:** `wmm-site/` 是独立 Git 仓库，包含与根目录完全相同的项目文件。根目录已有完整项目，wmm-site/ 是冗余副本。不删除它（安全保底），但需要让 Git 忽略它。

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: 确认 wmm-site/ 与根目录一致**

```bash
cd "E:\Obsidian知识库\10-Projects\个人网站"
diff -rq src/ wmm-site/src/ 2>/dev/null | head -10
diff -rq public/ wmm-site/public/ 2>/dev/null | head -10
```

Expected: 无差异输出（或仅时间戳差异）。

- [ ] **Step 2: 编辑 .gitignore 添加 wmm-site/**

在 `.gitignore` 末尾添加：

```
# 旧版项目副本（已迁移到根目录，独立 git 仓库）
wmm-site/
```

- [ ] **Step 3: 验证 gitignore 生效**

```bash
cd "E:\Obsidian知识库\10-Projects\个人网站"
git status --short | grep wmm-site
```

Expected: 无输出（wmm-site/ 被完全忽略）。

- [ ] **Step 4: 暂存 .gitignore 变更**

```bash
cd "E:\Obsidian知识库\10-Projects\个人网站"
git add .gitignore
```

---

### Task 3: 关闭 Dependabot PR

**Background:** 两个 Dependabot PR 的 merge base 是初始 commit `10dd5`，与当前 master 有 9 个 commit 差距。合并将产生大量冲突，技术上不可行。改为关闭 PR + 在 Task 4 中手动更新依赖。

**Files:**
- No files created or modified

- [ ] **Step 1: 查看待处理的 Dependabot PR**

```bash
cd "E:\Obsidian知识库\10-Projects\个人网站"
gh pr list --author "app/dependabot" --state open
```

Expected: 2 个 PR 列出。记录 PR 编号。

- [ ] **Step 2: 关闭第一个 PR（minor updates）**

```bash
cd "E:\Obsidian知识库\10-Projects\个人网站"
gh pr close <PR-NUMBER-1> --comment "Closing: merge base is 9 commits behind master, merging is not feasible. Dependencies will be updated manually via pnpm update."
```

Expected: PR 已关闭。

- [ ] **Step 3: 关闭第二个 PR（patch updates）**

```bash
cd "E:\Obsidian知识库\10-Projects\个人网站"
gh pr close <PR-NUMBER-2> --comment "Closing: merge base is 9 commits behind master, merging is not feasible. Dependencies will be updated manually via pnpm update."
```

Expected: PR 已关闭。

- [ ] **Step 4: 删除远程 Dependabot 分支**

```bash
cd "E:\Obsidian知识库\10-Projects\个人网站"
git push origin --delete dependabot/npm_and_yarn/minor-updates-09f2bfbc35 2>/dev/null || echo "Branch already deleted"
git push origin --delete dependabot/npm_and_yarn/patch-updates-10944918e1 2>/dev/null || echo "Branch already deleted"
```

Expected: 分支删除成功或已不存在。

---

### Task 4: 修复构建错误

**Background:** `pnpm build` 报错 `z.function(...).args is not a function`，位于 `@astrojs/sitemap/dist/schema.js`。原因是 `@astrojs/sitemap` 与当前 zod 版本不兼容。

**Files:**
- Modify: `package.json`（通过 pnpm update）
- Modify: `pnpm-lock.yaml`（自动生成）

- [ ] **Step 1: 安装依赖**

```bash
cd "E:\Obsidian知识库\10-Projects\个人网站"
pnpm install
```

Expected: 安装成功。

- [ ] **Step 2: 升级 @astrojs/sitemap**

```bash
cd "E:\Obsidian知识库\10-Projects\个人网站"
pnpm update @astrojs/sitemap
```

Expected: 升级成功。

- [ ] **Step 3: 测试构建**

```bash
cd "E:\Obsidian知识库\10-Projects\个人网站"
pnpm run build
```

Expected: 构建成功，退出码 0。如果仍然报 zod 错误，执行 Step 4。

- [ ] **Step 4: （仅在 Step 3 失败时）升级 zod**

```bash
cd "E:\Obsidian知识库\10-Projects\个人网站"
pnpm update zod
pnpm run build
```

Expected: 构建成功。

- [ ] **Step 5: （仅在 Step 4 也失败时）重新安装 sitemap**

```bash
cd "E:\Obsidian知识库\10-Projects\个人网站"
pnpm remove @astrojs/sitemap && pnpm add @astrojs/sitemap@latest
pnpm run build
```

Expected: 构建成功。

- [ ] **Step 6: 验证 dist/ 输出**

```bash
cd "E:\Obsidian知识库\10-Projects\个人网站"
ls dist/ | head -20
ls dist/pagefind/ 2>/dev/null | head -5 || echo "Pagefind index not found"
```

Expected: dist/ 包含 index.html、posts/、pagefind/ 等。

- [ ] **Step 7: 暂存依赖更新**

```bash
cd "E:\Obsidian知识库\10-Projects\个人网站"
git add package.json pnpm-lock.yaml
```

---

### Task 5: 提交、推送与验证

**Background:** 将所有修复一次性提交并推送，触发 Cloudflare Pages 自动部署。

**Files:**
- No additional files created or modified

- [ ] **Step 1: 检查暂存区状态**

```bash
cd "E:\Obsidian知识库\10-Projects\个人网站"
git status
```

Expected: 暂存区包含 Task 1-4 的所有变更（恢复的文件 + .gitignore + package.json + pnpm-lock.yaml），无意外文件。

- [ ] **Step 2: 提交所有修复**

```bash
cd "E:\Obsidian知识库\10-Projects\个人网站"
git commit -m "$(cat <<'EOF'
fix: restore project structure and repair build

- Restore Git index: re-sync 110 files that were incorrectly shown as deleted
- Add wmm-site/ to .gitignore (redundant copy with own .git)
- Close unmergeable Dependabot PRs (merge base 9 commits behind)
- Upgrade @astrojs/sitemap to fix zod compatibility build error
EOF
)"
```

Expected: Commit 成功。

- [ ] **Step 3: 推送到远程**

```bash
cd "E:\Obsidian知识库\10-Projects\个人网站"
git push origin master
```

Expected: 推送成功。

- [ ] **Step 4: 确认线上部署**

等待 Cloudflare Pages 自动部署（1-3 分钟），访问 https://wmm-site.pages.dev 确认：
- 首页加载正常
- 文章列表显示所有 8 篇文章
- 点击任意文章可正常阅读
- `ai-memory-system-30-days` 文章的配图和 HTML 附件正常显示

---

## 风险与应对

| 风险 | 应对 |
|------|------|
| `git add -A` 无法修复索引 | `git rm --cached -r . && git add -A` 完全重建索引 |
| sitemap 升级后仍不兼容 | 降级回原版本，锁定 zod 到已知兼容版本 |
| Cloudflare Pages 部署失败 | `npx wrangler pages deployment list --project-name wmm-site` 检查日志 |
| wmm-site/ 删除后后悔 | 它有独立 `.git`，可 `git clone wmm-site/ wmm-site-backup/` |
