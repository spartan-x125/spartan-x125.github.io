# LPF、BPF、自定义H(f)与h(t)

条件：实LTI系统；本例理想滤波用单窗周期FFT；$h(t)$模式采用有限窗口线性卷积或加权理想冲激。

## 1. 输入输出关系由系统函数确定

频域相乘与时域卷积是一对同样的运算关系。$H(f)$改变各频率的复幅度，不能把$H$本身当作输出波形。

$$
\begin{gathered}y=x*h\\[.45em]Y(f)=X(f)H(f)\\[.45em]H(f)=\mathcal F\{h(t)\}\end{gathered}
$$

## 2. 低通的截止围绕零频

正负频率都通过，$|f|<B$。用rect定义时，其边界值按本项目约定为$1/2$。

$$
\begin{gathered}H_{\mathrm{LPF}}(f)=\operatorname{rect}\!\left(\frac f{2B}\right)\\[.45em]f_{\mathrm{cutoff}}=B,\quad f\in[-B,B]\end{gathered}
$$

## 3. 带通的中心与两个截止相互关联

正频通带为[$f_{L},f_{H}]$，负频保留共轭镜像。中心$f_{0}$与半带宽$B$给出两个截止，修改截止时要同步更新中心和宽度。

$$
\begin{gathered}f_0=\frac{f_L+f_H}2,\qquad B=\frac{f_H-f_L}2\\[.45em]f_L=f_0-B,\quad f_H=f_0+B\\[.45em]H_{\mathrm{BPF}}(f)=\operatorname{rect}\!\left(\frac{|f|-f_0}{2B}\right)\end{gathered}
$$

## 4. 逐个频率预测双音输出

$x=\cos (2\pi \cdot 2t)+\cos (2\pi \cdot 12t)$。$LPF B=3$通过2Hz、阻断12Hz；BPF中心12、半带宽3则通过12Hz、阻断2Hz。

$$
\begin{gathered}y_{\mathrm{LPF}}=\cos(4\pi t)\\[.45em]y_{\mathrm{BPF}}=\cos(24\pi t)\end{gathered}
$$

## 5. 系统函数可以带幅度和相位

例如一阶低通$H=\frac1{1+j2\pi f\tau}$，对应因果$h=\frac1\tau e^{-t/\tau}u(t)$。匹配滤波则先给模板$s$和观察时刻$T$，再构造$h=s*(T-t)$。

$$
\begin{gathered}\tau=0.1\ \mathrm s:\quad H(f)=\frac1{1+j2\pi f\cdot0.1}\\[.45em]h(t)=10e^{-10t}u(t)\\[.45em]h_{\mathrm{MF}}(t)=s^*(T-t),\quad y(T)=\int r(t)s^*(t)dt\end{gathered}
$$

## 数值例子

矩形模板在[0.1,0.3]上为1，设$T=0.5\,\mathrm{s}$。匹配响应在[0.2,0.4]上为1，无噪声时$y(0.5)=$模板能量0.2。用$h(t)=\delta (t)$则输出与输入相同；用$\delta (t)+0.4\delta (t-0.1)$可测试双径。

频带选择、系统响应与参考模板分开指定；通过各节点输入输出核对链路。
