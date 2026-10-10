---
title: "运行报错：Signature|privileged 权限不在 privapp-permissions 白名单"
date: 2025-10-10
tags: ["Android", "权限", "privapp", "报错排查"]
summary: "Signature privileged permissions not in privapp permissions allowlist{com.android.car.carlauncher (systempriv appCarLaun"
draft: false
visibility: public
---

Signature privileged permissions not in privapp-permissions allowlist{com.android.car.carlauncher (systempriv-appCarLauncher.apk) android.permission.SET_WALLPAPER_COMPONENT}

![](/images/privapp-permissions/Pasted%20image%2020250320102029.png)

```bash
10-07 02:32:36.488 14748 14748 E System  : ******************************************
10-07 02:32:36.488 14748 14748 E System  : ************ Failure starting system services
10-07 02:32:36.488 14748 14748 E System  : java.lang.IllegalStateException: Signature|privileged permissions not in privapp-permissions allowlist: {com.android.car.carlauncher (/system/priv-app/CarLauncher.apk): android.permission.SET_WALLPAPER_COMPONENT}
10-07 02:32:36.488 14748 14748 E System  :      at com.android.server.pm.permission.PermissionManagerServiceImpl.onSystemReady(PermissionManagerServiceImpl.java:4447)
10-07 02:32:36.488 14748 14748 E System  :      at com.android.server.pm.permission.PermissionManagerService$PermissionManagerServiceInternalImpl.onSystemReady(PermissionManagerService.java:743)
10-07 02:32:36.488 14748 14748 E System  :      at com.android.server.pm.PackageManagerService.systemReady(PackageManagerService.java:4265)
10-07 02:32:36.488 14748 14748 E System  :      at com.android.server.SystemServer.startOtherServices(SystemServer.java:2811)
10-07 02:32:36.488 14748 14748 E System  :      at com.android.server.SystemServer.run(SystemServer.java:946)
10-07 02:32:36.488 14748 14748 E System  :      at com.android.server.SystemServer.main(SystemServer.java:668)
10-07 02:32:36.488 14748 14748 E System  :      at java.lang.reflect.Method.invoke(Native Method)
10-07 02:32:36.488 14748 14748 E System  :      at com.android.internal.os.RuntimeInit$MethodAndArgsCaller.run(RuntimeInit.java:552)
10-07 02:32:36.488 14748 14748 E System  :      at com.android.internal.os.ZygoteInit.main(ZygoteInit.java:959)
10-07 02:32:36.488 14748 14748 V SystemServerTiming: MakePackageManagerServiceReady took to complete: 41ms
--------- beginning of crash
10-07 02:32:36.489 14748 14748 E AndroidRuntime: *** FATAL EXCEPTION IN SYSTEM PROCESS: main
10-07 02:32:36.489 14748 14748 E AndroidRuntime: java.lang.IllegalStateException: Signature|privileged permissions not in privapp-permissions allowlist: {com.android.car.carlauncher (/system/priv-app/CarLauncher.apk): android.permission.SET_WALLPAPER_COMPONENT}
10-07 02:32:36.489 14748 14748 E AndroidRuntime:        at com.android.server.pm.permission.PermissionManagerServiceImpl.onSystemReady(PermissionManagerServiceImpl.java:4447)
10-07 02:32:36.489 14748 14748 E AndroidRuntime:        at com.android.server.pm.permission.PermissionManagerService$PermissionManagerServiceInternalImpl.onSystemReady(PermissionManagerService.java:743)
10-07 02:32:36.489 14748 14748 E AndroidRuntime:        at com.android.server.pm.PackageManagerService.systemReady(PackageManagerService.java:4265)
10-07 02:32:36.489 14748 14748 E AndroidRuntime:        at com.android.server.SystemServer.startOtherServices(SystemServer.java:2811)
10-07 02:32:36.489 14748 14748 E AndroidRuntime:        at com.android.server.SystemServer.run(SystemServer.java:946)
10-07 02:32:36.489 14748 14748 E AndroidRuntime:        at com.android.server.SystemServer.main(SystemServer.java:668)
10-07 02:32:36.489 14748 14748 E AndroidRuntime:        at java.lang.reflect.Method.invoke(Native Method)
10-07 02:32:36.489 14748 14748 E AndroidRuntime:        at com.android.internal.os.RuntimeInit$MethodAndArgsCaller.run(RuntimeInit.java:552)
10-07 02:32:36.489 14748 14748 E AndroidRuntime:        at com.android.internal.os.ZygoteInit.main(ZygoteInit.java:959)
10-07 02:32:36.490 14748 14748 I DropBoxManagerService: add tag=system_server_crash isTagEnabled=true flags=0x2
```

#### 解决办法：

在/etc/permisions/下找到privapp-permissions-platform.xml或privapp-permissions-qti.xml，自行添加权限；
