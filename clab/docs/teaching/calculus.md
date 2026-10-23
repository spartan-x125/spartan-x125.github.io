# 积分器、微分器、初值与数值实现

条件：连续积分起点为$t_{0}$，初值$y_{0}$；数值实现为复合梯形积分和内点中心差分；讨论正弦稳态时避开$f=0$。

## 1. 先写出含初值的时间定义

有限起点积分与从负无穷的系统积分不同。常量输入会产生斜坡，初值会额外产生一个常数。

$$
\begin{gathered}y(t)=y_0+\int_{t_0}^tx(u)du\\[.45em]x=1\implies y=y_0+t-t_0\end{gathered}
$$

## 2. 对正弦逐项积分和微分

积分给出$1/\omega $因子与相位滞后；微分给出$\omega $因子与相位超前。若用正弦从0开始积分，还要补一个常数使初值成立。

$$
\begin{gathered}\int_0^t\sin(\omega u)du=\frac{1-\cos\omega t}\omega\\[.45em]\frac d{dt}\sin\omega t=\omega\cos\omega t\\[.45em]H_{\mathrm{int}}=\frac1{j2\pi f},\quad H_{\mathrm{diff}}=j2\pi f\end{gathered}
$$

## 3. 高频扰动的比例发生变化

令输入$\sin (2\pi f_{1}t)+a \sin (2\pi f_{2}t)$。两项的相对幅度在微分后乘$f_{2}/f_{1}$，积分后乘$f_{1}/f_{2}$。

$$
\begin{gathered}\frac{A_{\mathrm{noise,diff}}}{A_{\mathrm{signal,diff}}}=a\frac{f_2}{f_1}\\[.45em]\frac{A_{\mathrm{noise,int}}}{A_{\mathrm{signal,int}}}=a\frac{f_1}{f_2}\end{gathered}
$$

## 4. 明确离散计算公式

梯形法累计相邻样本的平均值；中心差分用两侧样本。端点缺一侧时改用单边差分，因此端点误差通常更大。

$$
\begin{gathered}y[0]=y_0\\[.45em]y[n]=y[n-1]+\frac{\Delta t}2(x[n-1]+x[n])\\[.45em]x'[n]\approx\frac{x[n+1]-x[n-1]}{2\Delta t}\end{gathered}
$$

## 5. 区分算法误差与真实系统效应

加密采样会减小差分误差，但不会消除微分器本身放大高频的性质。理想无限带宽白噪声不能直接作为有限方差波形微分。

$$
\begin{gathered}[y_{\mathrm{int}}]=[x]\cdot\mathrm s\\[.45em][y_{\mathrm{diff}}]=[x]/\mathrm s\end{gathered}
$$

## 数值例子

$f_{1}=2\,\mathrm{Hz}$、$f_{2}=12\,\mathrm{Hz}$、$a=0.05$：原扰动相对幅度0.05；微分后为0.3；积分的交流部分仅为约0.00833。若积分初值为2，结果还要整体加2。

积分和微分不是只换一个符号；它们改变频率增益、相位和量纲。
