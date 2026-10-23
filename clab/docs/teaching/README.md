# 概念辨析 · 推导笔记

29个概念单元，对应22篇逐步推导。

- [从旋转积分到功率谱密度](spectrum.md)
- [内积、能量相关与协方差](correlation.md)
- [滑动积分器为什么等价于矩形响应](convolution.md)
- [复包络与低通等效中的1/2](envelope.md)
- [随机相位余弦：均值与平稳性](ensemble.md)
- [AM边带、SSB与功率的来处](modulation.md)
- [相干解调噪声系数：逐段计算面积](noise.md)
- [PAM功率谱：从双重求和到连续谱与线谱](pam.md)
- [零ISI：时域格点与频域叠加](nyquist.md)
- [匹配滤波与MAP判决的完整信号链](decision.md)
- [QPSK：符号能量、比特能量与错误率](constellation.md)
- [采样混叠：为什么同一组点对应不同频率](sampling.md)
- [量化误差、PCM码率与6.02b](quantization.md)
- [熵与Huffman：平均不确定性怎样变成码长](entropy.md)
- [固定功率时，带宽为什么不能让容量无限增长](capacity.md)
- [Hamming与CRC：综合征和余数能说明什么](coding.md)
- [Viterbi为什么能丢弃部分路径](viterbi.md)
- [正交子载波：频谱重叠为何仍能分离](ofdm.md)
- [m序列相关与扩频处理增益](spread.md)
- [时间延时与恒相移为什么不能混用](phase-delay.md)
- [积分器、微分器、初值与数值实现](calculus.md)
- [LPF、BPF、自定义H(f)与h(t)](filters.md)

图解、推导与独立阅读版分别由src/concepts.js、src/derivations.js和scripts/build-derivations.mjs维护。
