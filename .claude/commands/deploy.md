# /deploy — 构建并部署网站

执行完整的构建和部署流程。

## 参数

$ARGUMENTS — 可选的 commit message，例如：
- 空 — 使用默认 message
- `添加文章《xxx》` — 自定义 commit message

## 执行步骤

1. **检查变更**
   ```bash
   cd "e:/Obsidian知识库/10-Projects/AI学习工程/260620_个人网站/wmm-site"
   git status
   ```

2. **Git 提交**
   ```bash
   git add .
   git commit -m "feat: $ARGUMENTS || '更新网站内容'"
   ```

3. **推送到 GitHub**
   ```bash
   git push origin master
   ```

4. **构建**
   ```bash
   pnpm run build
   ```

5. **部署到 Cloudflare Pages**
   ```bash
   npx wrangler pages deploy dist --project-name wmm-site
   ```

6. **验证**
   - 检查部署输出是否成功
   - 报告线上地址

## 错误处理

- 如果构建失败，分析错误并尝试修复
- 如果推送失败，检查网络连接
- 如果部署失败，检查 Cloudflare 认证状态

## 输出

部署完成后报告：
- Git commit hash
- 构建页面数
- 部署 URL
- 线上地址：https://wmm-site.pages.dev
