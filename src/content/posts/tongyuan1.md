---
title: "通信原理复习1"
description: "通信原理复习的第一篇笔记，写给自己看的，包括一些正确或者不正确的废话。"
category: "通信原理考研"
tags: ["通信原理", "考研复习","笔记"]
draft: true
---

## 1. 数学基础

1. 复数

    (1) 基础运算

    复数可以写成代数形式和极坐标形式：
    $$
    \begin{aligned}
    x&=a+jb=Ae^{j\theta}\\
    A&=|x|=\sqrt{a^2+b^2}\\
    \theta&=\arctan\frac{b}{a}
    \end{aligned}
    $$

    共轭、实部和虚部：
    $$
    \begin{aligned}
    x^*&=a-jb\\
    \operatorname{Re}[x]&=\frac{x+x^*}{2}\\
    \operatorname{Im}[x]&=\frac{x-x^*}{2j}
    \end{aligned}
    $$

    对复指数：
    $$
    (e^{j\theta})^*=e^{-j\theta},\qquad |e^{j\theta}|=1
    $$

    (2) 欧拉公式

    $$
    \begin{aligned}
    e^{jx}&=\cos x+j\sin x\\
    e^{-jx}&=\cos x-j\sin x\\
    \cos x&=\frac{1}{2}(e^{jx}+e^{-jx})\\
    \sin x&=\frac{1}{2j}(e^{jx}-e^{-jx})
    \end{aligned}
    $$

2. 对数

    (1) 基础公式

    $$
    \begin{aligned}
    \log_a xy&=\log_a x+\log_a y\\
    \log_a \frac{x}{y}&=\log_a x-\log_a y\\
    \log_a x^y&=y\log_a x\\
    \log_a b&=\frac{\log_c b}{\log_c a}
    \end{aligned}
    $$

    (2) 分贝

    分贝用于描述两个功率相关量之间的倍数关系：
    $$
    dB=10\log_{10}x,\qquad 10\log_{10}2\approx3dB
    $$



3. 几何基础

    (1) 直线

    任意直线可以写成：
    $$
    f(x)=ax+b
    $$

    过原点时：
    $$
    f(x)=ax
    $$

    其中 $a$ 是斜率。

    (2) 圆的割线

    半径为 $r$，圆心角为 $\alpha$ 时，割线长度：
    $$
    d=2r\sin\frac{\alpha}{2}
    $$

4. 三角函数

    (1) 定义和基本性质

    $$
    \sin\alpha=\frac{a}{r},\qquad \cos\alpha=\frac{b}{r}
    $$

    $$
    \begin{aligned}
    \sin\alpha&=\cos(\frac{\pi}{2}-\alpha)\\
    \cos\alpha&=\sin(\frac{\pi}{2}-\alpha)\\
    \sin(-\alpha)&=-\sin\alpha\\
    \cos(-\alpha)&=\cos\alpha\\
    \sin(\alpha\pm\pi)&=-\sin\alpha\\
    \cos(\alpha\pm\pi)&=-\cos\alpha
    \end{aligned}
    $$

    (2) 相位

    相位描述三角信号在一个周期中的位置。常见参考点：
    $$
    0^\circ,\quad 90^\circ,\quad 180^\circ,\quad 270^\circ
    $$


    (3) 积分特性

    若 $f_0=\frac{1}{T}$，在整数个周期上：
    $$
    \int_0^T \cos(2\pi nf_0t+\theta)dt=0,\qquad
    \int_0^T \sin(2\pi nf_0t+\theta)dt=0
    $$
    >完整周期三角函数的积分值为零
    

    (4) 和角公式

    $$
    \begin{aligned}
    \sin(\alpha+\beta)&=\sin\alpha\cos\beta+\cos\alpha\sin\beta\\
    \cos(\alpha+\beta)&=\cos\alpha\cos\beta-\sin\alpha\sin\beta\\
    \sin(\alpha-\beta)&=\sin\alpha\cos\beta-\cos\alpha\sin\beta\\
    \cos(\alpha-\beta)&=\cos\alpha\cos\beta+\sin\alpha\sin\beta
    \end{aligned}
    $$

    特别地：
    $$
    \sin2\alpha=2\sin\alpha\cos\alpha
    $$
    $$
    \cos2\alpha=\cos^2\alpha-\sin^2\alpha=2\cos^2\alpha-1=1-2\sin^2\alpha
    $$

    (5) 和差化积

    $$
    \begin{aligned}
    \sin\alpha+\sin\beta&=2\sin\frac{\alpha+\beta}{2}\cos\frac{\alpha-\beta}{2}\\
    \cos\alpha+\cos\beta&=2\cos\frac{\alpha+\beta}{2}\cos\frac{\alpha-\beta}{2}\\
    \sin\alpha-\sin\beta&=2\cos\frac{\alpha+\beta}{2}\sin\frac{\alpha-\beta}{2}\\
    \cos\alpha-\cos\beta&=-2\sin\frac{\alpha+\beta}{2}\sin\frac{\alpha-\beta}{2}
    \end{aligned}
    $$

    (6) 积化和差

    $$
    \begin{aligned}
    \sin\alpha\cos\beta&=\frac{1}{2}[\sin(\alpha+\beta)+\sin(\alpha-\beta)]\\
    \cos\alpha\cos\beta&=\frac{1}{2}[\cos(\alpha+\beta)+\cos(\alpha-\beta)]\\
    \cos\alpha\sin\beta&=\frac{1}{2}[\sin(\alpha+\beta)-\sin(\alpha-\beta)]\\
    \sin\alpha\sin\beta&=-\frac{1}{2}[\cos(\alpha+\beta)-\cos(\alpha-\beta)]
    \end{aligned}
    $$

    特别地：
    $$
    \sin^2\alpha=\frac{1-\cos2\alpha}{2},\qquad
    \cos^2\alpha=\frac{1+\cos2\alpha}{2}
    $$

    >显然，和差化积和积化和差纯粹正反手关系，背一个，剩下的需要用的时候现推导就行了。

