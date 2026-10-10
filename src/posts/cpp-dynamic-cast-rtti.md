---
title: "编译报错：use of dynamic_cast requires -frtti"
date: 2025-10-10
tags: ["C++", "RTTI", "AOSP", "报错排查"]
summary: "Solution bp文件添加 RTTI（Run Time Type Information，运行时类型信息）是 C++ 中的一种机制，允许程序在运行时获取对象的类型信息。通过 RTTI，程序可以在运行时检查和操作对象的类型，而不仅仅是在编"
draft: false
visibility: public
---

![](/images/cpp-dynamic-cast-rtti/Pasted image 20250320101302.png)

```bash
In file included from hardware/interfaces/automotive/vehicle/aidl/impl/user/communication/comm_soa/include/CommunicationSOAImpl.h:3:
In file included from hardware/interfaces/automotive/vehicle/aidl/impl/user/communication/comm_base/include/IVehicleCommunication.h:3:
In file included from hardware/interfaces/automotive/vehicle/aidl/impl/utils/common/include/VehicleHalTypes.h:20:
In file included from out/soong/.intermediates/hardware/interfaces/automotive/vehicle/aidl_property/android.hardware.automotive.vehicle.property-V2-ndk-source/gen/include/aidl/android/hardware/automotive/vehicle/AutomaticEmergencyBrakingState.h:3:
In file included from external/libcxx/include/array:112:
In file included from external/libcxx/include/algorithm:644:
external/libcxx/include/memory:4972:16: error: use of dynamic_cast requires -frtti
    _Tp* __p = dynamic_cast<_Tp*>(__r.get());
               ^
hardware/interfaces/automotive/vehicle/aidl/impl/user/communication/comm_soa/src-gen/v2/commonapi/CanInfoServiceProxy.hpp:113:24: note: in instantiation of function template specialization 'std::dynamic_pointer_cast<v2::commonapi::CanInfoServiceProxyBase, CommonAPI::Proxy>' requested here
        delegate_(std::dynamic_pointer_cast< CanInfoServiceProxyBase>(delegate)) {
                       ^
external/libcxx/include/memory:2156:9: note: in instantiation of member function 'v2::commonapi::CanInfoServiceProxy<>::CanInfoServiceProxy' requested here
      : __value_(_VSTD::forward<_Args>(_VSTD::get<_Indexes>(__args))...) {}
        ^
external/libcxx/include/memory:4331:26: note: in instantiation of function template specialization 'std::__shared_ptr_emplace<v2::commonapi::CanInfoServiceProxy<>, std::allocator<v2::commonapi::CanInfoServiceProxy<>>>::__shared_ptr_emplace<std::shared_ptr<CommonAPI::Proxy> &>' requested here
    ::new(__hold2.get()) _CntrlBlk(__a2, _VSTD::forward<_Args>(__args)...);
                         ^
external/libcxx/include/memory:4710:29: note: in instantiation of function template specialization 'std::shared_ptr<v2::commonapi::CanInfoServiceProxy<>>::make_shared<std::shared_ptr<CommonAPI::Proxy> &>' requested here
    return shared_ptr<_Tp>::make_shared(_VSTD::forward<_Args>(__args)...);
                            ^
external/capicxx-core-runtime/include/CommonAPI/Runtime.hpp:56:25: note: in instantiation of function template specialization 'std::__1::make_shared<v2::commonapi::CanInfoServiceProxy<>, std::shared_ptr<CommonAPI::Proxy> &>' requested here
            return std::make_shared<ProxyClass_<AttributeExtensions_...>>(proxy);
                        ^
hardware/interfaces/automotive/vehicle/aidl/impl/user/communication/comm_soa/src/CommunicationSOAImpl.cpp:39:36: note: in instantiation of function template specialization 'CommonAPI::Runtime::buildProxy<v2::commonapi::CanInfoServiceProxy>' requested here
    canInfoServiceProxy = runtime->buildProxy<v2::commonapi::CanInfoServiceProxy>("local", "CanInfoService", "default");
                                   ^
1 error generated.
19:08:25 ninja failed with: exit status 1
#### failed to build some targets (12 seconds) ####
```

### Solution

bp文件添加

```bash
    rtti:true,
```

> RTTI（Run-Time Type Information，运行时类型信息）是 C++ 中的一种机制，允许程序在运行时获取对象的类型信息。通过 RTTI，程序可以在运行时检查和操作对象的类型，而不仅仅是在编译时进行类型检查。
