---
title: "【编译构建】repo 拉取代码占用过大（浅拷贝）"
date: 2025-10-10
tags: ["repo", "git", "编译", "浅拷贝", "报错排查"]
summary: "Date：2024/12/16 问题 按照既定教程，repo拉取代码的时候过大，加上生成物后1T磁盘已无法满足，但是存在其他同事代码拉取很小的情况 解决办法 repo init加上 depth=1参数，进行浅拷贝 排查过程 主要思路是通过对"
draft: false
visibility: public
---

Date：2024/12/16

## 问题

按照既定教程，repo拉取代码的时候过大，加上生成物后1T磁盘已无法满足，但是存在其他同事代码拉取很小的情况

## 解决办法

- repo init加上--depth=1参数，进行浅拷贝

```shell
repo init --current-branch --depth=1 -u <url> -m mainifest.xml --no-clone-bundle --repo-url=https://git.codelinaro.org/clo/la/tools/repo.git --repo-branch=qc-stable

repo sync -j32 -c --no-tags
```

## 排查过程

- 主要思路是通过对比代码占用很大的工作站（后称大工作站）和代码占用很小的工作站（后称小工作站）进行对比

1. Mainifest的Git Log

大工作站：.repo/mainifests/下面git log仅有1条，且有grafted字样

小工作站：.repo/mainifests/下面git log有完整历史，没有grafted字样

2. grafted字样是什么？

- [https://adoyle.me/Today-I-Learned/git/grafted-commit.html](https://adoyle.me/Today-I-Learned/git/grafted-commit.html)
- ![](/images/repo-shallow-clone/Pasted%20image%2020250320102120.png)

3. --depth参数是什么？怎么用？

- [https://blog.csdn.net/qq_43827595/article/details/104833980](https://blog.csdn.net/qq_43827595/article/details/104833980)

4. 怎么查看大小工作站的depth

- 查询AI，无果
- 是否为git的配置？如何查看git的配置？
- [https://www.cnblogs.com/merray/p/6006411.html](https://www.cnblogs.com/merray/p/6006411.html)

```shell
# 查看系统配置
git config --system --list

# 查看当前用户（global）配置
git config --global  --list

# 查看当前仓库配置信息
git config --local  --list
```

- manifests里面git config --local --list，明显看到repo.depth = 1
- repo能否--depth？--> 查看--help
- repo init能， repo sync不能指定
- 加一下试试看咯 —> BINGO

## 其他的一些问题？

1. 如何识别git的浅克隆和深克隆？

- 检查.git/shallow，有此文件是浅拷贝，无则深拷贝；
- git rev-parse --is-shallow-repository，true是浅拷贝，false是深拷贝

2. repo如何保证是浅克隆

- 添加--depth=选项（暂时没有找到别的办法了）

3. git浅拷贝后 git log只能看到1条日志，如何看到全部日志，但保持浅拷贝？

- 方法1：git fetch --depth=<n>
- 方法2：git fetch origin --unshallow

4. 浅克隆和深克隆的区别和定义

- 浅克隆（Shallow Clone）：

    - 定义：浅克隆是指在克隆 Git 仓库时，仅获取指定数量的最近提交，而不获取完整的提交历史。通常通过 --depth 选项来指定克隆的深度；
    - 使用场景：浅克隆适用于需要快速获取代码进行构建或测试，但不需要完整历史记录的场合。例如，在 CI/CD 环境中，通常只关心最新的代码而不需要历史提交。
- 深克隆（Deep Clone）：

    - 定义：深克隆是指在克隆 Git 仓库时，获取整个仓库的完整提交历史。没有使用 --depth 选项；
    - 使用场景：深克隆适用于需要完整历史记录的场合，如开发和调试时，开发者可能需要查看项目的历史变更和提交。
