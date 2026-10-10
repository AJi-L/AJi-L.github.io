---
title: RK3588 系统开发：从源码到烧录的流程梳理
date: 2026-10-07
tags: [RK3588, Android, 车机]
summary: 把 RK3588（Android 15）编译、打包、烧录、OTA 的整条链路梳理成一张流程清单。
visibility: public
---

## 环境

- 代码：WSL Ubuntu 下的 AOSP 检出
- SDK：Rockchip Android 15 Express SDK
- 工具：`upgrade_tool`（Linux）/ RKDevTool（Windows）

## 编译

```bash
source build/envsetup.sh
lunch <target>
./build.sh -j$(nproc)
```

## 打包与镜像

常见产物：`boot.img`、`super.img`、`update.img`。

## 烧录

- 分区烧录：`upgrade_tool di -p` 写分区
- 整包：`upgrade_tool uf update.img`
- 免按键进入烧录模式：优先用 `adb reboot loader` / `reboot loader`

## OTA

```bash
./mkimage.sh ota
```

把 OTA 包放服务器，设备端远程升级或 TF 卡本地升级。

> 待补：自动化测试接入（编译冒烟 + 开机自检）。
