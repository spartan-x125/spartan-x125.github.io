# 熵与Huffman：平均不确定性怎样变成码长

条件：离散无记忆信源；二元前缀码；$p=(1/2,1/4,1/8,1/8)$。

## 1. 先计算每个符号的信息量

概率越小，观察到它带来的信息越多；熵是按概率加权的平均。

$$
\begin{gathered}I_i=-\log_2p_i=(1,2,3,3)\ \mathrm{bit}\\[.45em]H=\sum_ip_iI_i=0.5+0.5+0.375+0.375=1.75\end{gathered}
$$

## 2. 合并两个最小概率

每次合并使这两个子树中所有叶子的码长增加1，新增平均码长正好等于合并权重。

$$
\begin{gathered}\frac18+\frac18=\frac14\\[.45em]\frac14+\frac14=\frac12\\[.45em]\frac12+\frac12=1\end{gathered}
$$

## 3. 从根向叶赋0和1

一个可行结果是0、10、110、111。同权交换会改变具体码字，但不改变平均长度。

$$
\begin{gathered}\overline L=\frac12\cdot1+\frac14\cdot2+\frac18\cdot3+\frac18\cdot3=1.75\\[.45em]\sum_i2^{-l_i}=2^{-1}+2^{-2}+2^{-3}+2^{-3}=1\end{gathered}
$$

## 4. 检查熵界与压缩收益

二元最优前缀码通常满足$H\le\overline L<H+1$；本例概率均为2的负整数次幂，可以恰好达到$H$。

$$
\begin{gathered}L_{\mathrm{fixed}}=2\ \mathrm{bit/\text{符号}}\\[.45em]\Delta L=2-1.75=0.25\ \mathrm{bit/\text{符号}}\\[.45em]\frac{\Delta L}{L_{\mathrm{fixed}}}=12.5\%\end{gathered}
$$

## 数值例子

每秒1000个独立符号：固定长度需$2000bit/s$；上述Huffman平均$1750bit/s$。它降低平均码率，不保证每个符号都变短。

信息量是单次，熵是平均；Huffman优化平均码长。
