# Hamming与CRC：综合征和余数能说明什么

条件：GF(2)运算；Hamming(7,4)偶校验，位序1…7；CRC最高次项在前、初始余数0、无反射或尾异或。

## 1. Hamming校验列是错误位置的二进制编号

取$H$的第$i$列为$i$的三位二进制，最低位在第一行；校验关系确保合法码字$Hc^{T}=0$。

$$
\begin{gathered}H=\begin{bmatrix}1&0&1&0&1&0&1\\[.45em]0&1&1&0&0&1&1\\[.45em]0&0&0&1&1&1&1\end{bmatrix}\\[.45em]s=Hr^{\mathsf T}=H(c+e)^{\mathsf T}=He^{\mathsf T}\end{gathered}
$$

## 2. 按消息生成一个合法码字

消息1011放在位置3、5、6、7，校验位在1、2、4，分别令对应检查和为偶。

$$
\begin{gathered}c_3=1,\ c_5=0,\ c_6=1,\ c_7=1\\[.45em]c_1=c_3\oplus c_5\oplus c_7=0\\[.45em]c_2=c_3\oplus c_6\oplus c_7=1\\[.45em]c_4=c_5\oplus c_6\oplus c_7=0\\[.45em]c=0110011\end{gathered}
$$

## 3. 单错时综合征就是该列

翻转第5位，接收0110111。综合征按($s_{2}s_{1}s_{0})$显示101，因此单错假设下应翻回第5位。双错可能伪装成另一列，不能保证纠正。

$$
\begin{gathered}e=e_5\implies s=H_5=(1,0,1)^{\mathsf T}\\[.45em]\text{位置}=s_0+2s_1+4s_2=5\end{gathered}
$$

## 4. CRC用余数构造可整除码字

消息1011对应$m=x^{3}+x+1$，$g=1101=x^{3}+x^{2}+1$，$r=3$。先补3个0，再做模二长除。

$$
\begin{gathered}x^3m=1011000\\[.45em]1011000\oplus1101000=0110000\\[.45em]0110000\oplus0110100=0000100\\[.45em]p=100,\qquad c=1011100\end{gathered}
$$

## 5. 判清零余数的含义

接收$r=c+e$。因为$c$可被$g$整除，接收余数只由错误$e$决定；非零余数必检错，零余数可能漏检。

$$
\begin{gathered}r\bmod g=e\bmod g\\[.45em]g\mid e\implies\text{漏检}\\[.45em]\text{Hamming：给定能力内纠错；CRC：通常检错}\end{gathered}
$$

## 数值例子

CRC若错误图样为0001101，恰好是$g$的一个移位对齐副本，就可能从一个可整除码字变成另一个可整除序列，校验余数仍为0。

综合征/余数是在压缩错误信息，不是给出任意错误的唯一身份。
