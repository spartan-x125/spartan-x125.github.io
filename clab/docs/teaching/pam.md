# PAM功率谱：从双重求和到连续谱与线谱

条件：$a_{n}$为实WSS码元，均值$m$、协方差$C_{a}[k]$；$g$为有限能量脉冲；采用固定时钟的时间平均相关。

## 1. 把PAM代入二阶相关

令$k=l-n$，把两个码元索引的相关写成只依赖差值的$R_{a}[k]$。

$$
\begin{gathered}s(t)=\sum_na_ng(t-nT_s)\\[.45em]\mathbb E[s(t)s(t+\tau)]=\sum_n\sum_kR_a[k]g(t-nT_s)g(t+\tau-nT_s-kT_s)\end{gathered}
$$

## 2. 先对一个时钟周期取平均

$n$所标记的时间区间首尾拼成整个实轴，令$u=t-nT_{s}$。定义$R_{g}(\tau )=\int g(u)g(u+\tau )du$。

$$
\begin{gathered}\overline R_s(\tau)=\frac1{T_s}\int_0^{T_s}\mathbb E[s(t)s(t+\tau)]dt\\[.45em]=\frac1{T_s}\sum_kR_a[k]\int_{-\infty}^{\infty}g(u)g(u+\tau-kT_s)du\\[.45em]=\frac1{T_s}\sum_kR_a[k]R_g(\tau-kT_s)\end{gathered}
$$

## 3. 把等间隔时移变成DTFT核

相关的傅里叶变换为$|G|^{2}$，每个$kT_{s}$时移提供一个相位因子。不是漏掉了$R_{a}$的变换，而是它已经以序列DTFT出现。

$$
\begin{gathered}\overline S_s(f)=\frac{|G(f)|^2}{T_s}\sum_kR_a[k]e^{-j2\pi fkT_s}\\[.45em]=\frac{|G(f)|^2}{T_s}S_a(e^{j2\pi fT_s})\end{gathered}
$$

## 4. 拆出均值，认出冲激梳

$R_a[k]=C_a[k]+m^2$；常数序列的DTFT是周期冲激。把无量纲数字频率映射到Hz时产生$1/T_{s}$。

$$
\begin{gathered}\sum_ke^{-j2\pi fkT_s}=\frac1{T_s}\sum_l\delta\!\left(f-\frac l{T_s}\right)\\[.45em]\overline S_s(f)=\frac{|G(f)|^2}{T_s}\sum_kC_a[k]e^{-j2\pi fkT_s}\\[.45em]+\frac{m^2}{T_s^2}\sum_l\left|G\!\left(\frac l{T_s}\right)\right|^2\delta\!\left(f-\frac l{T_s}\right)\end{gathered}
$$

## 5. 不相关码元只简化协方差项

不相关给$C_{a}[k]=\sigma ^{2}\delta [k]$，但$R_{a}[k]$在$k\ne 0$时仍是$m^{2}$。将两者混淆会错删线谱。

$$
\begin{gathered}\overline S_s(f)=\frac{\sigma^2}{T_s}|G(f)|^2\\[.45em]+\frac{m^2}{T_s^2}\sum_l\left|G\!\left(\frac l{T_s}\right)\right|^2\delta\!\left(f-\frac l{T_s}\right)\end{gathered}
$$

## 6. 矩形脉冲决定哪些时钟线被抹掉

$g$在[$0,dT_{s}]$为1，则$G=dT_{s}\operatorname{sinc}(fdT_{s})e^{-j}\pi fdT_{s}$。$d=1$时非零整数谐波全部落在零点。

$$
\begin{gathered}P_l=m^2d^2\operatorname{sinc}^2(ld)\\[.45em]P_{\mathrm{random}}=\sigma^2d,\qquad P_{\mathrm{mean}}=m^2d\\[.45em]P=(\sigma^2+m^2)d\end{gathered}
$$

## 数值例子

$T_{s}=1$、$m=0.6$、$\sigma ^{2}=0.5$：$d=1$时总功率0.86，仅直流线权重0.36。$d=0.25$时连续部分功率0.125，全部线权重之和0.09，总功率0.215；不能只加图中显示的9条线来冒充无限和。

连续时间的时移相位正好承载离散码元的DTFT；时钟存在不保证时钟线非零。
