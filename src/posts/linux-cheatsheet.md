---
title: Linux 命令速查：文件、进程、网络
date: 2026-10-08
tags: [Linux, 速查]
summary: 平时最常用的一批 Linux 命令，按文件、进程、网络分组，随手查。
visibility: public
---

## 文件

```bash
ls -lah                 # 列表（含隐藏、人类可读大小）
tree -L 2               # 两层目录树
du -sh */               # 各目录占用
find . -name "*.log"    # 按名查找
grep -rn "TODO" src/    # 递归搜索
```

## 进程 / 资源

```bash
ps aux | grep python
top -o %MEM
kill -9 <pid>
lsof -i :8080           # 谁占了端口
```

## 网络

```bash
ip addr
ss -tulpn               # 监听端口
curl -I https://example.com
rsync -a --info=progress2 src/ dst/
```

> 经验：`du -sh` 在超大目录上很慢，加 `--max-depth=1` 先看哪一层大。
