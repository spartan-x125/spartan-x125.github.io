# 采样混叠：为什么同一组点对应不同频率

条件：低通带限；理想冲激采样；$f_{s}=1/T$；重建端理想低通。

## 1. 把采样看成乘冲激梳

乘积在频域成为卷积，时域梳的傅里叶变换仍是梳，间隔互为倒数。

$$
\begin{gathered}x_s(t)=x(t)\sum_n\delta(t-nT)\\[.45em]X_s(f)=f_s\sum_kX(f-kf_s)\end{gathered}
$$

## 2. 找出频谱副本不重叠的条件

若原信号支撑在[−B,B]，相邻中心距离$f_{s}$，边缘相距$f_{s}-2B$。实际留裕量，避免临界相位与理想边缘问题。

$$
\begin{gathered}f_s>2B\\[.45em]H_{\mathrm{rec}}(f)=\frac1{f_s}\quad\text{（所需基带内）}\end{gathered}
$$

## 3. 从样本直接证明频率等价

采样点上增加$k f_{s}$，只多出整数个2π。实余弦还具有正负频率对称性。

$$
\begin{gathered}e^{j2\pi(f+kf_s)n/f_s}=e^{j2\pi fn/f_s}\\[.45em]\cos\frac{2\pi fn}{f_s}=\cos\frac{2\pi(f_s-f)n}{f_s}\end{gathered}
$$

## 4. 用逆变换得到sinc插值

理想重建滤波器在时域是sinc。样本点已经混叠时，这个公式只能重建选定基带中的代表信号。

$$
\begin{gathered}\widehat x(t)=\sum_nx(nT)\operatorname{sinc}\!\left(\frac{t-nT}{T}\right)\end{gathered}
$$

## 数值例子

$f=1\,\mathrm{kHz}$、$f_{s}=1.5\,\mathrm{kHz}$：1kHz与0.5kHz余弦在所有$n$点完全相同。提高插值点数不会补回丢失的频率身份。

采样率决定可辨认的频率范围，绘图点数只决定画得多密。
