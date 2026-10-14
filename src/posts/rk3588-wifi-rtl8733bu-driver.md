---
title: "RK3588 WiFi 打不开（RTL8733BU 驱动缺失）"
date: 2026-10-15
tags: ["RK3588", "WiFi", "驱动", "kernel", "Android", "bringup"]
summary: "RK3588 车机板设置里 WiFi 打不开，/sys/class/net 里没有 wlan0。查到板载是 RTL8733BU USB WiFi（0bda:b733，设备树 wifi_chip_type=rtl8733bu），但 SDK 树"
draft: false
visibility: public
---

# RK3588 WiFi 打不开（RTL8733BU 驱动缺失）

## 问题描述

RK3588 车机板（ATK-DLRK3588 / 自建产品 `AJi3588_CAR`，Android 15 + kernel 6.1.118，userdebug）**设置里 WiFi 打不开**，开关点不动、也搜不到网络。

设备侧看，网卡根本没有：

```bash
$ adb shell "ls /sys/class/net"
can0  dummy0  eth0  eth1  ifb0  ifb1  ip6_vti0  ip6tnl0  ip_vti0  lo  sit0
# 没有 wlan0
```

`wificond` 在跑、`dumpsys wifi` 也正常，但拿不到接口，整条 WiFi 链路停摆。

## 分析

**第一步：确认驱动有没有加载。**

```bash
$ adb shell "lsmod"
bcmdhd               2191360  0
r8168                 598016  0
```

`bcmdhd` 是**博通（Broadcom AP6xxx）**的驱动，板子上根本没有这类芯片，所以它加载了却关联不到任何设备。

**第二步：查板上实际是什么芯片。**（USB + 设备树两侧交叉验证）

```bash
$ adb shell "for d in /sys/bus/usb/devices/*/; do echo \"\$(cat \$d/idVendor):\$(cat \$d/product)\"; done"
...
0bda:b733  [Realtek]  802.11n  WLAN Adapter      # ← Realtek RTL8733BU
```

```bash
$ adb shell "cat /proc/device-tree/wireless-wlan/wifi_chip_type"
rtl8733bu
```

设备树（`kernel-6.1/arch/arm64/boot/dts/rockchip/rk3588-atk-evb7-lp4.dtsi` 里 `wifi_chip_type = "rtl8733bu"`）与真实硬件**一致**，说明设备树是对的。

**第三步：看 SDK 的选型与驱动目录。**

```bash
$ grep -n 'BOARD_CONNECTIVITY' device/rockchip/rk3588/wifi_bt.mk
BOARD_CONNECTIVITY_VENDOR := Broadcom
BOARD_CONNECTIVITY_MODULE := ap6xxx          # ← 选型就是错的
```

```bash
$ ls external/wifi_driver/
aic8800  bcmdhd  ea6621q  infineon  Makefile  rtl8822cs  rtl8852bs  swt6621s  wifi.load
# 有 rtl8822cs / rtl8852bs，唯独没有 rtl8733bu —— 根因就在这里
```

```bash
$ ls /vendor/lib/modules        # 设备侧同样没有 8733bu.ko
8822cs.ko  8852bs.ko  aic8800_*.ko  bcmdhd.ko  cyw88459.ko  r8168.ko  skw*.ko  swt6621s_wifi.ko
```

结论：**板子是 RTL8733BU，但 SDK 里既没有这颗芯片的驱动源码，构建选型还是 Broadcom**，于是开机只加载 bcmdhd → 没有 wlan0。

**顺带排除了其它可能**：`bcmdhd` 的 dmesg 只有 `loading out-of-tree module taints kernel` / `_dhd_module_init: in Dongle Host Driver`，没有任何 SDIO/PCIe 报错——因为板上压根没有博通芯片可枚举。

## 解决思路

候选方案：

1. **把设备树改成 Broadcom** —— 不行：板上就是 RTL8733BU，改设备树只会更糟。
2. **拿官方 ATK 镜像里现成的 `8733bu.ko`** —— 试了，**不行**：官方镜像是 Android 13 + **kernel 5.10**，模块 `vermagic=5.10.157`，而本板是 6.1.118，内核 ABI 差一个大版本，不能 insmod。
3. **从正点原子 android13 SDK 里取驱动源码** —— 也走了不通：那个 `atk-rk3588_androidT_release_v1.2_20250104.tgz` 解开后**只有 `.repo`、没有工作区**，而其中的 `external/wifi_driver.git` 是空的（无 commit、pack 里没有 8733）。镜像里那个 ko 的构建路径 `/home/user/android/atk-rk3588_androidT_release_v1.2_20250104/external/wifi_driver/rtl8733bu/...` 说明源码曾在那个 SDK 里，但已不在磁盘。
4. **从 GitHub 取原厂驱动源码**（最终采用）：`https://github.com/ROCKNIX/RTL8733BU`，结构与 RK 的 `rtl8822cs/rtl8852bs` 完全同源（core/hal/os_dep/platform），`hal/rtl8733b/hal8733b_fw.c` 里**固件是内嵌的**，不需要外部 bin。

