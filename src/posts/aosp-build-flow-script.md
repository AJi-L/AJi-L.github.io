---
title: "【编译构建】AOSP 编译流程（脚本篇）"
date: 2025-10-08
tags: ["AOSP", "编译", "脚本"]
summary: "基本知识 + Android编译一般输入如下命令进行选择全编 + 单编 mm 、 mma 、 mmm 、 mmma 脚本篇 source envsetup.sh 源码解析 编译的第一步是运行 source build/envsetup.sh"
draft: false
visibility: public
---

# 基本知识

+ Android编译一般输入如下命令进行选择全编
```bash
source build/envsetup.sh
lunch <combo>
m -j 16
```

+ 单编
`mm`、`mma`、`mmm`、`mmma`
# 脚本篇

## source envsetup.sh

### 源码解析

编译的第一步是运行`source build/envsetup.sh`，逐步看下发生了什么。

```bash
# ...

T=$(_gettop_once)
if [ ! "$T" ]; then
    echo "Couldn't locate the top of the tree. Always source build/envsetup.sh from the root of the tree." >&2
    return 1
fi
IMPORTING_ENVSETUP=true source $T/build/make/shell_utils.sh

# ...

validate_current_shell
set_global_paths
source_vendorsetup
addcompletions
```

#### 获取TOP

1. 进入之后立马获取一次TOP，就是Android根目录；
2. 如果获取不到TOP，就输出提示，重定向到stderr；

#### 导入shell_utils.sh

1. 设置IMPORTING_ENVSETUP为true；
2. 导入shell_utils.sh；

#### validate_current_shell

+ 检测当前shell是否为bash或者zsh，bash是linux的shell，zsh是macOS的shell；都不是，提示警告；可以近似认为：**只有Linux（bash shell）或者macOS（zsh shell）才可以编译AOSP；**
```bash
function validate_current_shell() {
    local current_sh="$(ps -o command -p $$)"
    case "$current_sh" in
        *bash*)
            function check_type() { type -t "$1"; }
            ;;
        *zsh*)
            function check_type() { type "$1"; }
            enable_zsh_completion ;;
        *)
            echo -e "WARNING: Only bash and zsh are supported.\nUse of other shell would lead to erroneous results."
            ;;
    esac}
```

#### set_global_paths

+ 设置环境变量，这些环境变量包括build/soong/bin、build/bazel/bin、development/scripts、prebuilts/devtools/tools等；
+ 如果prebuilts/android-emulator/<system>/ 存在，就设置环境变量；

```bash
# Add directories to PATH that are NOT dependent on the lunch target.
# For directories that are lunch-specific, add them in set_lunch_paths
function set_global_paths()
{
    local T=$(gettop)
    if [ ! "$T" ]; then
        echo "Couldn't locate the top of the tree.  Try setting TOP."
        return
    fi

    ##################################################################
    #                                                                #
    #              Read me before you modify this code               #
    #                                                                #
    #   This function sets ANDROID_GLOBAL_BUILD_PATHS to what it is  #
    #   adding to PATH, and the next time it is run, it removes that #
    #   from PATH.  This is required so envsetup.sh can be sourced   #
    #   more than once and still have working paths.                 #
    #                                                                #
    ##################################################################

    # Out with the old...
    if [ -n "$ANDROID_GLOBAL_BUILD_PATHS" ] ; then
        export PATH=${PATH/$ANDROID_GLOBAL_BUILD_PATHS/}
    fi

    # And in with the new...
    ANDROID_GLOBAL_BUILD_PATHS=$T/build/soong/bin
    ANDROID_GLOBAL_BUILD_PATHS+=:$T/build/bazel/bin
    ANDROID_GLOBAL_BUILD_PATHS+=:$T/development/scripts
    ANDROID_GLOBAL_BUILD_PATHS+=:$T/prebuilts/devtools/tools

    # add kernel specific binaries
    if [ $(uname -s) = Linux ] ; then
        ANDROID_GLOBAL_BUILD_PATHS+=:$T/prebuilts/misc/linux-x86/dtc
        ANDROID_GLOBAL_BUILD_PATHS+=:$T/prebuilts/misc/linux-x86/libufdt
    fi

    # If prebuilts/android-emulator/<system>/ exists, prepend it to our PATH
    # to ensure that the corresponding 'emulator' binaries are used.
    case $(uname -s) in
        Darwin)
            ANDROID_EMULATOR_PREBUILTS=$T/prebuilts/android-emulator/darwin-x86_64
            ;;
        Linux)
            ANDROID_EMULATOR_PREBUILTS=$T/prebuilts/android-emulator/linux-x86_64
            ;;
        *)
            ANDROID_EMULATOR_PREBUILTS=
            ;;
    esac
    if [ -n "$ANDROID_EMULATOR_PREBUILTS" -a -d "$ANDROID_EMULATOR_PREBUILTS" ]; then
        ANDROID_GLOBAL_BUILD_PATHS+=:$ANDROID_EMULATOR_PREBUILTS
        export ANDROID_EMULATOR_PREBUILTS
    fi

    # Finally, set PATH
    export PATH=$ANDROID_GLOBAL_BUILD_PATHS:$PATH
}
```

