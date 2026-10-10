---
title: 用 Astro + GitHub Pages 搭这个博客
date: 2026-10-10
tags: [Astro, GitHub Pages, 前端]
summary: 从零搭一个静态博客并部署到 GitHub Pages 的流程，含搜索与标签的实现思路。
visibility: public
---

## 选型

- **Astro**：Node 环境即可跑，Markdown 原生，输出纯静态 HTML，非常适合博客。
- **GitHub Pages**：免费托管，配合 GitHub Actions 一键发布。

## 目录结构

```
src/
  posts/          # 文章（Markdown，支持子目录）
  layouts/        # 布局
  pages/          # 路由：/、/posts/、/tags/、/search/、/rss.xml
  lib/posts.js    # 加载文章 + 生成标签
public/styles/    # 全局样式
```

## 搜索怎么做的

构建时把文章生成一份 `search-index.json`（标题、标签、摘要、正文纯文本），
前端 `search` 页拉取后本地打分过滤，**零后端、零外部服务**。

## 部署

推送到 `main` 分支，GitHub Actions 构建 `dist/` 并发布到 Pages。

```yaml
# .github/workflows/deploy.yml 关键步骤
- run: npm ci
- run: npm run build
- uses: actions/upload-pages-artifact@v3
  with: { path: dist }
```

在仓库 **Settings → Pages → Source** 选 **GitHub Actions** 即可。