## 2. 信号基础

1. 信号的基本运算

    (1) 水平移位

    $f(x-x_0)$ 表示右移 $x_0$，$f(x+x_0)$ 表示左移 $x_0$。简单记就是：左加右减。

    (2) 垂直移位

    $f(x)+A$ 表示上移 $A$，$f(x)-A$ 表示下移 $A$。简单记就是：上加下减。

    (3) 伸缩

    $f(ax)$ 中 $|a|>1$ 时，图像在横轴方向压缩；$0<|a|<1$ 时，图像在横轴方向放大。

    (4) 反褶

    $f(-x)$ 是以 $y$ 轴为对称轴的反褶。

    > 信号运算都要盯住自变量。遇到 $f(4-2x)$ 这种东西，先把括号整理成 $f[-2(x-2)]$，再按平移、伸缩、反褶理解。

2. 信号的分解

    (1) 奇分量和偶分量

    任意实信号都可以分解为偶分量和奇分量之和：
    $$
    f(t)=f_e(t)+f_o(t)
    $$

    $$
    f_e(t)=\frac{f(t)+f(-t)}{2},\qquad
    f_o(t)=\frac{f(t)-f(-t)}{2}
    $$

    (2) 直流分量和交流分量

    任意实信号可以分解为直流分量和交流分量：
    $$
    f(t)=f_d(t)+f_a(t)
    $$

    $$
    f_d(t)=\lim_{T\to\infty}\frac{1}{T}\int_{-\frac{T}{2}}^{\frac{T}{2}}f(t)dt,\qquad
    f_a(t)=f(t)-f_d(t)
    $$

    时域有限宽信号的直流分量为 $0$。之后很多地方会默认“隔直通交”，也就是更关心交流分量。

3. 常见信号及性质

    (1) 单位冲激信号

    $$
    \delta(t)=
    \begin{cases}
    \infty,&t=0\\
    0,&t\neq0
    \end{cases}
    ,\qquad
    \int_{-\infty}^{+\infty}\delta(t)dt=1
    $$

    性质：
    $$
    \begin{aligned}
    \delta(t)&=\delta(-t)\\
    \delta(at)&=\frac{1}{|a|}\delta(t)\\
    \delta(at+b)&=\frac{1}{|a|}\delta(t+\frac{b}{a})\\
    f(t)\delta(t)&=f(0)\delta(t)\\
    f(t)\delta(t-t_0)&=f(t_0)\delta(t-t_0)
    \end{aligned}
    $$

    取样性质：
    $$
    \int_{-\infty}^{+\infty}f(t)\delta(t)dt=f(0),\qquad
    \int_{-\infty}^{+\infty}f(t)\delta(t-t_0)dt=f(t_0)
    $$

    (2) 单位冲激偶信号

    单位冲激偶就是 $\delta'(t)$，可以理解为单位冲激的导数。

    奇偶性：
    $$
    \delta'(t)=-\delta'(-t)
    $$

    加权性质：
    $$
    \begin{aligned}
    f(t)\delta'(t)&=f(0)\delta'(t)-f'(0)\delta(t)\\
    f(t)\delta'(t-t_0)&=f(t_0)\delta'(t-t_0)-f'(t_0)\delta(t-t_0)
    \end{aligned}
    $$

    取样性质：
    $$
    \int_{-\infty}^{+\infty}f(t)\delta'(t)dt=-f'(0),\qquad
    \int_{-\infty}^{+\infty}f(t)\delta'(t-t_0)dt=-f'(t_0)
    $$

    (3) 单位阶跃信号

    $$
    u(t)=
    \begin{cases}
    1,&t\ge0\\
    0,&t<0
    \end{cases}
    $$

    微分性质：
    $$
    u'(t)=\delta(t)
    $$

    奇异函数在跳变点的取值一般要看题目约定，不要机械套。

    (4) 符号函数

    $$
    \operatorname{sgn}(t)=2u(t)-1=
    \begin{cases}
    1,&t>0\\
    -1,&t\le0
    \end{cases}
    $$

    (5) 抽样函数

    $$
    Sa(t)=\frac{\sin t}{t},\qquad
    \int_{-\infty}^{+\infty}Sa(t)dt=\pi
    $$

    $$
    \operatorname{sinc}(t)=Sa(\pi t)=\frac{\sin\pi t}{\pi t},\qquad
    \int_{-\infty}^{+\infty}\operatorname{sinc}(t)dt=1
    $$

    注意这里的 $\operatorname{sinc}(t)$ 是通信里常用的归一化 sinc。

    (6) 矩形窗函数

    $$
    G_T(t)=\operatorname{rect}\frac{t}{T}=
    \begin{cases}
    1,&-\frac{T}{2}\le t\le\frac{T}{2}\\
    0,&else
    \end{cases}
    $$

    (7) 三角窗函数

    $$
    \Lambda\frac{t}{T}=\operatorname{tri}\frac{t}{T}=
    \begin{cases}
    1-\frac{|t|}{T},&-T\le t\le T\\
    0,&else
    \end{cases}
    $$