#### source_vendorsetup

+ 如果发现1个allowed-vendorsetup_sh-files 文件存在，就加载 allowed-vendorsetup_sh-files 文件限定的 vendorsetup.sh 文件;
+ 如果发现多个allowed-vendorsetup_sh-files 文件存在，则会报错并停止加载；
+ 如果发现allowed-vendorsetup_sh-files 文件不存在， 加载指定目录下的 vendorsetup.sh 文件;

```bash

# Execute the contents of any vendorsetup.sh files we can find.
# Unless we find an allowed-vendorsetup_sh-files file, in which case we'll only
# load those.
#
# This allows loading only approved vendorsetup.sh files
function source_vendorsetup() {
    unset VENDOR_PYTHONPATH
    local T="$(gettop)"
    allowed=
    for f in $(cd "$T" && find -L device vendor product -maxdepth 4 -name 'allowed-vendorsetup_sh-files' 2>/dev/null | sort); do
        if [ -n "$allowed" ]; then
            echo "More than one 'allowed_vendorsetup_sh-files' file found, not including any vendorsetup.sh files:"
            echo "  $allowed"
            echo "  $f"
            return
        fi
        allowed="$T/$f"
    done

    allowed_files=
    [ -n "$allowed" ] && allowed_files=$(cat "$allowed")
    for dir in device vendor product; do
        for f in $(cd "$T" && test -d $dir && \
            find -L $dir -maxdepth 4 -name 'vendorsetup.sh' 2>/dev/null | sort); do

            if [[ -z "$allowed" || "$allowed_files" =~ $f ]]; then
                echo "including $f"; . "$T/$f"
            else
                echo "ignoring $f, not in $allowed"
            fi
        done
    done

    setup_cog_env_if_needed
}
```

#### addcompletions

+ 设置补全文件，用于做补全命令使用。（就是能不能tab出来）；

```bash
function addcompletions()
{
    local f=

    # Keep us from trying to run in something that's neither bash nor zsh.
    if [ -z "$BASH_VERSION" -a -z "$ZSH_VERSION" ]; then
        return
    fi

    # Keep us from trying to run in bash that's too old.
    if [ -n "$BASH_VERSION" -a ${BASH_VERSINFO[0]} -lt 3 ]; then
        return
    fi

    local completion_files=(
      packages/modules/adb/adb.bash
      system/core/fastboot/fastboot.bash
      tools/asuite/asuite.sh
    )
    # Completion can be disabled selectively to allow users to use non-standard completion.
    # e.g.
    # ENVSETUP_NO_COMPLETION=adb # -> disable adb completion
    # ENVSETUP_NO_COMPLETION=adb:bit # -> disable adb and bit completion
    local T=$(gettop)
    for f in ${completion_files[*]}; do
        f="$T/$f"
        if [ ! -f "$f" ]; then
          echo "Warning: completion file $f not found"
        elif should_add_completion "$f"; then
            . $f
        fi
    done

    if [ -z "$ZSH_VERSION" ]; then
        # Doesn't work in zsh.
        complete -o nospace -F _croot croot
        # TODO(b/244559459): Support b autocompletion for zsh
        complete -F _bazel__complete -o nospace b
    fi
    complete -F _lunch lunch
    complete -F _lunch_completion lunch2

    complete -F _complete_android_module_names pathmod
    complete -F _complete_android_module_names gomod
    complete -F _complete_android_module_names outmod
    complete -F _complete_android_module_names installmod
    complete -F _complete_android_module_names m
}
```

#### 其他命令

其实 source 某个脚本后， 脚本内的函数是可以直接调用的；例如附录下的命令，有许多都是定义在 envsetup.sh 脚本中的；

在Android14及以前，这些大部分命令都是在 envsetup.sh 脚本中， Android15开始，将这些命令挪到了build/soong/bin中；

### 总结

+ 获取一次根目录；
+ 导入shell_utils.sh；
+ 校验shell ->  设置**全局环境变量** -> **查找加载供应商vendorsetup.sh脚本** -> 完成命令补全操作；
+ 提供其他便捷命令；
+ unset了一些命令，这些命令一开始写在envsetup.sh的脚本，后来都放在soong系统里面了，因此需要unset；

### 附录：脚本的命令

