# /quick-publish — 一键发布文章

将指定文章从草稿状态改为发布状态，并部署。

## 参数

$ARGUMENTS — 文章文件名（不含 .md），例如：
- `my-new-post` — 发布这篇文章
- 空 — 发布所有 draft: true 的文章

## 执行步骤

1. **查找文章**
   - 如果指定了文件名，查找 `src/content/posts/{文件名}.md`
   - 如果未指定，查找所有 `draft: true` 的文章

2. **更新 frontmatter**
   - 将 `draft: true` 改为 `draft: false`
   - 设置 `published` 为今天日期（如果未设置）

3. **Git 提交**
   ```bash
   git add .
   git commit -m "publish: 发布文章《标题》"
   ```

4. **构建并部署**
   ```bash
   git push origin master
   pnpm run build
   npx wrangler pages deploy dist --project-name wmm-site
   ```

## 输出

发布完成后报告：
- 发布的文章标题
- 线上地址：https://wmm-site.pages.dev/posts/{slug}/
