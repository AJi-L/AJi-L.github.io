---
title: "CarService 启动崩溃排查（car audio zones 缺 BUS 输出设备）"
date: 2026-10-14
tags: ["Android", "CarService", "车机音频", "音频策略", "RK3588", "WSL"]
summary: "RK3588 板子上电后 com.android.car 反复崩溃在 CarAudioZonesHelper.validateOutputAudioDevice：car_audio_configuration.xml 要 bus0~bus7"
draft: false
visibility: public
---

# CarService 启动崩溃排查（car audio zones 缺 BUS 输出设备）

## 问题描述

RK3588 开发板（产品 `AJi3588_CAR`，Android 15 userdebug）上电后**车机界面起不来**：`com.android.car` 一启动就崩，无限重启。

确认跑的是目标产品：

```bash
$ adb shell getprop ro.build.fingerprint
Alientek/AJi3588_CAR/AJi3588_CAR:15/AP4A.250205.002.C1/eng.user:userdebug/release-keys
```

logcat 崩溃原文：

```
E AndroidRuntime: FATAL EXCEPTION: main
E AndroidRuntime: Process: com.android.car, PID: 1275
E AndroidRuntime: java.lang.RuntimeException: Unable to create service com.android.car.CarService: java.lang.IllegalStateException: Output device address bus0_media_out does not belong to any configured output device.
E AndroidRuntime: 	at com.android.car.audio.CarAudioZonesHelper.validateOutputAudioDevice(CarAudioZonesHelper.java:1142)
E AndroidRuntime: 	at com.android.car.audio.CarAudioZonesHelper.parseVolumeGroupDeviceToContextMapping(CarAudioZonesHelper.java:987)
E AndroidRuntime: 	at com.android.car.audio.CarAudioZonesHelper.parseVolumeGroup(CarAudioZonesHelper.java:973)
E AndroidRuntime: 	at com.android.car.audio.CarAudioZonesHelper.parseZoneConfig(CarAudioZonesHelper.java:753)
E AndroidRuntime: 	at com.android.car.audio.CarAudioService.loadCarAudioConfigurationLocked(CarAudioService.java:1866)
E AndroidRuntime: 	at com.android.car.CarServiceImpl.onCreate(CarServiceImpl.java:78)
E ActivityManager: Scheduling restart of crashed service com.android.car/.CarService in 0ms for persistent
```

崩溃循环累计次数：

```bash
$ adb shell "logcat -d | grep -c 'bus0_media_out does not belong'"
478
```

影响：CarService（车机核心服务）起不来 ⇒ Launcher/车辆信号/空调等车机功能全部不可用。

## 分析

报错来自 `CarAudioZonesHelper.validateOutputAudioDevice`：它把 `car_audio_configuration.xml` 里 volume group 写的 device address，拿去和 AudioManager 实际持有的输出设备列表比对，**对不上就抛异常**。

第一步先看两份配置：

```bash
$ adb shell cat /vendor/etc/car_audio_configuration.xml     # 车机音频分区（要哪些设备）
$ adb shell grep -c AUDIO_DEVICE_OUT_BUS /vendor/etc/audio_policy_configuration.xml
0
```

`car_audio_configuration.xml` 里要的设备（主音区 + 两个后排音区）：

```xml
<device address="bus0_media_out">        <!-- music / announcement -->
<device address="bus6_notification_out"> <!-- notification -->
<device address="bus1_navigation_out">   <!-- navigation -->
<device address="bus2_voice_command_out">
<device address="bus4_call_out"> / <device address="bus3_call_ring_out">
<device address="bus5_alarm_out"> / <device address="bus7_system_sound_out">
<zone name="rear seat zone 1" audioZoneId="1">  -> bus100/bus101/bus110/bus111_audio_zone_1
<zone name="rear seat zone 2"  audioZoneId="2"> -> bus200/bus201/bus210/bus211_audio_zone_2
```

而 `/vendor/etc/audio_policy_configuration.xml` **一个 `AUDIO_DEVICE_OUT_BUS` 都没有**——只有 Speaker / Wired Headset / BT SCO / HDMI / SPDIF。也就是说：policy 里根本没有这些 bus 设备，CarService 自然校验不过。

