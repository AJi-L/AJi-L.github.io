---
title: "车机设置里 WiFi 列表不显示（列表被排到可见区外）"
date: 2026-10-15
tags: ["Android", "car-settings", "WiFi", "uiautomator", "UI布局", "显示覆盖"]
summary: "车机板驱动修好、WiFi 已连上能上网，但\"设置 → WiFi\"页面里看不到网络列表（只有标题和开关）。逐层排查后确认框架和设置 App 的数据都正常（WifiPickerTracker 里有 14 个网络、当前连接项标着 Connecte"
draft: false
visibility: public
---

# 车机设置里 WiFi 列表不显示（列表被排到可见区外）

## 问题描述

RK3588 车机板（Android 15 userdebug）WiFi 驱动修好、命令行已经连上 AP 并能上公网之后，UI 上仍然不对：**进入「设置 → Wi‑Fi」，页面只有标题和右上角开关，一个网络都看不到**，连当前已连接的网络也不显示。

现象（`uiautomator dump` 拿到的页面文字）：

```
text="Wi‑Fi"
text="Wi‑Fi"
        # ← 只有标题，列表区什么都没有
```

第一反应是"是不是没扫到网络"或者"权限被挡了"，但后面证明**都不是**。

## 分析

**第一步：先看框架层到底有没有数据。**（shell 有权限，用它当基准）

```bash
$ adb shell "cmd wifi status"
Wifi is connected to "MAX"
  ...
  Supplicant state: COMPLETED

$ adb shell "cmd wifi list-scan-results | wc -l"
12                                  # ← 框架扫到了一堆 AP
```

**第二步：看设置 App 自己拿到了什么。**（关键一步）

```bash
$ adb shell "logcat -d | grep WifiPickerTracker | tail -20"
V WifiPickerTracker: Entry 1/14: [StandardWifiEntry][MAX][][Level:4][WPA/WPA2][Connected][Internet][Default][Primary][Saved]
V WifiPickerTracker: Entry 2/14: [StandardWifiEntry][CMCC-1][][Level:2][WPA/WPA2]
V WifiPickerTracker: Entry 3/14: [StandardWifiEntry][MERCURY_EBAB][][Level:2][WPA/WPA2]
...
```

**设置 App 的 `WifiPickerTracker` 里 14 个网络一个不少**，当前连接的 MAX 还带着 `Connected / Internet / Default / Primary / Saved` 全部标记。也就是说：

> **数据是好的，问题纯在 UI 渲染。**

**第三步：把页面的控件树 dump 出来看结构。**

```bash
$ adb shell "uiautomator dump /sdcard/u.xml && cat /sdcard/u.xml" | grep -o 'class="android.widget.[A-Za-z]*"'
# 页面有 RecyclerView（滚动容器）、有 Wi‑Fi 开关、有 Scroll up/Scroll down/Back
```

而且日志里能看到列表行是**存在但不可见**的：

```
I AccessibilityNodeInfoDumper: Skipping invisible child: ... packageName: com.android.car.settings;
  className: android.widget.FrameLayout; boundsInScreen: Rect(112, 348 - 112, 396);
```

注意 `Rect(112, 348 - 112, 396)`：**left = right = 112 → 宽度 0**。行对象在、但量出来的宽度是 0，所以画不出来。

**第四步：往下滚一屏，列表就出来了。**

```bash
$ adb shell "input swipe 640 600 640 200 300"   # 手指上滑
$ adb shell "uiautomator dump /sdcard/v.xml && cat /sdcard/v.xml" | grep -o 'text="[^"]*"' | grep -v 'text=""'
text="TP-LINK_BCBA"
text="Xiaomi_CAF6"
text="小九"
text="小米88"
text="益启学"
text="Add network"
text="Wi‑Fi"
```

**列表内容一直都在，只是初始位置被排到了可见区域下方**（首次布局没量好，滚动触发重新测量后就正常了）。

