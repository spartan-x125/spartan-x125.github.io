# 固定功率时，带宽为什么不能让容量无限增长

条件：实AWGN信道；可用正频带宽$B$；单边噪声$PSD N_{0}$；固定接收总功率$P$。容量公式作为信道编码定理的前提，此处推导其带宽与能量结论。

## 1. 噪声随带宽一起增加

固定$N_{0}$时，通过更宽带宽会积累更多噪声；保持$P$与保持SNR是两个约束。

$$
\begin{gathered}N=N_0B,\qquad\mathrm{SNR}=\frac P{N_0B}\\[.45em]C(B)=B\log_2\!\left(1+\frac P{N_0B}\right)\end{gathered}
$$

## 2. 把宽带极限化为一个标准极限

令$u=P/(N_{0}B)$，当$B$→∞时$u$→0，使用$\ln (1+u)/u$→1。

$$
\begin{gathered}C=\frac{P}{N_0\ln2}\frac{\ln(1+u)}u\\[.45em]\lim_{B\to\infty}C=\frac P{N_0\ln2}\end{gathered}
$$

## 3. 从频谱效率推出每比特能量

令$R=C$，$\eta =R/B$。$E_{b}=P/R$，把$P/(N_{0}B)$替换为$\eta E_{b}/N_{0}$。

$$
\begin{gathered}\eta=\log_2\!\left(1+\eta\frac{E_b}{N_0}\right)\\[.45em]\frac{E_b}{N_0}=\frac{2^\eta-1}{\eta}\end{gathered}
$$

## 4. 取低频谱效率的能量极限

展开$2^\eta =1+\eta \ln 2+O(\eta ^{2})$，代回即可。该值是理想编码边界，不是未编码BPSK的误码率保证。

$$
\begin{gathered}\lim_{\eta\to0}\frac{E_b}{N_0}=\ln2\approx0.6931\\[.45em]10\log_{10}(\ln2)\approx-1.59\ \mathrm{dB}\end{gathered}
$$

## 数值例子

$P=1\,\mathrm{W}$、$N_{0}=0.1\,\mathrm{W}/\mathrm{Hz}$：$B=1\,\mathrm{Hz}$时$C=\log _{2}11\approx 3.459bit/s$；$B=10\,\mathrm{Hz}$时$C=10bit/s$；宽带极限≈$14.427bit/s$。固定SNR则$C$正比$B$，但此时$P$也随$B$增大。

容量的趋势由“保持什么不变”决定。
