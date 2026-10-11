---
title: "Repo sync 报错 Failing Repos（-j1 --fail-fast）"
date: 2025-10-08
tags: ["repo", "编译", "报错排查"]
summary: "报错 处理 1. 删除repo fail的文件夹， 重新repo sync即可； Preferences 1. master分支仓库更新方法 try re running with \" j1 fail fast\" to exit at t "
draft: false
visibility: public
---

#### 报错
![](/images/repo-sync-failing/Pasted%2520image%252020250320101731.png)
```sh
	clang-3289846/lib64/clang/3.8/include/mm3dnow.h
	clang-32898
Aborting
error: prebuilts/clang/host/linux-x86/: platform/prebuilts/clang/host/linux-x86 checkout 822e367c6d8007296d01b87fa18b187257c2be0f
error: Cannot checkout platform/prebuilts/clang/host/linux-x86
Checking out: 100% (1423/1423), done in 31.598s
error: Unable to fully sync the tree
error: Checking out local projects failed.
Failing repos:
device/google/sunfish-kernel
prebuilts/misc
prebuilts/abi-dumps/vndk
prebuilts/clang/host/linux-x86
prebuilts/rust
Try re-running with "-j1 --fail-fast" to exit at the first error.
================================================================================
Repo command failed due to the following `SyncError` errors:
device/google/sunfish-kernel checkout 02079225c56fa70a0b729a6c5eae909e848a2e5e
platform/prebuilts/misc checkout 83065adae342205df04abe16bb1b46527ce08795
platform/prebuilts/abi-dumps/vndk checkout 67cbeb44c901c5c41b75b8dc42aa893c583d9b74
platform/prebuilts/clang/host/linux-x86 checkout 822e367c6d8007296d01b87fa18b187257c2be0f
platform/prebuilts/rust checkout cec82598fd463dc3977e0245599bf52706e3688c
root@xxx-virtual-machine:/home/user/android/AOSP#
root@xxx-virtual-machine:/home/user/android/AOSP#
root@xxx-virtual-machine:/home/user/android/AOSP# rm -rf device/google/sunfish-
sunfish-kernel/   sunfish-sepolicy/
root@xxx-virtual-machine:/home/user/android/AOSP# rm -rf device/google/sunfish-kernel/
root@xxx-virtual-machine:/home/user/android/AOSP# rm -rf prebuilts/misc/
root@xxx-virtual-machine:/home/user/android/AOSP# rm -rf prebuilts/abi-dumps/vndk/
root@xxx-virtual-machine:/home/user/android/AOSP# rm -rf prebuilts/clang/host/linux-x86/
root@xxx-virtual-machine:/home/user/android/AOSP# rm -rf prebuilts/runtime/
root@xxx-virtual-machine:/home/user/android/AOSP# rm -rf prebuilts/r
r8/                     remoteexecution-client/ rust/
root@xxx-virtual-machine:/home/user/android/AOSP# rm -rf prebuilts/rust/
root@xxx-virtual-machine:/home/user/android/AOSP# repo sync -c -j8
Fetching: 100% (1423/1423), done in 26.893s
Updating files: 100% (1007/1007), done.xternal/rust/crates/lru-cacheUpdating files: 100% (1007/1007)
```

#### 处理

1. 删除repo fail的文件夹， 重新repo sync即可；

#### Preferences

1. [master分支仓库更新方法_try re-running with "-j1 --fail-fast" to exit at t-CSDN博客](https://blog.csdn.net/weixin_44205232/article/details/134192193)