4. 连续信号的卷积积分

    (1) 定义

    $$
    f(t)=f_1(t)*f_2(t)=\int_{-\infty}^{+\infty}f_1(\tau)f_2(t-\tau)d\tau
    $$

    实际计算时，积分区间是两个信号非零区间重叠的部分。

    (2) 常规性质

    $$
    \begin{aligned}
    f_1(t)*f_2(t)&=f_2(t)*f_1(t)\\
    [f_1(t)*f_2(t)]*f_3(t)&=f_1(t)*[f_2(t)*f_3(t)]\\
    f_1(t)*[f_2(t)+f_3(t)]&=f_1(t)*f_2(t)+f_1(t)*f_3(t)
    \end{aligned}
    $$

    (3) 时移性质

    若 $y(t)=x(t)*h(t)$，则：
    $$
    y(t-t_0)=x(t-t_0)*h(t)=x(t)*h(t-t_0)
    $$

    $$
    y(t)=x(t-t_0)*h(t+t_0)=x(t+t_0)*h(t-t_0)
    $$

    (4) 与冲激、阶跃的卷积

    $$
    f(t)*\delta(t)=f(t),\qquad
    f(t)*\delta(t-t_0)=f(t-t_0)
    $$

    $$
    f(t)*u(t)=\int_{-\infty}^{t}f(\tau)d\tau
    $$

    $$
    f(t)*[u(t-a)-u(t-b)]=\int_{t-b}^{t-a}f(\tau)d\tau
    $$

    (5) 微分性质

    若 $y(t)=x(t)*h(t)$，则：
    $$
    y'(t)=x'(t)*h(t)=x(t)*h'(t)
    $$

    也可以反过来用积分形式化简卷积：
    $$
    y(t)=x'(t)*h^{(-1)}(t)=x^{(-1)}(t)*h'(t)
    $$

    (6) 非零区间

    若两个信号的非零区间分别为 $[a,b]$ 和 $[c,d]$，则卷积结果的非零区间为：
    $$
    [a+c,\ b+d]
    $$

    两个矩形的卷积一般是梯形；两个等宽矩形的卷积是三角形。

5. 离散信号的卷积和

    (1) 定义

    $$
    y[n]=x[n]*h[n]=\sum_{m=-\infty}^{+\infty}x[m]h[n-m]
    =\sum_{m=-\infty}^{+\infty}h[m]x[n-m]
    $$

    (2) 冲激卷积性质

    $$
    x[n]*\delta[n]=x[n],\qquad
    x[n]*\delta[n-m]=x[n-m]
    $$

    (3) 常用计算方法

    离散卷积常见三种做法：不进位乘法、冲激性质法、定义计算法。遇到有限长序列时，不进位乘法最顺手；遇到阶跃、指数序列时，定义和分段范围更重要。

## 3. 通信系统基础

1. 消息、信息与信号

    消息是信息的物理形式，信息是消息的有效内容，信号是消息的传输载体。

    通信原理默认讨论电信，也就是利用电信号传输消息中包含的信息。

2. 通信系统分类

    (1) 按信号特征：模拟通信系统、数字通信系统。

    (2) 按调制方式：基带传输系统、频带传输系统。

    (3) 按传输媒介：有线通信系统、无线通信系统。

    (4) 按复用方式：频分复用、时分复用、码分复用。

    (5) 按通信业务：电报、电话、数据、图像通信等。

    (6) 按工作波段：长波、中波、短波、红外通信等。

    电磁波频率越低，波长越长，传输距离越远，但天线尺寸也越大。

3. 通信方式

    (1) 工作方式

    单工：只能单方向传输，比如广播、遥测、遥控。

    半双工：双方都能收发，但不能同时收发，比如对讲机。

    全双工：双方可以同时收发，比如电话。

    (2) 传输方式

    串行传输：一条线路依次传输，速率慢、成本低。

    并行传输：多条线路同时传输，速率快、成本高。

