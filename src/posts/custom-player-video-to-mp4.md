---
title: "定制播放器加密课程视频逆向与无损转 mp4"
date: 2026-10-14
tags: ["逆向", "视频", "H.264", "MP4", "容器封装", "FFmpeg", "PowerShell"]
summary: "把某定制课程播放器的加密课程视频（.vep / .sz）无损转成 mp4。用播放器当解密黑盒（代理 avformat-58.dll 截 AVIOContext 顺序读明文）；.vep 明文是 M2TS 直接重封装；.sz 明文是被改写过的 "
draft: false
visibility: public
---

# 定制播放器加密课程视频（.vep / .sz）逆向与无损转 mp4

## 任务描述

把课程视频从「某定制课程播放器」的加密格式**无损**转成 mp4。

- 起始素材：`D:\Downloads\chrome\test`（无扩展名，282,146,787 字节）
- 后续目标：把 `D:\Course` 下整套课程也转掉（`.vep` 266 个 + `.sz` 144 个 / 15.27 GB）
- 约束：
  - 视频音频**必须无损**（只做重封装 / 字节级还原，不重新编码）
  - 不能靠录屏；播放器是唯一持有密钥的东西
  - 环境：Windows 11，当前 shell **非管理员**，PowerShell 执行策略**禁止直接跑 `.ps1`**（要 `powershell.exe -NoProfile -ExecutionPolicy Bypass -File xxx.ps1`）

两套格式后缀不同、保护方式也不同：

| 后缀 | 容器明文 | 负载 |
| --- | --- | --- |
| `.vep` | MPEG-TS / M2TS（192 字节包） | 标准，直接重封装 |
| `.sz` | 结构完好的 MP4 | **被厂商改写过**，需要字节级还原 |

## 解决 / 分解思路

1. **先识别文件**：全文件熵 7.9997 bit/byte，没有 `ftyp/moov/mdat` → 整文件加密。
   尾部结构固定：`[加密数据][7128 个全大写 ASCII 十六进制字符][4 字节 uint32]`，
   且 **uint32(小端) = 十六进制串长度 + 1,110,004**（266 个 `.vep` 全部吻合）。
   按文件大小精确匹配，在 `D:\Course` 里定位到同一文件（BLAKE2b-128 一致）→ `test` 就是改名的 `.vep`。
2. **不猜密钥，改用"播放器当黑盒"**：注册表 `HKCR\.vep` → `player`，课程目录自带
   `PlayerData\Player.exe`（32 位 PE 播放器）。
   它依赖 FFmpeg 4.x（avformat-58 / avcodec-58 / avutil-56）+ SDL2，是 Delphi/C++Builder FMX 程序。
3. **代理 DLL 截流**：用代理 `avformat-58.dll` 替换原 DLL（转发全部 219 个导出），
   在 `avformat_open_input` 返回后拿到 FFmpeg 内部的 `AVIOContext`，顺序读 → 明文。
4. **`.vep`**：明文是 M2TS → `ffmpeg -c copy -movflags +faststart` 完事。
5. **`.sz`**：明文是 MP4 但负载被改写 → 先做容器/解复用/解码器三层校验证明"我们没解错"，
   再逐字段定位改写规则 → 还原成标准 H.264 + AAC → `-c copy` 封装。
6. **工具化**：`vep2mp4.ps1`（含 `-DumpOnly`）、`sz2mp4.ps1`、`src/sz_fix.py`（自包含，仅标准库）。

## 实现过程

### 1. 去掉 exe 的管理员清单（否则读不了它内存）

播放器要求管理员，普通权限启动直接失败 `CreateProcess err=740`（= `ERROR_ELEVATION_REQUIRED`）。
把内嵌清单里 `requireAdministrator` **等长替换**成 `asInvoker`（尾部补空格保持长度），
自己拷贝一份改好的副本以普通权限运行 —— 同级完整性，内存随便读。

```powershell
$enc = [Text.Encoding]::GetEncoding(28591)
$bytes = [IO.File]::ReadAllBytes($exe); $s = $enc.GetString($bytes)
$i = $s.IndexOf('requireAdministrator')
$s = $s.Remove($i, 'requireAdministrator'.Length).Insert($i, 'asInvoker')
$j = $s.IndexOf('</assembly>', $i) + '</assembly>'.Length
$s = $s.Insert($j, ' ' * ('requireAdministrator'.Length - 'asInvoker'.Length))
[IO.File]::WriteAllBytes($exe, $enc.GetBytes($s))
```

