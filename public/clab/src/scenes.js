import {MODEL_VERSION,validateSettings} from './engine.js';
import {parseDefinition,normalize} from './math.js';
export const COLORS=['#167a68','#cd8540','#636dc4','#dc647a','#2e88b4','#8c6ba7','#839444'];
export const uid=()=>globalThis.crypto.randomUUID();
export function object(definition,i=0,extra={}) {
  const scalar=/^[A-Za-z_][\w]*\s*=\s*-?[\d.]+$/.test(definition);
  const value=scalar?Number(definition.split('=')[1]):0;
  return {id:uid(),definition,color:COLORS[i%COLORS.length],visible:!scalar,representation:'re',slider:scalar?{min:Math.min(0,value-1),max:Math.max(2,value*2),step:.01,unit:''}:null,...extra};
}
export function blank(workbench='W1') {
  return {version:1,modelVersion:MODEL_VERSION,id:uid(),name:'未命名场景',workbench,theme:null,preset:0,objects:[],settings:{tMin:0,tMax:1,fMin:-40,fMax:40,points:1024,seed:801},views:{time:workbench!=='W3',spectrum:workbench!=='W3',constellation:workbench==='W2',eye:false,information:workbench==='W3',axes:{time:workbench==='W3'?'n':'s',spectrum:'Hz'},representation:'re',guidance:false},notes:'',frozen:null};
}
const theme=(id,workbench,title,subtitle,presets,guides,formula,conditions,misconception,prerequisites)=>({id,workbench,title,subtitle,presets,guides,formula,conditions,misconception,prerequisites});
export const THEMES=[
  theme('A01','W1','时域与频域','频率、脉宽与频谱的关系',[
    {name:'单音频率',definitions:['a=1','f0=5','x(t)=a*cos(2*pi*f0*t)','X=Fourier(x)']},
    {name:'宽窄脉冲',definitions:['T=0.2','x(t)=rect(t/T)','X=Fourier(x)'],settings:{tMin:-1,tMax:1,fMin:-30,fMax:30}},
    {name:'双音与滤波',definitions:['a=1','f0=5','f1=12','fc=8','x(t)=a*cos(2*pi*f0*t)+0.5*cos(2*pi*f1*t)','H(f)=rect(f/(2*fc))','y=Filter(x,H)']}
  ],['改变 f0，观察频谱峰的位置与时域周期。','冻结结果后改变参数，比较同一坐标下的两组条件。'], 'X(f)=∫x(t)e^(−j2πft)dt','矩形窗；有限时长 FFT；频率单位 Hz；展示双边幅度谱，不表示 PSD。','相位改变不会移动频率峰；脉冲越窄，主瓣通常越宽。','三角函数、频率与周期'),
  theme('A04','W1','匹配滤波','时间反转、对齐与相关接收',[
    {name:'无噪声对齐',definitions:['T=0.2','sigma=0','s(t)=rect((t-T/2)/T)','r=Noise(s,sigma)','h(t)=conj(s(T-t))','y=Matched(r,s,T)'],settings:{tMin:-.5,tMax:1,fMin:-20,fMax:20}},
    {name:'固定种子噪声',definitions:['T=0.2','sigma=0.5','s(t)=rect((t-T/2)/T)','r=Noise(s,sigma)','h(t)=conj(s(T-t))','y=Matched(r,s,T)'],settings:{tMin:-.5,tMax:1,fMin:-20,fMax:20}},
    {name:'模板失配',definitions:['T=0.2','s(t)=rect((t-T/2)/T)','q(t)=rect((t-T/4)/(T/2))','y=Matched(s,q,T)','matched=Matched(s,s,T)'],settings:{tMin:-.5,tMax:1,fMin:-20,fMax:20}}
  ],['把时间游标放在 T 处，比较滤波输出与模板能量。','增大 sigma 后更换种子；一次峰值位置变化不能代表统计结论。'],'h(t)=s*(T−t)，y(T)=∫r(τ)s*(τ)dτ','AWGN 假设下、指定采样时刻 T 的最优滤波；Noise 为有限带宽复采样噪声；卷积采用零延拓。','匹配并不是直接复制 s(t)：还需要时间反转与复共轭。','卷积、相关与能量'),
  theme('B01','W1','模拟调制','载波、边带与过调制',[
    {name:'正常 AM',definitions:['fm=3','fc=24','mu=0.6','m(t)=cos(2*pi*fm*t)','s(t)=(1+mu*m(t))*cos(2*pi*fc*t)','envelope=Envelope(s)']},
    {name:'过调制 AM',definitions:['fm=3','fc=24','mu=1.4','m(t)=cos(2*pi*fm*t)','s(t)=(1+mu*m(t))*cos(2*pi*fc*t)','envelope=Envelope(s)']},
    {name:'DSB / SSB',definitions:['fm=3','fc=24','m(t)=cos(2*pi*fm*t)','dsb(t)=m(t)*cos(2*pi*fc*t)','ssb=SSB(m,fc)','H(f)=rect(f/16)','mixed(t)=2*dsb(t)*cos(2*pi*fc*t)','recovered=Filter(mixed,H)']}
  ],['调整 mu 到 1 以上，留意包络折返与原消息的区别。','切换 DSB / SSB，比较 fc±fm 处的边带；recovered 是相干解调结果。'],'AM=[1+μm(t)]cos(2πfct)；SSB=m cos−Hilbert(m) sin','SSB 与包络采用有限记录 Hilbert，周期边界；假设消息带宽远小于载频；恢复采用理想相干混频与频域低通。','包络检波不能普遍恢复 DSB-SC，过调制 AM 也会产生失真。','频谱搬移与乘法'),
  theme('E01','W1','采样与混叠','同样的采样点，不同的信号',[
    {name:'满足低通条件',definitions:['f0=1000','fs=2500','offset=0','x(t)=cos(2*pi*f0*t)','samples=Sample(x,fs,offset)','reconstructed=Reconstruct(samples)'],settings:{tMin:-.01,tMax:.01,fMin:-4000,fMax:4000}},
    {name:'低采样率混叠',definitions:['f0=1000','fs=1500','offset=0','x(t)=cos(2*pi*f0*t)','samples=Sample(x,fs,offset)','reconstructed=Reconstruct(samples)'],settings:{tMin:-.01,tMax:.01,fMin:-4000,fMax:4000}},
    {name:'临界采样与相位',definitions:['f0=1000','fs=2000','offset=0.00025','x(t)=cos(2*pi*f0*t)','samples=Sample(x,fs,offset)','reconstructed=Reconstruct(samples)'],settings:{tMin:-.01,tMax:.01,fMin:-4000,fMax:4000}}
  ],['把 fs 从 2500 改为 1500，观察 1 kHz 信号重建为约 0.5 kHz。','在临界采样条件下改变 offset，留意全部采样点接近零的特殊情况。'],'x̂(t)=Σx[k]sinc(fs·(t−t₀)−k)','仅演示低通带限采样；内部绘图采样率独立；有限 sinc 求和，边缘有截断误差。','低采样率之后的插值不会恢复已丢失的频率信息。','奈奎斯特采样条件'),
  theme('C02','W2','脉冲成形与眼图','脉冲重叠为何仍能无 ISI',[
    {name:'奈奎斯特对齐',definitions:['Ts=0.1','alpha=0.25','sigma=0','offset=0','a=[1,-1,1,1,-1,-1,1,-1,1,1]','p(t)=rc(t,Ts,alpha)','x=Shape(a,p,Ts)','r=Noise(x,sigma)','samples=Sample(r,1/Ts,offset)'],settings:{tMin:-.2,tMax:1.2,fMin:-20,fMax:20},views:{eye:true}},
    {name:'不同滚降',definitions:['Ts=0.1','alpha=0.8','sigma=0','offset=0','a=[1,-1,1,1,-1,-1,1,-1,1,1]','p(t)=rc(t,Ts,alpha)','x=Shape(a,p,Ts)','r=Noise(x,sigma)','samples=Sample(r,1/Ts,offset)'],settings:{tMin:-.2,tMax:1.2,fMin:-20,fMax:20},views:{eye:true}},
    {name:'偏移与噪声',definitions:['Ts=0.1','alpha=0.25','sigma=0.18','offset=0.025','a=[1,-1,1,1,-1,-1,1,-1,1,1]','p(t)=rc(t,Ts,alpha)','x=Shape(a,p,Ts)','r=Noise(x,sigma)','samples=Sample(r,1/Ts,offset)'],settings:{tMin:-.2,tMax:1.2,fMin:-20,fMax:20},views:{eye:true}}
  ],['把 sigma 设为 0，再单独改变 offset，分清采样偏移与噪声。','调整 alpha，比较脉冲尾部和频谱带宽，正确采样处仍接近原符号。'],'p(t)=sinc(t/Ts)cos(παt/Ts)/(1−(2αt/Ts)²)，B=(1+α)/(2Ts)','这里是总升余弦 RC 响应，不是 RRC 发射滤波器；有限符号序列；眼图为两符号周期折叠。','脉冲在时间上重叠不等于采样点一定存在码间干扰。','符号周期、奈奎斯特零点'),
  theme('D01','W2','数字调制与接收','I/Q、星座与判决',[
    {name:'无噪声 BPSK',definitions:['Ts=0.05','fc=40','phi=0','b=[0,1,1,0,0,1,0,1,1,0,1,0,0,1,1,0]','s=BPSK(b)','r=Phase(s,phi)','wave=Carrier(r,Ts,fc)','decoded=Detect(r)'],settings:{tMin:0,tMax:.8,fMin:-100,fMax:100},views:{constellation:true}},
    {name:'无噪声 QPSK',definitions:['Ts=0.05','fc=40','phi=0','b=[0,1,1,0,0,1,0,1,1,0,1,0,0,1,1,0]','s=QPSK(b)','r=Phase(s,phi)','wave=Carrier(r,Ts,fc)','decoded=Detect(r)'],settings:{tMin:0,tMax:.4,fMin:-100,fMax:100},views:{constellation:true}},
    {name:'固定序列加噪',definitions:['Ts=0.05','fc=40','EbN0=6','phi=0','b=[0,1,1,0,0,1,0,1,1,0,1,0,0,1,1,0,1,1,0,0,0,1,1,0,1,0,0,1,0,0,1,1]','s=QPSK(b)','noisy=AWGN(s,EbN0)','r=Phase(noisy,phi)','wave=Carrier(r,Ts,fc)','decoded=Detect(r)'],settings:{tMin:0,tMax:.8,fMin:-100,fMax:100},views:{constellation:true}}
  ],['选中 r，在星座上点击一个符号，同时读取 I/Q 和对应的输入比特。','保持种子，降低 EbN0，比较点云扩散与观测错误；phi 为接收相位偏差。'],'QPSK=(±1±j)/√2；σ²=Eb/(2·10^(EbN0/10))','单位符号能量；Gray I/Q 映射；理想同步、符号采样处复 AWGN，硬判决不包含载波恢复或真实接收滤波链。','Eb/N0 不是波形采样 SNR；零次观测误码不代表理论误码率为零。','复数、相干判决与能量'),
  theme('E03','W3','信息熵与互信息','概率分布与二元信道',[
    {name:'均匀信源',definitions:['q=0.5','e0=0.1','e1=0.1','distribution=Probabilities([1-q,q])','channel=BinaryChannel(q,e0,e1)']},
    {name:'确定信源',definitions:['q=0','e0=0.1','e1=0.1','distribution=Probabilities([1-q,q])','channel=BinaryChannel(q,e0,e1)']},
    {name:'独立输出',definitions:['q=0.5','e0=0.5','e1=0.5','distribution=Probabilities([1-q,q])','channel=BinaryChannel(q,e0,e1)']}
  ],['改变 q，观察信源熵与互信息。','将 e0、e1 设为 0.5，比较联合概率。'],'H(X)=−Σp log₂p；I(X;Y)=H(Y)−H(Y|X)','二元无记忆信道，e0=P(Y=1|X=0)，e1=P(Y=0|X=1)。','互信息依赖输入分布；不等同于信道容量。','离散概率与条件概率'),
  theme('E05','W3','哈夫曼编码','概率、前缀码与编码树',[
    {name:'等概率',definitions:['q=0.25','distribution=Probabilities([q,(1-q)/3,(1-q)/3,(1-q)/3])','code=Huffman(distribution)']},
    {name:'偏斜分布',definitions:['q=0.7','distribution=Probabilities([q,(1-q)/3,(1-q)/3,(1-q)/3])','code=Huffman(distribution)']},
    {name:'确定信源',definitions:['q=1','distribution=Probabilities([q,(1-q)/3,(1-q)/3,(1-q)/3])','code=Huffman(distribution)']}
  ],['改变 q，比较平均码长和信息熵。','选中 code，用逐步观察节点合并。'],'L̄=Σpᵢlᵢ；H≤L̄<H+1（至少两个有效符号）','二元 Huffman；零概率符号不编码；同权按固定次序合并。','同概率可能存在不同的最优码树。','熵与前缀码'),
  theme('F01','W3','信道容量','带宽、功率与信噪比约束',[
    {name:'固定功率与噪声谱',definitions:['B=3000','P=1','N0=0.0001','capacity=Capacity(B,P,N0)']},
    {name:'固定接收信噪比',definitions:['B=3000','snrDb=10','capacity=CapacitySNR(B,snrDb)']},
    {name:'二元对称信道',definitions:['cross=0.1','capacity=BinaryCapacity(cross)']}
  ],['改变带宽 B，对比不同约束下的容量曲线。','将 cross 改到 0.5 或 1，观察极端情况。'],'C=B log₂(1+P/(N0B))；C_BSC=1−H₂(p)','AWGN 中 N=N0B；固定 SNR 模式需随带宽增加功率。','容量是理论上限，不是当前码的实际传输速率。','带宽、功率与噪声谱密度'),
  theme('G01','W3','汉明码与伴随式','码字、距离与错误位置',[
    {name:'无错误',definitions:['message=[1,0,1,1]','coded=Hamming(message)','errors=[0,0,0,0,0,0,0]','received=Xor(coded,errors)','decoded=HammingDecode(received)']},
    {name:'单比特错误',definitions:['message=[1,0,1,1]','coded=Hamming(message)','errors=[0,0,0,0,1,0,0]','received=Xor(coded,errors)','decoded=HammingDecode(received)']},
    {name:'双错反例',definitions:['message=[1,0,1,1]','coded=Hamming(message)','errors=[1,1,0,0,0,0,0]','received=Xor(coded,errors)','decoded=HammingDecode(received)']}
  ],['点击接收码字中的比特，观察伴随式。','比较单错与双错，观察译码候选是否仍等于原消息。'],'c=mG；s=Hrᵀ；d_min=3','GF(2)，偶校验 (7,4)，位置 1/2/4 为校验位。','普通 (7,4) 汉明码遇到双错可能误纠，不能保证检出双错。','模二运算与汉明距离'),
  theme('G02','W3','循环码与 CRC','多项式、模二除法与漏检',[
    {name:'校验通过',definitions:['message=[1,0,1,1]','generator=[1,1,0,1]','coded=CRCEncode(message,generator)','errors=[0,0,0,0,0,0,0]','received=Xor(coded,errors)','check=CRCCheck(received,generator)']},
    {name:'单比特错误',definitions:['message=[1,0,1,1]','generator=[1,1,0,1]','coded=CRCEncode(message,generator)','errors=[0,0,0,0,1,0,0]','received=Xor(coded,errors)','check=CRCCheck(received,generator)']},
    {name:'生成多项式倍数',definitions:['message=[1,0,1,1]','generator=[1,1,0,1]','coded=CRCEncode(message,generator)','errors=[1,1,0,1,0,0,0]','received=Xor(coded,errors)','check=CRCCheck(received,generator)']}
  ],['点击接收位，观察 CRC 余数。','打开倍数错误预设，比较码字变化与零余数。'],'r(x)=[xʳm(x)] mod g(x)；c=xʳm+r','系数按最高次项在前；初始 0，无反射、无末尾异或。','CRC 检错而非一般纠错；零余数不证明未发生错误。','GF(2) 多项式'),
  theme('G03','W3','卷积码与 Viterbi','状态、格图与幸存路径',[
    {name:'无错误路径',definitions:['message=[1,0,1,1,0,1]','coded=Convolutional(message)','errors=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]','received=Xor(coded,errors)','decoded=Viterbi(received)']},
    {name:'一位接收错误',definitions:['message=[1,0,1,1,0,1]','coded=Convolutional(message)','errors=[0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0]','received=Xor(coded,errors)','decoded=Viterbi(received)']},
    {name:'突发错误',definitions:['message=[1,0,1,1,0,1]','coded=Convolutional(message)','errors=[0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0]','received=Xor(coded,errors)','decoded=Viterbi(received)']}
  ],['点击接收码位，查看最短路径与译码消息。','选中 decoded，用逐步观察每列路径度量。'],'g₀=111，g₁=101；M_t(s)=min[M_{t−1}(s′)+d_H]','固定 (7,5)₈、K=3、R=1/2，起止 00，两位零尾比特，全记录硬判决。','短块硬判决不是软判决，也不能纠正任意突发错误。','移位寄存器与汉明距离'),
  theme('H01','W3','序列发生器与扰码','寄存器、周期与相关',[
    {name:'完整 m 序列周期',definitions:['initial=[1,0,0]','pn=LFSR(initial,7)','correlation=PeriodicCorrelation(pn)']},
    {name:'扰码与恢复',definitions:['initial=[1,0,0]','message=[1,1,1,1,1,1,1,1,1,1,1,1,1,1]','pn=LFSR(initial,14)','scrambled=Xor(message,pn)','recovered=Xor(scrambled,pn)'],views:{time:true}},
    {name:'不同非零初态',definitions:['initial=[1,0,1]','pn=LFSR(initial,7)','correlation=PeriodicCorrelation(pn)']}
  ],['选中 pn，逐时钟观察寄存器状态。','用相同 PN 序列再次异或，比较恢复后的消息。'],'[a,b,c]→[b⊕c,a,b]；z=m⊕pn；m=z⊕pn','固定三阶反馈，输出 c；非零初态周期 7；归一化周期相关。','任意反馈不一定产生 m 序列；扰码不等于加密。','移位寄存器与模二和'),
];
export function makeScene(themeId='A01',index=2) {
  const spec=THEMES.find(t=>t.id===themeId),preset=spec.presets[index],scene=blank(spec.workbench);
  scene.theme=themeId;scene.preset=index;scene.name=`${spec.title} · ${preset.name}`;
  Object.assign(scene.settings,preset.settings);Object.assign(scene.views,preset.views);
  scene.objects=preset.definitions.map((d,i)=>object(d,i));
  const ranges={q:[0,1,.01,''],e0:[0,1,.01,''],e1:[0,1,.01,''],cross:[0,1,.01,''],B:[100,12000,100,'Hz'],P:[0,5,.01,'W'],N0:[.00001,.001,.00001,'W/Hz'],snrDb:[-10,30,.1,'dB'],f0:[0,30,.1,'Hz'],f1:[0,40,.1,'Hz'],fc:[.1,60,.1,'Hz'],fm:[.1,10,.1,'Hz'],mu:[0,2,.01,''],Ts:[.02,.2,.001,'s'],alpha:[0,1,.01,''],sigma:[0,1,.01,''],phi:[-Math.PI,Math.PI,.01,'rad'],EbN0:[-5,20,.1,'dB'],T:[.02,.5,.01,'s'],offset:[0,.09,.001,'s']};
  for(const obj of scene.objects) {
    const def=parseDefinition(obj.definition),r=ranges[def.name];
    if(r&&obj.slider)obj.slider={min:r[0],max:r[1],step:r[2],unit:r[3]};
    if(themeId==='E01'&&def.name==='f0')obj.slider={min:100,max:2500,step:10,unit:'Hz'};
    if(themeId==='E01'&&def.name==='fs')obj.slider={min:1000,max:6000,step:50,unit:'Hz'};
    if(themeId==='E01'&&def.name==='offset')obj.slider={min:0,max:.001,step:.00001,unit:'s'};
    if(def.name==='X')obj.visible=false;
    if(spec.workbench==='W3'&&['message','generator','errors','initial','coded'].includes(def.name))obj.visible=false;
    if(def.name==='h'||def.name==='p'||def.name==='m'||def.name==='b'||def.name==='a'&&def.variable===null&&def.ast.kind==='array')obj.visible=false;
  }
  return scene;
}
export const TOOLS=[
  {label:'余弦信号',group:'信号',definition:'x(t)=cos(2*pi*5*t)',help:'频率 5 Hz，幅度 1'},
  {label:'矩形脉冲',group:'信号',definition:'p(t)=rect(t/0.2)',help:'宽度 0.2 s，边界为 1/2'},
  {label:'复指数',group:'信号',definition:'z(t)=exp(j*2*pi*5*t)',help:'实部 / 虚部 / 模 / 相位 / 轨迹'},
  {label:'因果指数滤波器',group:'系统',definition:'h(t)=exp(-t/0.1)*u(t)/0.1',help:'时间常数 0.1 s，配合 Convolve'},
  {label:'理想低通',group:'系统',definition:'H(f)=rect(f/16)',help:'截止频率 8 Hz，物理实现性未判定'},
  {label:'延迟冲激',group:'系统',definition:'h(t)=delta(t)+0.4*delta(t-0.02)',help:'权重和时延；解析时移而非大数近似'},
  {label:'有限序列',group:'序列',definition:'b=[0,1,1,0,1,0,0,1]',help:'首索引 n=0；采样率未知'},
  {label:'升余弦脉冲',group:'系统',definition:'p(t)=rc(t,0.1,0.25)',help:'总 RC 响应，Ts=0.1 s，alpha=0.25'},
  ...[['概率分布','Probabilities([0.5,0.3,0.2])'],['信息熵','Entropy(distribution)'],['二元信道互信息','BinaryChannel(0.5,0.1,0.1)'],['AWGN 容量','Capacity(3000,1,0.0001)'],['BSC 容量','BinaryCapacity(0.1)'],['哈夫曼编码','Huffman(distribution)'],['汉明编码','Hamming(message)'],['汉明译码','HammingDecode(received)'],['模二和','Xor(coded,errors)'],['CRC 编码','CRCEncode(message,generator)'],['CRC 校验','CRCCheck(received,generator)'],['卷积编码','Convolutional(message)'],['Viterbi 译码','Viterbi(received)'],['序列发生器','LFSR([1,0,0],7)'],['周期相关','PeriodicCorrelation(pn)'],['卷积','Convolve(x,h)'],['频域滤波','Filter(x,H)'],['傅里叶变换','Fourier(x)'],['逆傅里叶变换','InverseFourier(X)'],['采样','Sample(x,40)'],['sinc 重建','Reconstruct(samples)'],['BPSK 调制','BPSK(b)'],['QPSK 调制','QPSK(b)'],['匹配滤波','Matched(x,p,0.2)'],['脉冲成形','Shape(b,p,0.1)'],['符号噪声','AWGN(s,6)'],['波形噪声','Noise(x,0.1)'],['硬判决','Detect(r)']].map(([label,op])=>({label,group:'运算',definition:`y=${op}`,help:op}))
];
export function validateScene(scene) {
  if(!scene||scene.version!==1||scene.modelVersion!==MODEL_VERSION)throw new Error('场景格式或计算模型版本不兼容，请使用本版本导出的 JSON');
  if(!['W1','W2','W3'].includes(scene.workbench)||typeof scene.name!=='string'||scene.name.length>100||typeof scene.notes!=='string'||scene.notes.length>20000)throw new Error('场景名称、笔记或工作台不合法');
  validateSettings(scene.settings);
  if(!Array.isArray(scene.objects)||scene.objects.length>48)throw new Error('场景最多 48 个对象');
  const ids=new Set();
  for(const obj of scene.objects) {
    if(typeof obj.id!=='string'||obj.id.length>80||ids.has(obj.id)||typeof obj.definition!=='string'||obj.definition.length>4096||!/^#[a-fA-F0-9]{6}$/.test(obj.color))throw new Error('对象标识、表达式或颜色不合法');
    ids.add(obj.id);if(!['re','im','abs','arg'].includes(obj.representation))obj.representation='re';
    if(obj.slider){const {min,max,step}=obj.slider;if(![min,max,step].every(Number.isFinite)||max<=min||step<=0)throw new Error('参数范围不合法');}
  }
  if(!scene.views||['time','spectrum','constellation','eye','guidance'].some(k=>typeof scene.views[k]!=='boolean'))throw new Error('视图格式不合法');
  if(scene.views.information!==undefined&&typeof scene.views.information!=='boolean')throw new Error('信息视图格式不合法');
  if(scene.views.hiddenObjects)for(const values of Object.values(scene.views.hiddenObjects))if(!Array.isArray(values)||values.length>48||values.some(v=>typeof v!=='string'))throw new Error('视图对象选择格式不合法');
  if(scene.views.axes&&(!['s','n'].includes(scene.views.axes.time)||!['Hz','sampledHz','cycles/sample'].includes(scene.views.axes.spectrum)))throw new Error('视图坐标单位不合法');
  if(scene.views.plotRanges)for(const range of Object.values(scene.views.plotRanges))if(!range||!['xmin','xmax','ymin','ymax'].every(key=>Number.isFinite(range[key]))||range.xmax<=range.xmin||range.ymax<=range.ymin)throw new Error('视图缩放范围不合法');
  if(scene.frozen){if(!scene.frozen.scene||scene.frozen.scene.frozen||typeof scene.frozen.name!=='string')throw new Error('冻结场景格式不合法');validateScene(scene.frozen.scene);}// Persist definitions, then recompute imported snapshots with the same engine.
  return scene;
}
export function renameInScene(scene,id,newName) {
  if(!/^[A-Za-z_][A-Za-z_0-9]*$/.test(newName))throw new Error('名称需以英文字母或下划线开头');
  const old=parseDefinition(scene.objects.find(o=>o.id===id).definition).name;
  const pattern=new RegExp(`\\b${old}\\b`,'g');
  for(const obj of scene.objects)obj.definition=normalize(obj.definition).replace(pattern,newName);
}
