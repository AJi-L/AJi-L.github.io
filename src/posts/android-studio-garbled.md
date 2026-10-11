---
title: "Android Studio 报错中文乱码"
date: 2026-06-27
tags: ["AndroidStudio", "编码"]
summary: "现象： 解决办法： 1. 按两下Shift，查找Edit Custom VM Options并确认； 2. 没有studio64.exe.vmoptions的话会弹窗，创建一个即可；原本存在的话，在最下面添加 3. Sync Gradle "
draft: false
visibility: public
---

### 现象：
![](/images/android-studio-garbled/f873770f212c44c0b131092e0b742308.png)

### 解决办法：
1. 按两下Shift，查找Edit Custom VM Options并确认；
![](/images/android-studio-garbled/dcbbc07ea9464f7bbdb8ee2c6e0d14aa.png)

2. 没有studio64.exe.vmoptions的话会弹窗，创建一个即可；原本存在的话，在最下面添加
```
-Dfile.encoding=UTF-8
```
![](/images/android-studio-garbled/889c8e0beaae453b98f3fc0556fc1c7d.png)
3. Sync Gradle 重新同步一下；
![](/images/android-studio-garbled/d20c93c7a2d24743a95163afaa2a71ad.png)