4. 性能指标

    (1) 有效性

    模拟通信系统的有效性用传输带宽衡量；数字通信系统的有效性用频带利用率衡量。

    $$
    \eta=\frac{R_s}{B}\ \text{Baud/Hz},\qquad
    \eta_b=\frac{R_b}{B}\ \text{bps/Hz}
    $$

    $$
    R_b=R_s\log_2M
    $$

    (2) 可靠性

    模拟通信系统的可靠性用解调输出信噪比衡量；数字通信系统的可靠性用差错概率衡量。

    二进制时：
    $$
    P_b=P_e
    $$

5. 通信系统框图

    (1) 常见基本单元

    加法器、乘法器、滤波器、积分器、微分器、取样器、延时器、移存器、相移器等。

    (2) 注意点

    实际框图中，模二加符号有时也可能表示普通算术加，需要结合上下文判断。框图不要死记，关键是理解每个模块对信号做了什么。

## 4. 傅里叶分析

1. 傅里叶级数

    (1) 三角形式

    周期为 $T$，基波角频率 $\omega_1=\frac{2\pi}{T}$：
    $$
    f(t)=\frac{a_0}{2}+\sum_{n=1}^{+\infty}a_n\cos(n\omega_1t)+b_n\sin(n\omega_1t)
    $$

    也可以写成：
    $$
    f(t)=c_0+\sum_{n=1}^{+\infty}c_n\cos(n\omega_1t+\varphi_n)
    $$

    系数：
    $$
    \begin{aligned}
    a_0&=\frac{2}{T}\int_{-\frac{T}{2}}^{\frac{T}{2}}f(t)dt\\
    a_n&=\frac{2}{T}\int_{-\frac{T}{2}}^{\frac{T}{2}}f(t)\cos(n\omega_1t)dt\\
    b_n&=\frac{2}{T}\int_{-\frac{T}{2}}^{\frac{T}{2}}f(t)\sin(n\omega_1t)dt\\
    c_n&=\sqrt{a_n^2+b_n^2}\\
    \varphi_n&=-\arctan\frac{b_n}{a_n}
    \end{aligned}
    $$

    (2) 指数形式

    $$
    f(t)=\sum_{n=-\infty}^{+\infty}F_ne^{j2\pi nf_1t},\qquad f_1=\frac{1}{T}
    $$

    $$
    F_n=\frac{1}{T}\int_{-\frac{T}{2}}^{+\frac{T}{2}}f(t)e^{-j2\pi nf_1t}dt
    $$

    对实信号：
    $$
    F_{-n}=F_n^*
    $$

    所以双边幅度谱是偶对称，相位谱是奇对称。

2. 傅里叶变换

    (1) 定义

    $$
    F(f)=\int_{-\infty}^{+\infty}f(t)e^{-j2\pi ft}dt
    $$

    $$
    f(t)=\int_{-\infty}^{+\infty}F(f)e^{j2\pi ft}df
    $$

    简记：
    $$
    f(t)\leftrightarrow F(f)
    $$

    正变换是负指数，反变换是正指数。

    若：
    $$
    F(f)=|F(f)|e^{j\varphi(f)}
    $$

    则 $|F(f)|$ 是幅度谱，$\varphi(f)$ 是相位谱。

    (2) 常见变换对

    $$
    \delta(t)\leftrightarrow1
    $$

    $$
    \delta'(t)\leftrightarrow j2\pi f
    $$

    $$
    e^{-at}u(t)\leftrightarrow\frac{1}{a+j2\pi f}\quad(a>0)
    $$

    $$
    \operatorname{sgn}(t)\leftrightarrow\frac{1}{j\pi f}
    $$

    $$
    A G_T(t)\leftrightarrow AT\operatorname{sinc}(fT)
    $$

    矩形窗的傅里叶变换可以记成：面积 $\times\operatorname{sinc}(f\times$ 宽度 $)$。

    $$
    A\Lambda\frac{t}{T}\leftrightarrow AT\operatorname{sinc}^2(fT)
    $$

    三角窗的傅里叶变换可以记成：面积 $\times\operatorname{sinc}^2(f\times$ 半宽度 $)$。

    (3) 余弦、正弦

    $$
    \cos(2\pi f_0t)\leftrightarrow
    \frac{1}{2}[\delta(f-f_0)+\delta(f+f_0)]
    $$

    $$
    \sin(2\pi f_0t)\leftrightarrow
    \frac{1}{2j}[\delta(f-f_0)-\delta(f+f_0)]
    $$