| 方法名                      | 功能描述                                                     |
| --------------------------- | ------------------------------------------------------------ |
| `_gettop_once`              | 查找并返回项目的根目录路径。                                 |
| `hmm`                       | 显示帮助信息，列出所有可用的函数及其用途。                   |
| `build_build_var_cache`     | 缓存构建变量，以便快速获取构建系统中的变量值。               |
| `destroy_build_var_cache`   | 清除构建变量缓存。                                           |
| `get_abs_build_var`         | 获取构建变量的绝对路径值。                                   |
| `get_build_var`             | 获取构建变量的精确值。                                       |
| `check_product`             | 检查指定的产品是否可以构建。                                 |
| `check_variant`             | 检查指定的变体是否有效。                                     |
| `set_lunch_paths`           | 设置与`lunch`目标相关的环境路径。                            |
| `set_global_paths`          | 设置与全局环境相关的路径。                                   |
| `printconfig`               | 打印当前构建配置信息。                                       |
| `set_stuff_for_environment` | 设置构建环境所需的基本变量和路径。                           |
| `set_sequence_number`       | 设置构建环境的序列号。                                       |
| `should_add_completion`     | 检查是否应为某个命令添加补全功能。                           |
| `addcompletions`            | 添加命令补全功能（支持bash和zsh）。                          |
| `multitree_lunch_help`      | 显示`multitree_lunch`的帮助信息。                            |
| `multitree_lunch`           | 配置多树构建环境，设置产品和变体组合。                       |
| `choosetype`                | 选择构建类型（release或debug）。                             |
| `chooseproduct`             | 选择要构建的产品。                                           |
| `choosevariant`             | 选择构建变体（如eng、userdebug等）。                         |
| `choosecombo`               | 综合选择构建类型、产品和变体。                               |
| `add_lunch_combo`           | （已废弃）添加新的`lunch`组合选项。                          |
| `print_lunch_menu`          | 打印常见的`lunch`组合菜单。                                  |
| `lunch`                     | 配置构建环境，选择产品和变体组合。                           |
| `tapas`                     | 配置构建环境以构建独立的应用程序（APK）。                    |
| `banchan`                   | 配置构建环境以构建独立的模块（APEX）。                       |
| `croot`                     | 切换到项目根目录或其子目录。                                 |
| `m`                         | 从项目根目录开始构建。                                       |
| `mm`                        | 构建当前目录下的模块及其依赖项。                             |
| `mmm`                       | 构建指定目录下的模块及其依赖项。                             |
| `mma`                       | 同`mm`，但会强制重新构建。                                   |
| `mmma`                      | 同`mmm`，但会强制重新构建。                                  |
| `provision`                 | 使用`fastboot`刷入设备所需的分区镜像。                       |
| `cgrep`                     | 在本地C/C++文件中进行搜索。                                  |
| `ggrep`                     | 在本地Gradle文件中进行搜索。                                 |
| `gogrep`                    | 在本地Go文件中进行搜索。                                     |
| `jgrep`                     | 在本地Java文件中进行搜索。                                   |
| `jsongrep`                  | 在本地JSON文件中进行搜索。                                   |
| `ktgrep`                    | 在本地Kotlin文件中进行搜索。                                 |
| `resgrep`                   | 在本地资源文件（`.xml`）中进行搜索。                         |
| `mangrep`                   | 在本地`AndroidManifest.xml`文件中进行搜索。                  |
| `mgrep`                     | 在本地Makefile和`.bp`文件中进行搜索。                        |
| `owngrep`                   | 在本地`OWNERS`文件中进行搜索。                               |
| `rsgrep`                    | 在本地Rust文件中进行搜索。                                   |
| `sepgrep`                   | 在本地sepolicy文件中进行搜索。                               |
| `sgrep`                     | 在本地源代码文件中进行搜索。                                 |
| `tomlgrep`                  | 在本地Toml文件中进行搜索。                                   |
| `pygrep`                    | 在本地Python文件中进行搜索。                                 |
| `godir`                     | 跳转到包含指定文件的目录。                                   |
| `allmod`                    | 列出所有模块。                                               |
| `gomod`                     | 跳转到指定模块所在的目录。                                   |
| `bmod`                      | 获取Soong模块的Bazel标签（如果已转换）。                     |
| `pathmod`                   | 获取指定模块所在的目录。                                     |
| `outmod`                    | 获取指定模块安装输出的位置（带特定扩展名）。                 |
| `dirmods`                   | 获取指定目录中定义的模块列表。                               |
| `installmod`                | 使用`adb`安装指定模块的APK。                                 |
| `refreshmod`                | 刷新模块列表以供`allmod`、`gomod`、`pathmod`、`outmod`、`installmod`使用。 |
| `syswrite`                  | 将分区（如`system.img`）挂载为可写，并在必要时重启设备。     |
| =======                     |                                                              |

