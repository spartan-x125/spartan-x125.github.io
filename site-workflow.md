---
title: "我的博客维护流程"
description: "用本地 Markdown 写作，用 Astro 构建，用 GitHub Pages 发布。"
date: "2026-05-16"
tags: ["教程", "博客管理"]
draft: false
---

推荐维护流程：

1. 在 `/studio/` 页面编辑或导入 Markdown。
2. 下载生成的 `.md` 文件。
3. 放入 `src/content/posts/`。
4. 运行 `npm.cmd run build`。
5. 提交 `docs/` 和源码变更，再推送到 GitHub。

因为 GitHub Pages 是静态托管，它不能在网页上直接写入你的仓库。真正的权限控制来自你的本机文件系统、GitHub 账号和仓库权限。
