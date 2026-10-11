---
title: "空调 APP 滑动温度条崩溃（HVAC_TEMPERATURE_SET）"
date: 2026-06-16
tags: ["HVAC", "CarProperty", "崩溃"]
summary: "原因 CarService里面专门对HVAC TEMPERATURE SET配置做了修改 修改"
draft: false
visibility: public
---

```bash

--------- beginning of crash
06-12 15:27:58.308  9156  9156 E AndroidRuntime: FATAL EXCEPTION: main
06-12 15:27:58.308  9156  9156 E AndroidRuntime: Process: com.xxx.hvac, PID: 9156
06-12 15:27:58.308  9156  9156 E AndroidRuntime: java.lang.IllegalArgumentException: setProperty: value to set must exist in set of supported values. - value. - property ID: HVAC_TEMPERATURE_SET area ID: ROW_2_RIGHT|ROW_1_RIGHT, valueToSet: 32.0, supported values: [RawPropertyValue{typedValue=16.0}, RawPropertyValue{typedValue=16.5}, RawPropertyValue{typedValue=17.0}, RawPropertyValue{typedValue=17.5}, RawPropertyValue{typedValue=18.0}, RawPropertyValue{typedValue=18.5}, RawPropertyValue{typedValue=19.0}, RawPropertyValue{typedValue=19.5}, RawPropertyValue{typedValue=20.0}, RawPropertyValue{typedValue=20.5}, RawPropertyValue{typedValue=21.0}, RawPropertyValue{typedValue=21.5}, RawPropertyValue{typedValue=22.0}, RawPropertyValue{typedValue=22.5}, RawPropertyValue{typedValue=23.0}, RawPropertyValue{typedValue=23.5}, RawPropertyValue{typedValue=24.0}, RawPropertyValue{typedValue=24.5}, RawPropertyValue{typedValue=25.0}, RawPropertyValue{typedValue=25.5}, RawPropertyValue{typedValue=26.0}, RawPropertyValue{typedValue=26.5}, RawPropertyValue{typedValue=27.0}, RawPropertyValue{typedValue=27.5}, RawPropertyValue{typedValue=28.0}]
06-12 15:27:58.308  9156  9156 E AndroidRuntime:        at android.os.Parcel.createExceptionOrNull(Parcel.java:3377)
06-12 15:27:58.308  9156  9156 E AndroidRuntime:        at android.os.Parcel.createException(Parcel.java:3357)
06-12 15:27:58.308  9156  9156 E AndroidRuntime:        at android.os.Parcel.readException(Parcel.java:3340)
06-12 15:27:58.308  9156  9156 E AndroidRuntime:        at android.os.Parcel.readException(Parcel.java:3282)
06-12 15:27:58.308  9156  9156 E AndroidRuntime:        at android.car.hardware.property.ICarProperty$Stub$Proxy.setProperty(ICarProperty.java:755)
06-12 15:27:58.308  9156  9156 E AndroidRuntime:        at android.car.hardware.property.CarPropertyManager.lambda$setProperty$3(CarPropertyManager.java:2992)
06-12 15:27:58.308  9156  9156 E AndroidRuntime:        at android.car.hardware.property.CarPropertyManager.$r8$lambda$D25BzYto_s5Fw2qXlbmq0RR-DOg(Unknown Source:0)
06-12 15:27:58.308  9156  9156 E AndroidRuntime:        at android.car.hardware.property.CarPropertyManager$$ExternalSyntheticLambda4.call(D8$$SyntheticClass:0)
06-12 15:27:58.308  9156  9156 E AndroidRuntime:        at android.car.hardware.property.CarPropertyManager.runSyncOperation(CarPropertyManager.java:2585)
06-12 15:27:58.308  9156  9156 E AndroidRuntime:        at android.car.hardware.property.CarPropertyManager.setProperty(CarPropertyManager.java:2991)
06-12 15:27:58.308  9156  9156 E AndroidRuntime:        at android.car.hardware.property.CarPropertyManager.setFloatProperty(CarPropertyManager.java:3079)
06-12 15:27:58.308  9156  9156 E AndroidRuntime:        at com.xxx.hvac.manager.CarHvacManager.setRightTemp(CarHvacManager.java:130)
06-12 15:27:58.308  9156  9156 E AndroidRuntime:        at com.xxx.hvac.ui.fragment.AirConditionerFragment$1.handleMessage(AirConditionerFragment.java:90)
06-12 15:27:58.308  9156  9156 E AndroidRuntime:        at android.os.Handler.dispatchMessage(Handler.java:132)
06-12 15:27:58.308  9156  9156 E AndroidRuntime:        at android.os.Looper.dispatchMessage(Looper.java:333)
06-12 15:27:58.308  9156  9156 E AndroidRuntime:        at android.os.Looper.loopOnce(Looper.java:263)
06-12 15:27:58.308  9156  9156 E AndroidRuntime:        at android.os.Looper.loop(Looper.java:367)
06-12 15:27:58.308  9156  9156 E AndroidRuntime:        at android.app.ActivityThread.main(ActivityThread.java:9287)
06-12 15:27:58.308  9156  9156 E AndroidRuntime:        at java.lang.reflect.Method.invoke(Native Method)
06-12 15:27:58.308  9156  9156 E AndroidRuntime:        at com.android.internal.os.RuntimeInit$MethodAndArgsCaller.run(RuntimeInit.java:566)
06-12 15:27:58.308  9156  9156 E AndroidRuntime:        at com.android.internal.os.ZygoteInit.main(ZygoteInit.java:929)
06-12 15:27:58.314  9156  9156 I Process : Sending signal. PID: 9156 SIG: 9
```

### 原因

- CarService里面专门对HVAC_TEMPERATURE_SET配置做了修改

```java
// PropertyHalService.java
if (halPropId == VehicleProperty.HVAC_TEMPERATURE_SET) {
    // The config array for HVAC_TEMPERATURE_SET is defined as:
    // configArray[0] = [the lower bound of the supported temperature in Celsius] * 10.
    // configArray[1] = [the upper bound of the supported temperature in Celsius] * 10.
    // configArray[2] = [the increment in Celsius] * 10.
    // configArray[3] = [the lower bound of the supported temperature in Fahrenheit]
    // * 10.
    // configArray[4] = [the upper bound of the supported temperature in Fahrenheit]
    // * 10.
    // configArray[5] = [the increment in Fahrenheit] * 10.
    int[] configArray = halPropConfig.getConfigArray();
    if (configArray.length == HalPropConfig.HVAC_CONFIG_ARRAY_LENGTH) {
        int celsiusLowerBound = configArray[0];
        int celsiusUpperBound = configArray[1];
        int step = configArray[2];
        for (int temp = celsiusLowerBound; temp <= celsiusUpperBound; temp += step) {
            // The celsiusUpperBound, celsiusUpperBound and step is Celsius temp * 10.
            returnValues.add(new RawPropertyValue(temp / 10.f));
        }
    } else {
        return null;
    }
    // This is already sorted.
    return returnValues;
}
```

### 修改

```diff

       "comment": "minFloatValue and maxFloatValue in area config should match corresponding values in configArray",
       "configArray": [
         160,
-        280,
+        320,
         5,
         600,
-        840,
+        900,
         10
       ],
       "access": "VehiclePropertyAccess::READ_WRITE",
```