## lunch命令

源码解析

+ lunch命令的源码还是在envsetup.sh脚本中

```bash
function lunch()
{
	# 如果只有1个参数并且参数为--help，显示帮助
    if [[ $# -eq 1 && $1 = "--help" ]]; then
        _lunch_usage
        return 0
    fi

    # 没有参数或者参数大于3个，提示并返回
    if [[ $# -eq 0 ]]; then
        echo "No target specified. See lunch --help" 1>&2
        return 1
    fi
    if [[ $# -gt 3 ]]; then
        echo "Too many parameters given. See lunch --help" 1>&2
        return 1
    fi

	# 3个重要的变量
    local product release variant

	# 从参数中提取3个变量；
	# 旧格式处理方式，带-的选项就是旧格式，如果解析出来任一变量为空，就报错；
	# 如果不带-，就按照新格式处理；
    # Handle the legacy format
    local legacy=$(echo $1 | grep "-")
    if [[ $# -eq 1 && -n $legacy ]]; then
        IFS="-" read -r product release variant <<< "$1"
        if [[ -z "$product" ]] || [[ -z "$release" ]] || [[ -z "$variant" ]]; then
            echo "Invalid lunch combo: $1" 1>&2
            echo "Valid combos must be of the form <product>-<release>-<variant> when using" 1>&2
            echo "the legacy format.  Run 'lunch --help' for usage." 1>&2
            return 1
        fi
    fi

	# 新格式只要product， 其他两个默认为trunk_staging和eng
    # Handle the new format.
    if [[ -z $legacy ]]; then
        product=$1
        release=$2
        if [[ -z $release ]]; then
            release=trunk_staging
        fi
        variant=$3
        if [[ -z $variant ]]; then
            variant=eng
        fi
    fi

	# 下一步调用
    # Validate the selection and set all the environment stuff
    _lunch_meat $product $release $variant
}
```

1. 设置环境变量和调用build_build_var_cache，缓存编译要用到的变量；
2. 检查build_build_var_cache是否执行成功；
3. 从缓存里面导出TARGET_PRODUCT和TARGET_BUILD_VARIANT环境变量；
4. export TARGET_RELEASE、 TARGET_BUILD_TYPE等环境变量；
5. 判断是否开启安静模式，安静模式就不输出；非安静模式下，如果还有spam_for_lunch脚本，就把这个脚本也加载；
6. set_stuff_for_environment，里面是设置了其他一些环境变量；
7. 检查多用户配置；

```bash
function _lunch_meat()
{
    local product=$1  # 定义局部变量 product，赋值为第一个参数
    local release=$2  # 定义局部变量 release，赋值为第二个参数
    local variant=$3  # 定义局部变量 variant，赋值为第三个参数

    # 设置环境变量并调用 build_build_var_cache 函数缓存构建变量
    TARGET_PRODUCT=$product \
    TARGET_RELEASE=$release \
    TARGET_BUILD_VARIANT=$variant \
    build_build_var_cache

    # 检查 build_build_var_cache 的执行结果是否成功
    if [ $? -ne 0 ]; then
        # 如果 product 包含 "_eng"、"_user" 或 "_userdebug"，提示用户可能是下划线使用错误
        if [[ "$product" =~ .*_(eng|user|userdebug) ]]; then
            echo "Did you mean -${product/*_/}? (dash instead of underscore)"
        fi
        return 1  # 返回错误码 1 表示失败
    fi

    # 从缓存中获取并导出最终的 TARGET_PRODUCT 和 TARGET_BUILD_VARIANT 环境变量
    export TARGET_PRODUCT=$(_get_build_var_cached TARGET_PRODUCT)
    export TARGET_BUILD_VARIANT=$(_get_build_var_cached TARGET_BUILD_VARIANT)

    # 导出其他必要的环境变量
    export TARGET_RELEASE=$release  # 导出 TARGET_RELEASE 变量
    # 注意：这里的 "release" 是一个固定的字符串，而不是变量的值
    export TARGET_BUILD_TYPE=release

    # 如果未设置 ANDROID_QUIET_BUILD（安静模式），则打印空行
    [[ -n "${ANDROID_QUIET_BUILD:-}" ]] || echo

    # 调用 set_stuff_for_environment 设置构建环境
    set_stuff_for_environment
    # 如果未启用安静模式，则打印当前配置信息
    [[ -n "${ANDROID_QUIET_BUILD:-}" ]] || printconfig

    # 如果未启用安静模式，并且存在 spam_for_lunch 脚本，则运行该脚本提供额外提示
    if [[ -z "${ANDROID_QUIET_BUILD}" ]]; then
        local spam_for_lunch=$(gettop)/build/make/tools/envsetup/spam_for_lunch
        if [[ -x $spam_for_lunch ]]; then
            $spam_for_lunch
        fi
    fi

    # 清理构建变量缓存
    destroy_build_var_cache

    # 如果设置了 CHECK_MU_CONFIG，则检查多用户配置
    if [[ -n "${CHECK_MU_CONFIG:-}" ]]; then
      check_mu_config
    fi
}
```

