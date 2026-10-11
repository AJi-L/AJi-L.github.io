---
title: "CarLauncher 无法显示壁纸问题解决"
date: 2025-10-08
tags: ["CarLauncher", "壁纸"]
summary: "Reason & Steps Reason: 检查壁纸服务是否运行 根据源码和日志查看不运行的原因 分析 1. 通过服务列表查看壁纸服务是否运行 2. 通过源码发现 system server通过判断config enableWallpap"
draft: false
visibility: public
---

#### Reason & Steps

Reason:
检查壁纸服务是否运行 -- 根据源码和日志查看不运行的原因

#### 分析

1. 通过服务列表查看壁纸服务是否运行

![](/images/carlauncher-wallpaper/Pasted%2520image%252020250317093814.png)

```sh
service list | grep wall -i
```

2. 通过源码发现

- system_server通过判断config_enableWallpaperService是否为true决定是否拉起WallpaperManagerService；

![](/images/carlauncher-wallpaper/Pasted%2520image%252020250317093822.png)

- 查找config_enableWallpaperService配置，发现在图片以下地方都有存在此配置；

![](/images/carlauncher-wallpaper/Pasted%2520image%252020250317093829.png)

```sh
./frameworks/base/core/res/res/values/symbols.xml:335
./frameworks/base/core/res/res/values/config.xml:1634 ---------------- 此处为framework的配置
./packages/services/Car/car_product/overlay/frameworks/base/core/res/res/values/config.xml:111 --------- 此为Automotive Car的配置，利用overlay机制覆盖原本framework的机制
```

3. logcat -v color -b system 查看wallpaper确定是否由于config原因无法起来

![](/images/carlauncher-wallpaper/Pasted%2520image%252020250317093836.png)
这里和上面代码的日志一致

#### 解决办法

1. 将上面config_enableWallpaperService相关配置改为true；
2. 通过make framework-res编译framework生成物；
3. 找到以下生成物，并替换到真机对应位置：

- out/target/product/msmnile_gvmq/system/framework/framework-res.apk
- out/target/product/msmnile_gvmq/system/product/overlay/framework-res__auto_generated_rro_product.apk

补充说明：
framework-res__auto_generated_rro_product.apk是framework-res.apk的Overlay的apk，属于overlay RRO(Runtime Resource Overlay)方式，因此仅改写framework-res是不够的，还需要将这里（重点是将这里）改写成true；
