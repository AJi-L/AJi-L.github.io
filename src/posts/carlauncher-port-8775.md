---
title: "8775 CarLauncher 移植（依赖分析与导入）"
date: 2025-10-09
tags: ["CarLauncher", "依赖分析", "移植"]
summary: "Step 1. Anaylyze the dependencies and draw a dependencies tree; 分析模块依赖，并画出依赖结构； 2. Import or new Modules from the smalle"
draft: false
visibility: public
---

#### Step

1. Anaylyze the dependencies and draw a dependencies tree;
    分析模块依赖，并画出依赖结构；
2. Import or new Modules from the smallest unit;
    从最小模块（没有依赖或者尽可能少依赖的）导入；
3. Make sure every modules could be build and run correctly;
    保证每个模块都能正确编译和运行；
4. Continue import next smallest unit;
    继续导入下一个最小模块；

#### Dependencies Analysis

```bash
CarLauncher
    \----- CarLauncher-core
               |---- androidx-constraintlayout_constraintlayout-solver
               |---- androidx-constraintlayout_constraintlayout
               |---- androidx.lifecycle_lifecycle-extensions
               |---- car-media-common
                      |---- androidx.cardview_cardview
                      |---- androidx.legacy_legacy-support-v4
                      |---- androidx.recyclerview_recyclerview
                      |---- androidx.mediarouter_mediarouter
                      |---- androidx-constraintlayout_constraintlayout
                      |---- car-apps-common
                               |---- androidx.annotation_annotation
                               |---- androidx.cardview_cardview
                               |---- androidx.interpolator_interpolator
                               |---- androidx.lifecycle_lifecycle-common-java8
                               |---- androidx.lifecycle_lifecycle-extensions
                               |---- androidx-constraintlayout_constraintlayout
                               |---- androidx.recyclerview_recyclerview
                               |---- androidx-constraintlayout_constraintlayout-solver
                               |---- car-ui-lib
                               \---- junit
                      \---- androidx-constraintlayout_constraintlayout-solver
               |---- car-telephony-common
                          |---- androidx.legacy_legacy-support-v4
                          |---- car-apps-common
                          |---- glide-prebuilt
                          |---- guava
                          |---- libphonenumber
               |---- car-ui-lib
               |---- com.google.android.material_material
               |---- WindowManager-Shell
               |---- launcher_item
               |---- SystemUISharedLib
               \---- android.car
```