## 总结

+ 加载了一堆环境变量；

## m命令

### 源码解析

+ 一般我们敲命令的时候是敲m -j 32，然后在这里会编程，执行命令的时候，一般在android根目录下面以rootpath替代

#### m

```bash
# 引入 shell_utils.sh 脚本，该脚本通常包含一些辅助函数。
# $(dirname $BASH_SOURCE) 获取当前脚本所在的目录，然后通过 cd 和 pwd 找到其绝对路径，
# 最终定位到 ../../make/shell_utils.sh 文件并加载它。
source $(cd $(dirname $BASH_SOURCE) &> /dev/null && pwd)/../../make/shell_utils.sh

# 调用 require_top 函数，确保环境变量 $TOP 已正确设置为项目的顶级目录。
# 如果 $TOP 未设置或无效，require_top 可能会报错并退出脚本。
require_top

# 调用 _wrap_build 函数，执行 Soong 构建系统的核心逻辑。
# 参数说明：
# "$TOP/build/soong/soong_ui.bash"：指定要运行的构建脚本（Soong 的入口脚本）。
# --build-mode：以build模式运行 Soong。
# --all-modules：编译所有模块。
# --dir="$(pwd)"：指定当前工作目录作为build的上下文。
# "$@"：将脚本接收到的所有参数传递给 soong_ui.bash。
_wrap_build "$TOP/build/soong/soong_ui.bash" --build-mode --all-modules --dir="$(pwd)" "$@"

# 返回上一步命令的退出状态码，决定脚本是否成功执行。
# 如果构建成功，返回 0；否则返回非零值表示失败。
exit $?
```

#### _wrap_build

+ 如果是安静模式，就直接运行了；
+ 如果不是安静模式，会先后打印一些信息；
+ 这里其实没有实际编译作用，但是是个可以借鉴的脚本写法；
+ 去掉这些杂七杂八的，命令是**"$TOP/build/soong/soong_ui.bash" --build-mode --all-modules --dir=rootpath -j 32**

```bash
# 漂亮地打印构建状态和持续时间
function _wrap_build()
{
    # 如果设置了 ANDROID_QUIET_BUILD 为 true，则直接执行传入的命令，不显示额外信息
    if [[ "${ANDROID_QUIET_BUILD:-}" == true ]]; then
      "$@"
      return $?
    fi

    # 记录构建开始时间（以秒为单位）
    local start_time=$(date +"%s")

    # 执行传入的命令（"$@" 表示所有参数）
    "$@"

    # 获取命令的返回值（构建结果）
    local ret=$?

    # 记录构建结束时间
    local end_time=$(date +"%s")

    # 计算构建总耗时（秒数）
    local tdiff=$(($end_time-$start_time))

    # 将总耗时转换为小时、分钟和秒
    local hours=$(($tdiff / 3600 ))     # 总耗时除以 3600 得到小时数
    local mins=$((($tdiff % 3600) / 60)) # 剩余时间除以 60 得到分钟数
    local secs=$(($tdiff % 60))         # 剩余时间为秒数

    # 检查终端是否支持颜色输出（通过 tput colors 判断）
    local ncolors=$(tput colors 2>/dev/null)
    if [ -n "$ncolors" ] && [ $ncolors -ge 8 ]; then
        # 如果支持 8 色及以上，定义颜色变量
        color_failed=$'\E'"[0;31m"   # 红色，表示失败
        color_success=$'\E'"[0;32m" # 绿色，表示成功
        color_warning=$'\E'"[0;33m" # 黄色，表示警告
        color_reset=$'\E'"[00m"     # 重置颜色
    else
        # 如果不支持颜色输出，清空颜色变量
        color_failed=""
        color_success=""
        color_reset=""
    fi

    # 打印空行，用于分隔输出
    echo

    # 根据构建结果打印不同的消息
    if [ $ret -eq 0 ] ; then
        # 如果构建成功，打印绿色的成功消息
        echo -n "${color_success}#### build completed successfully "
    else
        # 如果构建失败，打印红色的失败消息
        echo -n "${color_failed}#### failed to build some targets "
    fi

    # 根据耗时的不同范围，格式化输出时间
    if [ $hours -gt 0 ] ; then
        # 如果耗时超过 1 小时，显示小时、分钟和秒
        printf "(%02d:%02d:%02d (hh:mm:ss))" $hours $mins $secs
    elif [ $mins -gt 0 ] ; then
        # 如果耗时超过 1 分钟但不足 1 小时，显示分钟和秒
        printf "(%02d:%02d (mm:ss))" $mins $secs
    elif [ $secs -gt 0 ] ; then
        # 如果耗时不足 1 分钟，仅显示秒数
        printf "(%d seconds)" $secs
    fi

    # 打印结束标志并重置颜色
    echo " ####${color_reset}"

    # 打印空行，用于分隔输出
    echo

    # 返回构建命令的原始退出码
    return $ret
}
```

