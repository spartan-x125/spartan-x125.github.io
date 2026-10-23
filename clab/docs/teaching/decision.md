# 匹配滤波与MAP判决的完整信号链

条件：发送$\pm v(t)$；实AWGN双边$PSD=N_{0}/2$；两类误判代价相同；$p=P(+)$。

## 1. 把波形压缩成一个统计量

相关模板$g$把一段接收波形积成一个数。白高斯噪声经线性映射仍高斯。

$$
\begin{gathered}Y=\int r(t)g(t)dt=\pm C+N\\[.45em]C=\int v(t)g(t)dt,\qquad\sigma^2=\frac{N_0}2\int g^2(t)dt\end{gathered}
$$

## 2. 用Cauchy–Schwarz找到最佳模板

最大化的是采样信噪比，不是让噪声绝对值最小。相关模板$g$∝$v$；实现为滤波器时要时间反转与共轭。

$$
\begin{gathered}\frac{C^2}{\sigma^2}=\frac2{N_0}\frac{|\int vg|^2}{\int g^2}\le\frac2{N_0}\int v^2=\frac{2E_v}{N_0}\\[.45em]g=kv\text{ 时取等},\qquad h(t)=kv^*(T-t)\end{gathered}
$$

## 3. 写出两条条件密度

横轴是$Y$的可能取值，不是时间。信号把噪声密度移到$\pm C$；先验$p$尚未参与这个平移。

$$
\begin{gathered}f(y\mid+)=\frac1{\sqrt{2\pi\sigma^2}}\exp\!\left[-\frac{(y-C)^2}{2\sigma^2}\right]\\[.45em]f(y\mid-)=\frac1{\sqrt{2\pi\sigma^2}}\exp\!\left[-\frac{(y+C)^2}{2\sigma^2}\right]\end{gathered}
$$

## 4. 由最大后验比较推导门限

判+当$pf(y|+)>(1-p)f(y|-)$。取对数，公共归一化项抵消，两个平方展开后只剩4Cy。

$$
\begin{gathered}\ln\frac p{1-p}+\frac{(y+C)^2-(y-C)^2}{2\sigma^2}>0\\[.45em]\ln\frac p{1-p}+\frac{2Cy}{\sigma^2}>0\\[.45em]y>\gamma,\qquad\gamma=\frac{\sigma^2}{2C}\ln\frac{1-p}p\quad(C>0)\end{gathered}
$$

## 5. 从两块尾面积得到总错误率

发送+却落在$\gamma $左边，发送−却落在$\gamma $右边。分别标准化，然后按先验加权。

$$
\begin{gathered}P(-\mid+)=Q\!\left(\frac{C-\gamma}\sigma\right),\quad P(+\mid-)=Q\!\left(\frac{C+\gamma}\sigma\right)\\[.45em]P_e=pQ\!\left(\frac{C-\gamma}\sigma\right)+(1-p)Q\!\left(\frac{C+\gamma}\sigma\right)\end{gathered}
$$

## 6. 检查两个极限

等先验时门限为0。$C=0$时两个条件密度完全重合，门限公式不能再除$C$；最佳策略是永远选更常见的一类。

$$
\begin{gathered}p=\frac12\implies\gamma=0,\quad P_e=Q\!\left(\frac C\sigma\right)\\[.45em]\text{匹配时 }P_e=Q\!\left(\sqrt{\frac{2E_v}{N_0}}\right)\\[.45em]C=0\implies P_{e,\min}=\min(p,1-p)\end{gathered}
$$

## 数值例子

$E_{v}=1$、$N_{0}=0.5$、单位能量模板：匹配时$C=1$、$\sigma =0.5$，$P_{e}=Q(2)=0.02275$。模板转60°，$C=0.5$，错误率$Q(1)=0.15866$。把模板整体放大2倍，$C$与$\sigma $同时翻倍，错误率不变。

信号处理改变可分性，先验改变最佳决策；这两步分别观察。