3. 傅里叶变换的性质

    (1) 对称性

    若：
    $$
    f(t)\leftrightarrow F(f)
    $$

    则：
    $$
    F(t)\leftrightarrow f(-f)
    $$

    推论：偶函数对称性会少一个负号，奇函数对称性会多一个负号。

    (2) 尺度变换

    $$
    f(at)\leftrightarrow\frac{1}{|a|}F\left(\frac{f}{a}\right)
    $$

    时域压缩，频域扩展；时域扩展，频域压缩。

    (3) 时移

    $$
    f(t-t_0)\leftrightarrow F(f)e^{-j2\pi ft_0}
    $$

    时移只改变相位谱，不改变幅度谱。

    (4) 频移

    $$
    f(t)e^{j2\pi f_0t}\leftrightarrow F(f-f_0)
    $$

    (5) 时域微积分

    $$
    \frac{df(t)}{dt}\leftrightarrow j2\pi fF(f)
    $$

    若 $f(t)$ 直流为零：
    $$
    \int_{-\infty}^{t}f(\tau)d\tau\leftrightarrow\frac{F(f)}{j2\pi f}
    $$

    微分器系统函数：
    $$
    H(f)=j2\pi f
    $$

    积分器系统函数：
    $$
    H(f)=\frac{1}{j2\pi f}
    $$

    (6) 奇偶虚实性

    $$
    f(-t)\leftrightarrow F(-f)
    $$

    $$
    f^*(t)\leftrightarrow F^*(-f)
    $$

    若 $f(t)$ 是实信号：
    $$
    F(f)=F^*(-f)
    $$

    所以实信号的幅度谱是偶函数，相位谱是奇函数。

    (7) 卷积定理

    时域卷积：
    $$
    f_1(t)*f_2(t)\leftrightarrow F_1(f)F_2(f)
    $$

    时域相乘：
    $$
    f_1(t)f_2(t)\leftrightarrow F_1(f)*F_2(f)
    $$

    时域有限信号可以写成一个信号乘以矩形窗，所以时域有限宽的信号，频域一定无限宽；反过来也一样。

    (8) 帕色瓦尔定理

    $$
    \int_{-\infty}^{+\infty}s_1^*(t)s_2(t)dt
    =
    \int_{-\infty}^{+\infty}S_1^*(f)S_2(f)df
    $$

    特别地：
    $$
    \int_{-\infty}^{+\infty}|s(t)|^2dt
    =
    \int_{-\infty}^{+\infty}|S(f)|^2df
    $$

    (9) 信号面积

    $$
    F(0)=\int_{-\infty}^{+\infty}f(t)dt,\qquad
    f(0)=\int_{-\infty}^{+\infty}F(f)df
    $$

4. 周期信号的傅里叶变换

    若周期信号：
    $$
    f(t)=\sum_{n=-\infty}^{+\infty}F_ne^{j2\pi nf_1t}
    $$

    则：
    $$
    F(f)=\sum_{n=-\infty}^{+\infty}F_n\delta(f-nf_1)
    $$

    其中：
    $$
    F_n=\frac{1}{T}\int_{-\frac{T}{2}}^{+\frac{T}{2}}f(t)e^{-j2\pi nf_1t}dt,\qquad f_1=\frac{1}{T}
    $$

    计算周期信号频谱时，也可以先取一个周期内的非周期信号 $f_1(t)$，求它的傅里叶变换 $F_1(f)$，然后：
    $$
    F_n=\frac{1}{T}F_1(nf_1)
    $$

    周期冲激序列：
    $$
    \sum_{n=-\infty}^{+\infty}\delta(t-nT)
    \leftrightarrow
    \frac{1}{T}\sum_{n=-\infty}^{+\infty}\delta(f-\frac{n}{T})
    $$

5. 信号抽样

    (1) 抽样原理

    若：
    $$
    p(t)=\sum_{n=-\infty}^{+\infty}g(t-nT)
    $$

    是周期为 $T$ 的抽样脉冲序列，则：
    $$
    f_s(t)=f(t)p(t)
    $$

    对应频域：
    $$
    F_s(f)=F(f)*P(f)=\sum_{n=-\infty}^{+\infty}P_nF(f-nf_s)
    $$

    其中：
    $$
    f_s=\frac{1}{T},\qquad P_n=\frac{1}{T}P_1(nf_s)
    $$

    (2) 理想冲激抽样

    若：
    $$
    p(t)=\sum_{n=-\infty}^{+\infty}\delta(t-nT)
    $$

    则：
    $$
    F_s(f)=\frac{1}{T}\sum_{n=-\infty}^{+\infty}F(f-nf_s)
    $$

    无明确说明时，抽样默认就是理想冲激抽样。

    (3) 抽样定理

    若信号最高频率为 $f_H$，则无失真抽样的最小抽样频率：
    $$
    f_s=2f_H
    $$

    (4) 频谱搬移

    理想抽样会在频域产生一系列搬移后的频谱副本。利用抽样加滤波器，可以完成特定频段搬移。

## 5. 相关、能量与功率谱

