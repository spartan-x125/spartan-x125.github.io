# m序列相关与扩频处理增益

条件：三阶本原LFSR；非零初态；完整周期；比特映为$\pm 1$；只讨论该周期相关，不把扰码当加密。

## 1. 先区分寄存器位数与周期

$m$位寄存器有2ᵐ种状态，全零为吸收态。选择本原反馈与非零初态才可遍历其余全部状态。

$$
\begin{gathered}N=2^m-1,\qquad m=3\implies N=7\end{gathered}
$$

## 2. 映射为双极性序列并计算循环相关

用$c_{n}=1-2b_{n}$，索引按模$N$回绕。非零移位的乘积序列具有$m$序列平衡性：一类比另一类多1个，和为−1。

$$
\begin{gathered}R[k]=\frac1N\sum_{n=0}^{N-1}c_nc_{(n+k)\bmod N}\\[.45em]R[0]=1,\quad R[k]=-\frac1N\quad(k\not\equiv0\pmod N)\end{gathered}
$$

## 3. 解扩是与本地码相乘积累

期望码对齐时$c_{n}^{2}=1$，消息相干积累；不相关或失配干扰不能以相同方式积累。

$$
\begin{gathered}r_nc_n=(ac_n+i_n+n_n)c_n\\[.45em]=a+i_nc_n+n_nc_n\end{gathered}
$$

## 4. 明确处理增益的比较条件

宽带扩频后经过匹配解扩与窄带检测，可抑制适当的窄带干扰。但固定$\frac{E_b}{N_0}$的单用户AWGN，扩频不会凭空改善未编码BER。

$$
\begin{gathered}G_p\approx\frac{R_{\mathrm{chip}}}{R_b}\\[.45em]\text{理想反极性AWGN：}\quad P_b=Q\!\left(\sqrt{\frac{2E_b}{N_0}}\right)\end{gathered}
$$

## 数值例子

码0010111按0→+1、1→−1映射后，循环相关为1、$-1/7$、$-1/7$、$-1/7$、$-1/7$、$-1/7$、$-1/7$。截取不完整片段再做非周期相关，结果不必仍是两值。

相关结论依赖周期、映射和对齐；扩频增益依赖干扰与比较条件。
