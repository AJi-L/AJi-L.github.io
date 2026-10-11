---
title: "QNX 常用指令"
date: 2026-06-23
tags: ["QNX", "命令", "车机"]
summary: ""
draft: false
visibility: public
---

```bash
1、通过 Android GVM 的 adb shell 进入 QNX shell 环境：
busybox telnet 192.168.1.100

2、通过 qnx 串口进入 Android GVM 的 adb shell 环境：
Android启用服务端：busybox telnetd -l /system/bin/sh
telnet 192.168.1.100

3、QNX侧获取Android 开机log：
cat /dev/shmem/la_gvm.txt

4、QNX 杀死进程：
slay xxxxx ，如 slay vmm_service

5、QNX 重新可写挂载 mnt：
mount -uw /mnt

6、查看GPIO状态：
msmgpiotool dump
msmgpiotool info gpio_num

7、读写i2c寄存器：
i2cdbgr -D [node] -s [slave addr] -r -b [byte size] -o [offset] -i
# i2cdbgr -D /dev/i2c2 -s 0x40 -r -b 2 -o 0x0 -i 1
addr: 0x00 data : 0x80

i2cdbgr -D [node] -s [slave addr] -w -b [byte size] -o [offset] -x
#i2cdbgr -D /dev/i2c1 -s 0x77 -w -b 1 -o 0x0 -x 0xa
addr: 0x0 <- data: 0xa

8、查看QNX log：
	显示log：slog2info
	实时显示log：slog2info -w
	清除log：slog2info -c
	过滤log：slog2info -b qvm //过滤只显示qvm进程相关log
	通过 slog2info| grep “string”去筛选需要监控的打印
	slog2info -l  /dev/shmem/slogger2/devnp_emac_eth1.45080

9、查看cpu使用情况：
	top

10、查看系统进程
查看全部进程：pidin ar
查看io-xxx的线程：
pidin -p io-pkt-v6-hc thread

11、查看网口信息：
查看全部网口信息：ifconfig
设置网口ip：ifconfig emac0 192.168.1.100 up

nicinfo
12、cat /dev/bmetrics
	记录程序启动时间，和一些打印

```
