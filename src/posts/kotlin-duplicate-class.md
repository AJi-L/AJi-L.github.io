---
title: "Kotlin 版本冲突报错 Duplicate class"
date: 2025-10-10
tags: ["Kotlin", "Gradle", "报错排查"]
summary: "问题 本地编译SystemUI的时候，Android Studio报错 解决办法： build.gradle添加"
draft: false
visibility: public
---

#### 问题

本地编译SystemUI的时候，Android Studio报错
![](/images/kotlin-duplicate-class/Pasted%20image%2020250320101838.png)

```xml
Duplicate class kotlin.collections.jdk8.CollectionsJDK8Kt found in modules kotlin-stdlib-1.8.22 (org.jetbrains.kotlin:kotlin-stdlib:1.8.22) and kotlin-stdlib-jdk8-1.6.0 (org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.6.0)
Duplicate class kotlin.internal.jdk7.JDK7PlatformImplementations found in modules kotlin-stdlib-1.8.22 (org.jetbrains.kotlin:kotlin-stdlib:1.8.22) and kotlin-stdlib-jdk7-1.6.0 (org.jetbrains.kotlin:kotlin-stdlib-jdk7:1.6.0)
Duplicate class kotlin.internal.jdk8.JDK8PlatformImplementations found in modules kotlin-stdlib-1.8.22 (org.jetbrains.kotlin:kotlin-stdlib:1.8.22) and kotlin-stdlib-jdk8-1.6.0 (org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.6.0)
Duplicate class kotlin.io.path.ExperimentalPathApi found in modules kotlin-stdlib-1.8.22 (org.jetbrains.kotlin:kotlin-stdlib:1.8.22) and kotlin-stdlib-jdk7-1.6.0 (org.jetbrains.kotlin:kotlin-stdlib-jdk7:1.6.0)
Duplicate class kotlin.io.path.PathRelativizer found in modules kotlin-stdlib-1.8.22 (org.jetbrains.kotlin:kotlin-stdlib:1.8.22) and kotlin-stdlib-jdk7-1.6.0 (org.jetbrains.kotlin:kotlin-stdlib-jdk7:1.6.0)
Duplicate class kotlin.io.path.PathsKt found in modules kotlin-stdlib-1.8.22 (org.jetbrains.kotlin:kotlin-stdlib:1.8.22) and kotlin-stdlib-jdk7-1.6.0 (org.jetbrains.kotlin:kotlin-stdlib-jdk7:1.6.0)
Duplicate class kotlin.io.path.PathsKt__PathReadWriteKt found in modules kotlin-stdlib-1.8.22 (org.jetbrains.kotlin:kotlin-stdlib:1.8.22) and kotlin-stdlib-jdk7-1.6.0 (org.jetbrains.kotlin:kotlin-stdlib-jdk7:1.6.0)
Duplicate class kotlin.io.path.PathsKt__PathUtilsKt found in modules kotlin-stdlib-1.8.22 (org.jetbrains.kotlin:kotlin-stdlib:1.8.22) and kotlin-stdlib-jdk7-1.6.0 (org.jetbrains.kotlin:kotlin-stdlib-jdk7:1.6.0)
Duplicate class kotlin.jdk7.AutoCloseableKt found in modules kotlin-stdlib-1.8.22 (org.jetbrains.kotlin:kotlin-stdlib:1.8.22) and kotlin-stdlib-jdk7-1.6.0 (org.jetbrains.kotlin:kotlin-stdlib-jdk7:1.6.0)
Duplicate class kotlin.jvm.jdk8.JvmRepeatableKt found in modules kotlin-stdlib-1.8.22 (org.jetbrains.kotlin:kotlin-stdlib:1.8.22) and kotlin-stdlib-jdk8-1.6.0 (org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.6.0)
Duplicate class kotlin.random.jdk8.PlatformThreadLocalRandom found in modules kotlin-stdlib-1.8.22 (org.jetbrains.kotlin:kotlin-stdlib:1.8.22) and kotlin-stdlib-jdk8-1.6.0 (org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.6.0)
Duplicate class kotlin.streams.jdk8.StreamsKt found in modules kotlin-stdlib-1.8.22 (org.jetbrains.kotlin:kotlin-stdlib:1.8.22) and kotlin-stdlib-jdk8-1.6.0 (org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.6.0)
Duplicate class kotlin.streams.jdk8.StreamsKt$asSequence$$inlined$Sequence$1 found in modules kotlin-stdlib-1.8.22 (org.jetbrains.kotlin:kotlin-stdlib:1.8.22) and kotlin-stdlib-jdk8-1.6.0 (org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.6.0)
Duplicate class kotlin.streams.jdk8.StreamsKt$asSequence$$inlined$Sequence$2 found in modules kotlin-stdlib-1.8.22 (org.jetbrains.kotlin:kotlin-stdlib:1.8.22) and kotlin-stdlib-jdk8-1.6.0 (org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.6.0)
Duplicate class kotlin.streams.jdk8.StreamsKt$asSequence$$inlined$Sequence$3 found in modules kotlin-stdlib-1.8.22 (org.jetbrains.kotlin:kotlin-stdlib:1.8.22) and kotlin-stdlib-jdk8-1.6.0 (org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.6.0)
Duplicate class kotlin.streams.jdk8.StreamsKt$asSequence$$inlined$Sequence$4 found in modules kotlin-stdlib-1.8.22 (org.jetbrains.kotlin:kotlin-stdlib:1.8.22) and kotlin-stdlib-jdk8-1.6.0 (org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.6.0)
Duplicate class kotlin.text.jdk8.RegexExtensionsJDK8Kt found in modules kotlin-stdlib-1.8.22 (org.jetbrains.kotlin:kotlin-stdlib:1.8.22) and kotlin-stdlib-jdk8-1.6.0 (org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.6.0)
Duplicate class kotlin.time.jdk8.DurationConversionsJDK8Kt found in modules kotlin-stdlib-1.8.22 (org.jetbrains.kotlin:kotlin-stdlib:1.8.22) and kotlin-stdlib-jdk8-1.6.0 (org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.6.0)
```

#### 解决办法：

build.gradle添加

```xml
    implementation(platform("org.jetbrains.kotlin:kotlin-bom:1.8.10"))
```