### 2. 代理 avformat-58.dll：拿到解密后的明文

代理侧关键点：`avformat_open_input` 返回后

```
(*ps)->pb            // 32 位 FFmpeg 4.x 中 AVFormatContext.pb 在偏移 16
avio_size = 282146787    // 与 .vep 文件等长 → 逐字节原地解密
```

然后 `avio_seek(pb,0)` → 循环 `avio_read(pb, buf, 1MB)` → 写文件，
得到 **282,146,787 字节明文**。

重新编译代理（需要 mingw-w64 的 **32 位** gcc）：

```powershell
cd build
python ..\src\gen_proxy.py
gcc -m32 -O2 -shared -o avformat-58.dll ..\src\proxy.c gen.c gen.S gen.def
```

### 3. `.vep`：明文是 M2TS，直接重封装

明文开头 `47 40 11 …` + `"FFmpeg\tService01"`，H.264 1080p 15fps + AAC，17:00。

```powershell
ffmpeg -hide_banner -y -fflags +genpts -i plain_pb_1.bin -c copy -movflags +faststart out.mp4
```

重封装结果的第 5 分钟画面：



### 4. `.sz`：容器层解密 + 负载还原

`.sz` 的尾部规则与 `.vep` **完全一致**（`last4 == hexChars + 1110004`，81/81 吻合），
同一套代理方案即可拿到明文：

```
ftyp(32) free(8) mdat(39,740,728) moov(355,356)      # 40,174,723 字节，结构完美的 MP4
```

自洽性校验全过：视频轨 `max(chunk_off+chunk_size)=39,740,738`、音频轨 `=39,740,768`，
精确填满 mdat；`stsz/stsc/stco/stts/ctts` 一致；NAL 长度框架 11,145/11,145 样本 100% 自洽。

先在播放器里做了**三层对照**证明"解出来的字节没毛病"（否则是白忙）：

| 层 | 手段 | 结果 |
| --- | --- | --- |
| 协议输出 | hook `AVIOContext.read_packet` | `pos=48 n=149014 head=000002a10605ffff` |
| 解复用输出 | hook `av_read_frame`（data@+24 size@+28 pos@+56） | `pos=48 size=149014`，前 32 字节一致 |
| 解码器输入 | 代理 `avcodec-58.dll` hook `avcodec_send_packet` | `sum=023561dd head32=000002a10605ffff...` |

同样的校验和在我们自己的 dump 上算出**逐字节一致**（`dump[48,149014) -> 023561dd`）。

### 5. 最终定位：厂商只在 slice 头部多插了 1 个比特

先做全量统计，得到两条铁一样的事实：

- 每个 slice 负载前**插入 1 字节 `0x84`**（11,144/11,144；15,105/15,105；12,100/12,100 —— SEI 包没有）
- 头部的 `slice_type` 与 `pic_parameter_set_id` 两个字段**值被互换**：
  文件 `[fmb=0][slice_type=0][pps_id=tag]` ←→ 真实 `[fmb=0][slice_type=tag][pps_id=0]`
  （tag：**5=P / 6=B / 7=I**）。两者 ue 编码**等长**（P/B 7 bit、I 9 bit），所以重排本身不改变长度

但把前两个改完后，仍然有约 25% 的切片从 `slice_qp_delta` 之后开始错位
（典型症状：`disable_deblocking_filter_idc = 15` 这种非法值）。

**关键一步**：写脚本扫描「每种切片类型各丢 k 位后，`frame_num` 是否变成应有的值」：

| k | IDR | 第 1 个 P | 判断 |
| --- | --- | --- | --- |
| 0 | fn=8, idr_id=1 | fn=8 | ✗ IDR 的 frame_num 必须是 0 |
| **1** | **fn=0, idr_id=0, poc=0** | **fn=1, poc=8** | ✓ 全对了 |
| 2 | fn=1, idr_id=2040 | fn=2 | ✗ |