第二步回到源码，确认这是"配了但配错了"：

```bash
$ diff device/rockchip/common/audio_policy_configuration.xml \
       device/rockchip/rk3588/AJi3588_CAR/audio/audio_policy_configuration.xml
（输出为空：两份文件逐字节相同）
```

产品目录里那份 policy 就是 AOSP 默认版的复制，**从来没改过**。

再看产品开关（`audio.mk` 的分支逻辑）：

```make
# device/rockchip/common/modules/audio.mk
ifneq ($(filter car, $(strip $(TARGET_BOARD_PLATFORM_PRODUCT))), )
    PRODUCT_COPY_FILES += \
        $(TARGET_DEVICE_DIR)/audio/audio_policy_configuration.xml:$(TARGET_COPY_OUT_VENDOR)/etc/audio_policy_configuration.xml \
        $(TARGET_DEVICE_DIR)/audio/car_audio_configuration.xml:$(TARGET_COPY_OUT_VENDOR)/etc/car_audio_configuration.xml \
        ...
else
    PRODUCT_COPY_FILES += $(RKSDK_PATH)/audio_policy_configuration_singlehal.xml:...
endif

ifeq ($(filter car, $(strip $(TARGET_BOARD_PLATFORM_PRODUCT))), )
    PRODUCT_COPY_FILES += $(RKSDK_PATH)/audio_policy_configuration.xml:$(TARGET_COPY_OUT_VENDOR)/etc/audio_policy_configuration.xml ...
endif
```

`AJi3588_CAR.mk` 里 `TARGET_BOARD_PLATFORM_PRODUCT := car` 是对的，所以走的是"产品自带 policy"分支——**但那份文件内容等于默认版**，等于配了个寂寞。

第三步确认 HAL 是支持 bus 的（问题在声明层，不在实现层）：

```bash
$ grep -n 'BUS_NAME' hardware/rockchip/audio/primary_hal/audio_control/inc/platform_policy.h
#define BUS_NAME_MEDIA              "bus0_media_out"
#define BUS_NAME_NAVIGATION         "bus1_navigation_out"
#define BUS_NAME_VOICE              "bus2_voice_command_out"
#define BUS_NAME_RING               "bus3_call_ring_out"
#define BUS_NAME_PHONE              "bus4_call_out"
#define BUS_NAME_SYS_NOTIFICATION   "bus6_notification_out"
#define BUS_NAME_ZONE_1             "bus100_audio_zone_1"
#define BUS_NAME_ZONE_2             "bus200_audio_zone_2"
#define BUS_NAME_ZONE_3             "bus300_audio_zone_3"
```

`bus0_media_out` 在 HAL 里是有硬编码的，只是 policy 没声明。

结论：**这是一份残缺的 car audio policy**——`car_audio_configuration.xml` 是车机版（要 bus），`audio_policy_configuration.xml` 是手机默认版（没 bus），两边对不上。

## 解决思路

思路：**把 policy 补成车机版**，而不是去砍 `car_audio_configuration.xml`（那是车机音频架构的核心）。

改动一：重写 `device/rockchip/rk3588/AJi3588_CAR/audio/audio_policy_configuration.xml`，在 RK 原有 primary module 上补齐 bus 设备（参照 AOSP 的 `device/generic/car/emulator/audio/audio_policy_configuration.xml`）：

```xml
<!-- mixPort：每个 bus 一个 source mixPort，名字必须与 devicePort 区分开 -->
<mixPort name="mixport_bus0_media_out" role="source">
    <profile name="" format="AUDIO_FORMAT_PCM_16_BIT"
             samplingRates="48000" channelMasks="AUDIO_CHANNEL_OUT_STEREO"/>
</mixPort>

<!-- devicePort：AUDIO_DEVICE_OUT_BUS + address，且必须带 gains -->
<devicePort tagName="bus0_media_out" role="sink" type="AUDIO_DEVICE_OUT_BUS" address="bus0_media_out">
    <profile name="" format="AUDIO_FORMAT_PCM_16_BIT"
             samplingRates="48000" channelMasks="AUDIO_CHANNEL_OUT_STEREO"/>
    <gains>
        <gain name="" mode="AUDIO_GAIN_MODE_JOINT"
              minValueMB="-3200" maxValueMB="600"
              defaultValueMB="0" stepValueMB="100"/>
    </gains>
</devicePort>

<!-- route -->
<route type="mix" sink="bus0_media_out" sources="mixport_bus0_media_out"/>
```