#### soong_ui.bash

+ 前面加载工具类、记录时间、检查TOP变量、输出环境变量等等；
+ 加载microfactory.bash脚本；
+ 编译soong_ui、mk2rbc、rbcrun、release-config 4个工具；
+ "$(getoutdir)/soong_ui" "$@" -->  **$(getoutdir)/soong_ui --build-mode --all-modules --dir=rootpath -j 32**

```bash
# 引入 shell_utils.sh 脚本，提供一些辅助函数。
# 通过 $(dirname $BASH_SOURCE) 获取当前脚本所在的目录，然后定位到 ../make/shell_utils.sh 文件并加载它。
source $(cd $(dirname $BASH_SOURCE) &> /dev/null && pwd)/../make/shell_utils.sh

# 确保环境变量 $TOP 已正确设置为项目的顶级目录。
require_top

# 记录 Soong 构建系统启动的时间戳，用于后续性能分析。
case $(uname -s) in
  Darwin) # 如果操作系统是 macOS
    export TRACE_BEGIN_SOONG=`$TOP/prebuilts/build-tools/path/darwin-x86/date +%s%3N`
    ;;
  *) # 其他操作系统（如 Linux）
    export TRACE_BEGIN_SOONG=$(date +%s%N)
    ;;
esac

# 设置 COG 环境（如果需要），COG 是 Android 构建系统中的一个工具。
setup_cog_env_if_needed

# 保存当前的工作目录（PWD），以便在 soong_ui 中使用。
export ORIGINAL_PWD=${PWD}

# 获取项目的顶级目录并导出为环境变量 $TOP。
export TOP=$(gettop)

# 加载 Soong 构建系统的微工厂脚本 microfactory.bash。
source ${TOP}/build/soong/scripts/microfactory.bash

# 使用 soong_build_go 编译多个 Go 语言工具：
# 1. soong_ui：Soong 的核心构建工具。
soong_build_go soong_ui android/soong/cmd/soong_ui
# 2. mk2rbc：将 Makefile 转换为 RBC（Rule-Based Compilation）格式的工具。
soong_build_go mk2rbc android/soong/mk2rbc/mk2rbc
# 3. rbcrun：运行 RBC 文件的工具。
soong_build_go rbcrun rbcrun/rbcrun
# 4. release-config：生成发布配置的工具。
soong_build_go release-config android/soong/cmd/release_config/release_config

# 切换到项目的顶级目录。
cd ${TOP}

# 执行编译好的 soong_ui 工具，并将所有传入参数传递给它。
exec "$(getoutdir)/soong_ui" "$@"
```

#### build/soong/scripts/microfactory.bash

1. 设置go环境变量；

