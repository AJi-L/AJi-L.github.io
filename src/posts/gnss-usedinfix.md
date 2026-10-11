---
title: "星历问题 usedInFix 排查（GNSS）"
date: 2026-06-22
tags: ["GNSS", "星历", "Location"]
summary: "问题描述 1. 腾讯地图可用卫星数为0， 按照腾讯的分析，是以下截图的接口一直为FALSE，导致可用卫星数为0； Android时序 1. LocationManager 静态类new的时候已经监听, 套用比较多层 1. static cl"
draft: false
visibility: public
---

## 问题描述

1. 腾讯地图可用卫星数为0， 按照腾讯的分析，是以下截图的接口一直为FALSE，导致可用卫星数为0；

![](/images/gnss-usedinfix/lu193925ame_tmp_68100a50.png)

## Android时序

1. LocationManager 静态类new的时候已经监听, 套用比较多层
   1. static class GnssLazyLoader
   2. xxxManager
   3. registerTransport
   4. getService().register
2. LocationManager.registerGnssStatusCallback → LazyLoader reigsterTransport service.register
3. **onSvStatusChanged** → GnssStatusTransport.onSatelliteStatusChanged

4. LocationManagerService.java registerGnssStatusCallback

5. GnssManagerService registerGnssStatusCallback

6. mGnssStatusProvider.addListener

7. **GnssStatusProvider.java onReportSvStatus -> onSvStatusChanged**

8. GnssNative.java **reportSvStatus** -> onReportSvStatus

9. GnssCallback.cpp

![](/images/gnss-usedinfix/lu193925ame_tmp_ce5c071d.png)

![](/images/gnss-usedinfix/lu193925ame_tmp_6f10bf0d.png)

10. IGnssCallback.hal

gnssSvStatusCb_2_0(vec<GnssSvInfo> svInfoList);

11. Gnss.cpp

