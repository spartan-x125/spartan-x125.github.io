# 从旋转积分到功率谱密度

条件：连续时间；对称矩形观察窗；电阻归一化为1Ω；$\operatorname{sinc}u=\frac{\sin(\pi u)}{\pi u}$。

## 1. 先把实余弦拆成两个旋转分量

欧拉公式同时给出正负频率及相位；负频率不是额外增加的物理功率。

$$
\begin{gathered}x(t)=A\cos(2\pi f_0t+\varphi)\\[.45em]=\frac A2e^{j\varphi}e^{j2\pi f_0t}+\frac A2e^{-j\varphi}e^{-j2\pi f_0t}\end{gathered}
$$

## 2. 在试探频率的参考系中积分

令$\nu =f_{0}-f$，积分的上下端点相减产生正弦。$\nu =0$时用极限，不能直接除以零。

$$
\begin{gathered}\int_{-T/2}^{T/2}e^{j2\pi\nu t}\,dt=\left[\frac{e^{j2\pi\nu t}}{j2\pi\nu}\right]_{-T/2}^{T/2}\\[.45em]=\frac{\sin(\pi\nu T)}{\pi\nu}=T\operatorname{sinc}(\nu T)\end{gathered}
$$

## 3. 得到有限窗的复频谱

每个频率点都要重新做一次乘法与积分。实部与虚部都必须保留，否则无法恢复相位。

$$
\begin{gathered}X_T(f)=\frac{AT}{2}\left\{e^{j\varphi}\operatorname{sinc}[(f-f_0)T]+e^{-j\varphi}\operatorname{sinc}[(f+f_0)T]\right\}\end{gathered}
$$

## 4. 把每单位带宽的功率定义清楚

有限窗能量为$E_{T}$。Parseval使时域平方积分等于频域模平方积分；除以观察时长，得到平均功率。

$$
\begin{gathered}E_T=\int_{-T/2}^{T/2}|x(t)|^2dt=\int_{-\infty}^{\infty}|X_T(f)|^2df\\[.45em]S_T(f)=\frac{|X_T(f)|^2}{T},\qquad\int_{-\infty}^{\infty}S_T(f)df=\frac{E_T}{T}\\[.45em]\Delta f=\frac1T,\qquad P_k\approx S_T(f_k)\Delta f\end{gathered}
$$

## 5. 再看无限长周期信号

周期信号的谱是带权冲激。平方的是傅里叶级数系数，不能计算$\delta ^{2}$。有限窗PSD峰值随$T$增长、宽度随$1/T$缩小，面积保持有限。

$$
\begin{gathered}c_+=\frac A2e^{j\varphi},\quad c_-=\frac A2e^{-j\varphi}\\[.45em]S_x(f)=\frac{A^2}{4}[\delta(f-f_0)+\delta(f+f_0)]\\[.45em]P=\frac{A^2}{2},\qquad P_{\mathrm{line}}=\frac{A^2}{4}\end{gathered}
$$

## 数值例子

$A=2$、$f_{0}=3\,\mathrm{Hz}$、$\varphi =0$、$T=2\,\mathrm{s}$：窗内恰好6周期，平均功率2W。归一化幅度峰$|X_{T}|/T=1\,\mathrm{V}$；每根功率线1W；$S_{T}(\pm 3)=2\,\mathrm{W}/\mathrm{Hz}$。把$T$改为4s，PSD峰升到$4\,\mathrm{W}/\mathrm{Hz}$，谱线面积仍为1W。

功率谱描述功率如何分布；PSD是对频率的密度。线谱用权重，连续谱用面积，有限FFT频点用$\Delta f$连接二者。
