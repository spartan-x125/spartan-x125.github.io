# 随机相位余弦：均值与平稳性

条件：$Y(t)=X(t)\cos (\omega _{c} t+\Phi )$；$X$为WSS，$\Phi $与整个$X$过程独立，$\Phi \sim U[-a,a]$，$\omega _{c}\ne 0$。

## 1. 固定时刻，对随机相位取平均

$t$是参数；积分变量是$\Phi $。独立性使两个因子的期望相乘。

$$
\begin{gathered}m_Y(t)=\frac{m_X}{2a}\int_{-a}^a\cos(\omega_ct+\phi)d\phi\\[.45em]=m_X\cos(\omega_ct)\frac{\sin a}{a}\end{gathered}
$$

## 2. 相关需要同一相位出现在两个时刻

同一条样本函数使用同一个$\Phi $，不是每个时刻重新独立抽相位。先用积化和差。

$$
\begin{gathered}\cos(\omega_ct+\Phi)\cos[\omega_c(t+\tau)+\Phi]\\[.45em]=\frac12\cos(\omega_c\tau)+\frac12\cos[\omega_c(2t+\tau)+2\Phi]\end{gathered}
$$

## 3. 再对相位积分

奇对称正弦项积分为零，余弦项留下$\sin (2a)/(2a)$。

$$
\begin{gathered}R_Y(t,\tau)=\frac{R_X(\tau)}2\left\{\cos(\omega_c\tau)+\frac{\sin(2a)}{2a}\cos[\omega_c(2t+\tau)]\right\}\end{gathered}
$$

## 4. 同时检查两个WSS条件

只让相关的$t$项消失还不够，均值也必须是常数。对非退化$X$与$0<a<\pi $，相关条件要求$a=\pi /2$。

$$
\begin{gathered}\sin(2a)=0\implies a=\frac\pi2\quad(0<a<\pi)\\[.45em]m_X=0\implies m_Y=0\quad\text{可为WSS}\\[.45em]m_X\ne0\implies m_Y(t)=\frac{2m_X}\pi\cos\omega_ct\quad\text{非WSS}\end{gathered}
$$

## 5. 完整相位周期是另一个清晰极限

$a=\pi $时，均值与二倍相位项都消失。固定幅度余弦对应$X$≡1，在此条件下是WSS。

$$
\begin{gathered}a=\pi\implies m_Y=0\\[.45em]R_Y(\tau)=\frac{R_X(\tau)}2\cos(\omega_c\tau)\end{gathered}
$$

## 数值例子

固定幅度1、$f_{c}=1\,\mathrm{Hz}$、$a=\pi /2$：$R(t,\tau )=0.5cos(2\pi \tau )$虽不含$t$，但$m(t)=(2/\pi )\cos (2\pi t)$，仍非WSS。$a=\pi $时才同时满足两项。

集合平均沿样本方向，平稳性要分别检查均值和相关。
