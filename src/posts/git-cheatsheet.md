---
title: Git 常用操作与几个容易踩的坑
date: 2026-10-06
tags: [Git, 速查]
summary: 分支、回退、冲突、stash 的常用命令，以及几个新手常踩的坑。
visibility: public
---

## 日常

```bash
git status -sb
git log --oneline --graph -20
git switch -c feature/x
git add -p                # 分块暂存
git commit -m "feat: ..."
```

## 回退

```bash
git restore <file>              # 丢弃工作区改动
git reset --soft HEAD~1         # 撤销提交，保留改动
git reset --hard <commit>       # 慎用
```

## 临时保存

```bash
git stash push -m "wip"
git stash list
git stash pop
```

## 坑

- `git reset --hard` 会丢工作区改动，先 `stash` 或提交。
- 已经 `push` 的分支别随便 rebase/force，会影响别人。
- 大文件别进仓库，用 `.gitignore` 或 LFS。
