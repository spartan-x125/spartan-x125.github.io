# AM边带、SSB与功率的来处

条件：零均值单音消息，$m_{n}=\cos (2\pi f_{m} t)$；$f_{c}>f_{m}$；1Ω；标准SSB采用m cos−m̂ sin。

## 1. 展开AM中的乘法

常数项保留载波，消息与载波相乘产生和差频，每根边带的幅度是$A_{c}\mu /2$。

$$
\begin{gathered}s=A_c[1+\mu\cos\omega_mt]\cos\omega_ct\\[.45em]=A_c\cos\omega_ct+\frac{A_c\mu}2\cos[(\omega_c+\omega_m)t]\\[.45em]+\frac{A_c\mu}2\cos[(\omega_c-\omega_m)t]\end{gathered}
$$

## 2. 按正交余弦的功率相加

不同频率长期交叉均值为零，每根余弦功率为幅度平方的一半。

$$
\begin{gathered}P_c=\frac{A_c^2}2,\quad P_{\mathrm{USB}}=P_{\mathrm{LSB}}=\frac{A_c^2\mu^2}8\\[.45em]P_{\mathrm{SB}}=\frac{A_c^2\mu^2}4\\[.45em]\eta=\frac{P_{\mathrm{SB}}}{P_c+P_{\mathrm{SB}}}=\frac{\mu^2}{2+\mu^2}\end{gathered}
$$

## 3. SSB滤波法要保留共轭镜像

DSB乘cos后的幅度是标准SSB的一半。滤掉一组边带，并不自动补回增益。

$$
\begin{gathered}m\cos\omega_ct=\frac12\cos[(\omega_c+\omega_m)t]+\frac12\cos[(\omega_c-\omega_m)t]\\[.45em]\text{保留USB}\implies\frac12\cos[(\omega_c+\omega_m)t]\end{gathered}
$$

## 4. 相移法直接合成一条边带

单音的Hilbert变换为$\sin \omega _{m} t$。两个支路的和差让一组边带相消，另一组相加。

$$
\begin{gathered}m\cos\omega_ct-\widehat m\sin\omega_ct\\[.45em]=\cos\omega_mt\cos\omega_ct-\sin\omega_mt\sin\omega_ct\\[.45em]=\cos[(\omega_c+\omega_m)t]\end{gathered}
$$

## 5. 把带宽与包络条件分开

上下边带是正载频两侧；负频率是实信号镜像。$\mu >1$时带符号调幅函数穿零，正幅度包络取绝对值而折返。

$$
\begin{gathered}B_{\mathrm{AM}}=B_{\mathrm{DSB}}=2W,\quad B_{\mathrm{SSB}}=W\\[.45em]A_{\mathrm{envelope}}=|A_c(1+\mu m_n)|\end{gathered}
$$

## 数值例子

$A_{c}=2$、$\mu =0.6$：$P_{c}=2\,\mathrm{W}$，$P_{\mathrm{SB}}=0.36\,\mathrm{W}$，$\eta =0.36/2.36=15.25\%$。$\mu =1$时$\eta =1/3$；继续增大$\mu $会过调制，不能以效率上升推断包络检波仍正确。

频移来自乘法；AM的命名来自消息控制的载波参数。
