# /new-post — 创建新文章

根据用户提供的标题和类型，创建一篇新文章。

## 参数

$ARGUMENTS — 文章标题和类型，例如：
- `Astro 入门教程` — 默认创建原创文章
- `curated:Vibe Coding 核心理念` — 创建整理文章
- `translated:How to Use Claude Code` — 创建翻译文章

## 执行步骤

1. 解析参数，判断文章类型（original/curated/translated）
2. 从标题生成文件名（中文标题用拼音或英文缩写）
3. 根据类型选择对应的 frontmatter 模板
4. 创建文件到 `src/content/posts/`
5. 生成文章骨架（H2 标题结构）

## frontmatter 模板

### 原创文章
```yaml
---
title: "标题"
published: YYYY-MM-DD
description: ""
image: ""
tags: []
category: ""
draft: true
source_type: "original"
---
```

### 整理文章
```yaml
---
title: "标题"
published: YYYY-MM-DD
description: ""
image: ""
tags: []
category: ""
draft: true
source_type: "curated"
source_url: "https://"
source_author: ""
source_platform: ""
---
```

### 翻译文章
```yaml
---
title: "标题"
published: YYYY-MM-DD
description: ""
image: ""
tags: []
category: ""
draft: true
source_type: "translated"
source_url: "https://"
source_author: ""
source_platform: ""
---
```

## 输出

创建完成后报告：
- 文件路径
- 文章类型
- 下一步：填写 description、tags，然后写正文
