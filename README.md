# aji_blog

个人博客：**Astro** 静态站点，部署到 **GitHub Pages**。简洁风格，带**标签**与**搜索**。

- 列表：`/`
- 文章：`/posts/<slug>/`
- 标签：`/tags/`
- 搜索：`/search/`（构建时生成 `search-index.json`，前端本地检索，无后端）
- RSS：`/rss.xml`

## 本地开发

```powershell
npm install
npm run dev      # http://localhost:4321
npm run build    # 输出到 dist/
npm run preview  # 预览构建产物
```

> 本机若 `npm` 被 PowerShell 执行策略拦截，用 `npm.cmd` 或 `cmd /c npm ...`。

## 写文章

在 `src/posts/` 下新建 Markdown（可分子目录）：

```markdown
---
title: 标题
date: 2026-10-11
tags: [标签A, 标签B]
summary: 一句话摘要（列表/搜索/RSS 用）
draft: false
visibility: public
---

正文……
```

- `draft: true` 只在本地预览可见，生产构建会隐藏。
- `visibility` 是**公私隔离**的标记（见下）。

## 公私隔离（重要）

GitHub Pages 的仓库里，**凡提交的都是公开的**。所以私有内容绝不进这个仓库。

- 本仓库只放**可公开**的文章。
- 私有笔记留在原地（本地/私有仓）。
- 同步脚本只挑 `visibility: public`：

```powershell
node scripts/sync-public.mjs "D:\我的笔记目录"
```

脚本会：只拷 `public` 且非 `draft` 的文章、保留目录结构、命中疑似密钥则跳过报警；**不删除**（旧文章手动清）。

## 部署到 GitHub Pages

1. 建仓库。二选一：
   - **用户站**：仓库名 `AJi-L.github.io` → 访问 `https://aji-l.github.io/`（`astro.config.mjs` 里 `base` 留空，已默认）
   - **项目站**：仓库名如 `aji_blog` → 访问 `https://aji-l.github.io/aji_blog/`，需把 `astro.config.mjs` 的 `base` 设为 `"/aji_blog"`。
2. 推到 `main` 分支（`.github/workflows/deploy.yml` 会自动构建发布）。
3. 仓库 **Settings → Pages → Source** 选 **GitHub Actions**。
