---
title: "CarLauncher 显示尺寸不正常"
date: 2025-10-09
tags: ["CarLauncher", "显示"]
summary: "现象 CarLauncher移植到Android Studio后，App列表页面显示不正常，图标偏小，布局偏移； 正常的现象（源码编译出来的CarLauncher） 不正常的现象（Android Studio编译） 解决思路 没有怎么解决过"
draft: false
visibility: public
---

#### 现象

- CarLauncher移植到Android Studio后，App列表页面显示不正常，图标偏小，布局偏移；
- 正常的现象（源码编译出来的CarLauncher）
![](/images/carlauncher-display-size/Pasted%2520image%252020250320101906.png)
- 不正常的现象（Android Studio编译）
    ![](/images/carlauncher-display-size/Pasted%2520image%252020250320101914.png)

#### 解决思路

> 没有怎么解决过布局的问题，一开始还是有点头脑空白，但是既然是尺寸问题，那就用工具查看尺寸吧

1. 使用Android Studio的Layout Inspector， 查看和记录正常、异常的尺寸， 既然很多尺寸都对不上，找几个有差别的尺寸持续分析就好。我这里记录了图标大小的尺寸，正常大小是76dp，异常大小是18dp；
   ![](/images/carlauncher-display-size/Pasted%2520image%252020250320101921.png)

2. 查看Launcher源码，找到CarLauncher的item图标尺寸大小，验证76dp和18dp是从哪里来的；
    ImageView的尺寸是app_grid_touch_target_size --> 引用@*android:dimen/car_touch_target_size --> car_touch_target_size，最终尺寸是76dp，这个应该是正常的；那么异常的18dp是否被overlay覆盖或者其他途径修改等情况呢？简单搜索并没有发现，但是无论如何，最终肯定都会编译进apk，我们反编译一下apk试一下；
    ![](/images/carlauncher-display-size/Pasted%2520image%252020250320101927.png)
    ![](/images/carlauncher-display-size/Pasted%2520image%252020250320101931.png)
    ![](/images/carlauncher-display-size/Pasted%2520image%252020250320101938.png)

3. 反编译正常的apk和异常的apk，查看同样的尺寸，发现app_grid_touch_target_size最终编译成了另外的尺寸，但是很明显源码编译的和AS编译的内容不同；

    ```xml
    正常的apk：
    <dimen name="app_grid_touch_target_size">@android:dimen/chooser_header_scroll_elevation</dimen>
    异常的apk：
    <dimen name="app_grid_touch_target_size">@android:dimen/chooser_preview_image_border</dimen>
    ```

    ![](/images/carlauncher-display-size/Pasted%2520image%252020250320101946.png)

4. 进一步搜索chooser_preview_image_border，发现这个尺寸为1dp，而且看名称，像是个边界线的宽度尺寸；

    在这里，需要停下来思考一下，为什么源码编译和AS编译不同，如果问题不出现在源码上，又出现在哪里？
    Android在编译apk的时候，很多时候会进行序列化在链接各个文件等等，这里可能是从这个方向出发。

    ![](/images/carlauncher-display-size/Pasted%2520image%252020250320101951.png)

5. 一般编译时候进行序列化，导致最终链接的位置不一样，这种情况一般是因为使用的依赖、工具等有所差异，而这些东西不在自己源码控制范围内，但最终都会编译进入apk；结合上面SDK为33，其实我们的CarLauncher是在Android12 SDK 32版本基础上挪动的，是否是这个原因导致的呢？

6. 源码查找当前源码的SDK版本cat build/core/version_defaults.mk | grep SDK -i，确认当前SDK版本是32；
    ![](/images/carlauncher-display-size/Pasted%2520image%252020250320101957.png)

7. build.gradle修改compileSdk为 32， 验证问题；

8. Done；

#### 经验和教训

1. 有空还是得研究一下Android源码编译、AS编译、命令行打包apk等原理和流程；
2. 在移植源码到本地编译的时候，需要注意各个依赖的版本，包括本地的SDK；
3. 在平时Debug的时候，为什么会觉得难？理由是不注重细节和想当然。如果没有确认这个资源文件的位置，我可能理所当然认为这个资源在framework-res了，如果不注重细节去仔细推测观察chooser_preview_image_border的名称和作用，我也不会联想到这个应该是个边界线，进而推测到不是源码本身的错误。上述第4、5步，其实没有很规范的debug推测流程，算是一种直觉，是经验的积累，也是细节的推敲。
