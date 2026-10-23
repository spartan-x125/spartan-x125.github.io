# 零ISI：时域格点与频域叠加

条件：总脉冲$p(t)$包含发射、信道与接收响应；符号周期$T_{s}$；以$p(0)=1$归一化。

## 1. 先在接收时刻分出目标与邻居

是否无ISI只由采样格点决定，不要求连续波形互不重叠。

$$
\begin{gathered}y(kT_s)=\sum_na_np[(k-n)T_s]\\[.45em]=a_kp(0)+\sum_{n\ne k}a_np[(k-n)T_s]\end{gathered}
$$

## 2. 要求任意序列都能恢复

让每个邻居系数分别为0，目标系数为1，就得到必要且充分的格点条件。

$$
\begin{gathered}p(nT_s)=\delta[n]\end{gathered}
$$

## 3. 对频域周期叠加计算傅里叶级数系数

令$Q(f)=\sum _{m}P(f-m/T_{s})$，周期$1/T_{s}$。其第$n$个系数把频域区间拼成实轴，恰好是$T_{s}p(nT_{s})$。

$$
\begin{gathered}q_n=T_s\int_{\text{任一周期}}Q(f)e^{j2\pi nT_sf}df\\[.45em]=T_s\int_{-\infty}^{\infty}P(f)e^{j2\pi nT_sf}df=T_sp(nT_s)\end{gathered}
$$

## 4. 因此格点零点对应频域常数

当$p(nT_{s})=\delta [n]$时，仅零次系数$q_{0}=T_{s}$非零，$Q$为常数。

$$
\begin{gathered}\sum_mP\!\left(f-\frac m{T_s}\right)=T_s\end{gathered}
$$

## 5. 升余弦用滚降区互补实现这个常数

相邻副本在过渡区互补。支撑单侧宽度为($1+\alpha )/(2T_{s})$，反变换给出RC脉冲；分母为0时用极限。

$$
\begin{gathered}p(t)=\operatorname{sinc}\!\left(\frac t{T_s}\right)\frac{\cos(\pi\alpha t/T_s)}{1-(2\alpha t/T_s)^2}\\[.45em]B=\frac{1+\alpha}{2T_s}\\[.45em]p\!\left(\pm\frac{T_s}{2\alpha}\right)=\frac\pi4\operatorname{sinc}\!\left(\frac1{2\alpha}\right)\end{gathered}
$$

## 6. 采样偏移破坏零点对齐

$\varepsilon \ne 0$时邻居项一般不再为零。单只RRC并非总RC，通常由收发两个RRC相乘形成RC。

$$
\begin{gathered}y(kT_s+\varepsilon)=a_kp(\varepsilon)+\sum_{n\ne k}a_np[(k-n)T_s+\varepsilon]\end{gathered}
$$

## 数值例子

$R_{s}=2kBaud$、$\alpha =0.5$：单侧低通带宽$B=1.5\,\mathrm{kHz}$。可有脉冲重叠，但对齐采样无ISI；不能把带宽写成3kHz而又当作正频截止。

看采样点的邻居贡献，别只看连续波形是否交叠。
