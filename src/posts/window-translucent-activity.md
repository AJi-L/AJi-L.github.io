---
title: "Android windowIsTranslucent 导致无法切换 Activity"
date: 2025-06-12
tags: ["Android", "Activity", "窗口"]
summary: "在使用CarLauncher的时候，因为CarLauncher背景非透明颜色，导致无法看到壁纸；因此设置了以下几个属性 但是，设置属性之后，出现无法切换会主页的情况。随后网上查询得知android:windowIsTranslucent经常"
draft: false
visibility: public
---

在使用CarLauncher的时候，因为CarLauncher背景非透明颜色，导致无法看到壁纸；因此设置了以下几个属性

```xml
    <activity
        android:theme="@style/Theme.Launcher.HomeActivity"/>

    <style name="Theme.Launcher.HomeActivity" parent="Theme.CarUi.NoToolbar">
        <item name="android:background">@color/transparent</item>
        <item name="android:windowIsTranslucent">true</item>
    </style>
```

但是，设置属性之后，出现无法切换会主页的情况。随后网上查询得知android:windowIsTranslucent经常会导致activity无法正常走生命流程；

#### Preferences

1. [windowIsTranlucent 踩坑之旅](https://fioneragh.github.io/2017/08/09/windowIsTranlucent-%E8%B8%A9%E5%9D%91%E4%B9%8B%E6%97%85/);
2. [Activity Lifecycle in Android](https://www.google.com/url?sa=t&rct=j&q=&esrc=s&source=web&cd=&cad=rja&uact=8&ved=2ahUKEwjM97aso9GIAxXLnK8BHeuTO_gQFnoECBQQAQ&url=https%3A%2F%2Fmedium.com%2F%40anna972606%2Factivity-lifecycle-in-android-2cb49f351524&usg=AOvVaw3XVrnssDbdKx86Hjr44He8&opi=89978449);
3. [In-depth analysis of Activity's Lifecycle | by Abhilash Das](https://www.google.com/url?sa=t&rct=j&q=&esrc=s&source=web&cd=&cad=rja&uact=8&ved=2ahUKEwjM97aso9GIAxXLnK8BHeuTO_gQFnoECBUQAQ&url=https%3A%2F%2Fmedium.com%2Fandroid-news%2Fin-depth-analysis-of-activitys-lifecycle-676179d8a520&usg=AOvVaw2g8P6nBy81ZcblqjIFB2-P&opi=89978449);