实际改动：

```bash
# 1) 放进树里
external/wifi_driver/rtl8733bu/            # 整份驱动源码

# 2) 注册到 external/wifi_driver/Makefile
CONFIG_RTL8733BU = m
export CONFIG_RTL8733BU
obj-$(CONFIG_RTL8733BU) += rtl8733bu/

# 3) 修驱动的 Android 编译门槛（见下「遇到的坑」）
#    rtl8733bu/Makefile:  CONFIG_RTW_ANDROID = 0  ->  15

# 4) 用树内 clang 编（对 6.1.118）
cd external/wifi_driver
make CROSS_COMPILE=aarch64-linux-gnu- LLVM=1 LLVM_IAS=1 ARCH=arm64 \
     -C ../../kernel-6.1 M=$PWD/rtl8733bu CONFIG_RTL8733BU=m modules -j16
```

产物与内核版本核对：

```bash
$ strings -a rtl8733bu/8733bu.ko | grep vermagic
vermagic=6.1.118 SMP preempt mod_unload modversions aarch64     # ← 与板子完全一致
```

部署到板子（`/vendor` 是 overlay，注意命名空间与重启）：

```bash
adb root && adb wait-for-device
adb remount                     # 启用 overlayfs
adb reboot                      # ← 必须重启一次 overlay 才真正生效
adb root && adb remount
adb push 8733bu.ko /vendor/lib/modules/8733bu.ko
adb shell "echo 8733bu.ko >> /vendor/lib/modules/modules.load"
```

验证：

```bash
$ adb shell "insmod /vendor/lib/modules/8733bu.ko; ls /sys/class/net"
... wlan0  p2p0                # ← 接口出来了

$ adb shell dmesg | tail -1
usbcore: registered new interface driver rtl8733bu

$ adb shell "svc wifi enable; cmd wifi connect-network MAX wpa2 <密码已脱敏>"
$ adb shell "cmd wifi status"
Wifi is connected to "MAX"
  SSID: "MAX"  IP: 192.168.1.100/24  RSSI: -44  Link speed: 150Mbps  Supplicant: COMPLETED

$ adb shell "ping -c 2 223.5.5.5"
2 packets transmitted, 2 received, 0% packet loss            # ← 能上公网
```

## 常见原理与分析思路

- **RK 平台的 WiFi 模块不是全部写进 `modules.load` 里开机 load 的**。看 `device/rockchip/common/rootdir/init.insmod.sh`：它会遍历 `modules.load`，但**凡是名字出现在 `/vendor/etc/wifi/wifi.load` 里的模块一律 `continue` 跳过**，交给 WiFi HAL 在需要时按 **设备树的 `wifi_chip_type`** 去选对应驱动 insmod。所以"驱动装在哪 + 选型对不对 + 设备树芯片名"三者必须自洽。
- **`/vendor/lib/modules` 在镜像里往往是符号链接**：在官方 `vendor.img` 里 `debugfs` 会报 `-l: Ext2 inode is not a directory`，真实文件在 **`vendor_dlkm`** 分区（`/lib/modules/`）。找模块时别只解 vendor.img。
- **`vermagic` 是硬门槛**：跨大版本（5.10 → 6.1）的预编译 `.ko` 一律不能用，必须用目标内核的头文件重新编译。
- **车机板 WiFi 出问题先分三层看**：HAL/框架（`dumpsys wifi`、`wificond`）→ 驱动（`lsmod`、`dmesg`）→ 硬件与设备树（USB/SDIO 枚举、`/proc/device-tree/.../wifi_chip_type`）。这三层里"驱动选型与硬件不符"是最常见的坑。

### 分析方法（命令）

