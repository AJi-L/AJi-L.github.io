---
title: "告别 Lunch 菜单：Android 16 编译组合（Product-Release-Variant）"
date: 2025-12-29
tags: ["AOSP", "编译", "lunch", "Android16"]
summary: "告别 Lunch 菜单：详解 Android 16 全新编译组合 (Product Release Variant) Android16取消lunch menu显示 lunch combo的含义 lunch的combo一直由product,"
draft: false
visibility: public
---

# 告别 Lunch 菜单：详解 Android 16 全新编译组合 (Product Release Variant)

## Android16取消lunch menu显示

## lunch combo的含义
lunch的combo一直由product, release, variant三部分组成，分别代表产品、发布版本、变体。

product: 硬件/形态定义。决定了系统跑在什么硬件上（虚拟化还是真车）。
release: 功能开关配置。Trunk Stable 模式下的 Feature Flags 集合。
variant: 权限与调试等级。决定是否有 Root、是否开启调试日志。

### product
| 产品前缀/关键字                 | 详细含义                                 | 适用场景                                 |
|--------------------------|--------------------------------------|--------------------------------------|
| aosp_arm / arm64 / x86   | 通用的 Android 开源项目基础配置。                | 基础架构开发、验证 AOSP 核心功能。                 |
| aosp_cf_... (Cuttlefish) | Cuttlefish 虚拟设备。它是基于云的模拟器，支持高级特性。    | 座舱开发重点（cf_x86_64_auto），用于无硬件时的自动化测试。 |
| aosp_..._car / auto      | 专门为 Android Automotive (AAOS) 优化的配置。 | 车载系统开发，包含 CarService、座舱 UI 指标等。      |
| aosp_trout_...           | Trout 是虚拟化车载参考平台（基于 Virtio）。         | 车载座舱的虚拟化（Hypervisor）方案开发。            |
| sdk_...                  | 软件开发工具包相关产品。                         | 生成编译 Android SDK、模拟器镜像。              |
| gsi_... / csi_...        | Generic System Image (GSI) 通用系统镜像。   | 硬件兼容性测试（VTS/CTS-on-GSI）。             |
| mainline_...             | Mainline 模块化系统的镜像。                   | 针对 Project Mainline 模块的开发与调试。        |
| hikey / db845c           | 特定的开发板支持包（Vendor BSP）。               | 在特定的硬件参考板（如 960 板）上运行。               |
| module_...               | 针对特定编译模块的微型配置。                       | 只编译特定的 APEX 或独立模块。                   |
| ..._fullmte / hwasan     | 带有内存检测（MTE/HWASan）工具的配置。             | 专门用于排查内存泄漏、越界等内存安全问题。                |
| ..._pgagnostic           | 页面大小不可知（Page Agnostic）配置。            | 支持 16KB 页大小的内核适配测试（Android 15 重大更新）。 |

### release
| 字段名称              | 详细含义                                   | 备注                                      |
|-------------------|----------------------------------------|-----------------------------------------|
| trunk_staging     | 主干暂存版。包含所有正在开发中的、未合入稳定分支的功能。           | 开发者最常用，用于尝试最新特性。                        |
| aosp_current      | AOSP 当前标准配置。                           | 默认的开源发布配置。                              |
| ap1a / ap2a / ... | Android 14 (Android Purple) 相关的版本迭代快照。 | 字母 A 代表 Android 14。                     |
| bp1a / bp2a / ... | Android 15 (Android Black) 相关的版本迭代快照。  | 字母 B 代表 Android 15 (Vanilla Ice Cream)。 |
| QPR (e.g. ap3a)   | Quarterly Platform Release。            | 季度平台更新版本（例如 Android 15 QPR1）。           |

### variant
| 变体名称      | 权限与调试能力                                     | 适用场景                       |
|-----------|---------------------------------------------|----------------------------|
| eng       | 最高权限：默认开启 Root，adb 默认开启，启用所有调试日志，编译速度快。     | 纯内部开发、功能调测、快速迭代。           |
| userdebug | 中等权限：类似于 user 版但保留 Root 权限和部分调试功能，有性能监控。    | 系统工程师最常用。用于性能测试、实车联调、冒烟测试。 |
| user      | 生产环境：无 Root 权限，adb 受限，关闭所有调试开关，代码经过混淆和高度优化。 | 最终用户交付、OTA 更新、过 CTS 认证的版本。 |
