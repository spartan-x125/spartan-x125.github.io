# 量化误差、PCM码率与6.02b

条件：满幅区间[−A,A]；$L=2^{b}$级均匀中升量化；高分辨率、无过载、误差近似均匀；满幅正弦输入。

## 1. 由量化级数确定步长

每个区间宽度相等，重建值取区间中点。端点饱和规则要另行指定。

$$
\begin{gathered}L=2^b,\quad\Delta=\frac{2A}L\\[.45em]e=x-Q(x)\in[-\Delta/2,\Delta/2]\end{gathered}
$$

## 2. 对误差平方做积分

均匀误差密度为$1/\Delta $。偶对称积分给出$\frac{\Delta^2}{12}$，这不是对任意输入都成立的精确模型。

$$
\begin{gathered}\sigma_e^2=\frac1\Delta\int_{-\Delta/2}^{\Delta/2}e^2de\\[.45em]=\frac2\Delta\left[\frac{e^3}3\right]_0^{\Delta/2}=\frac{\Delta^2}{12}\end{gathered}
$$

## 3. 代入满幅正弦功率

正弦平均功率$A^{2}/2$；与量化噪声相除，$A$消掉。

$$
\begin{gathered}\mathrm{SQNR}=\frac{A^2/2}{\Delta^2/12}=\frac32L^2=\frac32\,2^{2b}\end{gathered}
$$

## 4. 转换为分贝并计算码率

每增加一位，级数翻倍，误差功率约减为$1/4$。码率则是每秒样本数乘每样本位数。

$$
\begin{gathered}\mathrm{SQNR}_{\mathrm{dB}}=10\log_{10}\frac32+20b\log_{10}2\\[.45em]\approx1.76+6.02b\ \mathrm{dB}\\[.45em]R_b=bf_s\end{gathered}
$$

## 5. TDM与编码开销继续逐级算

$N$路每帧各一个样值、每帧$h$位开销；信道码率$R_{c}$，$M$进制映射。

$$
\begin{gathered}R_{\mathrm{PCM}}=f_s(Nb+h)\\[.45em]R_{\mathrm{channel}}=\frac{R_{\mathrm{PCM}}}{R_c}\\[.45em]R_s=\frac{R_{\mathrm{channel}}}{\log_2M}\end{gathered}
$$

## 数值例子

$A=1$、$b=3$：$\Delta =0.25$，$\sigma _{e}^{2}\approx 0.005208$，满幅正弦$SQNR\approx 19.82\,\mathrm{dB}$。8kHz、8bit单路PCM为$64kbit/s$；32路每帧另加8bit，帧率8kHz时为$2.112Mbit/s$。

$\frac{\Delta^2}{12}$有适用条件；量化噪声、过载失真和采样混叠分别处理。
