---
title: "【工具环境】AOSP 编译及 AVD 使用"
date: 2026-06-22
tags: ["AOSP", "AVD", "编译"]
summary: "AVD编译与制作 下载 Download 按照官网源码下载流程，下载代码，这里将main换成想要的分支名，目前拉的是android14 release； 编译 Build 1. lunch有很多选项，选择SDK开头的就可以，后面架构具体看本"
draft: false
visibility: public
---

# AVD编译与制作

## 下载 Download

按照官网源码下载流程，下载代码，这里将main换成想要的分支名，目前拉的是android14-release；

```bash
repo init --partial-clone -b main -u https://android.googlesource.com/platform/manifest
repo sync -c -j8
```

## 编译 Build

1. lunch有很多选项，选择SDK开头的就可以，后面架构具体看本地电脑/工作站的芯片架构，md是指多屏；

```bash
73. sdk_car_arm-userdebug
74. sdk_car_arm64-userdebug
75. sdk_car_md_x86_64-userdebug
76. sdk_car_portrait_x86_64-userdebug
77. sdk_car_x86-userdebug
78. sdk_car_x86_64-userdebug
79. sdk_pc_x86_64-userdebug
```

1. 敲m，等待编译完成；
2. 编译AVD镜像

```bash
make emu_img_zip // Android13及以上
// 会生成sdk-repo-linux-system-images-eng.[username]].zip文件

make -j32 sdk sdk_repo // Android13以下
// 会在out/host/linux-x86/sdk/sdk_phone_x86生成
// sdk-repo-linux-system-images-eng.[username].zip
// repo-sys-img.xml
```

> 参考：https://source.android.com/docs/setup/test/avd#share （注意不要看中文网页，看英文网页，因为里面有更新不及时的部分）

# AVD在Linux的使用

MobaXterm等Shell工具连接后，调用编译环境脚本、lunch <combo>、然后就可以调用emulaor了；

emulator能在本地显示，但是相关镜像的数据都是在服务器的，所以如果在外面网络不好的情况下，投屏会有些慢；

```bash
source build/envsetup.sh
lunch sdk_car_x86_64-userdebug
emulator -writable-system &
// -writable-system 是保证可以进行adb root和adb remount，以便我们调试系统应用
```

![](/images/aosp-compile-avd/lu193925am2_tmp_290cbc55.png)

# AVD在Windows本地的使用

1. 导出镜像到本地

因为我们用的是Android14，通过WinSCP将sdk-repo-linux-system-images-eng.[username]].zip下载到本地，并解压；

里面是结构树如下

```bash
sdk-repo-linux-system-images-eng
└─x86_64
    └─data
        ├─media
        │  └─0
        │      └─test
        │          └─CtsMediaTestCases-1.4
        └─misc
            ├─apns
            ├─emulator
            │  └─config
            ├─gceconfigs
            └─modem_simulator
                └─etc
                    └─modem_simulator
                        └─files
```

2. 然后用本地emulator打开镜像，目前用的是参考1的方案1；

先在AS自己建一个Virtual Device， 自己建立一个虚拟镜像；

3. ~~星历问题usedInFix排查拷贝自己的镜像文件夹下的x86_64文件夹，替换 Android\Sdk\system-images\android-34\google_apis\ 下的x86_64文件夹；~~~~这里如果没有android-34，就自己建立一个，Android版本跟镜像版本一致就行；~~

4. 命令行打开（相关路径自行修改一下）， -avd后面的参数名就是Android Studio镜像设置的Virtual Device的名称；

```bash
（注意一定要写-writable-system，否则无法调试system应用，只能验证一些简单的app）
C:\Users\username\AppData\Local\Android\Sdk\emulator\emulator.exe -avd Nexus -sysdir C:\Users\username\AppData\Local\Android\Sdk\system-images\android-34\google_apis\x86_64 -writable-system
```

5. 然后就可以adb root、adb remount等等自己的操作啦

> 参考1：https://blog.csdn.net/obana/article/details/134913847
>
> 参考2：https://blog.csdn.net/chenzili870305/article/details/140543537

# 后续要优化和研究的方向

1. 	导入到本地emulator镜像的方式其实不是很规范，后续可以再看下；
2. 	Android记得好像可以搭建在线的镜像（其实这个放服务器也算是了），后面可以做一个公用的镜像，将本地的代码放在在线镜像，方便合作，也方便展示给客户等等；
3. 	可以基于sdkxxx这个，新建一个分支，或者直接基于此分支，拉公司内部的代码，同步出镜像或更新在线镜像；

# 注意

1. 	参数要写对；
2. 	因为是原生镜像，使用的时候需要自己wm size、wm density重新设置尺寸和像素密度；
3. 	因为是原生镜像，在调试应用的时候，可能涉及到相关的依赖也得更新；例如更新CarLauncher，因为涉及到壁纸更新接口，也需要push /etc/permissions/com.android.car.carlauncher.xml;
