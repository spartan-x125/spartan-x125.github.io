# 正交子载波：频谱重叠为何仍能分离

条件：有用窗长$T_{u}$；理想同步；子载波$\Delta f=\frac1{T_u}$；CP覆盖信道超额时延，窗内信道近似不变。

## 1. 对子载波做整窗内积

当索引差为非零整数，指数积分的首尾相等，分子为零。这里零的是整窗内积，不是每个时刻的瞬时乘积。

$$
\begin{gathered}\frac1{T_u}\int_0^{T_u}e^{j2\pi(k-l)t/T_u}dt\\[.45em]=\begin{cases}1&k=l\\[.45em]\dfrac{e^{j2\pi(k-l)}-1}{j2\pi(k-l)}=0&k\ne l\end{cases}\end{gathered}
$$

## 2. 频偏使整数条件失效

令归一化频偏$\varepsilon =\delta fT_{u}$，交叉系数为带相位的sinc。$\varepsilon \ne 0$时本应为零的其他子载波项一般不再为零。

$$
\begin{gathered}C_{kl}(\varepsilon)=e^{j\pi(k-l+\varepsilon)}\operatorname{sinc}(k-l+\varepsilon)\\[.45em]|C_{kl}|^2=\operatorname{sinc}^2(k-l+\varepsilon)\end{gathered}
$$

## 3. CP让有效块成为循环卷积

复制符号尾部到前端。CP足够长且正确去除后，每个有效样点所需的前序输入来自本块的循环延拓。

$$
\begin{gathered}y[n]=\sum_mh[m]x[(n-m)\bmod N]+w[n]\\[.45em]Y[k]=H[k]X[k]+W[k]\end{gathered}
$$

## 4. 把各项开销纳入信息码率

有用子载波数$N_{d}$、每符号$\log _{2}M$位、码率$R_{c}$，分母必须包含CP。

$$
\begin{gathered}R_{\mathrm{info}}=\frac{N_d\log_2M\cdot R_c}{T_u+T_{\mathrm{CP}}}\\[.45em]\text{CP不消除频偏、深衰落或快时变}\end{gathered}
$$

## 数值例子

$T_{u}=1\,\mathrm{ms}$时$\Delta f=1\,\mathrm{kHz}$。$\delta f=100\,\mathrm{Hz}$给$\varepsilon =0.1$，目标子载波耦合功率$\operatorname{sinc}^{2}(0.1)\approx 0.9675$；相邻项$\operatorname{sinc}^{2}(1.1)\approx 0.0080$，不再严格为0。

正交依赖整个观察窗与同步条件，频谱重叠本身不构成干扰。
