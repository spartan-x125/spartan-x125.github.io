// Canonical TeX is kept separately from the readable historical notation.
const tex=String.raw;
export const noteFormulas={
 spectrum:[
 tex`x(t)=A\cos(2\pi f_0t+\varphi)\\=\frac A2e^{j\varphi}e^{j2\pi f_0t}+\frac A2e^{-j\varphi}e^{-j2\pi f_0t}`,
 tex`\int_{-T/2}^{T/2}e^{j2\pi\nu t}\,dt=\left[\frac{e^{j2\pi\nu t}}{j2\pi\nu}\right]_{-T/2}^{T/2}\\=\frac{\sin(\pi\nu T)}{\pi\nu}=T\operatorname{sinc}(\nu T)`,
 tex`X_T(f)=\frac{AT}{2}\left\{e^{j\varphi}\operatorname{sinc}[(f-f_0)T]+e^{-j\varphi}\operatorname{sinc}[(f+f_0)T]\right\}`,
 tex`E_T=\int_{-T/2}^{T/2}|x(t)|^2dt=\int_{-\infty}^{\infty}|X_T(f)|^2df\\S_T(f)=\frac{|X_T(f)|^2}{T},\qquad\int_{-\infty}^{\infty}S_T(f)df=\frac{E_T}{T}\\\Delta f=\frac1T,\qquad P_k\approx S_T(f_k)\Delta f`,
 tex`c_+=\frac A2e^{j\varphi},\quad c_-=\frac A2e^{-j\varphi}\\S_x(f)=\frac{A^2}{4}[\delta(f-f_0)+\delta(f+f_0)]\\P=\frac{A^2}{2},\qquad P_{\mathrm{line}}=\frac{A^2}{4}`],
 correlation:[
 tex`\mathbb E[x(U)y(U)]=\frac1L\int_0^Lx(t)y(t)\,dt`,
 tex`\operatorname{Cov}(X,Y)=\mathbb E[XY]-\mathbb E[X]\mathbb E[Y]\\\operatorname{Var}(X)=\mathbb E[X^2]-\mathbb E[X]^2\\\rho_E=\frac{\mathbb E[XY]}{\sqrt{\mathbb E[X^2]\mathbb E[Y^2]}}\\\rho_P=\frac{\operatorname{Cov}(X,Y)}{\sqrt{\operatorname{Var}(X)\operatorname{Var}(Y)}}`,
 tex`\mathbb E[x]=0,\quad\mathbb E[y]=d\\\mathbb E[x^2]=1,\quad\mathbb E[y^2]=1+d^2\\\mathbb E[xy]=\cos\theta,\quad\operatorname{Cov}(x,y)=\cos\theta`,
 tex`\rho_E=\frac{\cos\theta}{\sqrt{1+d^2}},\qquad\rho_P=\cos\theta`,
 tex`|\langle x,y\rangle|^2\le\|x\|^2\|y\|^2\\\text{等号成立}\iff y=kx\quad\text{（几乎处处）}\\\text{联合高斯且 }\operatorname{Cov}(X,Y)=0\implies\text{独立}`],
 convolution:[
 tex`y(t)=\int_{-\infty}^{t}x(\tau)d\tau-\int_{-\infty}^{t-T}x(\tau)d\tau=\int_{t-T}^{t}x(\tau)d\tau`,
 tex`h(t)=u(t)-u(t-T)\\y(t)=\int_{-\infty}^{\infty}x(\tau)h(t-\tau)d\tau`,
 tex`H(f)=\int_0^Te^{-j2\pi ft}dt=e^{-j\pi fT}\int_{-T/2}^{T/2}e^{-j2\pi fu}du\\=T\operatorname{sinc}(fT)e^{-j\pi fT},\quad H(0)=T`,
 tex`r(t)=\max\{0,\min(T,t)-\max(0,t-T)\}\\=\begin{cases}t&0\le t\le T\\2T-t&T\le t\le2T\\0&\text{其他}\end{cases}`],
 envelope:[
 tex`x_a=x+j\mathcal H\{x\}\\X_a(f)=\begin{cases}2X(f)&f>0\\0&f<0\end{cases}\\x_L=x_ae^{-j2\pi f_ct},\qquad X_L(f)=2X(f+f_c)`,
 tex`x_L=I+jQ\\x=\operatorname{Re}\{(I+jQ)(\cos\omega_ct+j\sin\omega_ct)\}\\=I\cos\omega_ct-Q\sin\omega_ct`,
 tex`Y_L(f)=2Y(f+f_c)\\=2H(f+f_c)X(f+f_c)\\=H(f+f_c)X_L(f)`,
 tex`H_{\mathrm{eq}}(f)=H(f+f_c)\\H_L(f)=2H(f+f_c)=2H_{\mathrm{eq}}(f)\\y_L=x_L*h_{\mathrm{eq}}=\frac12x_L*h_L`,
 tex`2\operatorname{LPF}\{x\cos(\omega_ct+\theta)\}\\=I\cos\theta+Q\sin\theta=\operatorname{Re}\{x_Le^{-j\theta}\}`],
 ensemble:[
 tex`m_Y(t)=\frac{m_X}{2a}\int_{-a}^a\cos(\omega_ct+\phi)d\phi\\=m_X\cos(\omega_ct)\frac{\sin a}{a}`,
 tex`\cos(\omega_ct+\Phi)\cos[\omega_c(t+\tau)+\Phi]\\=\frac12\cos(\omega_c\tau)+\frac12\cos[\omega_c(2t+\tau)+2\Phi]`,
 tex`R_Y(t,\tau)=\frac{R_X(\tau)}2\left\{\cos(\omega_c\tau)+\frac{\sin(2a)}{2a}\cos[\omega_c(2t+\tau)]\right\}`,
 tex`\sin(2a)=0\implies a=\frac\pi2\quad(0<a<\pi)\\m_X=0\implies m_Y=0\quad\text{可为WSS}\\m_X\ne0\implies m_Y(t)=\frac{2m_X}\pi\cos\omega_ct\quad\text{非WSS}`,
 tex`a=\pi\implies m_Y=0\\R_Y(\tau)=\frac{R_X(\tau)}2\cos(\omega_c\tau)`],
 modulation:[
 tex`s=A_c[1+\mu\cos\omega_mt]\cos\omega_ct\\=A_c\cos\omega_ct+\frac{A_c\mu}2\cos[(\omega_c+\omega_m)t]\\+\frac{A_c\mu}2\cos[(\omega_c-\omega_m)t]`,
 tex`P_c=\frac{A_c^2}2,\quad P_{\mathrm{USB}}=P_{\mathrm{LSB}}=\frac{A_c^2\mu^2}8\\P_{\mathrm{SB}}=\frac{A_c^2\mu^2}4\\\eta=\frac{P_{\mathrm{SB}}}{P_c+P_{\mathrm{SB}}}=\frac{\mu^2}{2+\mu^2}`,
 tex`m\cos\omega_ct=\frac12\cos[(\omega_c+\omega_m)t]+\frac12\cos[(\omega_c-\omega_m)t]\\\text{保留USB}\implies\frac12\cos[(\omega_c+\omega_m)t]`,
 tex`m\cos\omega_ct-\widehat m\sin\omega_ct\\=\cos\omega_mt\cos\omega_ct-\sin\omega_mt\sin\omega_ct\\=\cos[(\omega_c+\omega_m)t]`,
 tex`B_{\mathrm{AM}}=B_{\mathrm{DSB}}=2W,\quad B_{\mathrm{SSB}}=W\\A_{\mathrm{envelope}}=|A_c(1+\mu m_n)|`],
 noise:[
 tex`N_{i,\mathrm{DSB}}=\frac{N_0}2\cdot4B=2N_0B\\N_{i,\mathrm{SSB}}=\frac{N_0}2\cdot2B=N_0B`,
 tex`S_{\mathrm{mix}}(f)=\frac{k^2}4[S_i(f-f_c)+S_i(f+f_c)]`,
 tex`S_{o,\mathrm{DSB}}(f)=\frac{k^2N_0}4\quad(|f|<B)\\N_{o,\mathrm{DSB}}=\frac{k^2N_0}4\cdot2B=\frac{k^2N_0B}2`,
 tex`S_{o,\mathrm{SSB}}(f)=\frac{k^2N_0}8\quad(|f|<B)\\N_{o,\mathrm{SSB}}=\frac{k^2N_0B}4`,
 tex`k=2:\quad N_{o,\mathrm{DSB}}=2N_0B,\quad N_{o,\mathrm{SSB}}=N_0B\\k=1:\quad N_{o,\mathrm{DSB}}=\frac{N_0B}2,\quad N_{o,\mathrm{SSB}}=\frac{N_0B}4`],
 pam:[
 tex`s(t)=\sum_na_ng(t-nT_s)\\\mathbb E[s(t)s(t+\tau)]=\sum_n\sum_kR_a[k]g(t-nT_s)g(t+\tau-nT_s-kT_s)`,
 tex`\overline R_s(\tau)=\frac1{T_s}\int_0^{T_s}\mathbb E[s(t)s(t+\tau)]dt\\=\frac1{T_s}\sum_kR_a[k]\int_{-\infty}^{\infty}g(u)g(u+\tau-kT_s)du\\=\frac1{T_s}\sum_kR_a[k]R_g(\tau-kT_s)`,
 tex`\overline S_s(f)=\frac{|G(f)|^2}{T_s}\sum_kR_a[k]e^{-j2\pi fkT_s}\\=\frac{|G(f)|^2}{T_s}S_a(e^{j2\pi fT_s})`,
 tex`\sum_ke^{-j2\pi fkT_s}=\frac1{T_s}\sum_l\delta\!\left(f-\frac l{T_s}\right)\\\overline S_s(f)=\frac{|G(f)|^2}{T_s}\sum_kC_a[k]e^{-j2\pi fkT_s}\\+\frac{m^2}{T_s^2}\sum_l\left|G\!\left(\frac l{T_s}\right)\right|^2\delta\!\left(f-\frac l{T_s}\right)`,
 tex`\overline S_s(f)=\frac{\sigma^2}{T_s}|G(f)|^2\\+\frac{m^2}{T_s^2}\sum_l\left|G\!\left(\frac l{T_s}\right)\right|^2\delta\!\left(f-\frac l{T_s}\right)`,
 tex`P_l=m^2d^2\operatorname{sinc}^2(ld)\\P_{\mathrm{random}}=\sigma^2d,\qquad P_{\mathrm{mean}}=m^2d\\P=(\sigma^2+m^2)d`],
 nyquist:[
 tex`y(kT_s)=\sum_na_np[(k-n)T_s]\\=a_kp(0)+\sum_{n\ne k}a_np[(k-n)T_s]`,
 tex`p(nT_s)=\delta[n]`,
 tex`q_n=T_s\int_{\text{任一周期}}Q(f)e^{j2\pi nT_sf}df\\=T_s\int_{-\infty}^{\infty}P(f)e^{j2\pi nT_sf}df=T_sp(nT_s)`,
 tex`\sum_mP\!\left(f-\frac m{T_s}\right)=T_s`,
 tex`p(t)=\operatorname{sinc}\!\left(\frac t{T_s}\right)\frac{\cos(\pi\alpha t/T_s)}{1-(2\alpha t/T_s)^2}\\B=\frac{1+\alpha}{2T_s}\\p\!\left(\pm\frac{T_s}{2\alpha}\right)=\frac\pi4\operatorname{sinc}\!\left(\frac1{2\alpha}\right)`,
 tex`y(kT_s+\varepsilon)=a_kp(\varepsilon)+\sum_{n\ne k}a_np[(k-n)T_s+\varepsilon]`],
 decision:[
 tex`Y=\int r(t)g(t)dt=\pm C+N\\C=\int v(t)g(t)dt,\qquad\sigma^2=\frac{N_0}2\int g^2(t)dt`,
 tex`\frac{C^2}{\sigma^2}=\frac2{N_0}\frac{|\int vg|^2}{\int g^2}\le\frac2{N_0}\int v^2=\frac{2E_v}{N_0}\\g=kv\text{ 时取等},\qquad h(t)=kv^*(T-t)`,
 tex`f(y\mid+)=\frac1{\sqrt{2\pi\sigma^2}}\exp\!\left[-\frac{(y-C)^2}{2\sigma^2}\right]\\f(y\mid-)=\frac1{\sqrt{2\pi\sigma^2}}\exp\!\left[-\frac{(y+C)^2}{2\sigma^2}\right]`,
 tex`\ln\frac p{1-p}+\frac{(y+C)^2-(y-C)^2}{2\sigma^2}>0\\\ln\frac p{1-p}+\frac{2Cy}{\sigma^2}>0\\y>\gamma,\qquad\gamma=\frac{\sigma^2}{2C}\ln\frac{1-p}p\quad(C>0)`,
 tex`P(-\mid+)=Q\!\left(\frac{C-\gamma}\sigma\right),\quad P(+\mid-)=Q\!\left(\frac{C+\gamma}\sigma\right)\\P_e=pQ\!\left(\frac{C-\gamma}\sigma\right)+(1-p)Q\!\left(\frac{C+\gamma}\sigma\right)`,
 tex`p=\frac12\implies\gamma=0,\quad P_e=Q\!\left(\frac C\sigma\right)\\\text{匹配时 }P_e=Q\!\left(\sqrt{\frac{2E_v}{N_0}}\right)\\C=0\implies P_{e,\min}=\min(p,1-p)`],
 constellation:[
 tex`s=\left(\pm\sqrt{\frac{E_s}2},\pm\sqrt{\frac{E_s}2}\right)\\E_s=I^2+Q^2,\qquad E_b=\frac{E_s}2`,
 tex`P_b=Q\!\left(\frac{\sqrt{E_s/2}}{\sqrt{N_0/2}}\right)\\=Q\!\left(\sqrt{\frac{E_s}{N_0}}\right)=Q\!\left(\sqrt{\frac{2E_b}{N_0}}\right)`,
 tex`P_s=1-(1-P_b)^2=2P_b-P_b^2`,
 tex`d_{\min}=2\sqrt{E_s/2}=2\sqrt{E_b}\\R_b=2R_s\quad\text{（未编码QPSK）}`],
 sampling:[
 tex`x_s(t)=x(t)\sum_n\delta(t-nT)\\X_s(f)=f_s\sum_kX(f-kf_s)`,
 tex`f_s>2B\\H_{\mathrm{rec}}(f)=\frac1{f_s}\quad\text{（所需基带内）}`,
 tex`e^{j2\pi(f+kf_s)n/f_s}=e^{j2\pi fn/f_s}\\\cos\frac{2\pi fn}{f_s}=\cos\frac{2\pi(f_s-f)n}{f_s}`,
 tex`\widehat x(t)=\sum_nx(nT)\operatorname{sinc}\!\left(\frac{t-nT}{T}\right)`],
 quantization:[
 tex`L=2^b,\quad\Delta=\frac{2A}L\\e=x-Q(x)\in[-\Delta/2,\Delta/2]`,
 tex`\sigma_e^2=\frac1\Delta\int_{-\Delta/2}^{\Delta/2}e^2de\\=\frac2\Delta\left[\frac{e^3}3\right]_0^{\Delta/2}=\frac{\Delta^2}{12}`,
 tex`\mathrm{SQNR}=\frac{A^2/2}{\Delta^2/12}=\frac32L^2=\frac32\,2^{2b}`,
 tex`\mathrm{SQNR}_{\mathrm{dB}}=10\log_{10}\frac32+20b\log_{10}2\\\approx1.76+6.02b\ \mathrm{dB}\\R_b=bf_s`,
 tex`R_{\mathrm{PCM}}=f_s(Nb+h)\\R_{\mathrm{channel}}=\frac{R_{\mathrm{PCM}}}{R_c}\\R_s=\frac{R_{\mathrm{channel}}}{\log_2M}`],
 entropy:[
 tex`I_i=-\log_2p_i=(1,2,3,3)\ \mathrm{bit}\\H=\sum_ip_iI_i=0.5+0.5+0.375+0.375=1.75`,
 tex`\frac18+\frac18=\frac14\\\frac14+\frac14=\frac12\\\frac12+\frac12=1`,
 tex`\overline L=\frac12\cdot1+\frac14\cdot2+\frac18\cdot3+\frac18\cdot3=1.75\\\sum_i2^{-l_i}=2^{-1}+2^{-2}+2^{-3}+2^{-3}=1`,
 tex`L_{\mathrm{fixed}}=2\ \mathrm{bit/\text{符号}}\\\Delta L=2-1.75=0.25\ \mathrm{bit/\text{符号}}\\\frac{\Delta L}{L_{\mathrm{fixed}}}=12.5\%`],
 capacity:[
 tex`N=N_0B,\qquad\mathrm{SNR}=\frac P{N_0B}\\C(B)=B\log_2\!\left(1+\frac P{N_0B}\right)`,
 tex`C=\frac{P}{N_0\ln2}\frac{\ln(1+u)}u\\\lim_{B\to\infty}C=\frac P{N_0\ln2}`,
 tex`\eta=\log_2\!\left(1+\eta\frac{E_b}{N_0}\right)\\\frac{E_b}{N_0}=\frac{2^\eta-1}{\eta}`,
 tex`\lim_{\eta\to0}\frac{E_b}{N_0}=\ln2\approx0.6931\\10\log_{10}(\ln2)\approx-1.59\ \mathrm{dB}`],
 coding:[
 tex`H=\begin{bmatrix}1&0&1&0&1&0&1\\0&1&1&0&0&1&1\\0&0&0&1&1&1&1\end{bmatrix}\\s=Hr^{\mathsf T}=H(c+e)^{\mathsf T}=He^{\mathsf T}`,
 tex`c_3=1,\ c_5=0,\ c_6=1,\ c_7=1\\c_1=c_3\oplus c_5\oplus c_7=0\\c_2=c_3\oplus c_6\oplus c_7=1\\c_4=c_5\oplus c_6\oplus c_7=0\\c=0110011`,
 tex`e=e_5\implies s=H_5=(1,0,1)^{\mathsf T}\\\text{位置}=s_0+2s_1+4s_2=5`,
 tex`x^3m=1011000\\1011000\oplus1101000=0110000\\0110000\oplus0110100=0000100\\p=100,\qquad c=1011100`,
 tex`r\bmod g=e\bmod g\\g\mid e\implies\text{漏检}\\\text{Hamming：给定能力内纠错；CRC：通常检错}`],
 viterbi:[
 tex`v_1=u\oplus a\oplus b,\qquad v_2=u\oplus b\\(a,b)\longrightarrow(u,a)`,
 tex`-\ln P=-d\ln p-(L-d)\ln(1-p)\\=\text{常数}+d\ln\frac{1-p}p`,
 tex`M_k(s)=\min_{s'\to s}\left\{M_{k-1}(s')+d_{\mathrm{branch}}\right\}`,
 tex`\text{输入：}1\ 0\ 1\ 0\ 0\\\text{输出：}11\ 10\ 00\ 10\ 11\\\text{接收：}11\ 11\ 00\ 10\ 11\\d_{\mathrm{true}}=1`,
 tex`R_{\mathrm{eff}}=\frac3{10},\quad R_{\mathrm{mother}}=\frac12\\\text{软判AWGN：欧氏距离或等价对数似然}`],
 ofdm:[
 tex`\frac1{T_u}\int_0^{T_u}e^{j2\pi(k-l)t/T_u}dt\\=\begin{cases}1&k=l\\\dfrac{e^{j2\pi(k-l)}-1}{j2\pi(k-l)}=0&k\ne l\end{cases}`,
 tex`C_{kl}(\varepsilon)=e^{j\pi(k-l+\varepsilon)}\operatorname{sinc}(k-l+\varepsilon)\\|C_{kl}|^2=\operatorname{sinc}^2(k-l+\varepsilon)`,
 tex`y[n]=\sum_mh[m]x[(n-m)\bmod N]+w[n]\\Y[k]=H[k]X[k]+W[k]`,
 tex`R_{\mathrm{info}}=\frac{N_d\log_2M\cdot R_c}{T_u+T_{\mathrm{CP}}}\\\text{CP不消除频偏、深衰落或快时变}`],
 spread:[
 tex`N=2^m-1,\qquad m=3\implies N=7`,
 tex`R[k]=\frac1N\sum_{n=0}^{N-1}c_nc_{(n+k)\bmod N}\\R[0]=1,\quad R[k]=-\frac1N\quad(k\not\equiv0\pmod N)`,
 tex`r_nc_n=(ac_n+i_n+n_n)c_n\\=a+i_nc_n+n_nc_n`,
 tex`G_p\approx\frac{R_{\mathrm{chip}}}{R_b}\\\text{理想反极性AWGN：}\quad P_b=Q\!\left(\sqrt{\frac{2E_b}{N_0}}\right)`],
 'phase-delay':[
 tex`y(t)=x(t-\tau)\\Y(f)=\int x(t-\tau)e^{-j2\pi ft}dt\\=e^{-j2\pi f\tau}\int x(u)e^{-j2\pi fu}du\\H_\tau(f)=e^{-j2\pi f\tau}`,
 tex`\varphi_\tau(f)=-2\pi f\tau\\\tau_g=-\frac{d\varphi}{d\omega}=\tau`,
 tex`H_\theta(f)=\begin{cases}e^{-j\theta}&f>0\\e^{j\theta}&f<0\end{cases}\\\text{零均值实输入：}\quad y=x\cos\theta+\mathcal H\{x\}\sin\theta`,
 tex`\theta=90^\circ,\quad f_1=2\ \mathrm{Hz}\implies\tau=\frac18\ \mathrm s\\f_2=6\ \mathrm{Hz}\implies2\pi f_2\tau=270^\circ\ne90^\circ`],
 calculus:[
 tex`y(t)=y_0+\int_{t_0}^tx(u)du\\x=1\implies y=y_0+t-t_0`,
 tex`\int_0^t\sin(\omega u)du=\frac{1-\cos\omega t}\omega\\\frac d{dt}\sin\omega t=\omega\cos\omega t\\H_{\mathrm{int}}=\frac1{j2\pi f},\quad H_{\mathrm{diff}}=j2\pi f`,
 tex`\frac{A_{\mathrm{noise,diff}}}{A_{\mathrm{signal,diff}}}=a\frac{f_2}{f_1}\\\frac{A_{\mathrm{noise,int}}}{A_{\mathrm{signal,int}}}=a\frac{f_1}{f_2}`,
 tex`y[0]=y_0\\y[n]=y[n-1]+\frac{\Delta t}2(x[n-1]+x[n])\\x'[n]\approx\frac{x[n+1]-x[n-1]}{2\Delta t}`,
 tex`[y_{\mathrm{int}}]=[x]\cdot\mathrm s\\[y_{\mathrm{diff}}]=[x]/\mathrm s`],
 filters:[
 tex`y=x*h\\Y(f)=X(f)H(f)\\H(f)=\mathcal F\{h(t)\}`,
 tex`H_{\mathrm{LPF}}(f)=\operatorname{rect}\!\left(\frac f{2B}\right)\\f_{\mathrm{cutoff}}=B,\quad f\in[-B,B]`,
 tex`f_0=\frac{f_L+f_H}2,\qquad B=\frac{f_H-f_L}2\\f_L=f_0-B,\quad f_H=f_0+B\\H_{\mathrm{BPF}}(f)=\operatorname{rect}\!\left(\frac{|f|-f_0}{2B}\right)`,
 tex`y_{\mathrm{LPF}}=\cos(4\pi t)\\y_{\mathrm{BPF}}=\cos(24\pi t)`,
 tex`\tau=0.1\ \mathrm s:\quad H(f)=\frac1{1+j2\pi f\cdot0.1}\\h(t)=10e^{-10t}u(t)\\h_{\mathrm{MF}}(t)=s^*(T-t),\quad y(T)=\int r(t)s^*(t)dt`]
};

