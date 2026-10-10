import {MathError,c,add,mul,scale,abs,conj,real,finite,sinc,exp,parseDefinition,walk,evaluate,fft,nextPow2,linearConvolution,interpolate,normalSequence} from './math.js';
import {informationOperation} from './information.js';
export const MODEL_VERSION='clab-numeric-1';
const sequence=o=>{if(o?.type!=='sequence')throw new MathError('此操作需要离散序列，请先显式 Sample 或输入有限序列');return o;};
const timeSignal=o=>{if(!o?.fn||o.domain!=='t'||o.type==='impulse')throw new MathError('此操作需要普通时域信号，连续与离散对象不可隐式混用');return o;};
const signal=(fn,meta={})=>({type:'signal',domain:'t',fn,...meta});
function containsDelta(ast){let yes=false;walk(ast,n=>{if(n.kind==='call'&&n.name==='delta')yes=true;});return yes;}
function impulseTerms(ast,env,budget) {
  function split(n,weight=c(1)) {
    if(n.kind==='binary'&&['+','-'].includes(n.op))return [...split(n.left,weight),...split(n.right,scale(weight,n.op==='-'?-1:1))];
    if(n.kind==='unary')return split(n.arg,scale(weight,n.op==='-'?-1:1));
    if(n.kind==='binary'&&n.op==='*') {
      const l=containsDelta(n.left),r=containsDelta(n.right);
      if(l&&r)throw new MathError('不支持冲激乘积',n.p);
      const scalar=l?n.right:n.left;let hasTime=false;walk(scalar,k=>{if(k.kind==='id'&&k.name==='t')hasTime=true;});
      if(hasTime)throw new MathError('冲激的权重必须是常量或标量参数',n.p);
      return split(l?n.left:n.right,mul(weight,finite(evaluate(scalar,env,null,0,budget))));
    }
    if(n.kind==='call'&&n.name==='delta') {
      const arg=n.args[0],a=real(evaluate(arg,env,'t',0,budget)),b=real(evaluate(arg,env,'t',1,budget))-a;
      const hasNonlinear=(()=>{let nonlinear=false;walk(arg,k=>{if(k.kind==='call'||k.kind==='index'||(k.kind==='binary'&&!['+','-','*','/'].includes(k.op)))nonlinear=true;});return nonlinear;})();
      // Verify linearity at multiple positions; reject t*t even if its values happen to match at 0 and 1.
      if(hasNonlinear||Math.abs(real(evaluate(arg,env,'t',2,budget))-(a+2*b))>1e-9||Math.abs(real(evaluate(arg,env,'t',.37,budget))-(a+.37*b))>1e-9||Math.abs(b)<1e-12)throw new MathError('delta 仅支持线性自变量，例如 delta(t-d)',n.p);
      return [{delay:-a/b,weight:scale(weight,1/Math.abs(b))}];
    }
    throw new MathError('冲激响应须为加权冲激之和；普通函数与冲激混合暂未支持',n.p);
  }
  return split(ast);
}
export function validateSettings(settings) {
  const {tMin,tMax,points,fMin,fMax,seed}=settings??{};
  if(![tMin,tMax,fMin,fMax].every(Number.isFinite)||tMax<=tMin||fMax<=fMin)throw new MathError('时间和频率的起止范围必须有限且递增');
  if(![256,512,1024,2048].includes(points))throw new MathError('内部计算点数仅支持 256、512、1024 或 2048');
  if(!Number.isInteger(seed)||seed<0||seed>4294967295)throw new MathError('随机种子须为 0 到 4294967295 的整数');
}
export function computeScene(scene,cache=new Map(),onProgress=()=>{}) {
  const started=performance.now();validateSettings(scene.settings);
  for(const value of cache.values())if(value.evalBudget)value.evalBudget.remaining=6000000;
  if(!Array.isArray(scene.objects)||scene.objects.length>48)throw new MathError('每个场景最多 48 个对象');
  const {tMin,tMax,points:N,seed}=scene.settings,dt=(tMax-tMin)/N,budget={remaining:6000000};
  const definitions=new Map(),errors={},byId=new Map(),env=new Map(),dirty=[],visiting=new Set(),done=new Set();
  for(const obj of scene.objects) {
    try {const def=parseDefinition(obj.definition);byId.set(obj.id,def);if(definitions.has(def.name)){errors[obj.id]={message:`重复名称 ${def.name}`,position:0};errors[definitions.get(def.name).id]={message:`重复名称 ${def.name}`,position:0};}else definitions.set(def.name,{...def,id:obj.id});}
    catch(e){errors[obj.id]={message:e.message,position:e.position??0};}
  }
  const error=(id,e)=>{errors[id]={message:e.message,position:e.position??0};};
  const sampleFn=fn=>Array.from({length:N},(_,i)=>finite(fn(tMin+i*dt)));
  const arraySignal=(values,origin=tMin,step=dt,meta={})=>signal(t=>interpolate(values,origin,step,t),{gridValues:values,origin,step,...meta});
  function transform(o) {
    if(o.type==='impulse')return {type:'frequency',domain:'f',fn:f=>o.impulses.reduce((v,k)=>add(v,mul(k.weight,exp(c(0,-2*Math.PI*f*k.delay)))),c()),model:'理想冲激的解析变换'};
    const seq=o.type==='sequence';if(!seq)timeSignal(o);
    const values=seq?o.values:sampleFn(o.fn),length=nextPow2(values.length),step=seq?o.step:dt,origin=seq?o.origin:tMin;
    const spectrum=fft([...values,...Array.from({length:length-values.length},()=>c())]);
    const normalization=seq?1:dt;
    const frequencies=[],amplitudes=[];
    for(let k=-length/2;k<length/2;k++) {const f=k/(length*step),v=scale(mul(spectrum[(k+length)%length],exp(c(0,-2*Math.PI*f*origin))),normalization);frequencies.push(f);amplitudes.push(v);}
    const fn=seq?f=>values.reduce((sum,v,k)=>add(sum,mul(v,exp(c(0,-2*Math.PI*f*(origin+k*step))))),c()):f=>interpolate(amplitudes,frequencies[0],1/(length*step),f);
    return {type:'frequency',domain:'f',fn,frequencyData:{frequencies,amplitudes},inverseData:{values,origin,step,seq,source:o},sampleRate:seq?o.sampleRate:null,axisUnit:seq&&!o.sampleRate?'cycles/sample':'Hz',model:seq?'有限序列 DTFT / DFT 频点；不作连续积分归一化；采样谱幅度副本以 fs 为周期':'有限记录数值傅里叶变换；矩形窗；乘 Δt'};
  }
  function convolution(a,b) {
    if(a.type==='sequence'||b.type==='sequence') {sequence(a);sequence(b);if(a.values.length+b.values.length>4096)throw new MathError('卷积输出超过 4096 点');if(a.sampleRate!==b.sampleRate)throw new MathError('离散卷积需要一致的采样率元数据');const values=linearConvolution(a.values,b.values);return {type:'sequence',values,origin:a.origin+b.origin,step:a.step,indexOrigin:(a.indexOrigin??0)+(b.indexOrigin??0),sampleRate:a.sampleRate,model:'有限离散线性卷积；零延拓'};}
    if(a.type==='impulse'&&b.type!=='impulse')[a,b]=[b,a];timeSignal(a);
    if(b.type==='impulse')return signal(t=>b.impulses.reduce((v,k)=>add(v,mul(k.weight,a.fn(t-k.delay))),c()),{model:'加权时移的解析冲激卷积；不近似冲激为大数'});
    timeSignal(b);const av=sampleFn(a.fn),bv=sampleFn(b.fn),values=linearConvolution(av,bv).map(v=>scale(v,dt));
    return arraySignal(values,2*tMin,dt,{model:'两输入均截断至计算窗口；零延拓线性卷积，乘 Δt'});
  }
  function operation(name,a,p) {
    const information=informationOperation(name,a);
    if(information!==undefined)return information;
    switch(name) {
      case 'Convolve':return convolution(a[0],a[1]);
      case 'Fourier':return transform(a[0]);
      case 'InverseFourier': {
        const obj=a[0];if(obj?.domain!=='f')throw new MathError('InverseFourier 需要频域对象',p);
        if(obj.inverseData){const d=obj.inverseData;return d.seq?{...d.source}:arraySignal(d.values,d.origin,d.step,{model:'有限 DFT 逆变换；与原记录相同网格'});}
        const bins=Array.from({length:N},(_,k)=>{const f=(k<N/2?k:k-N)/(N*dt);return mul(obj.fn(f),exp(c(0,2*Math.PI*f*tMin)));});
        return arraySignal(fft(bins,true).map(v=>scale(v,1/dt)),tMin,dt,{model:'有限频率区间 IFFT，Δf=1/(NΔt)，周期时间边界'});
      }
      case 'Filter': {
        const x=timeSignal(a[0]),h=a[1];if(h?.domain!=='f')throw new MathError('Filter 第二参数应为 H(f)；h(t) 请使用 Convolve',p);
        const L=2*N,values=[...sampleFn(x.fn),...Array.from({length:N},()=>c())],X=fft(values);
        const Y=X.map((v,k)=>mul(v,h.fn((k<L/2?k:k-L)/(L*dt))));
        return arraySignal(fft(Y,true).slice(0,N),tMin,dt,{model:'双倍补零 FFT 频域滤波；在补零记录上采用周期边界，窗口边缘可能有截断与振铃；理想 H 未判定因果性'});
      }
      case 'Sample': {
        const x=timeSignal(a[0]),fs=real(a[1],'采样率'),offset=a[2]?real(a[2],'采样起始相位'):0;
        if(fs<=0)throw new MathError('采样率必须大于零',p);const origin=Math.ceil((tMin-offset)*fs-1e-10)/fs+offset,count=Math.max(0,Math.ceil((tMax-origin)*fs-1e-10));
        if(count>4096||count<1)throw new MathError('采样点数须为 1 到 4096，请调整窗口或采样率',p);
        return {type:'sequence',values:Array.from({length:count},(_,i)=>finite(x.fn(origin+i/fs))),origin,step:1/fs,indexOrigin:0,sampleRate:fs,model:'教学采样率与内部绘图采样率独立；起点为窗口内首个 k/fs+offset'};
      }
      case 'Reconstruct': {
        const x=sequence(a[0]);if(!x.sampleRate)throw new MathError('重建需要 Sample 得到的含采样率序列',p);
        return signal(t=>x.values.reduce((v,k,i)=>add(v,scale(k,sinc((t-x.origin)*x.sampleRate-i))),c()),{model:'有限个采样点的 sinc 插值；窗口边缘存在截断误差，不能消除已经产生的混叠'});
      }
      case 'BPSK':case 'QPSK': {
        const b=sequence(a[0]);if(b.values.some(v=>v.im!==0||![0,1].includes(v.re)))throw new MathError('调制输入必须为 0/1 比特序列',p);
        if(name==='QPSK'&&b.values.length%2)throw new MathError('QPSK 需要偶数个比特',p);
        const values=name==='BPSK'?b.values.map(v=>c(1-2*v.re)):Array.from({length:b.values.length/2},(_,i)=>scale(c(1-2*b.values[2*i].re,1-2*b.values[2*i+1].re),1/Math.sqrt(2)));
        return {type:'sequence',values,origin:0,step:1,modulation:name,bits:b.values.map(v=>v.re),bitsPerSymbol:name==='BPSK'?1:2,model:'单位符号能量；QPSK 按 I/Q 符号位作 Gray 映射，理想同步'};
      }
      case 'Shape': {
        const symbols=sequence(a[0]),pulse=timeSignal(a[1]),Ts=real(a[2],'符号周期');if(Ts<=0||symbols.values.length>512)throw new MathError('Ts 须大于零，成形序列最多 512 个符号',p);
        return signal(t=>symbols.values.reduce((v,s,k)=>add(v,mul(s,pulse.fn(t-k*Ts))),c()),{symbolPeriod:Ts,model:'有限符号的脉冲叠加 Σ a[k]p(t−kTs)；自定义 p(t) 不自动满足奈奎斯特条件'});
      }
      case 'AWGN': {
        const x=sequence(a[0]);if(!x.bitsPerSymbol)throw new MathError('AWGN 的 Eb/N0 模式需要 BPSK/QPSK 符号；波形噪声请用 Noise(x,sigma)',p);
        const db=real(a[1]),Es=x.values.reduce((s,v)=>s+abs(v)**2,0)/x.values.length,sigma=Math.sqrt(Es/x.bitsPerSymbol/(2*10**(db/10))),z=normalSequence(seed,x.values.length*2);
        return {...x,values:x.values.map((v,i)=>add(v,c(sigma*z[2*i],sigma*z[2*i+1]))),model:`理想同步符号 AWGN；Es=${Es.toPrecision(4)}，Eb=Es/${x.bitsPerSymbol}，每正交维噪声方差 Eb/(2·10^(EbN0/10))；${x.values.length} 符号`};
      }
      case 'Noise': {
        const x=timeSignal(a[0]),sigma=real(a[1]);if(sigma<0)throw new MathError('噪声标准差不能为负',p);const z=normalSequence(seed,N*2),values=sampleFn(x.fn).map((v,i)=>add(v,c(sigma*z[2*i],sigma*z[2*i+1])));
        return arraySignal(values,tMin,dt,{symbolPeriod:x.symbolPeriod,model:'有限带宽复采样噪声；sigma 为每正交维标准差；未将它等同于 Eb/N0 或理想连续白噪声'});
      }
      case 'Phase': {const x=sequence(a[0]),phi=real(a[1]);return {...x,values:x.values.map(v=>mul(v,exp(c(0,phi)))),model:'符号复平面旋转；phi 单位 rad'};}
      case 'Carrier': {
        const x=a[0],seq=x.type==='sequence',Ts=seq?real(a[1]):null,fc=real(seq?a[2]:a[1]);if(seq&&(!a[2]||Ts<=0))throw new MathError('符号载波使用 Carrier(symbols,Ts,fc)，Ts>0',p);if(!seq)timeSignal(x);
        return signal(t=>{const v=seq?x.values[Math.floor(t/Ts)]??c():x.fn(t),angle=2*Math.PI*fc*t;return c(v.re*Math.cos(angle)-v.im*Math.sin(angle));},{symbolPeriod:Ts??x.symbolPeriod,model:'I·cos(2πfct)−Q·sin(2πfct)；符号序列默认矩形保持'});
      }
      case 'SSB':case 'Envelope': {
        const x=timeSignal(a[0]),values=sampleFn(x.fn);if(values.some(v=>Math.abs(v.im)>1e-8))throw new MathError('SSB/Envelope 输入须为实信号',p);
        const X=fft(values),analytic=fft(X.map((v,k)=>scale(v,k===0||k===N/2?1:k<N/2?2:0)),true);
        if(name==='Envelope')return arraySignal(analytic.map(v=>c(abs(v))),tMin,dt,{model:'有限记录 Hilbert 解析包络；周期边界，过调制 AM 的包络为绝对值而非原消息'});
        const fc=real(a[1]);return arraySignal(analytic.map((v,k)=>c(mul(v,exp(c(0,2*Math.PI*fc*(tMin+k*dt)))).re)),tMin,dt,{model:'上边带 SSB：m cos−Hilbert(m) sin；有限记录 FFT Hilbert，周期边界'});
      }
      case 'Matched': {const x=timeSignal(a[0]),s=timeSignal(a[1]),T=real(a[2]);const out=convolution(x,signal(t=>conj(s.fn(T-t))));return {...out,model:'h(t)=s*(T−t)；有限窗口线性卷积，AWGN 下指定 T 处最优；噪声示例为有限带宽近似'};}
      case 'Detect': {
        const x=sequence(a[0]);if(!x.modulation)throw new MathError('Detect 需要带 BPSK/QPSK 元数据的符号',p);
        const bits=x.values.flatMap(v=>x.modulation==='BPSK'?[v.re<0?1:0]:[v.re<0?1:0,v.im<0?1:0]),count=bits.filter((v,i)=>v!==x.bits[i]).length;
        return {type:'sequence',values:bits.map(v=>c(v)),origin:0,step:1,bitErrors:count,totalBits:bits.length,model:`理想相干硬判决；${count}/${bits.length} 次观测比特错误，有限样本不代表理论 BER；零次错误不表示理论 BER 为零`};
      }
      default:throw new MathError(`尚未支持运算 ${name}`,p);
    }
  }
  env.operation=operation;
  function build(name) {
    if(done.has(name))return env.get(name);
    const def=definitions.get(name);if(!def)throw new MathError(`未定义变量或对象「${name}」`);
    if(errors[def.id])throw new MathError(`上游 ${name} 不可计算：${errors[def.id].message}`);
    if(visiting.has(name))throw new MathError(`循环依赖：${[...visiting,name].join(' → ')}`);
    visiting.add(name);
    try {
      for(const dep of def.dependencies){try{build(dep);}catch(error){let position=0;walk(def.ast,node=>{if(!position&&node.name===dep)position=node.p;});throw new MathError(error.message,position);}}
      const key=JSON.stringify([MODEL_VERSION,scene.settings,def.source,def.dependencies.map(k=>env.get(k)?.cacheKey)]),previous=cache.get(def.id);
      let result;
      if(previous?.inputKey===key)result=previous;
      else {
        if(def.variable==='t'&&containsDelta(def.ast))result={type:'impulse',domain:'t',impulses:impulseTerms(def.ast,env,budget),model:'理想加权冲激；标记表示权重，不表示采样振幅'};
        else if(def.variable==='t'||def.variable==='f') {
          const captured=new Map(env);captured.operation=operation;
          result={type:def.variable==='t'?'signal':'frequency',domain:def.variable,fn:x=>finite(evaluate(def.ast,captured,def.variable,x,budget)),model:def.variable==='f'?'手工频响；物理因果性及稳定性未判定':'显式函数，有限窗口数值求值；因果性及稳定性未判定'};
          // Validate every point before accepting a draft, including frequencies used by Filter.
          if(def.variable==='t')sampleFn(result.fn);else for(let k=0;k<2*N;k++)result.fn((k<N?k:k-2*N)/(2*N*dt));
        } else if(def.variable==='n')result={type:'sequence',values:Array.from({length:Math.min(N,512)},(_,n)=>finite(evaluate(def.ast,env,'n',n,budget))),origin:0,step:1,indexOrigin:0,model:'离散函数在 n=0…min(N,512)−1 截断；零延拓，未知采样率'};
        else {result=evaluate(def.ast,env,null,0,budget);if(result.re!==undefined)result={type:'scalar',value:finite(result)};if(result.type==='sequence'&&result.values.length>4096)throw new MathError('离散序列最多 4096 点');if(result.type==='sequence'&&result.values.length===0)throw new MathError('序列不能为空');}
        result={...result,name,inputKey:key,cacheKey:`${def.id}:${(previous?.version??0)+1}`,version:(previous?.version??0)+1,evalBudget:budget};dirty.push(name);cache.set(def.id,result);
      }
      env.set(name,result);done.add(name);return result;
    } finally {visiting.delete(name);}
  }
  let completed=0;
  for(const def of definitions.values()) {
    try {if(performance.now()-started>8000)throw new MathError('计算超过 8 秒，请减小规模');build(def.name);}
    catch(e){error(def.id,e);}onProgress(++completed,definitions.size);
  }
  const results={};
  for(const obj of scene.objects) {
    if(errors[obj.id])continue;const def=byId.get(obj.id),value=env.get(def?.name);if(!value)continue;
    try {
      const out={name:value.name,type:value.type,domain:value.domain,dependencies:def.dependencies,model:value.model??'标量参数',analysis:value.analysis,symbolPeriod:value.symbolPeriod,modulation:value.modulation,bits:value.bits,bitsPerSymbol:value.bitsPerSymbol,bitErrors:value.bitErrors,totalBits:value.totalBits,sampleRate:value.sampleRate,frequencyKind:value.domain==='f'?(value.inverseData?'spectrum':'response'):null};
      if(value.type==='scalar')out.value=value.value;
      else if(value.type==='information') { /* Structured information results have no waveform or Fourier spectrum. */ }
      else if(value.type==='impulse')out.impulses=value.impulses;
      else if(value.type==='sequence'){out.values=value.values;out.x=value.values.map((_,k)=>value.origin+k*value.step);out.sampleRate=value.sampleRate;out.axisUnit=value.sampleRate?'s':'n';}
      else if(value.domain==='t'){out.x=Array.from({length:N},(_,k)=>tMin+k*dt);out.values=sampleFn(value.fn);}
      else {out.x=Array.from({length:N},(_,k)=>scene.settings.fMin+k*(scene.settings.fMax-scene.settings.fMin)/(N-1));out.values=out.x.map(f=>finite(value.fn(f)));out.axisUnit=value.axisUnit??'Hz';}
      if(!['scalar','information'].includes(value.type)&&value.domain!=='f') {
        const spectrum=transform(value);out.spectrum=spectrum.frequencyData??{frequencies:Array.from({length:N},(_,k)=>scene.settings.fMin+k*(scene.settings.fMax-scene.settings.fMin)/(N-1)),amplitudes:Array.from({length:N},(_,k)=>spectrum.fn(scene.settings.fMin+k*(scene.settings.fMax-scene.settings.fMin)/(N-1)))};
        if(value.type==='sequence'&&value.sampleRate){const frequencies=Array.from({length:N},(_,k)=>scene.settings.fMin+k*(scene.settings.fMax-scene.settings.fMin)/(N-1));out.spectrum={frequencies,amplitudes:frequencies.map(spectrum.fn)};}
        out.spectrumUnit=spectrum.axisUnit??'Hz';out.spectrumModel=spectrum.model;
      }
      results[obj.id]=out;
    }catch(e){error(obj.id,e);}
  }
  // Materialization may reveal a singularity outside a filter's sampled bins.
  // Propagate that state too; no downstream curve can silently outlive a failed parent.
  let changed=true;while(changed){changed=false;for(const def of definitions.values())if(!errors[def.id]){const failed=def.dependencies.find(name=>errors[definitions.get(name)?.id]);if(failed){errors[def.id]={message:`上游 ${failed} 不可计算：${errors[definitions.get(failed).id].message}`,position:0};delete results[def.id];changed=true;}}}
  for(const key of cache.keys())if(!scene.objects.some(o=>o.id===key))cache.delete(key);
  return {results,errors,dirty,elapsed:performance.now()-started,dt,internalRate:1/dt,modelVersion:MODEL_VERSION};
}