**顺手排除掉的几个常见嫌疑**：

| 嫌疑 | 实测 | 结论 |
| --- | --- | --- |
| 定位没开（Android 拿扫描结果需要定位） | `settings get secure location_mode` → `3` | 排除 |
| 设置 App 没有定位权限 | `ACCESS_FINE_LOCATION: granted=true, flags=[SYSTEM_FIXED|GRANTED_BY_DEFAULT]` | 排除 |
| 少了 `NEARBY_WIFI_DEVICES`（Android 13+） | 该 App **根本没声明**这个权限，走的是 FINE_LOCATION 路径 | 排除 |
| 车机 UX 驾驶限制把列表屏蔽 | `dumpsys car_service` 里 `UXR: 0`、`DO: false` | 排除 |
| 扫描被限流 | 日志里 `WifiPickerTracker: Scanning stopped` 会周期性重启扫描 | 非本次原因 |

另外顺带确认：这个 build 里**只有车机版设置**（`com.android.car.settings`），没有 AOSP 原生 `com.android.settings` 可以替换。

## 解决思路

问题定性是"布局/测量"而不是"数据/权限"，所以方向不是改权限，而是：

1. **临时可用**：进页面后**往下滑一屏**，列表就出来了（已实测）；连接网络也可以直接用命令行/面板绕开 UI：
   ```bash
   adb shell "cmd wifi connect-network <SSID> wpa2 <密码>"
   ```
2. **界面正常化**：根因指向这台板子的**显示覆盖**——板子物理是 800×1280 @ 320dpi，被覆盖成 **1280×800（横向）+ 160dpi** 使用：
   ```bash
   $ adb shell "wm size"
   Physical size: 800x1280
   Override size: 1280x800
   $ adb shell "wm density"
   Physical density: 320
   Override density: 160
   ```
   车机版 Settings 是按车机屏尺寸设计的，和"横屏覆盖 + 半密度"这个组合不兼容，才出现"行宽算成 0 / 列表跑到屏幕外"。缓解办法（按侵入性从低到高）：
   - 把密度调回物理值试：`wm density 320`（布局正常些，字变小）
   - 不覆盖、直接用物理 800×1280
   - 构建层面定死：`PRODUCT_PROPERTY_OVERRIDES += ro.sf.lcd_density=...` 等
3. 最终我给用户的答复是：**WiFi 本身没问题（已连上、有网），设置里的列表下滑一屏即可见；排版别扭是显示覆盖导致的**。

## 常见原理与分析思路

- **"列表空"要分成两件事判断**：**数据有没有**（框架/App 层）和 **UI 有没有渲染**（View 层）。用 shell 的 `cmd wifi` 能拿到数据 ≠ App 能拿到；App 的 `WifiPickerTracker` 有数据 ≠ UI 画出来了。这三层要分别验证，否则很容易误判成权限问题、白折腾。
- **`WifiPickerTracker` 是车机/AOSP 设置里管 WiFi 列表的组件**，它自己会周期性发扫描请求并打日志（`Issuing scan request from WifiManager` / `Scanning stopped` / `Entry n/N: [...]`），是判断"App 侧数据是否正常"的最佳入口。
- **`uiautomator dump` 是判断"UI 到底画了什么"的利器**：它给的是无障碍节点树，含 `text` / `content-desc` / `class` / `boundsInScreen`。**坐标宽度为 0、或日志里出现 `Skipping invisible child`，都说明控件在但没显示**——这时优先怀疑布局/测量，而不是内容缺失。
- **Android 扫描结果的权限模型**：6.0 起需要定位；13 起可改用 `NEARBY_WIFI_DEVICES`（声明了才需要，且 `Uid mode: ... ignore` 会静默过滤结果）。所以遇到"列表空"要先看**这个 App 声明/授权的是哪条路径**，再决定去开定位还是查 AppOps。