即：**厂商在重排后的前缀之后，又插入了 1 个比特**，并把头部补齐到字节边界。
去掉那 1 个比特，所有字段立刻回到标准值。

还要处理一个边界情况（这是最后一环）：

```
设原始头部位数 X、厂商头部位数 Hd = X+1
  X % 8 != 0：插的 1 bit 落在同一字节内，ceil(X/8) == ceil(Hd/8)，直接丢 1 bit
  X % 8 == 0：厂商的 1 bit 会额外带出 7 个填充位，必须一起丢，
              否则 CABAC 起点后移 1 字节
```

顺带把之前所有的"误判"都解释清楚了 —— 它们全是在补偿这 1 个比特：

| 旧结论（错） | 真实情况 |
| --- | --- |
| PPS 的 `weighted_pred_flag` 必须改成 0 | **不用改**，文件里的 PPS 就是对的 |
| `pic_init_qp_minus26` 要 -3 → -5 | **不用改**，-3 本来就正确 |
| B 帧（tag=6）要单独再丢 1 bit | **不用**，所有切片类型统一丢那 1 bit |
| IDR 的 `frame_num=8` 是编码器如此 | 是被错位读出来的，真实值是 **0**（标准值） |

`frame_num` 从 8 修正回 0 之后，ffmpeg 不再判定"帧号跳变"、不再插入假帧，
**DPB（最多 4 帧）不再被冲爆**，`Missing reference picture` 随之消失。

### 6. 音频轨

音频也是被改写的（容器/采样表本身正确）：

- 每 **256 帧**插入一个 17 字节厂商标记块：`de 02 00` + `"Lavc58.59.102"` + `00`
- 紧随其后那一帧被**整体位移 1 位**，去掉标记块后右移 1 位即可还原
  （验证方式：标记帧还原后与相邻帧逐字节一致）
- 单文件 102 个标记块中 87 个能完整还原；**15 个内容已在厂商侧丢失**
  （各种位移方向都解不出，且都是 `global_gain=0xFF` 的静音帧），
  用同流静音帧替代 —— 听感无损，解码器也不再报错
- `esds`/ASC 是伪造的（`f8 93 48 2b 72 80`），但**不用管**：
  按裸 AAC-LC / 44100 / 立体声重建 ADTS 即可，实际参数由码流本身决定

### 7. 交付与实测

```powershell
.\vep2mp4.ps1 "D:\Course\xxx\01 某课.vep"                 # .vep 一键
.\sz2mp4.ps1  "D:\Course\xxx\43-xxx.sz"                   # .sz 一键
.\sz2mp4.ps1  "D:\Course\某个课程目录"                     # 目录递归批量（已存在自动跳过）
```

`sz2mp4.ps1` 内部复用 `vep2mp4.ps1 -DumpOnly` 做容器解密，然后调 `src/sz_fix.py`
还原负载，最后 `-c copy` 无损封装并全片校验。

| 素材 | 切片还原 | 全片解码 | 时长 |
| --- | --- | --- | --- |
| `sz_plain.bin` | 11,145/11,145 | **0 错误** | 09:17.26 |
| `sz_plain_file2.bin` | 15,105/15,105 | **0 错误** | 12:35.25 |
| 真实 `.sz` `058.aac…` | 12,100/12,100 | **0 错误** | 10:05.02 |
| 真实 `.sz` `006.adb…` | — | **0 错误** | 09:16.60 |

解出来的画面已肉眼确认就是课程本体（VS Code 里的 `SurfaceFlinger/MessageQueue.cpp`、
Perfetto 的 VSYNC 波形等）。



第二个文件（`43-sf之vsync与perfetto结合分析巩固1.sz`）解出的帧，模型跨文件通用：



### 8. 一键复现（从 `.sz` 到 mp4）