```bash
# 输入变量：
#  ${TOP}: Android 源码树的顶层目录
#  ${OUT_DIR}: 输出目录位置（默认为 ${TOP}/out）
#  ${OUT_DIR_COMMON_BASE}: 更改默认输出目录为
#    ${OUT_DIR_COMMON_BASE}/$(basename ${TOP})

# 确保 GOROOT 设置为树内的版本。
# 根据操作系统设置 GOROOT 环境变量。
case $(uname) in
    Linux)
        # 对于 Linux 系统，将 GOROOT 设置为 Linux x86 的预编译 Go 二进制文件路径
        export GOROOT="${TOP}/prebuilts/go/linux-x86/"
        ;;
    Darwin)
        # 对于 macOS 系统，将 GOROOT 设置为 macOS x86 的预编译 Go 二进制文件路径
        export GOROOT="${TOP}/prebuilts/go/darwin-x86/"
        ;;
    *)
        # 如果操作系统不被识别，打印错误信息并退出
        echo "未知的操作系统:" $(uname) >&2 && exit 1;;
esac

# 函数：获取输出目录
# 此函数确定构建输出的位置。
function getoutdir
{
    # 获取 OUT_DIR 的值，如果未设置则使用空字符串
    local out_dir="${OUT_DIR-}"

    # 如果 OUT_DIR 未设置，则检查 OUT_DIR_COMMON_BASE 是否设置
    if [ -z "${out_dir}" ]; then
        if [ "${OUT_DIR_COMMON_BASE-}" ]; then
            # 如果 OUT_DIR_COMMON_BASE 已设置，则构造输出目录路径
            out_dir="${OUT_DIR_COMMON_BASE}/$(basename ${TOP})"
        else
            # 否则，使用默认输出目录 'out'
            out_dir="out"
        fi
    fi

    # 如果输出目录不是绝对路径，则在其前面加上 TOP 以使其成为绝对路径
    if [[ "${out_dir}" != /* ]]; then
        out_dir="${TOP}/${out_dir}"
    fi

    # 打印确定的输出目录路径
    echo "${out_dir}"
}

# 函数：引导 microfactory 从源代码构建请求的二进制文件（如果必要）
# 参数：
#  $1: 请求的二进制文件名称
#  $2: 包名称
function soong_build_go
{
    # 设置构建所需的环境变量
    BUILDDIR=$(getoutdir) \                # 输出目录
    SRCDIR=${TOP} \                        # Android 源码树的顶层目录
    BLUEPRINTDIR=${TOP}/build/blueprint \  # Blueprint 目录
    EXTRA_ARGS="-pkg-path android/soong=${TOP}/build/soong \
                -pkg-path prebuilts/bazel/common/proto=${TOP}/prebuilts/bazel/common/proto \
                -pkg-path rbcrun=${TOP}/build/make/tools/rbcrun \
                -pkg-path google.golang.org/protobuf=${TOP}/external/golang-protobuf \
                -pkg-path go.starlark.net=${TOP}/external/starlark-go" \

    # 调用 build_go 函数，并传递提供的参数和额外参数
    build_go $@
}

# 引入 microfactory 脚本以包含其函数和配置
source ${TOP}/build/blueprint/microfactory/microfactory.bash
```

#### build/blueprint/microfactory/microfactory.bash

+ 检查microfactory bin文件是否已经生成（out目录下，bin文件是microfactory_<系统类型后缀>，我的是microfactory_Linux）
  + 如果没有生成 --> 使用 sed 命令将 package microfactory 改为 package main，并在文件末尾添加 main 函数调用 Main() --> go run编译microfactory .go；
  + 如果已经存在 --> 使用已经存在的microfactory；
+ 组件编译参数，使用microfactory_Linux bin文件编译指定模块；
+ 如果microfactory_Linux 从源码编译，更新版本号；

