---
title: Markdown 速查（含代码块与表格）
date: 2026-10-09
tags: [Markdown, 写作]
summary: 常用 Markdown 语法示例，顺便验证代码高亮、表格、引用等渲染效果。
draft: false
visibility: public
---

## 文本

**加粗**、*斜体*、`行内代码`、[链接](https://github.com/AJi-L)。

## 代码块

```python
def hello(name: str) -> str:
    return f"Hello, {name}!"
```

## 列表

1. 第一项
2. 第二项
   - 子项
   - 子项

## 表格

| 项 | 说明 |
|---|---|
| tags | 标签，数组 |
| draft | 草稿，生产构建隐藏 |
| visibility | public / private |

## 引用

> 私有笔记不进公开仓库；只有标 `visibility: public` 的才会被同步过来。
