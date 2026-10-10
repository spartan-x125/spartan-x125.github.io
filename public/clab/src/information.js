import {MathError,c,real} from './math.js';

const seq = (values,analysis,model) => ({type:'sequence',values:values.map(v=>c(v)),origin:0,step:1,analysis,model});
const info = (analysis,model) => ({type:'information',analysis,model});
function numbers(obj,label='序列') {
  if(obj?.type!=='sequence'||!obj.values.length)throw new MathError(`${label}需要非空有限序列`);
  return obj.values.map(v=>real(v,label));
}
function bits(obj,label='比特') {
  const values=numbers(obj,label);
  if(values.some(v=>v!==0&&v!==1))throw new MathError(`${label}仅接受 0/1`);
  return values;
}
function probabilities(obj) {
  const values=numbers(obj,'概率分布');
  if(values.length>16||values.some(v=>v<0||v>1)||Math.abs(values.reduce((s,v)=>s+v,0)-1)>1e-9)throw new MathError('概率需在 [0,1]，总和为 1，最多 16 个符号');
  return values;
}
function probability(obj,label) {const p=real(obj,label);if(p<0||p>1)throw new MathError(`${label}须在 [0,1]`);return p;}
export const entropy = values => -values.reduce((sum,p)=>sum+(p===0?0:p*Math.log2(p)),0);
const binaryEntropy = p=>entropy([p,1-p]);
const metric=(label,value,unit='')=>({label,value,unit});
const chart=(x,y,xLabel,yLabel,bars=false)=>({x,y,xLabel,yLabel,bars});
const grid=(max,fn)=>Array.from({length:101},(_,i)=>({x:max*i/100,y:fn(max*i/100)}));
const curve=(points,xLabel,yLabel)=>chart(points.map(p=>p.x),points.map(p=>p.y),xLabel,yLabel);

export const HAMMING_H=Array.from({length:3},(_,r)=>Array.from({length:7},(_,i)=>((i+1)>>r)&1));
export function hammingWord(m) {
  const word=[0,0,m[0],0,m[1],m[2],m[3]];
  for(const p of [1,2,4])word[p-1]=word.reduce((sum,v,i)=>sum^((i+1)&p?v:0),0);
  return word;
}
export const HAMMING_G=Array.from({length:4},(_,i)=>hammingWord(Array.from({length:4},(_,j)=>i===j?1:0)));
function syndrome(word) {return HAMMING_H.map(row=>row.reduce((s,v,i)=>s^(v&word[i]),0));}
function polynomial(obj) {const g=bits(obj,'生成多项式');if(g.length<2||g.length>17||g[0]!==1||g.at(-1)!==1)throw new MathError('生成多项式按最高次项在前输入，首末系数须为 1，次数为 1–16');return g;}
export function divideGF2(input,g) {
  const work=[...input],steps=[];
  for(let i=0;i<=work.length-g.length;i++) {
    const subtract=work[i]===1;
    if(subtract)for(let j=0;j<g.length;j++)work[i+j]^=g[j];
    steps.push({offset:i,subtract,bits:[...work]});
  }
  return {remainder:work.slice(-(g.length-1)),steps};
}
const transition=(state,input)=>({next:(input<<1)|(state>>1),out:[input^((state>>1)&1)^(state&1),input^(state&1)]});