void Gnss::gnssSvStatusCb(GnssSvStatus* status) {

12. gnsshab.c

```c++
void callback_thread(const qcxhab_t *habmsg)
{
//...
case *CB_GNSS_SV*:
   //gnss_sv_status_cb1
   gns_sv_status = (GnssSvStatus*)habmsg->data;
   GNSS_LOG(LOG_DEBUG, "callback_p.gnss_sv_status_cb\n");
   callback_p.gnss_sv_status_cb(gns_sv_status);
       break;

1. gnsshab.c
if (g_session_item->vgps_mode == *CMD_START*) {
   memset((void *)habmsg_hab, 0, habmsg_size);
   ret = habmm_socket_recv(g_session_item->hab_handle, (void *)habmsg_hab,
                       &habmsg_size, HAB_TIMEOUT_IN_MS, 0);
    if (ret) {
       GNSS_LOG(LOG_ERROR, "gnss FE habmm_socket_recv failure\n");
       goto exit;
   }
   /*for test*/
   //dump_gnss_msg(habmsg_hab);
   callback_thread(habmsg_hab);
} else {
   sleep(1);
}
```

14. gps.h

![](/images/gnss-usedinfix/lu193925ame_tmp_c1370370.png)

## FLAG的定义

```c++
enum GnssSvFlags : uint8_t {
   NONE                 = 0,
   HAS_EPHEMERIS_DATA   = 1 << 0,
   HAS_ALMANAC_DATA     = 1 << 1,
   USED_IN_FIX          = 1 << 2,
   HAS_CARRIER_FREQUENCY = 1 << 3
};
```

## 2026-01-19 会议进展

1. QNX侧有1个配置适配Android高低版本接口；
2. 目前调用的是低版本的接口， 但是Android接口对应的是高版本接口， 因此没有数据上报过来；

> ### AI解释 各个Flag与NMEA协议的判断关系
>
> 1. USED_IN_FIX (用于定位)
>
>   - NMEA判断依据: $GNGSA 或 $GPGSA / $GLGSA / $GAGSA / $BDGSA 等语句。
>   - 中文描述: GSA (GNSS DOP and Active Satellites) 语句的作用就是明确告知哪些卫星被用于计算当前的位置解。
>   - 在一个典型的$GNGSA语句中，例如：$GNGSA,A,3,**14,01,22,17,30,03,19,07,02,06**,,,1.0,0.5,0.8,1*34
>   - 从第4个字段开始到第15个字段结束的数字列表（14,01,22,...），就是当前用于定位的所有卫星的ID。
>   - 正确赋值逻辑:
>     - 后端服务在处理每一组定位数据时，首先应该解析所有的GSA语句，将其中列出的所有卫星ID存储在一个临时的“已使用卫星列表”中；
>     - 在填充GnssSvInfo结构体时，检查当前卫星的svid是否存在于这个“已使用卫星列表”里；
>     - 如果存在，就必须给flags字段加上USED_IN_FIX标志。
> 2. HAS_EPHEMERIS_DATA (有星历数据)
>
>   - NMEA判断依据: 间接判断，通常来自 $GPGSV / $GLGSV 等语句，但更依赖于GNSS芯片的内部状态。
>   - 中文描述: 星历是卫星精确的轨道参数和时钟修正数据，是计算位置的必需品。如果一颗卫星没有星历，它就不可能被用于定位。
>   - NMEA协议本身没有一个直接的字段说“这颗星有星历”。
>   - 但是，后端服务通常可以从GNSS芯片获取到这个状态。一颗卫星能被用于定位（出现在GSA中），几乎100%意味着它有星历。
>   - 反过来，一颗卫星即使有星历，也可能因为几何分布不好或信号质量差而未被用于定位。
>   - 正确赋值逻辑:
>     - 最佳方式: 后端服务从芯片的私有协议或SDK中获取每颗卫星的健康状态和数据状态，其中会明确包含是否有星历。
>     - 基于NMEA的推断: 如果无法直接获取状态，可以做如下推断：
>     - 如果一颗卫星出现在GSA语句中，那么它的flags必须包含HAS_EPHEMERIS_DATA。
>     - 如果一颗卫星只出现在GSV语句中，但信号质量很好（例如C/N0 > 30 dBHz），并且持续可见，那么可以大概率认为它已经下载完星历数据，也应该设置此标志。
> 3. HAS_ALMANAC_DATA (有历书数据)
>
>   - NMEA判断依据: 非常间接的判断，几乎完全依赖GNSS芯片的内部状态。
>   - 中文描述: 历书是所有卫星的粗略轨道信息，有效期很长。它帮助GNSS接收机快速知道天上有哪些卫星、它们大概在什么位置，从而加快搜星速度。
>   - NMEA协议中没有直接体现历书状态的字段。
>   - 只要接收机能搜到星（即卫星出现在GSV语句中），就几乎可以肯定它已经有了历书数据。因为没有历书，接收机就像个“瞎子”，不知道该去哪里搜索卫星信号。
>   - 正确赋值逻辑:
>     - 最佳方式: 同样，从芯片的私有协议或SDK中直接获取。
>     - 基于NMEA的推断: 一个比较稳妥的策略是，只要一颗卫星出现在GSV语句中，就给它的flags字段加上HAS_ALMANAC_DATA标志。因为能看到它，就说明接收机知道它的存在和大概位置。
> 4. HAS_CARRIER_FREQUENCY (有载波频率数据)
>
>   - NMEA判断依据: 直接判断，取决于GnssSvInfo结构体中的carrierFrequencyHz字段是否被填充。
>
>   - 中文描述: 这个标志表明carrierFrequencyHz字段中的值是否有效。carrierFrequencyHz是卫星信号的载波频率（例如L1, L5等）。
>
>   - 标准的NMEA语句（如GSV）通常不包含这个信息。这通常来自芯片的私有输出或较新的NMEA扩展协议。
>
>   - 正确赋值逻辑:
>
>     - 如果后端服务能够获取到卫星的载波频率，并成功填充了GnssSvInfo结构体中的carrierFrequencyHz字段（使其为一个非零的有效值），那么就必须给flags字段加上HAS_CARRIER_FREQUENCY标志。
>
>     - 如果无法获取，carrierFrequencyHz为0，那么就不应该设置此标志。
>
>     - HAB后端应该如何赋值flags (伪代码示例)
>
>     - 假设后端服务已经解析了所有NMEA语句，并把GSA中的“已用卫星ID”存放在一个叫used_sv_ids的集合里，把GSV中的所有卫星信息存放在一个叫all_svs的列表里。
>       ```C
>       // 伪代码，演示后端服务的正确逻辑
>       // 1. 从GSA语句中解析出用于定位的卫星ID
>       Set<int> used_sv_ids;
>       parse_gsa_sentences(nmea_buffer, &used_sv_ids);
>
>       // 2. 准备一个GnssSvInfo的列表，准备发给上层
>       List<GnssSvInfo> sv_info_list;
>
>       // 3. 遍历所有从GSV中看到的卫星
>       for (sv in all_svs) {
>           GnssSvInfo info;
>           info.size = sizeof(GnssSvInfo);
>           info.svid = sv.id;
>           info.constellation = sv.constellation;
>           info.c_n0_dbhz = sv.cn0;
>           info.elevation = sv.elevation;
>           info.azimuth = sv.azimuth;
>           info.carrierFrequencyHz = sv.carrier_freq; // 假设可以获取到
>
>           // --- 核心：开始设置flags ---
>           info.flags = GNSS_SV_FLAGS_NONE; // 先清零
>
>           // 判断是否有历书 (只要看到这颗星，就认为有)
>           info.flags |= GNSS_SV_FLAGS_HAS_ALMANAC_DATA;
>
>           // 判断是否有星历 (更可靠的依据是芯片状态，但可以从used_in_fix推断)
>           // 或者，如果信号很好，也可以认为有星历
>           if (is_in_set(used_sv_ids, sv.id) || sv.cn0 > 30) {
>               info.flags |= GNSS_SV_FLAGS_HAS_EPHEMERIS_DATA;
>           }
>
>           // 【关键】判断是否用于定位
>           if (is_in_set(used_sv_ids, sv.id)) {
>               info.flags |= GNSS_SV_FLAGS_USED_IN_FIX;
>           }
>
>           // 判断是否有载波频率
>           if (info.carrierFrequencyHz > 0) {
>               info.flags |= GNSS_SV_FLAGS_HAS_CARRIER_FREQUENCY;
>           }
>
>           sv_info_list.add(info);
>
>       }
>
>       // 4. 将填充好的sv_info_list打包到qcxhab_t消息中，通过socket发送
>       // ... send_to_hab_frontend(sv_info_list) ...
>       ```
>
>       你的问题根源，几乎可以肯定就在上述伪代码的第3步，特别是判断USED_IN_FIX的逻辑块，在你们的后端代码中被错误实现或完全遗漏了。
>
