---
title: "Java：把成员变量赋值给局部变量（avoid getfield opcode）"
date: 2023-07-05
tags: ["Java", "JVM", "字节码"]
summary: "Java Note 问题积累 为什么许多源码地方把成员变量赋值给局部变量？是否有什么说法？ 参考资料： 1. Java为什么成员变量赋值给局部变量 avoid getfield opcode 成知节的博客 CSDN博客 2. jdk源码中为"
draft: false
visibility: public
---

# Java Note

## 问题积累

#### 为什么许多源码地方把成员变量赋值给局部变量？是否有什么说法？

参考资料：
1. [ Java为什么成员变量赋值给局部变量 avoid getfield opcode_成知节的博客-CSDN博客](https://blog.csdn.net/taugast/article/details/128705293?spm=1001.2101.3001.6650.9&utm_medium=distribute.pc_relevant.none-task-blog-2~default~BlogCommendFromBaidu~Rate-9-128705293-blog-123646516.235^v38^pc_relevant_sort_base3&depth_1-utm_source=distribute.pc_relevant.none-task-blog-2~default~BlogCommendFromBaidu~Rate-9-128705293-blog-123646516.235^v38^pc_relevant_sort_base3&utm_relevant_index=18)
2. [ jdk源码中为什么把成员变量赋值给局部变量再操作_为什么将方法参数重新分配给局部变量_yygr的博客-CSDN博客](https://blog.csdn.net/fengyuyeguirenenen/article/details/123646516?spm=1001.2101.3001.6650.14&utm_medium=distribute.pc_relevant.none-task-blog-2~default~CTRLIST~Rate-14-123646516-blog-114704210.235^v38^pc_relevant_sort_base3&depth_1-utm_source=distribute.pc_relevant.none-task-blog-2~default~CTRLIST~Rate-14-123646516-blog-114704210.235^v38^pc_relevant_sort_base3&utm_relevant_index=18)
3. http://mail.openjdk.java.net/pipermail/core-libs-dev/2010-May/004165.html
4. https://stackoverflow.com/questions/2785964/in-arrayblockingqueue-why-copy-final-member-field-into-local-final-variable

It's a coding style made popular by Doug Lea. It's an extreme optimization that probably isn't necessary; you can expect the JIT to make the same optimizations. (you can try to check the machine code yourself!) Nevertheless, copying to locals produces the smallest bytecode, and for low-level code it's nice to write code that's a little closer to the machine.
...copying to locals produces the smallest bytecode, and for low-level code it's nice to write code that's a little closer to the machine
这个是Doug Lea流行起来的. 这个是机器指令级别的代码优化方式. 为什么说是机器指令级别的优化呢?
他的目的是为了避免
avoid getfield opcode
简单来说就是让字节码指令更少或者用性能更好的字节码替代.
我们来看代码:
```java
package com.example.zyy.jvm.oom;
/**
 *
 **/
public class AvoidGetField {
    public Object a ;
    public AvoidGetField(Object a) {
        this.a = a;
    }
    /**
    * avoid getfield opcode
    */
    public static void main(String[] args) throws Exception {
        AvoidGetField oom = new AvoidGetField(new Object());
        System.out.println(oom.a);;
        System.out.println(oom.a);;
        System.out.println(oom.a);;
        Object b = oom.a;
        System.out.println(b);
        System.out.println(b);
        System.out.println(b);
    }
}
```
我们编译成字节码:
```java
public static void main(java.lang.String[]) throws java.lang.Exception;
    descriptor: ([Ljava/lang/String;)V
    flags: ACC_PUBLIC, ACC_STATIC
    Code:
      stack=4, locals=3, args_size=1
         0: new           #3                  // class com/example/zyy/jvm/oom/AvoidGetField
         3: dup
         4: new           #4                  // class java/lang/Object
         ...
        15: getstatic     #6                  // Field java/lang/System.out:Ljava/io/PrintStream;
        18: aload_1
        19: getfield      #2                  // Field a:Ljava/lang/Object;
        22: invokevirtual #7                  // Method java/io/PrintStream.println:(Ljava/lang/Object;)V
        25: getstatic     #6                  // Field java/lang/System.out:Ljava/io/PrintStream;
        28: aload_1
        29: getfield      #2                  // Field a:Ljava/lang/Object;
        32: invokevirtual #7                  // Method java/io/PrintStream.println:(Ljava/lang/Object;)V
        35: getstatic     #6                  // Field java/lang/System.out:Ljava/io/PrintStream;
        38: aload_1
        39: getfield      #2                  // Field a:Ljava/lang/Object;
        42: invokevirtual #7                  // Method java/io/PrintStream.println:(Ljava/lang/Object;)V
        45: aload_1
        46: getfield      #2                  // Field a:Ljava/lang/Object;
        49: astore_2
        50: getstatic     #6                  // Field java/lang/System.out:Ljava/io/PrintStream;
        53: aload_2
        54: invokevirtual #7                  // Method java/io/PrintStream.println:(Ljava/lang/Object;)V
        57: getstatic     #6                  // Field java/lang/System.out:Ljava/io/PrintStream;
        60: aload_2
        61: invokevirtual #7                  // Method java/io/PrintStream.println:(Ljava/lang/Object;)V
        64: getstatic     #6                  // Field java/lang/System.out:Ljava/io/PrintStream;
        67: aload_2
        68: invokevirtual #7                  // Method java/io/PrintStream.println:(Ljava/lang/Object;)V
        71: return
```
可以看到，getfield 这个字节码只出现了一次。
从三次到一次，这就是注释中写的“avoid getfield opcode”的具体意思。
确实是减少了生成的字节码，理论上这就是一种极端的字节码层面的优化。
具体到 getfield 这个命令来说，它干的事儿就是获取指定对象的成员变量，然后把这个成员变量的值、或者引用放入操作数栈顶。
更具体的说，getfield 这个命令就是在访问我们 MainTest 类中的 CHARS 变量。
往底层一点的说就是如果没有局部变量来承接一下，每次通过 getfield 方法都要访问堆里面的数据。
而让一个局部变量来承接一下，只需要第一次获取一次，之后都把这个堆上的数据，“缓存”到局部变量表里面，也就是搞到栈里面去。之后每次只需要调用 aload_ 字节码，把这个局部变量加载到操作栈上去就完事。
aload_ 的操作，比起 getfield 来说，是一个更加轻量级的操作。
这一点，从 JVM 文档中对于这两个指令的描述的长度也能看出来：
jvm getfield 指令长度
————————————————