export function informationOperation(name,args) {
  const [a,b,d]=args;
  switch(name) {
    case 'Probabilities': {
      const values=probabilities(a);
      return seq(values,{kind:'probability',metrics:[metric('信源熵',entropy(values),'bit/符号')],chart:chart(values.map((_,i)=>i+1),values,'符号','概率',true),table:{headers:['符号','概率','自信息 / bit'],rows:values.map((p,i)=>['s'+(i+1),p,p? -Math.log2(p):'∞'])}},'离散无记忆信源；0·log₂0 按极限取 0。');
    }
    case 'Entropy':return c(entropy(probabilities(a)));
    case 'BinaryChannel': {
      const p=probability(a,'P(X=1)'),e0=probability(b,'P(Y=1|X=0)'),e1=probability(d,'P(Y=0|X=1)'),py=(1-p)*e0+p*(1-e1);
      const conditional=(1-p)*binaryEntropy(e0)+p*binaryEntropy(e1),mutual=q=>binaryEntropy((1-q)*e0+q*(1-e1))-(1-q)*binaryEntropy(e0)-q*binaryEntropy(e1);
      return info({kind:'binary-channel',metrics:[metric('H(X)',binaryEntropy(p),'bit'),metric('H(Y)',binaryEntropy(py),'bit'),metric('H(Y|X)',conditional,'bit'),metric('I(X;Y)',Math.max(0,mutual(p)),'bit/次')],chart:curve(grid(1,mutual),'P(X=1)','互信息 / bit'),marker:{x:p,y:mutual(p)},table:{headers:['联合概率','Y=0','Y=1'],rows:[['X=0',(1-p)*(1-e0),(1-p)*e0],['X=1',p*e1,p*(1-e1)]]}},'二元无记忆信道；互信息对应当前输入分布，不等同于最大化后的容量。');
    }
    case 'BinaryCapacity': {
      const p=probability(a,'BSC 交叉概率'),value=1-binaryEntropy(p);
      return info({kind:'bsc-capacity',metrics:[metric('BSC 容量',value,'bit/次')],chart:curve(grid(1,q=>1-binaryEntropy(q)),'交叉概率','容量 / bit/次'),marker:{x:p,y:value}},'二元对称无记忆信道；C=1−H₂(p)，p>0.5 时可以翻转接收标签。容量是理论上限。');
    }
    case 'Capacity':case 'CapacitySNR': {
      const B=real(a,'带宽');if(B<=0||B>1e12)throw new MathError('带宽须在 (0,10¹²] Hz');
      let fn,model;
      if(name==='Capacity') {const P=real(b,'功率'),N0=real(d,'噪声谱密度');if(P<0||N0<=0)throw new MathError('功率须非负，N0 须大于 0');fn=band=>band===0?0:band*Math.log1p(P/(N0*band))/Math.LN2;model='实 AWGN 信道，噪声功率 N=N0·B；固定总功率 P 与单边噪声谱密度 N0，C=B·log₂(1+P/(N0B))。';}
      else {const db=real(b,'信噪比');if(db< -300||db>300)throw new MathError('信噪比须在 −300 到 300 dB');const efficiency=Math.log1p(10**(db/10))/Math.LN2;fn=band=>band*efficiency;model='实 AWGN 信道；固定接收 SNR，C=B·log₂(1+SNR)。保持 SNR 时增加带宽也需要同比增加信号功率。';}
      const value=fn(B);if(!Number.isFinite(value))throw new MathError('容量超出数值范围');
      return info({kind:'awgn-capacity',metrics:[metric('信道容量',value,'bit/s'),metric('频谱效率',value/B,'bit/s/Hz')],chart:curve(grid(B*3,fn),'带宽 / Hz','容量 / bit/s'),marker:{x:B,y:value}},model+' 容量是理论上限。');
    }
    case 'Huffman': {
      const values=probabilities(a),codes=values.map(()=>''),steps=[];let id=0;
      const queue=values.flatMap((weight,symbol)=>weight>0?[{id:id++,weight,symbol}]:[]);
      const nodes=[...queue];
      while(queue.length>1) {queue.sort((l,r)=>l.weight-r.weight||l.id-r.id);const left=queue.shift(),right=queue.shift(),parent={id:id++,weight:left.weight+right.weight,left:left.id,right:right.id};queue.push(parent);nodes.push(parent);steps.push({left:left.id,right:right.id,parent:parent.id,a:left.weight,b:right.weight,sum:parent.weight});}
      function assign(node,prefix) {if(node.symbol!==undefined){codes[node.symbol]=prefix||'0';return;}assign(nodes.find(n=>n.id===node.left),prefix+'0');assign(nodes.find(n=>n.id===node.right),prefix+'1');}
      assign(queue[0],'');const average=values.reduce((s,p,i)=>s+p*codes[i].length,0),H=entropy(values);
      return info({kind:'huffman',metrics:[metric('信源熵',H,'bit/符号'),metric('平均码长',average,'bit/符号'),metric('编码效率',average?H/average:0)],tree:{nodes,root:queue[0].id},steps,table:{headers:['符号','概率','码字','码长'],rows:values.map((p,i)=>['s'+(i+1),p,p?codes[i]:'—',p?codes[i].length:'—'])}},'二元前缀码；每次合并最小概率的两个节点，同权按原符号与创建顺序确定。零概率符号不编码，唯一有效符号约定码字 0。');
    }
    case 'Hamming': {
      const input=bits(a);if(input.length%4||input.length>256)throw new MathError('Hamming(7,4) 消息长度须为 4 的倍数，最多 256 比特');
      const rows=[],values=[];for(let i=0;i<input.length;i+=4) {const m=input.slice(i,i+4),word=hammingWord(m);values.push(...word);rows.push([m.join(''),word.join('')]);}
      const codebook=Array.from({length:16},(_,i)=>{const m=Array.from({length:4},(_,j)=>(i>>(3-j))&1);return [m.join(''),hammingWord(m).join('')];});
      return seq(values,{kind:'hamming',metrics:[metric('码率',4/7),metric('最小距离',3),metric('保证纠正',1,'位/码字')],table:{headers:['消息','码字'],rows},matrices:{G:HAMMING_G,H:HAMMING_H},codebook},'偶校验 Hamming(7,4)；位置 1/2/4 为校验位，3/5/6/7 为消息位。GF(2) 上 c=mG，s=Hrᵀ；单比特可纠，多比特可能误纠。');
    }
    case 'HammingDecode': {
      const input=bits(a);if(input.length%7||input.length>448)throw new MathError('汉明接收序列长度须为 7 的倍数，最多 448 比特');
      const rows=[],values=[];for(let i=0;i<input.length;i+=7) {const received=input.slice(i,i+7),s=syndrome(received),position=s[0]+2*s[1]+4*s[2],word=[...received];if(position)word[position-1]^=1;const m=[word[2],word[4],word[5],word[6]];values.push(...m);rows.push([received.join(''),[...s].reverse().join(''),position||'—',word.join(''),m.join('')]);}
      return seq(values,{kind:'hamming-decode',table:{headers:['接收','伴随式 s₂s₁s₀','候选错误位','纠正候选','消息候选'],rows}},'按单比特错误假设译码；(7,4) 不能可靠区分单错与双错，非零伴随式也不能证明纠正成功。');
    }
    case 'Xor': {const x=bits(a),y=bits(b);if(x.length!==y.length)throw new MathError('Xor 两个比特序列长度须相同');return seq(x.map((v,i)=>v^y[i]),a.analysis?{...a.analysis,received:true,transmitted:x}:undefined,'逐位模二和；错误图样为 1 的位置翻转。');}
    case 'CRCEncode': {
      const input=bits(a),g=polynomial(b);if(input.length>512)throw new MathError('CRC 消息最多 512 比特');const division=divideGF2([...input,...Array(g.length-1).fill(0)],g),values=[...input,...division.remainder];
      return seq(values,{kind:'crc-encode',generator:g,steps:division.steps,metrics:[metric('校验位数',g.length-1)],table:{headers:['消息','余数','发送码字'],rows:[[input.join(''),division.remainder.join(''),values.join('')]]}},'最高次项在前；系统 CRC，初始余数 0，无反射、无末尾异或。不是一般纠错器。');
    }
    case 'CRCCheck': {
      const input=bits(a),g=polynomial(b);if(input.length<g.length||input.length>528)throw new MathError('接收码字应长于生成多项式次数，最多 528 比特');const division=divideGF2(input,g),detected=division.remainder.some(Boolean);
      return info({kind:'crc-check',generator:g,steps:division.steps,metrics:[metric('CRC 余数',division.remainder.join('')),metric('检测结果',detected?'检出错误':'未检出错误')],table:{headers:['接收码字','余数'],rows:[[input.join(''),division.remainder.join('')]]}},'非零余数说明检出错误；零余数也可能是漏检，错误多项式为生成多项式的倍数时无法检出。');
    }
    case 'Convolutional': {
      const input=bits(a);if(input.length>64)throw new MathError('卷积码消息最多 64 比特');let state=0;const values=[],steps=[];
      for(const bit of [...input,0,0]){const from=state,{next,out}=transition(state,bit);values.push(...out);steps.push({from,input:bit,to:next,out:out.join('')});state=next;}
      return seq(values,{kind:'convolutional',steps,metrics:[metric('码率',.5),metric('约束长度',3)],table:{headers:['时刻','原状态','输入','输出','新状态'],rows:steps.map((s,i)=>[i,s.from.toString(2).padStart(2,'0'),s.input,s.out,s.to.toString(2).padStart(2,'0')])}},'固定 (7,5)₈、K=3、码率 1/2；初态 00，附加两个 0 尾比特返回 00；输出顺序 g₀=111、g₁=101。');
    }
    case 'Viterbi': {
      const input=bits(a);if(input.length<6||input.length%2||input.length>132)throw new MathError('Viterbi 接收序列须为偶数长度 6–132 比特');
      let metrics=[0,Infinity,Infinity,Infinity];const steps=[];
      for(let i=0;i<input.length;i+=2){const nextMetrics=Array(4).fill(Infinity),survivors=Array(4).fill(null),received=input.slice(i,i+2);
        for(let from=0;from<4;from++)for(let bit=0;bit<2;bit++){const {next,out}=transition(from,bit),distance=out.reduce((s,v,k)=>s+(v!==received[k]),0),cost=metrics[from]+distance;if(cost<nextMetrics[next]){nextMetrics[next]=cost;survivors[next]={from,input:bit,to:next,out:out.join(''),distance};}}
        steps.push({received:received.join(''),metrics:nextMetrics,survivors});metrics=nextMetrics;
      }
      let state=0;const path=[];for(let i=steps.length-1;i>=0;i--){const s=steps[i].survivors[state];path.unshift({...s,time:i});state=s.from;}
      const values=path.slice(0,-2).map(s=>s.input);
      return seq(values,{kind:'viterbi',steps,path,metrics:[metric('最短路径度量',metrics[0],'次比特差异')],table:{headers:['时刻','接收','状态 00','状态 01','状态 10','状态 11'],rows:steps.map((s,i)=>[i,s.received,...s.metrics.map(v=>Number.isFinite(v)?v:'∞')])}},'与 Convolutional 配对的固定 (7,5)₈ 码；初态与终态均 00，全记录硬判决汉明度量，剥离两尾比特；并列路径按状态及输入顺序选取，不保证任意错误图样均可纠。');
    }
    case 'LFSR': {
      const initial=bits(a),count=real(b,'序列长度');if(initial.length!==3||!initial.some(Boolean)||!Number.isInteger(count)||count<1||count>127)throw new MathError('LFSR 使用 3 位非零初态，长度为 1–127 的整数');
      let state=[...initial];const values=[],steps=[];
      for(let i=0;i<count;i++){const before=[...state],out=state[2],feedback=state[1]^state[2];state=[feedback,state[0],state[1]];values.push(out);steps.push({before:before.join(''),out,feedback,after:state.join('')});}
      return seq(values,{kind:'lfsr',steps,metrics:[metric('非零状态周期',7)],table:{headers:['时钟','寄存器 abc','输出 c','反馈 b⊕c','下一状态'],rows:steps.map((s,i)=>[i,s.before,s.out,s.feedback,s.after])}},'固定三阶本原反馈：输出 c，下一状态 [b⊕c,a,b]；非零初态周期 7，零初态锁死。扰码与扩频都不等同加密。');
    }
    case 'PeriodicCorrelation': {
      const input=bits(a);if(input.length>127)throw new MathError('周期相关最多 127 比特');const bipolar=input.map(v=>1-2*v),values=input.map((_,lag)=>bipolar.reduce((s,v,i)=>s+v*bipolar[(i+lag)%input.length],0)/input.length);
      return seq(values,{kind:'correlation',chart:chart(values.map((_,i)=>i),values,'循环时移','归一化周期相关',true)},'将 0/1 映为 +1/−1，对输入整个有限块作循环相关并除以块长；完整 m 序列周期旁瓣为 −1/7。');
    }
    default:return undefined;
  }
}
