---
title: "Kanzi 车模壁纸集成"
date: 2025-10-09
tags: ["Kanzi", "壁纸", "AndroidStudio"]
summary: "结论 已完成，成功集成、运行，并在Android虚拟设备显示车模壁纸 工作内容 1. 集成Kanzi方提供的文件，在Android Studio成功编译； 2. 成功运行壁纸，并正确显示； Date 2024 09 14 2024 09 1"
draft: false
visibility: public
---

# 结论

- 已完成，成功集成、运行，并在Android虚拟设备显示车模壁纸

# 工作内容

1. 集成Kanzi方提供的文件，在Android Studio成功编译；
2. 成功运行壁纸，并正确显示；

# Date

2024-09-14 ~ 2024-09-15

---

> build.gradle
> getkanzi.gradle getKanziPlugins --> getKanziAndroidPath --> getKanzi
>
> getKanzi:
> 确定kanziPath
>
> 1. 通过local.properties "kanzi.home" property；
> 2. Environment variable "KANZI_HOME"；
> 3. 通过判断项目路径 Engine/version.txt 是否存在，若存在则为当前路径
>
> getKanziAndroidPath：
> 确定android库路径kanziAndroidPath
> kanziAndroidPath = kanziPath/Engine/lib/android
>
> getKanziPlugins:
> 确定pluginPath
> pluginPath = kanziAndroidPath/gradle
>
> ========================
>
> 修改的地方：
>
> 4. JDK版本不对（应该是我AS的问题）
> 5. 将Engine文件夹放到项目根目录（上面有3种方式确定Kanzi路径，我这里用第3种，觉得比较方便）；
> 6. debug.keystore文件有问题，应该是本地电脑的问题，删了就好了；
> 7. AS编译内存不足，本来是5G的，我给它加到了12G；
