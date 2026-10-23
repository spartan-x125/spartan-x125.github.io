# Viterbi为什么能丢弃部分路径

条件：固定($7,5)_{8}$、$K=3$、初态00；每步输入$u$，状态(a,b)表示前两位；硬判BSC且交叉率小于$1/2$。

## 1. 先从寄存器写出分支输出

两个异或器分别取当前位与记忆位；状态更新按新位入栈。

$$
\begin{gathered}v_1=u\oplus a\oplus b,\qquad v_2=u\oplus b\\[.45em](a,b)\longrightarrow(u,a)\end{gathered}
$$

## 2. 将接收序列的似然化为距离

在BSC上，长度$L$、汉明距离$d$的路径似然为$p$ᵈ(1−p)ᴸ⁻ᵈ。$p<1/2$时最大似然等价于最小$d$。

$$
\begin{gathered}-\ln P=-d\ln p-(L-d)\ln(1-p)\\[.45em]=\text{常数}+d\ln\frac{1-p}p\end{gathered}
$$

## 3. 证明同状态下仅需保留最优前缀

两条路径若在同一时刻到同一状态，对任意共同未来输入，其未来分支输出完全相同。较差前缀永远不能反超，因此可安全舍弃。

$$
\begin{gathered}M_k(s)=\min_{s'\to s}\left\{M_{k-1}(s')+d_{\mathrm{branch}}\right\}\end{gathered}
$$

## 4. 短例逐步编码并加入一个错误

输入101后加00尾比特，逐步状态00→10→01→10→01→00。接收与候选路径逐分支累加，而不是每一步直接决定输入位。

$$
\begin{gathered}\text{输入：}1\ 0\ 1\ 0\ 0\\[.45em]\text{输出：}11\ 10\ 00\ 10\ 11\\[.45em]\text{接收：}11\ 11\ 00\ 10\ 11\\[.45em]d_{\mathrm{true}}=1\end{gathered}
$$

## 5. 终点与尾比特影响有效速率

本例5次输入中仅3个是消息位，发送10位。母码率$1/2$与短帧有效码率不同。

$$
\begin{gathered}R_{\mathrm{eff}}=\frac3{10},\quad R_{\mathrm{mother}}=\frac12\\[.45em]\text{软判AWGN：欧氏距离或等价对数似然}\end{gathered}
$$

## 数值例子

在已有自由工作台的信息与编码页可查看完整格图、保留路径与回溯。本例真实路径的距离1提供对照；最优性来自同状态前缀支配关系，不来自每步贪心。

Viterbi保留每个状态的最优历史，最后再回溯整条序列。