```powershell
# 首次运行会自动准备播放器工作副本（来自 C:\Windows\SysWOW64\PlayerData\）
# 并安装代理 avformat-58.dll

# —— 一个文件 ——
.\sz2mp4.ps1 "D:\Course\...\43-xxx.sz"                        # 输出同名 mp4
.\sz2mp4.ps1 "D:\Course\...\43-xxx.sz" -Out "D:\out\43.mp4"   # 指定输出
.\sz2mp4.ps1 "D:\Course\...\43-xxx.sz" -ReuseDump             # 复用上次的解密结果，只重跑还原+封装

# —— 整个目录（递归；mp4 生成在 .sz 旁边；已存在自动跳过 → 可断点续跑）——
.\sz2mp4.ps1 "D:\Course\某课程目录"

# —— 想拆开排查时 ——
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\vep2mp4.ps1 "<某.sz>" -DumpOnly  # 只解密出明文 MP4
python src\sz_fix.py plain_pb_1.bin out.h264 out.aac                                       # 只做负载还原
ffmpeg -r 20 -i out.h264 -i out.aac -c:v copy -c:a copy -movflags +faststart out.mp4       # 只封装
```

`.vep` 侧同理，直接 `.\vep2mp4.ps1 "<某.vep>"`（明文是 M2TS，一步重封装）。

**判定成功的标准**：最后一行是 `完成 OK … 时长 HH:MM:SS`，
且 `ffmpeg -v error -i out.mp4 -f null -` 除 `non monotonically increasing dts` 外没有其它输出。

## 遇到的坑

### 坑 1：`CreateProcess err=740`，读不了播放器内存

- 现象：普通权限启动播放器直接失败，`CreateProcess err=740`（`ERROR_ELEVATION_REQUIRED`）。
- 原因：exe 内嵌清单声明了 `requireAdministrator`。
- 解决：等长替换成 `asInvoker`（尾部补空格），**改自己的副本**，以普通权限运行 → 同级完整性，可读内存。

### 坑 2：hook `avio_alloc_context` 从没被调用

- 现象：代理 DLL 打满日志，`avio_alloc_context` 一次都没进。
- 原因：播放器**注册了私有协议**，解密逻辑在它自己的读回调里 ——
  `avformat_open_input(url=stream:122577664, ...)`，`stream:` 是它自己 `av_register_protocol` 注册的。
- 解决：既然是"我们实现 `avformat_open_input`"，那就返回后直接取 `(*ps)->pb`，
  用 FFmpeg 内部为这个协议建好的 `AVIOContext` 自己读。

### 坑 3：给播放器换 `avcodec-58.dll` 代理 → 播放器直接退出

- 现象：换成代理 `avcodec-58.dll` 后播放器秒退。
- 原因：疑似有 DLL 完整性/签名校验。
- 解决：只换 `avformat-58.dll`（解密在协议层，够用了）。要拦解码器输入时另想办法（用文件校验和对照）。

### 坑 4：判断 TS 对齐只试 188 字节

- 现象：按 188 字节包去切，得出"中间全是乱码"的错误结论。
- 原因：明文是 **M2TS（192 字节包）**。
- 解决：188 **和** 192 都试。

### 坑 5（核心）：把"多插了 1 个比特"误判成"字段重排"

- 现象：改完 `0x84` 和前缀互换后，仍有约 25% 切片从 `slice_qp_delta` 之后错位，
  解析出的值"看着合理"（如 `disable_deblocking_filter_idc = 15`），其实是整体错位；
  ffmpeg 侧表现为：

  ```
  [h264] Reference 4 >= 4
  [h264] corrupt decoded frame
  [h264] Missing reference picture, default is 65
  [h264] illegal memory management control operation
  ```

- 原因：厂商在头部前缀后**插入 1 个比特**，于是从插入点之后的每个字段位置都差 1 bit。
- 解决：**所有切片类型统一丢掉那 1 个比特**（并处理 `X % 8 == 0` 时要连 7 个填充位一起丢）。
  定位手段就是"每种类型各丢 k 位，看 `frame_num` 是否等于应有的值"。

### 坑 6：`Reference 4 >= 4` 的报错数恰好是 12.14% ≈ 1/8

- 现象：这个报错出现 1353/11145 = **12.14%**，看着很怪。
- 原因：正好是"原始头部**字节对齐**（`X % 8 == 0`）"的那批切片 —— 厂商插的 1 bit 在这里
  会多带出 7 个对齐位，只丢 1 bit 的话 CABAC 起点后移 1 字节。
- 解决：按 `X % 8` 分情况处理填充位。这个数字反而是定位真因的关键线索。

### 坑 7：`frame_num=8` 导致 DPB 被冲爆