1. 相关系数

    (1) 能量信号

    $$
    r_{12}=\int_{-\infty}^{+\infty}f_1(t)f_2(t)dt
    $$

    归一化相关系数：
    $$
    \rho_{12}=\frac{r_{12}}{\sqrt{E_1E_2}},\qquad -1\le\rho_{12}\le1
    $$

    若 $r_{12}=0$，则称 $f_1(t)$ 和 $f_2(t)$ 正交。

    (2) 功率信号

    $$
    r_{12}=\lim_{T\to\infty}\frac{1}{T}
    \int_{-\frac{T}{2}}^{+\frac{T}{2}}f_1(t)f_2(t)dt
    $$

    归一化相关系数：
    $$
    \rho_{12}=\frac{r_{12}}{\sqrt{P_1P_2}},\qquad -1\le\rho_{12}\le1
    $$

    零均值功率信号与直流信号正交；实信号的直流分量和交流分量正交。

2. 相关函数

    (1) 能量信号

    互相关：
    $$
    R_{12}(\tau)=\int_{-\infty}^{+\infty}f_1(t)f_2(t+\tau)dt
    $$

    自相关：
    $$
    R(\tau)=\int_{-\infty}^{+\infty}f(t)f(t+\tau)dt
    $$

    (2) 功率信号

    互相关：
    $$
    R_{12}(\tau)=\lim_{T\to\infty}\frac{1}{T}
    \int_{-\frac{T}{2}}^{+\frac{T}{2}}f_1(t)f_2(t+\tau)dt
    $$

    自相关：
    $$
    R(\tau)=\lim_{T\to\infty}\frac{1}{T}
    \int_{-\frac{T}{2}}^{+\frac{T}{2}}f(t)f(t+\tau)dt
    $$

    复信号时，定义式第一项要加共轭。

3. 相关函数性质

    (1) 极值性

    自相关函数在 $\tau=0$ 处取最大值：
    $$
    R(0)\ge R(\tau)
    $$

    能量信号：
    $$
    R(0)=\int_{-\infty}^{+\infty}|f(t)|^2dt=E_f
    $$

    功率信号：
    $$
    R(0)=\lim_{T\to\infty}\frac{1}{T}
    \int_{-\frac{T}{2}}^{+\frac{T}{2}}|f(t)|^2dt=P_f
    $$

    (2) 对称性

    自相关函数：
    $$
    R(\tau)=R^*(-\tau)
    $$

    对实信号：
    $$
    R(\tau)=R(-\tau)
    $$

    互相关函数：
    $$
    R_{xy}(\tau)=R_{yx}^*(-\tau)
    $$

    对实信号：
    $$
    R_{xy}(\tau)=R_{yx}(-\tau)
    $$

4. 信号能量与能量谱密度

    (1) 信号能量

    $$
    E=\int_{-\infty}^{+\infty}|f(t)|^2dt
    $$

    能量有限的是能量信号，一般是有限长信号或衰减信号。能量无限但功率有限的是功率信号，一般是周期信号或随机信号。

    信号水平移位和反褶不改变能量。

    (2) 能量谱密度

    $$
    E=\int_{-\infty}^{+\infty}|f(t)|^2dt
    =
    \int_{-\infty}^{+\infty}|F(f)|^2df
    =
    \int_{-\infty}^{+\infty}E(f)df
    $$

    $$
    E(f)=|F(f)|^2
    $$

    实信号的能量谱密度是非负、实、偶函数。

    (3) 维纳-欣钦定理

    能量信号的自相关函数与能量谱密度是一对傅里叶变换对。

    能量信号的互相关函数与互能量谱密度是一对傅里叶变换对。

    (4) 信号和的能量谱

    若 $x(t)=x_1(t)+x_2(t)$，则：
    $$
    E_x=E_1+2\int_{-\infty}^{+\infty}x_1(t)x_2(t)dt+E_2
    $$

    两信号正交时，信号和的能量等于各自能量之和。

    当互相关函数或互能量谱密度为 $0$ 时，信号和的能量谱等于两个信号能量谱之和。

5. 信号功率与功率谱密度

    (1) 平均功率

    $$
    P=\lim_{T\to\infty}\frac{1}{T}\int_{-\frac{T}{2}}^{+\frac{T}{2}}|f(t)|^2dt
    $$

    瞬时功率：
    $$
    P_{t_0}=|f(t_0)|^2
    $$

    余弦信号平均功率为 $\frac{1}{2}$。信号幅度变为 $A$ 倍，功率变为 $A^2$ 倍。

    (2) 功率谱密度

    定义 $f_T(t)$ 为 $f(t)$ 在 $[-\frac{T}{2},+\frac{T}{2}]$ 的截断函数，$f_T(t)\leftrightarrow F_T(f)$：
    $$
    P(f)=\lim_{T\to\infty}\frac{|F_T(f)|^2}{T}
    $$

    $$
    P=\int_{-\infty}^{+\infty}P(f)df
    $$

    实信号的功率谱密度是非负、实、偶函数。为简化画图，功率谱密度有时只画正频率部分。

    (3) 维纳-欣钦定理

    功率信号的自相关函数与功率谱密度是一对傅里叶变换对。

    功率信号的互相关函数与互功率谱密度是一对傅里叶变换对。

    (4) 周期信号功率谱密度

    若实周期信号：
    $$
    f(t)=\sum_{n=-\infty}^{+\infty}F_ne^{j2\pi nf_1t}
    $$

    则：
    $$
    P(f)=\sum_{n=-\infty}^{+\infty}|F_n|^2\delta(f-nf_1)
    =
    \sum_{n=-\infty}^{+\infty}|F_n|^2\delta(f-\frac{n}{T})
    $$

    余弦和正弦的功率谱密度相同：
    $$
    P(f)=\frac{1}{4}\delta(f-f_c)+\frac{1}{4}\delta(f+f_c)
    $$

    (5) 信号和的功率谱

    两信号正交时，信号和的功率等于各自功率之和。

    实信号的功率等于直流功率与交流功率之和；实信号的功率谱等于直流功率谱与交流功率谱之和。

    当互相关函数或互功率谱密度为 $0$ 时，信号和的功率谱等于两个信号功率谱之和。

    (6) 功率谱密度性质

    若：
    $$
    s(t)=Km(t)
    $$

    则：
    $$
    P_s(f)=K^2P_m(f)
    $$

    若信号直流分量为 $A$，则功率谱中必有：
    $$
    A^2\delta(f)
    $$

    信号与其时移信号具有相同的功率谱密度。

