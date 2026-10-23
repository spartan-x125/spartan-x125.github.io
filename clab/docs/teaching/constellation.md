# QPSK：符号能量、比特能量与错误率

条件：相干Gray QPSK；等概符号；$I/Q$噪声独立且各方差$\frac{N_0}2$；单位正交基。

## 1. 把二维符号写成两个反极性坐标

四个点每个坐标为$\pm\sqrt{E_s/2}$，两个坐标平方之和是$E_{s}$。

$$
\begin{gathered}s=\left(\pm\sqrt{\frac{E_s}2},\pm\sqrt{\frac{E_s}2}\right)\\[.45em]E_s=I^2+Q^2,\qquad E_b=\frac{E_s}2\end{gathered}
$$

## 2. 每个坐标沿零门限判决

每一比特就是一维反极性判决；坐标信号幅度与噪声标准差之比给出$Q$函数自变量。

$$
\begin{gathered}P_b=Q\!\left(\frac{\sqrt{E_s/2}}{\sqrt{N_0/2}}\right)\\[.45em]=Q\!\left(\sqrt{\frac{E_s}{N_0}}\right)=Q\!\left(\sqrt{\frac{2E_b}{N_0}}\right)\end{gathered}
$$

## 3. 符号正确要求两路都正确

$I/Q$噪声独立，因此符号正确概率是两路正确概率的乘积。

$$
\begin{gathered}P_s=1-(1-P_b)^2=2P_b-P_b^2\end{gathered}
$$

## 4. 区分最近距离与每比特能量

相邻点只在一个坐标改变符号，因此距离$2\sqrt{E_{b}}$。固定$E_{s}$与固定$E_{b}$比较调制方式会得到不同问题。

$$
\begin{gathered}d_{\min}=2\sqrt{E_s/2}=2\sqrt{E_b}\\[.45em]R_b=2R_s\quad\text{（未编码QPSK）}\end{gathered}
$$

## 数值例子

$E_{b}/N_{0}=3\,\mathrm{dB}\approx 1.995$：$P_b=Q(\sqrt{3.99})\approx0.02288$，$P_{s}\approx 0.04523$。不是$P_{b}=P_{s}/2$的严格恒等式；后者仅在高SNR时近似。

星座点距离决定分辨难度，Gray映射决定邻点错误影响几位。
