# 相干解调噪声系数：逐段计算面积

条件：输入实AWGN双边PSD为$\frac{N_0}2$；消息截止$B$；前置理想带通；乘$k \cos (2\pi f_{c} t)$后理想低通。

## 1. 先记录前置滤波后的输入面积

DSB在正载频附近通过宽度2B，负载频镜像也宽2B；SSB总通过长度2B。

$$
\begin{gathered}N_{i,\mathrm{DSB}}=\frac{N_0}2\cdot4B=2N_0B\\[.45em]N_{i,\mathrm{SSB}}=\frac{N_0}2\cdot2B=N_0B\end{gathered}
$$

## 2. 混频产生两个移频副本

$k\cos\omega_ct=\frac k2(e^{j\omega_ct}+e^{-j\omega_ct})$，幅度系数平方后成为$k^{2}/4$。这里指时间平均输出PSD，低通保留分离的带通噪声搬移项。

$$
\begin{gathered}S_{\mathrm{mix}}(f)=\frac{k^2}4[S_i(f-f_c)+S_i(f+f_c)]\end{gathered}
$$

## 3. DSB的两份噪声在基带重合

每个$|f|<B$处，两项原谱都在通过区内，每项高$\frac{N_0}2$，所以相加为$N_{0}$。

$$
\begin{gathered}S_{o,\mathrm{DSB}}(f)=\frac{k^2N_0}4\quad(|f|<B)\\[.45em]N_{o,\mathrm{DSB}}=\frac{k^2N_0}4\cdot2B=\frac{k^2N_0B}2\end{gathered}
$$

## 4. SSB在基带每侧只留一份

只保留上边带及其负频镜像时，正基带与负基带各来自一个搬移项。每侧谱高为$k^{2}N_{0}/8$。

$$
\begin{gathered}S_{o,\mathrm{SSB}}(f)=\frac{k^2N_0}8\quad(|f|<B)\\[.45em]N_{o,\mathrm{SSB}}=\frac{k^2N_0B}4\end{gathered}
$$

## 5. 用相同增益处理信号和噪声

倍增本振幅度使信号幅度与噪声标准差都倍增，功率同时乘4。不能只调整噪声答案而不调整信号。

$$
\begin{gathered}k=2:\quad N_{o,\mathrm{DSB}}=2N_0B,\quad N_{o,\mathrm{SSB}}=N_0B\\[.45em]k=1:\quad N_{o,\mathrm{DSB}}=\frac{N_0B}2,\quad N_{o,\mathrm{SSB}}=\frac{N_0B}4\end{gathered}
$$

## 数值例子

$N_{0}=0.1\,\mathrm{W}/\mathrm{Hz}$，$B=4\,\mathrm{Hz}$，$k=2$：DSB输入/输出均0.8W；SSB输入/输出均0.4W。$k$降为1，输出分别0.2W和0.1W，信号功率也降为原来的$1/4$。

$N_{0}B$不是固定标签；始终用谱高×实际双边频宽检查答案。