## 6. 线性系统、带宽与等效低通

1. 线性时不变系统

    (1) 系统表示

    线性时不变系统可以用时域冲激响应 $h(t)$ 或频域系统函数 $H(f)$ 表示：
    $$
    H(f)=|H(f)|e^{j\varphi(f)}
    $$

    $|H(f)|$ 是幅频特性，$\varphi(f)$ 是相频特性。

    实系统的幅频特性为偶函数，相频特性为奇函数。默认系统一般指线性时不变实系统。

    常见非线性系统：平方器、全波整流器、包络检波器、鉴频器、鉴相器。

    (2) 无失真传输系统

    无失真传输要求幅频特性为常数，相频特性为过原点的反斜线：
    $$
    h(t)=K\delta(t-t_0)
    $$

    $$
    H(f)=Ke^{-j2\pi ft_0}
    $$

    $$
    y(t)=Kx(t-t_0)
    $$

    $$
    Y(f)=KX(f)e^{-j2\pi ft_0}
    $$

    若系统不满足无失真传输条件，信号通过系统后会产生失真。

    (3) 输出表示

    时域：
    $$
    y(t)=x(t)*h(t)
    $$

    频域：
    $$
    Y(f)=X(f)H(f)
    $$

    单频信号通过系统后，幅度乘以系统幅频值，相位加上系统相频值。

    输出能量谱密度：
    $$
    E_y(f)=E_x(f)|H(f)|^2
    $$

    输出功率谱密度：
    $$
    P_y(f)=P_x(f)|H(f)|^2
    $$

2. 信号带宽与滤波器

    (1) 信号分类

    基带信号，也叫低通信号，频谱主要集中在零频附近。

    频带信号，也叫带通信号，频谱集中在某个载频附近。

    窄带信号是带宽远小于中心频率的带通信号。

    (2) 带宽

    信号带宽是实信号正频率部分占用的宽度。复信号一般不讨论带宽。

    绝对带宽：若正频率非零范围是 $[f_L,f_H]$，则：
    $$
    B=f_H-f_L
    $$

    主瓣带宽：第一零点带宽。

    $3dB$ 带宽：功率谱从最高点降为一半时对应的频谱宽度。

    等效矩形带宽：功率谱等面积矩形的宽度。

    (3) 滤波器

    滤波器频域一定正负对称，不存在单侧滤波器。

    无特别说明时，滤波器增益默认为 $1$，相位默认为 $0$。

    理想低通滤波器：
    $$
    f\in[0,f_m]
    $$

    理想带通滤波器：
    $$
    f\in[f_L,f_H]
    $$

    理想高通滤波器：
    $$
    f\in[f_m,+\infty)
    $$

    理想窄带滤波器：
    $$
    f\in[f_m-\Delta f,\ f_m+\Delta f]
    $$

    (4) 可实现性

    非因果系统不能实现。因果系统要求：
    $$
    h(t)=0,\qquad t<0
    $$

    陡降系统不能严格实现，所以理想滤波器本质上都是理论模型。比如 SSB 调制严格实现困难，工程上会用 VSB 等折中方法。