- 现象：`Missing reference picture` + `correct decoded frame` 大面积出现，
  但画面偶尔又正常（IDR 还能解出真实画面）。
- 原因：IDR 的 `frame_num` 被错位读成 8（标准要求 IDR 必须是 0），
  ffmpeg 判定"帧号跳变"→ 插入 8 个假帧 → **DPB 只有 4 帧**，真实参考帧被挤掉 → 后面全崩。
- 解决：修正那 1 bit 后 `frame_num` 自动变回 0，级联故障整个消失。

### 坑 8：`non-existing PPS 0 referenced` / `A non-intra slice in an IDR NAL unit`

- 现象：

  ```
  [h264] non-existing PPS 0 referenced
  [h264] decode_slice_header error
  [h264] no frame!
  [h264] A non-intra slice in an IDR NAL unit
  ```

- 原因：avcC 里只声明了 PPS id 0，码流却引用 5/6/7；IDR 里 `slice_type=0`（P 帧）非法。
- 解决：这两条其实是同一个"字段值互换"造成的表象 —— 真实的 `pps_id` 就是 0，
  被换到 `slice_type` 位置的那个值其实是**帧类型标记**（5/6/7）。换回来即可。

### 坑 9：音频 `Prediction is not allowed in AAC-LC`

- 现象：

  ```
  [aac] Prediction is not allowed in AAC-LC.
  [aac] Input buffer exhausted before END element found
  ```

- 原因：每 256 帧一个厂商标记块，紧随其后的帧被整体位移 1 位；容器 `esds`/ASC 还是伪造的。
- 解决：去掉 17 字节标记块后右移 1 位；忽略 `esds`，按裸 AAC-LC/44100/立体声重建 ADTS。

### 坑 10：`-c copy` 到 mp4 时末帧 DTS 冲突

- 现象：

  ```
  [null] Application provided invalid, non monotonically increasing dts to muxer in stream 0: 11142 >= 11142
  ```

- 原因：源是 B 帧重排，封装到 mp4 时复用器对最后两帧抱怨一次。
- 解决：文件本身完整（`stsz` 样本数与源分毫不差、时长正确），属无害提示；
  校验脚本里用正则把它滤掉即可。

### 坑 11：`.sz` 的 SPS 在不同文件里有个别字节差异

- 现象：某文件的 SPS = `67640028acd940780227e5c044000003000400000300a03c60c658`，
  与另外两个样例的 `...0227e584...` 不同。
- 原因：是 VUI 等无关字段的差异。
- 解决：影响头部解析的那几个参数（`log2_max_frame_num`、`poc` 类型、`chroma_format_idc` 等）
  在所有文件里一致，按样例参数解析即可（实测 12,100/12,100 全中，零解析失败）。

## 其他

- 交付物（都在 `D:\Downloads\chrome\vep2mp4\`）：

  | 路径 | 说明 |
  | --- | --- |
  | `vep2mp4.ps1` | `.vep` 一键转换；`-DumpOnly` 只做容器解密 |
  | `sz2mp4.ps1` | `.sz` 一键/批量转换（复用上面那步），已存在自动跳过 |
  | `src/sz_fix.py` | `.sz` 负载还原，自包含，只依赖标准库 |
  | `src/proxy.c`、`src/gen_proxy.py`、`src/patch_manifest.py` | 代理 DLL 源码与生成器 |
  | `sz_plain.bin`、`sz_plain_file2.bin` | 两个已解密好的 `.sz` 明文（复现素材） |
  | `README.md` | 完整逆向纪要 + 最终模型 |

- `.vep` 与 `.sz` 的**容器层是同一套体系**（尾部规则一致），所以解密部分完全共用。
- 三条铁证（协议层 / 解复用层 / 解码器层校验和逐字节一致）很重要：先证明"我们解出来的
  字节就是播放器喂给解码器的字节"，才能把精力集中在"负载本身被改写"上，而不是怀疑解密。

- 参考：FFmpeg 4.x `libavformat/avformat.h`（`AVFormatContext.pb`）、
  H.264 (ITU-T H.264 / ISO 14496-10) 7.3.3 Slice header syntax、AAC `ID_END`/`byte_alignment`。
