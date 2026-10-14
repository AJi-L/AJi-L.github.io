---
title: "【工具环境】Android Studio 导入 AOSP 源码"
date: 2025-10-08
tags: ["AOSP", "AndroidStudio", "调试"]
summary: "编译AOSP 生成工程文件 执行成功后，在AOSP根目录生成 如果是在服务器上运行AS，性能足够，这一步就可以了，通过Android Studio打开android.ipr即可 修改android.iml 1. 增加excludeFolde"
draft: false
visibility: public
---

### 编译AOSP
```bash
source envsetup.sh
lunch <combo>
m -j 64
```

### 生成工程文件
```bash
source build/envsetup.sh
make idegen
# 或者 mmm development/tools/idegen/

# 如果提示权限问题，请用sudo执行下述命令
development/tools/idegen/idegen.sh
```

执行成功后，在AOSP根目录生成
```bash
android.iml # 清单文件
android.ipr # 在Android studio中打开这个文件，导入源码工程
```
> 如果是在服务器上运行AS，性能足够，这一步就可以了，通过Android Studio打开android.ipr即可

### 修改android.iml

1. 增加excludeFolder列表，排除不需要的源码路径，这样可以加快导入和创建文件索引的速度。在.iml文件中有少了的excludeFolder项；
```xml
<excludeFolder url="file://$MODULE_DIR$/abi"/>
<excludeFolder url="file://$MODULE_DIR$/art"/>
<excludeFolder url="file://$MODULE_DIR$/bionic"/>
<excludeFolder url="file://$MODULE_DIR$/bootable"/>
<excludeFolder url="file://$MODULE_DIR$/build"/>
<excludeFolder url="file://$MODULE_DIR$/cts"/>
<excludeFolder url="file://$MODULE_DIR$/dalvik"/>
<excludeFolder url="file://$MODULE_DIR$/developers"/>
<excludeFolder url="file://$MODULE_DIR$/development"/>
<!-- <excludeFolder url="file://$MODULE_DIR$/device"/> -->
<excludeFolder url="file://$MODULE_DIR$/docs"/>
<excludeFolder url="file://$MODULE_DIR$/external"/>
<!-- <excludeFolder url="file://$MODULE_DIR$/hardware"/> -->
<excludeFolder url="file://$MODULE_DIR$/kernel"/>
<!-- <excludeFolder url="file://$MODULE_DIR$/libcore"/> -->
<excludeFolder url="file://$MODULE_DIR$/libnativehelper"/>
<excludeFolder url="file://$MODULE_DIR$/ndk"/>
<excludeFolder url="file://$MODULE_DIR$/out"/>
<excludeFolder url="file://$MODULE_DIR$/pdk"/>
<excludeFolder url="file://$MODULE_DIR$/platform_testing"/>
<excludeFolder url="file://$MODULE_DIR$/prebuilts"/>
<excludeFolder url="file://$MODULE_DIR$/sdk"/>
<!-- <excludeFolder url="file://$MODULE_DIR$/system"/> -->
<excludeFolder url="file://$MODULE_DIR$/tools"/>
<!-- <excludeFolder url="file://$MODULE_DIR$/vendor"/> -->
<excludeFolder url="file://$MODULE_DIR$/toolchain"/>
<excludeFolder url="file://$MODULE_DIR$/compatibility"/>
<excludeFolder url="file://$MODULE_DIR$/compatibility"/>
<excludeFolder url="file://$MODULE_DIR$/test"/>
```

2. 删除所有<orderEntry type="module-library">...</orderEntry>项。这些项是引用的源码中编译出来的jar包，如果保留，在浏览过程中查看类型跳转到这些jar中的class文件，而不是源码java文件。删除后，则可以直接跳转到源码文件。
>这些设置也可以在Android studio：project structure - project settings - modules - dependencies中修改，速度比较慢，不如直接编辑.iml文件方便

```xml
<orderEntry type="module-library">
  <library>
    <CLASSES>
      <root url="jar://$MODULE_DIR$/./aosp/out/target/product/prodname/system/framework/locksettings.jar!/" />
    </CLASSES>
    <JAVADOC />
    <SOURCES />
  </library>
</orderEntry>
<orderEntry type="module-library">
  <library>
    <CLASSES>
      <root url="jar://$MODULE_DIR$/./aosp/out/target/product/prodname/system/framework/framework.jar!/" />
    </CLASSES>
    <JAVADOC />
    <SOURCES />
  </library>
```
---
参考：[Android studio导入Android源码（AOSP Android 14](https://blog.csdn.net/yinminsumeng/article/details/131144369)