3. 希尔伯特变换

    (1) 定义

    $$
    \mathcal{H}[f(t)]=\hat f(t)=f(t)*\frac{1}{\pi t}
    =
    \frac{1}{\pi}\int_{-\infty}^{+\infty}\frac{f(\tau)}{t-\tau}d\tau
    $$

    希尔伯特变换只针对实信号。

    频域：
    $$
    \hat f(t)\leftrightarrow F(f)[-j\operatorname{sgn}(f)]
    =
    \begin{cases}
    -jF(f),&f\ge0\\
    jF(f),&f<0
    \end{cases}
    $$

    结论：
    $$
    \mathcal{H}[\cos(2\pi f_0t+\theta)]=\sin(2\pi f_0t+\theta)
    $$

    $$
    \mathcal{H}[\sin(2\pi f_0t+\theta)]=-\cos(2\pi f_0t+\theta)
    $$

    当 $m(t)$ 为窄带调制中的基带信号且 $W\ll f_0$ 时：
    $$
    \mathcal{H}[m(t)\cos(2\pi f_0t)]\approx m(t)\sin(2\pi f_0t)
    $$

    (2) 基本性质

    二次希尔伯特变换：
    $$
    \mathcal{H}\{\mathcal{H}[f(t)]\}=-f(t)
    $$

    奇偶性相反：奇函数的希尔伯特变换为偶函数，偶函数的希尔伯特变换为奇函数。

    正交性：
    $$
    \int_{-\infty}^{+\infty}f(t)\hat f(t)dt=0
    $$

    希尔伯特变换不改变功率谱密度、功率和自相关函数。

4. 解析信号

    (1) 定义

    若 $f(t)$ 为实信号，则：
    $$
    z(t)=f(t)+j\hat f(t)
    $$

    称为 $f(t)$ 的解析信号。

    频域：
    $$
    Z(f)=F(f)[1+\operatorname{sgn}(f)]
    =
    \begin{cases}
    2F(f),&f\ge0\\
    0,&f<0
    \end{cases}
    $$

    简单记：负频率抹掉，正频率翻倍。实信号的解析信号一定是复函数。

    (2) 由解析信号反求原实信号

    $$
    f(t)=\operatorname{Re}[z(t)]=\frac{z(t)+z^*(t)}{2}
    $$

    $$
    F(f)=\frac{Z(f)+Z^*(-f)}{2}
    $$

    (3) 基本性质

    若 $f_1(t)$ 和 $f_2(t)$ 都是解析信号，则：
    $$
    f_1(t)*f_2^*(t)=f_2(t)*f_1^*(t)=0
    $$

    解析信号的功率是对应原实信号功率的二倍：
    $$
    P_z=2P_f
    $$

5. 等效低通

    (1) 等效低通信号

    设 $x(t)$ 为带通信号，解析信号为：
    $$
    z_x(t)=x(t)+j\hat x(t)
    $$

    定义：
    $$
    x_L(t)=z_x(t)e^{-j2\pi f_ct}
    $$

    $x_L(t)$ 称为 $x(t)$ 的等效低通或复包络，$|x_L(t)|$ 称为包络。带通信号的复包络一般是复信号，也可能是实信号。

    常用结论：
    $$
    m(t)\cos(2\pi f_ct)\quad\Longrightarrow\quad x_L(t)=m(t)
    $$

    $$
    m(t)\sin(2\pi f_ct)\quad\Longrightarrow\quad x_L(t)=-jm(t)
    $$

    $$
    m_1(t)\cos(2\pi f_ct)-m_2(t)\sin(2\pi f_ct)
    \quad\Longrightarrow\quad
    x_L(t)=m_1(t)+jm_2(t)
    $$

    (2) 带通信号表示

    等效低通形式：
    $$
    x(t)=\operatorname{Re}[x_L(t)e^{j2\pi f_ct}]
    $$

    同相分量和正交分量形式。令：
    $$
    x_L(t)=x_c(t)+jx_s(t)
    $$

    则：
    $$
    x(t)=x_c(t)\cos(2\pi f_ct)-x_s(t)\sin(2\pi f_ct)
    $$

    其中 $x_c(t)$ 是同相分量，$x_s(t)$ 是正交分量。

    包络和相位形式。令：
    $$
    x_L(t)=a(t)e^{j\varphi(t)}
    $$

    则：
    $$
    x(t)=a(t)\cos[2\pi f_ct+\varphi(t)]
    $$

    $$
    a(t)=|x_L(t)|=\sqrt{x_c^2(t)+x_s^2(t)},\qquad
    \varphi(t)=\arctan\frac{x_s(t)}{x_c(t)}
    $$

6. 带通信号通过带通系统

    (1) 直接分析

    带通信号通过带通系统可以在时域卷积，也可以在频域相乘：
    $$
    y(t)=x(t)*h(t),\qquad Y(f)=X(f)H(f)
    $$

    直接做通常会出现载频项，计算会比较重。

    (2) 等效低通分析

    方法就是：带通变低通，低通过低通，低通回带通。

    对系统冲激响应 $h(t)$，其等效低通系统定义为：
    $$
    h_{eq}(t)=\frac{1}{2}h_L(t)=\frac{1}{2}z_h(t)e^{-j2\pi f_ct}
    $$

    若输入带通信号的等效低通为 $x_L(t)$，则：
    $$
    y_L(t)=x_L(t)*h_{eq}(t)
    $$

    最后回到带通信号：
    $$
    y(t)=\operatorname{Re}[y_L(t)e^{j2\pi f_ct}]
    $$

    等效低通的好处是把高频振荡先拿掉，只算低通信号之间的卷积或系统响应，后面再把载波乘回去。
