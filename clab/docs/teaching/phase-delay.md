# 时间延时与恒相移为什么不能混用

条件：实信号；正频的恒相移延后$\theta $，负频取相反相位以保持实输出；直流单独保持。

## 1. 从时间平移直接代入变换

令$u=t-\tau $，则$t=u+\tau $。指数中多出的因子与积分变量无关，可提出积分。

$$
\begin{gathered}y(t)=x(t-\tau)\\[.45em]Y(f)=\int x(t-\tau)e^{-j2\pi ft}dt\\[.45em]=e^{-j2\pi f\tau}\int x(u)e^{-j2\pi fu}du\\[.45em]H_\tau(f)=e^{-j2\pi f\tau}\end{gathered}
$$

## 2. 相位延后随频率线性增加

正弦波的相位变化是$-2\pi f\tau $；相同时间平移对高频产生更大相位转角。

$$
\begin{gathered}\varphi_\tau(f)=-2\pi f\tau\\[.45em]\tau_g=-\frac{d\varphi}{d\omega}=\tau\end{gathered}
$$

## 3. 恒相角器按正负频分别移相

实输出需要$H(-f)=H*(f)$，所以不能把所有频率统一乘同一个复数而不补共轭。

$$
\begin{gathered}H_\theta(f)=\begin{cases}e^{-j\theta}&f>0\\[.45em]e^{j\theta}&f<0\end{cases}\\[.45em]\text{零均值实输入：}\quad y=x\cos\theta+\mathcal H\{x\}\sin\theta\end{gathered}
$$

## 4. 在一个频率匹配，不代表整个信号匹配

令$\theta =2\pi f_{1}\tau $，在$f_{1}$处二者一样；$f_{2}$处的时间延时相角是$\theta f_{2}/f_{1}$。多音或宽带信号一般不会整体一致。

$$
\begin{gathered}\theta=90^\circ,\quad f_1=2\ \mathrm{Hz}\implies\tau=\frac18\ \mathrm s\\[.45em]f_2=6\ \mathrm{Hz}\implies2\pi f_2\tau=270^\circ\ne90^\circ\end{gathered}
$$

## 数值例子

$x=\cos (4\pi t)+0.5cos(12\pi t)$。延时0.125s后，两音分别是sin(4πt)和−0.5sin(12πt)；恒相角延后90°后则是$\sin (4\pi t)+0.5sin(12\pi t)$。

时间延时改变整个波形的位置；恒相角器通常只在单一频率上等效于某个时间延时。
