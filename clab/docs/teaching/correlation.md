# 内积、能量相关与协方差

条件：实波形在一个完整周期上均匀平均；令$U$为该区间的均匀随机时间。

## 1. 把时间平均写成期望

对$U$均匀抽样，概率密度是$1/L$，因此两个框架使用同一积分，只是权重来源不同。

$$
\begin{gathered}\mathbb E[x(U)y(U)]=\frac1L\int_0^Lx(t)y(t)\,dt\end{gathered}
$$

## 2. 区分原始内积和中心化内积

方差必须先减均值；直流偏置有能量，却不会改变中心化后的波动。

$$
\begin{gathered}\operatorname{Cov}(X,Y)=\mathbb E[XY]-\mathbb E[X]\mathbb E[Y]\\[.45em]\operatorname{Var}(X)=\mathbb E[X^2]-\mathbb E[X]^2\\[.45em]\rho_E=\frac{\mathbb E[XY]}{\sqrt{\mathbb E[X^2]\mathbb E[Y^2]}}\\[.45em]\rho_P=\frac{\operatorname{Cov}(X,Y)}{\sqrt{\operatorname{Var}(X)\operatorname{Var}(Y)}}\end{gathered}
$$

## 3. 构造能看出区别的两条波形

取$x=\sqrt{2}\cos (2\pi t)$、$y=\sqrt{2}\cos (2\pi t-\theta )+d$。在一周期内，正余弦均值为零、平方均值为$1/2$、正交项积分为零。

$$
\begin{gathered}\mathbb E[x]=0,\quad\mathbb E[y]=d\\[.45em]\mathbb E[x^2]=1,\quad\mathbb E[y^2]=1+d^2\\[.45em]\mathbb E[xy]=\cos\theta,\quad\operatorname{Cov}(x,y)=\cos\theta\end{gathered}
$$

## 4. 分别归一化

中心化消去了$d$，所以两个分母不同。不能把“相关系数”当成无需定义的统一名称。

$$
\begin{gathered}\rho_E=\frac{\cos\theta}{\sqrt{1+d^2}},\qquad\rho_P=\cos\theta\end{gathered}
$$

## 5. 解释取等与独立

Cauchy–Schwarz取等是线性相关；独立需要更强条件。对联合高斯变量，零协方差才足以推出独立。

$$
\begin{gathered}|\langle x,y\rangle|^2\le\|x\|^2\|y\|^2\\[.45em]\text{等号成立}\iff y=kx\quad\text{（几乎处处）}\\[.45em]\text{联合高斯且 }\operatorname{Cov}(X,Y)=0\implies\text{独立}\end{gathered}
$$

## 数值例子

$\theta =45^{\circ}$：$d=0$时两种相关均为0.7071；$d=2$时$\rho_E=\frac{0.7071}{\sqrt5}=0.3162$，$\rho _{P}$仍为0.7071。

先问“是否中心化、用什么权重”，再比较相关公式。
