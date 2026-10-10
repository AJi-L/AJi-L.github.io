---
title: "编译报错：'visibility' attribute ignored [-Werror,-Wignored-attributes]"
date: 2025-10-10
tags: ["C++", "AOSP", "编译", "报错排查"]
summary: "Solution"
draft: false
visibility: public
---

![](/images/cpp-ignored-attributes/Pasted%20image%2020250320101347.png)

```bash
comm_manager/src/CommunicationManager.o.d -o out/soong/.intermediates/hardware/interfaces/automotive/vehicle/aidl/impl/user/communication/LibCommManager/android_vendor.34_arm64_armv8-a-branchprot_static_cfi/obj/hardware/interfaces/automotive/vehicle/aidl/impl/user/communication/comm_manager/src/CommunicationManager.o hardware/interfaces/automotive/vehicle/aidl/impl/user/communication/comm_manager/src/CommunicationManager.cpp
In file included from hardware/interfaces/automotive/vehicle/aidl/impl/user/communication/comm_manager/src/CommunicationManager.cpp:3:
In file included from hardware/interfaces/automotive/vehicle/aidl/impl/user/communication/comm_soa/include/CommunicationSOAImpl.h:5:
In file included from hardware/interfaces/automotive/vehicle/aidl/impl/user/communication/comm_soa/src-gen/v2/commonapi/CanInfoTypes.hpp:21:
In file included from external/capicxx-core-runtime/include/CommonAPI/InputStream.hpp:21:
In file included from external/capicxx-core-runtime/include/CommonAPI/Variant.hpp:23:
external/capicxx-core-runtime/include/CommonAPI/Logger.hpp:31:37: error: 'visibility' attribute ignored when parsing type [-Werror,-Wignored-attributes]
    enum class Level : std::uint8_t COMMONAPI_EXPORT {
                                    ^~~~~~~~~~~~~~~~
external/capicxx-core-runtime/include/CommonAPI/Export.hpp:19:46: note: expanded from macro 'COMMONAPI_EXPORT'
    #define COMMONAPI_EXPORT __attribute__ ((visibility ("default")))
                                             ^~~~~~~~~~~~~~~~~~~~~~
1 error generated.
11:37:46 ninja failed with: exit status 1
```

### Solution

```bash
// bp添加
-Wno-attributes
-Werror
```
