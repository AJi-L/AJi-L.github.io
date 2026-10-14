---
title: "【性能调试】Trace 抓取方法（systrace / perfetto）"
date: 2026-06-23
tags: ["Android", "Trace", "调试"]
summary: "Systrace 1. 谷歌官方在22年3月发布的33.0.1版本的platform tools包中移除了systrace，而最后一个含有systrace的platform tools版本是33.0.0，因此使用<=33.0.0版本的pla"
draft: false
visibility: public
---

## Systrace

```Plain
<Python2.7路径> <systrace.py路径> gfx input view sched am wm hal pm sm res video camera audio dalvik bionic memreclaim freq idle sync binder_driver irq workq power disk ss rs pagecache thermal memory ion --ktrace=hab_msg_dequeue --buf-size 96000 --time 5 --no-compress -o output.html
```

> 1. 谷歌官方在22年3月发布的33.0.1版本的platform-tools包中移除了systrace，而最后一个含有systrace的platform-tools版本是33.0.0，因此使用<=33.0.0版本的platform-tools即可
> 2. Systrace工具需要Python2.7版本，Python3不适用

- Systrace下载地址：https://dl.google.com/android/repository/platform-tools_r33.0.0-windows.zip?hl=zh-cn
- Python2.7下载地址：https://python.p2hp.com/downloads/windows/index.html

- 结果：直接打开output.html即可

> 如果要复制提供给其他人，整个文件夹打包吧。法雷奥电脑安装2.7需要管理员权限，忘了会生成什么文件夹了。

## Perfetto

```Plain
adb shell setprop persist.traced.enable 1

adb shell perfetto -o /data/misc/perfetto-traces/perfetto.trace -t 5s gfx input view sched am wm hal pm sm res video camera audio dalvik bionic memreclaim freq idle sync binder_driver irq workq power disk ss rs pagecache thermal memory ion block/block_rq_issue block/block_rq_complete msm_hyp ipi lock

adb pull /data/misc/perfetto-traces/perfetto.trace
```

> 不需要额外安装，android内置perfetto命令

- 产物：perfetto.trace

1. 打开ui.perfetto.dev网站
2. 导入perfetto.trace

## ATrace

```Plain
adb root

adb remount // /data/tracexxx.tr 可能需要root权限，否则会写入失败

adb shell setprop persist.traced.enable 1

adb shell atrace gfx input view wm am sm audio video camera hal res dalvik rs bionic power sched irq freq idle sync workq -b 30480 -t 10 -o /data/tracexxx.tr

adb pull /data/tracexxx.tr
```

> 不需要额外安装，android内置atrace命令

- 产物：tracexxx.tr

1. 打开ui.perfetto.dev网站
2. 导入tracexxx.tr
