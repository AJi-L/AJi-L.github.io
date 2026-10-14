---
title: "【问题排查】CameraServer 导致无法开机"
date: 2025-10-10
tags: ["Android", "启动", "Camera"]
summary: "现象 黑屏，无法开机 原因 本质原因：CameraServer启动失败导致 日志"
draft: false
visibility: public
---

### 现象
黑屏，无法开机

### 原因
本质原因：CameraServer启动失败导致

### 日志
```
--------- beginning of crash
01-01 08:00:29.415   755   755 F linker  : CANNOT LINK EXECUTABLE "/system/bin/app_process64": "/system/lib64/lib-platform-compat-native-api.so" has bad ELF magic: bd4d2356
01-01 08:00:29.416   368   368 I hwservicemanager: getTransport: Cannot find entry android.system.net.netd@1.1::INetd/default in either framework or device VINTF manifest.
01-01 08:00:29.416   753   753 E HidlServiceManagement: Service android.system.net.netd@1.1::INetd/default must be in VINTF manifest in order to register/get.
01-01 08:00:29.416   753   753 E Netd    : Unable to start HIDL NetdHwService: -2147483648
01-01 08:00:29.416   753   753 I netd    : Registering NetdHwService: 7665us
01-01 08:00:29.416   753   753 I netd    : Netd started in 182666us
01-01 08:00:30.532   788   788 D vdc     : Waited 0ms for vold
01-01 08:00:29.676   794   794 I wificond: wificond is starting up...
01-01 08:00:29.688   361   799 W libc    : Unable to set property "ctl.interface_start" to "aidl/android.hardware.net.nlinterceptor.IInterceptor/default": error code: 0x20
01-01 08:00:29.701   789   789 F linker  : CANNOT LINK EXECUTABLE "/system/bin/audioserver": "/system/lib64/lib-platform-compat-native-api.so" has bad ELF magic: bd4d2356
01-01 08:00:29.704   791   791 F linker  : CANNOT LINK EXECUTABLE "/system/bin/cameraserver": "/system/lib64/lib-platform-compat-native-api.so" has bad ELF magic: bd4d2356
```
