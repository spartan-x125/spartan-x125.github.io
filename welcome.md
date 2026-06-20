---
title: "欢迎来到我的博客"
description: "这个页面已经支持 Markdown 推文、标签筛选、搜索、背景轮播和明暗模式。"
date: "2026-05-16"
category: "随笔"
tags: ["站点", "Astro", "随笔"]
draft: false
---

这是第一篇示例推文。你可以把自己的 Markdown 文件放到 `src/content/posts/` 目录中，然后运行 `npm.cmd run build` 重新生成网站。

每篇文章顶部使用 frontmatter 描述标题、摘要、分类和标签；`date` 可以省略，构建时会根据文件上传/提交时间自动补齐：

```md
---
title: "文章标题"
description: "文章摘要"
category: "文章分类"
tags: ["标签一", "标签二"]
draft: false
---
```

把 `draft` 改为 `true` 可以让文章从公开列表和文章页面中隐藏。