### 分析方法（命令）

```bash
# 1. 框架层有没有扫到（shell 权限，基准值）
adb shell "cmd wifi status"
adb shell "cmd wifi start-scan; sleep 5; cmd wifi list-scan-results"

# 2. App 层拿到了什么（最关键）
adb shell "logcat -d | grep -E 'WifiPickerTracker|WifiTracker' | tail -30"

# 3. UI 到底画了什么
adb shell "uiautomator dump /sdcard/u.xml && cat /sdcard/u.xml" \
  | grep -o 'text="[^"]*"' | grep -v 'text=""'
#   再看控件类型 / 边界，找 0 宽行
adb shell "cat /sdcard/u.xml" | grep -o 'class="android.widget.[A-Za-z]*"'
adb shell "logcat -d | grep 'Skipping invisible child'"

# 4. 换个位置试（判断是否只是排到屏幕外）
adb shell "input swipe 640 600 640 200 300"   # 上滑一屏
adb shell "uiautomator dump /sdcard/v.xml && cat /sdcard/v.xml" | grep -o 'text="[^"]*"' | grep -v 'text=""'

# 5. 排查权限路径
adb shell "settings get secure location_mode"
adb shell "dumpsys package <包名> | grep -iE 'NEARBY_WIFI|ACCESS_FINE_LOCATION|ACCESS_COARSE'"
adb shell "appops get <包名> NEARBY_WIFI_DEVICES"

# 6. 排查车机 UX 限制
adb shell "dumpsys car_service | grep -iE -A8 'ux.?restriction'"

# 7. 看显示覆盖（车机 UI 排版怪时必看）
adb shell "wm size; wm density"
```

## 遇到的坑

1. **一上来就往权限上怀疑，其实 App 根本没声明 `NEARBY_WIFI_DEVICES`**。当时 `appops get com.android.car.settings NEARBY_WIFI_DEVICES` 显示 `ignore`，我给它 `appops set ... allow` 了，但**App 没声明这个权限，设了也没用**（`dumpsys package` 的 `requested permissions` 里根本没有它）——它走的是 `ACCESS_FINE_LOCATION`，而定位一直是开着的。教训：先看 `requested permissions`，再决定设不设 AppOps。
2. **被前台应用骗过**：`uiautomator dump` 出来是**微信登录页**——之前测安装时微信留在前台，把设置页压下去了，一度以为"设置页渲染异常"。dump 前先 `dumpsys window | grep mCurrentFocus` 确认前台是谁，必要时 `am force-stop` 掉无关应用。
3. **`adb reconnect` 把设备搞没了**：排查中 `adb reconnect` 后 `adb devices` 变空，还以为板子挂了（其实 `ping` 通、板子活着）。用 `adb kill-server` / `start-server` 恢复即可；另外这块板子 USB adb 偶发掉线，WiFi adb（`:5555`）默认没开，别指望。
4. **改 `wm density` 会重启 UI 布局**，测完记得恢复用户原本的值（本次是 160），否则界面字大小会变。
5. **别把"车机版设置"和"AOSP 原生设置"混为一谈**：这个 build 里 `pm list packages | grep settings` 只有 `com.android.car.settings`（外加 `com.android.wifi.dialog` 等），没有 `com.android.settings` 可以拿来"换个 App 试试"。

## 其他

- 结论一句话：**数据正常、列表也正常，只是初始排版跑到可见区外，滑一下就有；排版别扭的根因是 1280×800 + 160dpi 的显示覆盖与车机版 Settings 布局不兼容。**
- 官方 ATK 车机屏（800×1280 竖屏 + 旋转）与"横屏覆盖"之间怎么取舍，属于产品形态问题，后续要在构建层（`ro.sf.lcd_density` / 面板配置）定下来。
- 相关笔记：《RK3588 WiFi 打不开（RTL8733BU 驱动缺失）》——本篇的前置问题。