```bash
# 1. 有没有接口
adb shell "ls /sys/class/net"

# 2. 加载了哪些模块（对比预期芯片）
adb shell "lsmod"; adb shell "ls /vendor/lib/modules"

# 3. 硬件到底是什么芯片（USB / SDIO）
adb shell "for d in /sys/bus/usb/devices/*/; do cat \$d/idVendor; cat \$d/idProduct; cat \$d/product; done"
adb shell "for d in /sys/bus/sdio/devices/*/; do cat \$d/vendor; cat \$d/device; done"

# 4. 设备树声明的芯片类型
adb shell "cat /proc/device-tree/wireless-wlan/wifi_chip_type"

# 5. SDK 选型与驱动目录
grep -n 'BOARD_CONNECTIVITY' device/rockchip/rk3588/wifi_bt.mk
ls external/wifi_driver/

# 6. 模块加载机制
cat device/rockchip/common/rootdir/init.insmod.sh

# 7. 预编译 ko 的内核版本（判断能不能直接用）
strings -a 8733bu.ko | grep vermagic

# 8. 从镜像里抠模块（vendor 里的 /lib/modules 是链接 -> 去 vendor_dlkm 分区找）
out/host/linux-x86/bin/lpunpack super.raw.img out
debugfs -R "ls -l /lib/modules" out/vendor_dlkm.img
debugfs -R "dump /lib/modules/8733bu.ko /tmp/8733bu.ko" out/vendor_dlkm.img
```

## 遇到的坑

1. **编译直接 `#error` 挡住**：

   ```
   external/wifi_driver/rtl8733bu/include/drv_conf.h:84:3: error:
     "Set CONFIG_RTW_ANDROID in Makefile while build with Android Common Kernel!!"
   ```

   原因是 Realtek 驱动在 Android common kernel 下要求定义 `CONFIG_RTW_ANDROID`（会转成 `-DCONFIG_RTW_ANDROID=xx`）。ROCKNIX 这份 Makefile 里写的是 `CONFIG_RTW_ANDROID = 0`，改成 `15` 后通过（RK 自带的 rtl8822cs/rtl8852bs 都是 `CONFIG_RTW_ANDROID = 15`）。

2. **单独 `M=<驱动目录>` 编不出来**：`obj-$(CONFIG_RTL8733BU)` 依赖该变量，父 `external/wifi_driver/Makefile` 里的 `export CONFIG_RTL8733BU = m` 不生效时 kbuild 只会跑 MODPOST、不产出 `.ko`。命令里显式带上 `CONFIG_RTL8733BU=m` 才编得出来。

3. **`adb root` + `remount` 后 push 静默失败**：`adb root` 会重启 adbd，它不在 remount 命名空间里，往 `/vendor` 写的文件落不下去（报 `1 file pushed` 但设备上还是旧内容）。正确顺序是 `adb root` → `adb wait-for-device` → `adb remount` → **重启一次**（overlayfs 需要 reboot 才激活）→ 再 `adb root` + `adb remount` → 然后 push。整包烧录会把 overlay 冲掉，之后要重新 remount。

4. **被"官方镜像里有 ko"骗过一次**：`Image-ATK_DLRK3588/super.img` 里确实有 `8733bu.ko`，一度以为直接拿来就能用，结果 `vermagic=5.10.157`（那是 Android 13 的镜像），和 6.1.118 不匹配。

5. **正点原子的 android13 SDK tarball 是"只有 `.repo` 的镜像"**：`tar -tzf` 里 63032 个 project-objects，但**没有工作区文件**；`external/wifi_driver.git` 解开后 `refs/heads/master` 是空的。想从里面取源码必须先 `repo`/`git` 把工作区 checkout 出来，且那个项目本身就是空包。

## 其他

- **永久化（还没做完）**：驱动源码 + `Makefile` 入口已经进了树（`external/wifi_driver/rtl8733bu/` + `obj-$(CONFIG_RTL8733BU) += rtl8733bu/`），`build.sh` 构建 `external/wifi_driver` 时会一并编译并刷新 `wifi.load`，所以**下次整包编译烧录会自带这个驱动**；当前板子上只是 overlay 生效，`update.img` 里还没有。
- dmesg 有一条非致命警告：`Direct firmware load for PHY_REG_PG.txt failed with error -2` —— 可选的发射功率校准表，缺失时驱动用默认值（实测信号 -44dBm 正常），要校准可再补这个文件。
- 参考：`https://github.com/ROCKNIX/RTL8733BU`（原厂驱动）；RK 自家同类驱动的写法可对照 `external/wifi_driver/rtl8822cs/Makefile`。
