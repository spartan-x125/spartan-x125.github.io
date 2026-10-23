# 复包络与低通等效中的1/2

条件：实带通频带与镜像不重叠；解析信号正频翻倍；$x=\operatorname{Re}\{x_Le^{j2\pi f_ct}\}$。

## 1. 先构造解析信号，再搬移参考载频

Hilbert响应为−j sgn(f)。正频叠加后翻倍，负频抵消；下移载频后得到复包络。

$$
\begin{gathered}x_a=x+j\mathcal H\{x\}\\[.45em]X_a(f)=\begin{cases}2X(f)&f>0\\[.45em]0&f<0\end{cases}\\[.45em]x_L=x_ae^{-j2\pi f_ct},\qquad X_L(f)=2X(f+f_c)\end{gathered}
$$

## 2. 取实部恢复物理信号

$I$和$Q$是复包络的两个坐标。乘eʲωct后取实部，$Q$前出现负号。

$$
\begin{gathered}x_L=I+jQ\\[.45em]x=\operatorname{Re}\{(I+jQ)(\cos\omega_ct+j\sin\omega_ct)\}\\[.45em]=I\cos\omega_ct-Q\sin\omega_ct\end{gathered}
$$

## 3. 对系统输入输出做同一种表示

实系统$Y=HX$。对输出构造解析包络时只乘一次2，代入输入包络后，2被抵消。

$$
\begin{gathered}Y_L(f)=2Y(f+f_c)\\[.45em]=2H(f+f_c)X(f+f_c)\\[.45em]=H(f+f_c)X_L(f)\end{gathered}
$$

## 4. 辨认两个容易混淆的响应

如果把$h$也当一条实带通信号构造其复包络，就会再引入正频翻倍。它与系统映射的传递函数相差2。

$$
\begin{gathered}H_{\mathrm{eq}}(f)=H(f+f_c)\\[.45em]H_L(f)=2H(f+f_c)=2H_{\mathrm{eq}}(f)\\[.45em]y_L=x_L*h_{\mathrm{eq}}=\frac12x_L*h_L\end{gathered}
$$

## 5. 用相干混频检查I/Q方向

积化和差后，低通去掉$2f_{c}$分量，留下本振方向的投影。

$$
\begin{gathered}2\operatorname{LPF}\{x\cos(\omega_ct+\theta)\}\\[.45em]=I\cos\theta+Q\sin\theta=\operatorname{Re}\{x_Le^{-j\theta}\}\end{gathered}
$$

## 数值例子

$x_{L}=1\cdot rect[0,T]$，$h_{L}=2\cdot rect[0,T]$，则$h_{\mathrm{eq}}=1\cdot rect[0,T]$。$T=1$时，输出复包络三角峰值1；直接卷$x_{L}$和$h_{L}$得到2。这个矩形例子使用窄带等效模型，不声称有限载频截断脉冲严格带限。

$x_{a}$、$x_{L}$、$|x_{L}|$与$h_{\mathrm{eq}}$分别有自己的定义，系数必须成套。
