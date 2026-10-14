---
title: "【问题排查】Android Module Bluetooth 被覆盖"
date: 2026-06-22
tags: ["AOSP", "编译", "模块", "报错排查"]
summary: "问题背景 packages/module/Bluetooth/下的修改会被覆盖，每次编译这里都会产生变化； 排查过程 逐步根据编译脚本进行排查， source build/envsetup.sh lunch 8775脚本等； 每步命令之后都"
draft: false
visibility: public
---

### **问题背景**

- packages/module/Bluetooth/下的修改会被覆盖，每次编译这里都会产生变化；

### **排查过程**

- 逐步根据编译脚本进行排查， source build/envsetup.sh --> lunch --> 8775脚本等；
- 每步命令之后都git status查看路径下是否产生变化；

1. 已经确定是lunch的问题；
2. 查看lunch源码，源码在build/envsetup.sh中，lunch方法会调用build_build_var_cache；
3. build_build_var_cache最终调用soongui，而且是--dumpvars-mode模式；



4. soong里面这里有点弯绕，看不下去，但是记得好像有日志开关，查看有没有日志或者日志开关在哪里；
5. out目录下，查找soong的日志，从修改时间上大概可以猜出确定这几份；



6. 拉下日志查找蓝牙日志



7. 这里已经很明晰，调用的链路和脚本；

8. 阅读qva_bt.sh

	1. 需要执行的代码清单在qva_bt_source.txt里面；

	2. 如果是Android.bp，会在源路径加后缀.disable --> 不存在 --> 不复制；

	3. 复制时判断路径指定的代码与目【标路径的代码是否相同 --> 不同就复制过去；
