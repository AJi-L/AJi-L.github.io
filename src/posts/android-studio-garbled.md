---
title: "Android Studio 报错中文乱码"
date: 2026-06-27
tags: ["AndroidStudio", "编码"]
summary: "现象： 解决办法： 1. 按两下Shift，查找Edit Custom VM Options并确认； 2. 没有studio64.exe.vmoptions的话会弹窗，创建一个即可；原本存在的话，在最下面添加 3. Sync Gradle "
draft: false
visibility: public
---

### 现象：


### 解决办法：
1. 按两下Shift，查找Edit Custom VM Options并确认；


2. 没有studio64.exe.vmoptions的话会弹窗，创建一个即可；原本存在的话，在最下面添加
```
-Dfile.encoding=UTF-8
```

3. Sync Gradle 重新同步一下；
