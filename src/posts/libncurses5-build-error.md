---
title: "libncurses5 编译报错"
date: 2025-10-10
tags: ["AOSP", "编译", "报错排查"]
summary: "现象： 编译镜像没有super.img 排查过程： 1. 脚本中generate super报错，无法找到otatools等工具，对比正常情况，工具在lagvm qssi下的out/dist/目录下 qssi编译失败； 2. 直接编译qss"
draft: false
visibility: public
---

#### 现象：

编译镜像没有super.img

#### 排查过程：

1. 脚本中generate_super报错，无法找到otatools等工具，对比正常情况，工具在aosp_aosp下的out/dist/目录下 ---> aosp编译失败；
2. 直接编译aosp系统， ./build.sh dist -j32 --aosp_only， 出现报错：
  ![](/images/libncurses5-build-error/Pasted image 20250317093711.png)
3. 出现的so库loading失败，基本so库都是libncurses.so.5，相关工具比较多像是编译工具，如llvm等；

#### 解决办法

重装libncurses5即可；

```bash
sudo apt-get install libncurses5
```
