# 滑动积分器为什么等价于矩形响应

条件：LTI；积分在所需范围内存在；$u$为单位阶跃。

## 1. 从两个积分器输出相减开始

把两个共同的无限区间抵消，只留下最近$T$秒。

$$
\begin{gathered}y(t)=\int_{-\infty}^{t}x(\tau)d\tau-\int_{-\infty}^{t-T}x(\tau)d\tau=\int_{t-T}^{t}x(\tau)d\tau\end{gathered}
$$

## 2. 识别卷积中的窗口

$h(t-\tau )$非零的条件是$0\le t-\tau \le T$，即$t-T\le \tau \le t$，正好复现原积分。

$$
\begin{gathered}h(t)=u(t)-u(t-T)\\[.45em]y(t)=\int_{-\infty}^{\infty}x(\tau)h(t-\tau)d\tau\end{gathered}
$$

## 3. 直接对矩形求傅里叶变换

将区间[0,T]平移到对称窗，线性相位来自窗中心$T/2$。

$$
\begin{gathered}H(f)=\int_0^Te^{-j2\pi ft}dt=e^{-j\pi fT}\int_{-T/2}^{T/2}e^{-j2\pi fu}du\\[.45em]=T\operatorname{sinc}(fT)e^{-j\pi fT},\quad H(0)=T\end{gathered}
$$

## 4. 两个矩形的卷积是重叠长度

积分变量$\tau $同时要落在[0,T]和[t−T,t]中。两个区间的交集长度从0增至$T$，再减至0。

$$
\begin{gathered}r(t)=\max\{0,\min(T,t)-\max(0,t-T)\}\\[.45em]=\begin{cases}t&0\le t\le T\\[.45em]2T-t&T\le t\le2T\\[.45em]0&\text{其他}\end{cases}\end{gathered}
$$

## 数值例子

$T=1\,\mathrm{s}$，单位矩形输入：$t=0.3$时输出0.3，$t=1$时输出1，$t=1.6$时输出0.4。滑动窗长是$T$，不是2T。

卷积图的面积就是重叠区间里的乘积积分。
