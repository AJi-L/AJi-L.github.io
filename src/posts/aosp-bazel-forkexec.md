---
title: "编译报错 fork/exec ./build/bazel/bin/bazel: no such file or directory"
date: 2025-10-10
tags: ["AOSP", "编译", "bazel", "报错排查"]
summary: "报错 解决办法： 参考： Android14之解决编译报错:bazel: no such file or directory(一百八十九) bazel之后找不到路径 CSDN博客 补充 20251010补充 + 最近发现，如果报错是baze"
draft: false
visibility: public
---

#### 报错

```bash
[ 50% 1/2] Creating Bazel symlink forest
Clang SA is not enabled
[100% 2/2] analyzing Android.bp files and generating ninja file at out/soong/build.ninja
FAILED: out/soong/build.ninja
cd "$(dirname "out/host/linux-x86/bin/soong_build")" && BUILDER="$PWD/$(basename "out/host/linux-x86/bin/soong_build")" && cd / &&  "$BUILDER"     --top "$TOP"     --soong_out "out/soong"     --out "out"     -o out/soong/build.ninja --bazel-mode --globListDir build --globFile out/soong/globs-build.ninja -t -l out/.module_paths/Android.bp.list --available_env out/soong/soong.environment.available --used_env out/soong/soong.environment.used.build Android.bp
Clang SA is not enabled
internal error: bazel command failed: fork/exec ./build/bazel/bin/bazel: no such file or directory
---command---
./build/bazel/bin/bazel --output_base=/home/user/8775/aosp_aosp/LINUX/android/out/bazel/output cquery deps(@soong_injection//mixed_builds:buildroot, 2) --profile=/home/user/8775/aosp_aosp/LINUX/android/out/bazel_metrics/cquery-buildroot_bazel_profile.gz --experimental_repository_disable_download --ui_event_filters=-INFO --noshow_progress --norun_validations --output=starlark --starlark:file=/home/user/8775/aosp_aosp/LINUX/android/out/soong/soong_injection/buildroot.cquery
---env---
aosp_BUILD_CONFIG=/home/user/8775/aosp_aosp/LINUX/android/out/aosp_BUILD_CONFIG/build_config.xml
OLDPWD=/home/user/8775/aosp_aosp/LINUX/android/out/host/linux-x86/bin
SDCLANG_SA_ENABLED=
SDCLANG_AE_CONFIG=/home/user/8775/aosp_aosp/LINUX/android/vendor/qcom/proprietary/common-noship/etc/sdclang.json
TOP=/home/user/8775/aosp_aosp/LINUX/android
SDCLANG_CONFIG=/home/user/8775/aosp_aosp/LINUX/android/vendor/qcom/proprietary/common/config/sdclang.json
PWD=/
TARGET_BOARD_PLATFORM=aosp
HOME=/home/user/8775/aosp_aosp/LINUX/android/out/bazel/bazelhome
PWD=/proc/self/cwd
BUILD_DIR=/home/user/8775/aosp_aosp/LINUX/android/out/soong
OUT_DIR=/home/user/8775/aosp_aosp/LINUX/android/out
BAZEL_DO_NOT_DETECT_CPP_TOOLCHAIN=1
---stderr---
---
11:03:07 soong bootstrap failed with: exit status 1

#### failed to build some targets (39 seconds) ####
```

#### 解决办法：

```bash
1.先清理中间文件
# make clean

2.再编译即可
# make -j12
```

#### 参考：

- [Android14之解决编译报错:bazel: no such file or directory(一百八十九)_bazel之后找不到路径-CSDN博客](https://unbroken.blog.csdn.net/article/details/136359646?spm=1001.2101.3001.6650.1&utm_medium=distribute.pc_relevant.none-task-blog-2%7Edefault%7EBlogCommendFromBaidu%7ECtr-1-136359646-blog-136682027.235%5Ev43%5Epc_blog_bottom_relevance_base1&depth_1-utm_source=distribute.pc_relevant.none-task-blog-2%7Edefault%7EBlogCommendFromBaidu%7ECtr-1-136359646-blog-136682027.235%5Ev43%5Epc_blog_bottom_relevance_base1&utm_relevant_index=2)

#### 补充

> 20251010补充

+ 最近发现，如果报错是bazel问题，平时编译也没问题的话，一般是Android目录被修改了。怀疑bazel的一些环境变量等等，跟Android目录有关。