同时把 bus 加进 `attachedDevices`：

```xml
<attachedDevices>
    <item>Speaker</item>
    <item>Built-In Mic</item>
    <item>bus0_media_out</item>
    ...
    <item>bus211_audio_zone_2</item>
</attachedDevices>
```

改动二：后排音区那 8 路里，**RK HAL 只认 bus100/bus200/bus300**（见上面 `platform_policy.h`，没有 bus101/110/111/201/210/211），声明了也过不了校验。所以把 `car_audio_configuration.xml` 收敛到主音区（原始三音区版本已备份）：

```bash
# zone 数: 3 -> 1（只保留 primary）
```

改动文件与备份：

```
device/rockchip/rk3588/AJi3588_CAR/audio/
  audio_policy_configuration.xml            ← 重写
  audio_policy_configuration_aosp_backup.xml   ← 原文件备份
  car_audio_configuration.xml               ← 收敛到主音区
  car_audio_configuration_backup.xml        ← 原文件备份
```

验证：把改好的文件通过 overlayfs push 到 `/vendor/etc/`，重启框架后看日志。

```bash
$ adb shell "logcat -d | grep -c 'Unable to create service com.android.car.CarService'"
0

$ adb shell "logcat -d | grep -E 'CarAudioService|CarAudioZones' | tail -3"
I CarServiceUtils: Starting HandlerThread:CarAudioService
V CAR.InitTiming: CarAudioService took to complete: 578ms

$ adb shell "dumpsys car_service | grep -iE 'zone|VolumeGroup|Address'"
CarAudioZone(primary zone:0) isPrimary? true
  CarAudioZoneConfig(primary zone config 0:0) of zone 0 isDefault? true
    CarVolumeGroup(0)
      Context: MUSIC -> Address: bus0_media_out
      Context: NOTIFICATION -> Address: bus6_notification_out
      Context: ANNOUNCEMENT -> Address: bus0_media_out
    CarVolumeGroup(1)
      Context: NAVIGATION -> Address: bus1_navigation_out
      Context: VOICE_COMMAND -> Address: bus2_voice_command_out
    CarVolumeGroup(2)
      Context: CALL_RING -> Address: bus3_call_ring_out
      Context: CALL -> Address: bus4_call_out
```

## 常见原理与分析思路

- **AOSP car 音频是 bus 架构**：每个 usage/context（music / navigation / voice_command / call / call_ring / alarm / notification / system_sound）映射到一个 `AUDIO_DEVICE_OUT_BUS` 设备，由 `car_audio_configuration.xml` 描述"哪路声音走哪个 bus"，由 `audio_policy_configuration.xml` 声明这些 bus 真实存在。
- CarService 在 `onCreate` 阶段就**强制校验**这份映射（`CarAudioZonesHelper.validateOutputAudioDevice`），任何一个 address 找不到就抛异常 —— 所以表现是"开机就崩"，不是"没声音"。
- 分三层看：**HAL 实现层**（`platform_policy.h` 里硬编码的 bus 名）→ **policy 声明层**（`audio_policy_configuration.xml` 的 devicePort）→ **车机映射层**（`car_audio_configuration.xml`）。三层名字必须完全一致。
- 「文件存在 ≠ 配置生效」：产品目录里放了配置文件、`mk` 也拷了，但内容是从别处复制来的默认版 —— 这种要用 `diff` 对照才发现。
- `dumpsys media.audio_policy` 里能直接看到 AudioPolicy 实际持有的设备，是判断"policy 有没有生效"最快的手段。

### 分析方法（命令）