export const labFormulas={
 fourier:tex`\frac{X_T(f)}T=\frac1T\int_{-T/2}^{T/2}x(t)e^{-j2\pi ft}dt`,
 correlation:tex`\rho_E=\frac{\langle x,y\rangle}{\|x\|\|y\|}\\\rho_P=\frac{\langle x-\overline x,y-\overline y\rangle}{\|x-\overline x\|\|y-\overline y\|}`,
 envelope:tex`x_L=x_ae^{-j2\pi f_ct}=I+jQ\\x=\operatorname{Re}\{x_Le^{j2\pi f_ct}\}=I\cos(2\pi f_ct)-Q\sin(2\pi f_ct)\\2\operatorname{LPF}\{x\cos(2\pi f_ct+\theta)\}=I\cos\theta+Q\sin\theta`,
 convolution:tex`H_L(f)=2H(f+f_c)\\H_{\mathrm{eq}}(f)=H(f+f_c)=\frac{H_L(f)}2\\y_L=x_L*h_{\mathrm{eq}}=\frac12x_L*h_L`,
 ensemble:tex`X(t)=\cos(2\pi t+\Phi),\quad\Phi\sim\mathcal U[-\phi_0,\phi_0]\\\mathbb E[X(t)]=\cos(2\pi t)\frac{\sin\phi_0}{\phi_0}\\R(t,\tau)=\frac12\cos(2\pi\tau)+\frac12\cos[2\pi(2t+\tau)]\frac{\sin(2\phi_0)}{2\phi_0}`,
 modulation:tex`s(t)=A_c[1+\mu\cos(2\pi f_mt)]\cos(2\pi f_ct)\\P_c=\frac{A_c^2}2,\quad P_{\mathrm{SB}}=\frac{A_c^2\mu^2}4,\quad\eta=\frac{\mu^2}{2+\mu^2}`,
 noise:tex`P_{\mathrm{mix}}(f)=\frac{k^2}4[P_n(f-f_c)+P_n(f+f_c)]\\N_o=\int_{\text{实际低通区间}}P_{\mathrm{mix}}(f)df`,
 pam:tex`P_s(f)=\frac{\sigma_a^2}{T_s}|G(f)|^2+\frac{m_a^2}{T_s^2}\sum_k|G(k/T_s)|^2\delta(f-k/T_s)\\G(f)=dT_s\operatorname{sinc}(fdT_s)e^{-j\pi fdT_s}`,
 nyquist:tex`p(0)=1,\quad p(nT_s)=0\ (n\ne0)\\y(kT_s+\varepsilon)=a_kp(\varepsilon)+\sum_{n\ne k}a_np[(k-n)T_s+\varepsilon]\\B=\frac{1+\alpha}{2T_s}`,
 decision:tex`Y\mid\pm\sim\mathcal N(\pm C,\sigma^2)\\P_e=p_+Q\!\left(\frac{C-\gamma}\sigma\right)+(1-p_+)Q\!\left(\frac{C+\gamma}\sigma\right)\\\gamma_{\mathrm{MAP}}=\frac{\sigma^2}{2C}\ln\frac{1-p_+}{p_+}`,
 spectrum:tex`P_{\mathrm{line}}=\frac{A^2}4,\qquad S_T(f)=\frac{|X_T(f)|^2}T\\\int S_T(f)df=P_T,\quad P_{\mathrm{bin}}\approx S_T\Delta f`,
 constellation:tex`E_s=2E_b\\P_b=Q\!\left(\sqrt{\frac{E_s}{N_0}}\right),\quad P_s=2P_b-P_b^2`,
 sampling:tex`X_s(f)=f_s\sum_kX(f-kf_s)\\e^{j2\pi(f+kf_s)n/f_s}=e^{j2\pi fn/f_s}`,
 quantization:tex`\Delta=\frac2{2^b},\quad\sigma_e^2\approx\frac{\Delta^2}{12}\\\mathrm{SQNR}_{\mathrm{dB}}\approx6.02b+1.76\quad\text{（满幅正弦）}`,
 entropy:tex`I(x)=-\log_2p(x),\qquad H(X)=\sum_xp(x)I(x)`,
 capacity:tex`C=B\log_2\!\left(1+\frac P{N_0B}\right),\qquad C_\infty=\frac P{N_0\ln2}`,
 hamming:tex`c=uG,\quad Hc^{\mathsf T}=0\\s=Hr^{\mathsf T}=He^{\mathsf T}`,
 viterbi:tex`M_k(s)=\min_{s'\to s}[M_{k-1}(s')+d_{\mathrm{branch}}]\\\text{每个状态仅保留一个最优前缀}`,
 spread:tex`R[k]=\frac1N\sum_{n=0}^{N-1}c_nc_{(n+k)\bmod N}`,
 ofdm:tex`C_{kl}=e^{j\pi(k-l+\varepsilon)}\operatorname{sinc}(k-l+\varepsilon)`,
 phaseDelay:tex`H_\tau(f)=e^{-j2\pi f\tau}\\H_\theta(f)=e^{-j\theta\operatorname{sgn}(f)}\quad(f\ne0)`,
 calculus:tex`y_{\mathrm{int}}(t)=\int_0^tx(u)du,\qquad y_{\mathrm{diff}}=\frac{dx}{dt}`,
 filters:tex`H_{\mathrm{LPF}}=\operatorname{rect}\!\left(\frac f{2B}\right)\\H_{\mathrm{BPF}}=\operatorname{rect}\!\left(\frac{|f|-f_0}{2B}\right),\qquad Y=XH`
};