> 1. microfactory 模块2021年前会在[github](https://github.com/google/blueprint)上进行维护，2021 年 5 月 3 日后，github上存档，AOSP内继续更新，并且 AOSP 中的 Blueprint 源代码树最终将不再在 Android 之外使用；（意思是以前microfactory可以运用在其他方面，归档之后仅能运用于Android了）；

```bash
# 一组用于使用 microfactory 构建和运行 Go 代码的实用函数
#
# 输入变量：
#  ${GOROOT}
#  ${BUILDDIR}
#  ${BLUEPRINTDIR}
#  ${SRCDIR}

# 引导 microfactory 从源代码构建请求的二进制文件（如果必要）
#
# 参数：
#  $1: 请求的二进制文件名称
#  $2: 包名称
#  ${EXTRA_ARGS}: 传递给 microfactory 的额外参数 (-pkg-path 等)
function build_go
{
    # 当 microfactory 发生足够大的变化以至于无法重新构建自身时递增。
    # 例如，如果我们使用了一个旧版本不支持的新命令行参数。
    local mf_version=3

    local mf_src="${BLUEPRINTDIR}/microfactory"
    local mf_bin="${BUILDDIR}/microfactory_$(uname)"
    local mf_version_file="${BUILDDIR}/.microfactory_$(uname)_version"
    local built_bin="${BUILDDIR}/$1"
    local from_src=1

    # 检查 microfactory 二进制文件和版本文件是否存在，并且版本匹配
    if [ -f "${mf_bin}" ] && [ -f "${mf_version_file}" ]; then
        if [ "${mf_version}" -eq "$(cat "${mf_version_file}")" ]; then
            from_src=0
        fi
    fi

    local mf_cmd
    if [ $from_src -eq 1 ]; then
        # `go run` 需要一个单一的主包，因此创建一个
        local gen_src_dir="${BUILDDIR}/.microfactory_$(uname)_intermediates/src"
        mkdir -p "${gen_src_dir}"
        sed "s/^package microfactory/package main/" "${mf_src}/microfactory.go" >"${gen_src_dir}/microfactory.go"
        printf "\n//for use with go run\nfunc main() { Main() }\n" >>"${gen_src_dir}/microfactory.go"

        mf_cmd="${GOROOT}/bin/go run ${gen_src_dir}/microfactory.go"
    else
        mf_cmd="${mf_bin}"
    fi

    # 删除之前的跟踪文件
    rm -f "${BUILDDIR}/.$1.trace"
    # GOROOT 必须是绝对路径，因为 `go run` 会更改当前目录
    GOROOT=$(cd $GOROOT; pwd) ${mf_cmd} -b "${mf_bin}" \
            -pkg-path "github.com/google/blueprint=${BLUEPRINTDIR}" \
            -trimpath "${SRCDIR}" \
            ${EXTRA_ARGS} \
            -o "${built_bin}" $2

    # 如果构建成功并且是从源代码构建的，则更新版本文件
    if [ $? -eq 0 ] && [ $from_src -eq 1 ]; then
        echo "${mf_version}" >"${mf_version_file}"
    fi
}
```

### 命令推演

+ 至此，暂时回到soong_ui.bash

```bash
soong_build_go soong_ui android/soong/cmd/soong_ui
↓
↓
↓
↓
# soong_build_go 函数内部
BUILDDIR=$(getoutdir) \                # 输出目录
SRCDIR=${TOP} \                        # Android 源码树的顶层目录
BLUEPRINTDIR=${TOP}/build/blueprint \  # Blueprint 目录
EXTRA_ARGS="-pkg-path android/soong=${TOP}/build/soong \
            -pkg-path prebuilts/bazel/common/proto=${TOP}/prebuilts/bazel/common/proto \
            -pkg-path rbcrun=${TOP}/build/make/tools/rbcrun \
            -pkg-path google.golang.org/protobuf=${TOP}/external/golang-protobuf \
            -pkg-path go.starlark.net=${TOP}/external/starlark-go"
build_go soong_ui android/soong/cmd/soong_ui
↓
↓
↓
↓
# build_go 函数内部
local mf_version=3
local mf_src="${BLUEPRINTDIR}/microfactory"
local mf_bin="${BUILDDIR}/microfactory_$(uname)"
local mf_version_file="${BUILDDIR}/.microfactory_$(uname)_version"
local built_bin="${BUILDDIR}/soong_ui"
local from_src=1
GOROOT=$(cd $GOROOT; pwd) ${mf_cmd} -b "${mf_bin}" \
        -pkg-path "github.com/google/blueprint=${BLUEPRINTDIR}" \
        -trimpath "${SRCDIR}" \
        ${EXTRA_ARGS} \
        -o "${built_bin}" android/soong/cmd/soong_ui
↓
↓
↓
↓
# 最终版本
cd TOP/prebuilts/go/linux-x86/  # linux中go的环境变量路径
pwd # 打印绝对路径
GOROOT=$(cd $GOROOT; pwd) # 赋值绝对路径给GOROOT，因为上面说go run会导致相对路径有问题
# 如果是源码编译
${TOP}/prebuilts/go/linux-x86/bin/go run ${TOP}/out/.microfactory_Linux_intermediates/src/microfactory.go -b microfactory_Linux \
-pkg-path "github.com/google/blueprint=/build/blueprint=${TOP}/build/blueprint/microfactory" \
-trimpath ${TOP} \
-pkg-path android/soong=${TOP}/build/soong \
            -pkg-path prebuilts/bazel/common/proto=${TOP}/prebuilts/bazel/common/proto \
            -pkg-path rbcrun=${TOP}/build/make/tools/rbcrun \
            -pkg-path google.golang.org/protobuf=${TOP}/external/golang-protobuf \
            -pkg-path go.starlark.net=${TOP}/external/starlark-go"
            -o "/out/soong_ui" android/soong/cmd/soong_ui
# 如果是生成物
microfactory_Linux -b microfactory_Linux \
-pkg-path "github.com/google/blueprint=/build/blueprint=${TOP}/build/blueprint/microfactory" \
-trimpath ${TOP} \
-pkg-path android/soong=${TOP}/build/soong \
            -pkg-path prebuilts/bazel/common/proto=${TOP}/prebuilts/bazel/common/proto \
            -pkg-path rbcrun=${TOP}/build/make/tools/rbcrun \
            -pkg-path google.golang.org/protobuf=${TOP}/external/golang-protobuf \
            -pkg-path go.starlark.net=${TOP}/external/starlark-go"
            -o "/out/soong_ui" android/soong/cmd/soong_ui
```

> 其他3条mk2rbc、rbcrun、release-config的编译命令一样，可以自行推理；

+ 总结：
  + microfactory是一个go语言写的编译框架，使用go语言编译，以前可以在许多领域通用，2021年后仅在AOSP适用；
  + 封装了build_go和soong_build_go两个方法，使用microfactory编译了soong_ui、mk2rbc、rbcrun、release-config命令；
  + 得到soong_ui后，直接使用soong_ui命令；
  + 于是编译命令变成了**out/soong_ui --build-mode --all-modules --dir=rootpath -j 32**