```bash
# 1. 现象：谁在崩、崩几次
adb logcat -d | grep -A20 'FATAL EXCEPTION'
adb shell "logcat -d | grep -c 'does not belong to any configured output device'"

# 2. 两份配置对不上
adb shell cat /vendor/etc/car_audio_configuration.xml
adb shell grep -c AUDIO_DEVICE_OUT_BUS /vendor/etc/audio_policy_configuration.xml

# 3. AudioPolicy 里到底有没有这些设备（决定性证据）
adb shell "dumpsys media.audio_policy | grep -iE 'BUS|bus0_media'"

# 4. 改完后确认车机音频分区真的建起来了
adb shell "dumpsys car_service | grep -iE 'zone|VolumeGroup|Address'"

# 5. 源码侧定位
grep -rl 'bus0_media_out' device/rockchip hardware/rockchip vendor/rockchip
grep -rl 'AUDIO_DEVICE_OUT_BUS' device/rockchip/ device/generic/car
diff device/rockchip/common/audio_policy_configuration.xml \
     device/rockchip/rk3588/<产品>/audio/audio_policy_configuration.xml
sed -n '1,60p' device/rockchip/common/modules/audio.mk      # 看 car 分支逻辑
grep -rn 'TARGET_BOARD_PLATFORM_PRODUCT' device/rockchip/rk3588/<产品>/*.mk
```

## 遇到的坑

1. **mixPort 与 devicePort 同名 → 整份 policy 解析失败**。现象是 `AudioFlinger` 打：

   ```
   E AudioFlinger: Function: getAudioPolicyConfig Line: 2635 Failed
   ```

   然后 `APM::AudioPolicyEngine/Base: loadAudioPolicyEngineConfig: No configuration found, using default matching phone experience.`，car 那个报错照旧。改法：mixPort 一律加前缀（`mixport_bus0_media_out`），`route` 的 `sources` 指向 mixPort。

2. **bus devicePort 必须带 `<gains>`**，否则换成：

   ```
   java.lang.IllegalArgumentException: Audio device must have gains defined
       at com.android.car.audio.CarAudioService.generateCarAudioDeviceInfos(CarAudioService.java:1843)
   ```

   （说明上一条已过，校验往前推进了。）

3. **只把 bus0~bus7 放进 `attachedDevices` 不够**：后排音区那 8 路没有 attach 时，报错会变成 `Output device address bus100_audio_zone_1 does not belong to any configured output device.` —— **所有被引用的 bus 都要 attach**。

4. **`adb root` 会重启 adbd，导致 `adb push` 静默失效**。这是本次最耗时间的一个坑：

   ```bash
   $ adb push xxx.xml /vendor/etc/audio_policy_configuration.xml
   ...: 1 file pushed, 0 skipped. 80.5 MB/s (19247 bytes)
   $ adb shell "wc -c /vendor/etc/audio_policy_configuration.xml"
   19006        # ← 还是旧文件！
   ```

   原因：`adb root` 后 adbd 被重启，**不在 remount 命名空间里**，写 `/vendor` 落到了只读层。正确顺序：

   ```bash
   adb root
   adb wait-for-device
   adb remount        # 必须每次都做，重启后 root/remount 状态都会丢
   adb push <file> /vendor/etc/...
   ```

5. **overlayfs 的改动跨重启仍在**（本次实测：push 后 `adb reboot`，`/vendor/etc/` 里还是新文件）。`adb remount` 会提示 `Now reboot your device for settings to take effect`，实际不需要重启就能生效。

6. 测试用 `adb shell "stop"; adb shell "start"` 重启框架就够了（比重启设备快），但**必须先确认 adb 还有 root**，否则报 `Must be root` 而你以为重启了。

## 其他

- 只改了配置，没动 HAL 和 framework；后面要固化进镜像得重新编 `./build.sh -A -u` 再整包烧录（现在只是 overlayfs 生效）。
- 后排音区（`bus101/bus110/bus111/bus201/bus210/bus211`）要真正可用，得先在 `hardware/rockchip/audio/primary_hal/.../platform_policy.h` 里补 HAL 支持，再放开 `car_audio_configuration.xml`。
- 板上还看到两个待查的报错：
  - 内核每 5s 刷 `[drm:vop2_win_disable] *ERROR* Unsupported vp_id: -1`
  - `GarageModeRecorder: GarageMode session file is not found /data/system/car/garagemode/GarageModeSession.txt`
- 参考：`device/generic/car/emulator/audio/audio_policy_configuration.xml`（AOSP 的 car 音频 policy 样例，bus 写法可直接照抄）
