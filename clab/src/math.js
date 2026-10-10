// All evaluation is through a bounded AST. No eval, Function, or external code.
export class MathError extends Error {
  constructor(message, position = 0) { super(message); this.position = position; }
}
export const c = (re = 0, im = 0) => ({ re, im });
export const add = (a,b) => c(a.re+b.re,a.im+b.im);
export const sub = (a,b) => c(a.re-b.re,a.im-b.im);
export const mul = (a,b) => c(a.re*b.re-a.im*b.im,a.re*b.im+a.im*b.re);
export const scale = (a,s) => c(a.re*s,a.im*s);
export const abs = a => Math.hypot(a.re,a.im);
export const conj = a => c(a.re,-a.im);
export function div(a,b) {
  const d=b.re*b.re+b.im*b.im;
  if(d===0) throw new MathError('除数为零，请检查表达式及计算范围');
  return c((a.re*b.re+a.im*b.im)/d,(a.im*b.re-a.re*b.im)/d);
}
export const exp = a => scale(c(Math.cos(a.im),Math.sin(a.im)),Math.exp(a.re));
export const principalArg = a => {const phase=Math.atan2(a.im,a.re);return phase<=-Math.PI?Math.PI:phase;};
export const log = a => { if(abs(a)===0) throw new MathError('对数在零处发散'); return c(Math.log(abs(a)),principalArg(a)); };
export function pow(a,b) {
  if(abs(a)===0) { if(b.im===0&&b.re>0) return c(); if(b.im===0&&b.re===0) return c(1); throw new MathError('零的负幂或复幂未定义'); }
  return exp(mul(b,log(a)));
}
export function real(a,label='参数') {
  if(!a || typeof a.re!=='number' || Math.abs(a.im)>1e-10) throw new MathError(`${label}需要实数`);
  return a.re;
}
export function finite(a,position=0) {
  if(!a||!Number.isFinite(a.re)||!Number.isFinite(a.im)) throw new MathError('计算结果发散或超出数值范围',position);
  return a;
}
export const sinc = v => Math.abs(v)<1e-10 ? 1 : Math.sin(Math.PI*v)/(Math.PI*v);
export function raisedCosine(t,Ts,alpha) {
  if(Ts<=0||alpha<0||alpha>1) throw new MathError('rc 的 Ts 须大于 0，滚降 alpha 须在 [0,1]');
  const v=t/Ts;
  if(alpha===0) return sinc(v);
  if(Math.abs(Math.abs(2*alpha*v)-1)<1e-8) return alpha/2*Math.sin(Math.PI/(2*alpha));
  return sinc(v)*Math.cos(Math.PI*alpha*v)/(1-4*alpha*alpha*v*v);
}
const aliases={π:'pi',τ:'tau',α:'alpha',β:'beta',ω:'omega',φ:'phi',μ:'mu',δ:'delta',θ:'theta',σ:'sigma'};
export function normalize(source) {
  return source.replace(/[πτ αβωφμδθσ]/g,s=>aliases[s]??s).replace(/[×·]/g,'*').replace(/÷/g,'/').replace(/[−–]/g,'-').replace(/²/g,'^2').replace(/³/g,'^3');
}
export const constants={pi:c(Math.PI),e:c(Math.E),i:c(0,1),j:c(0,1)};
export const informationArities={Probabilities:1,Entropy:1,BinaryChannel:3,BinaryCapacity:1,Capacity:3,CapacitySNR:2,Huffman:1,Hamming:1,HammingDecode:1,Xor:2,CRCEncode:2,CRCCheck:2,Convolutional:1,Viterbi:1,LFSR:2,PeriodicCorrelation:1};
export const reserved=new Set(['t','f','n',...Object.keys(constants),...Object.keys(informationArities),'sin','cos','exp','ln','log10','sqrt','abs','arg','conj','re','im','sinc','rect','u','If','delta','rc','Convolve','Filter','Fourier','InverseFourier','Sample','Reconstruct','Shape','BPSK','QPSK','AWGN','Noise','Phase','Carrier','SSB','Envelope','Matched','Detect']);
export const arities={...informationArities,sin:1,cos:1,exp:1,ln:1,log10:1,sqrt:1,abs:1,arg:1,conj:1,re:1,im:1,sinc:1,rect:1,u:1,If:3,delta:1,rc:3,Convolve:2,Filter:2,Fourier:1,InverseFourier:1,Sample:[2,3],Reconstruct:1,Shape:3,BPSK:1,QPSK:1,AWGN:2,Noise:2,Phase:2,Carrier:[2,3],SSB:2,Envelope:1,Matched:3,Detect:1};
export function tokenize(source) {
  if(source.length>4096) throw new MathError('单条表达式最多 4096 字符');
  const tokens=[]; let p=0;
  while(p<source.length) {
    if(/\s/.test(source[p])) {p++;continue;}
    const rest=source.slice(p), number=rest.match(/^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/), name=rest.match(/^[A-Za-z_][A-Za-z_0-9]*/);
    if(number) {tokens.push({type:'number',value:Number(number[0]),p});p+=number[0].length;}
    else if(name) {tokens.push({type:'id',value:name[0],p});p+=name[0].length;}
    else {
      const op=rest.match(/^(?:<=|>=|==|!=|[+\-*/^(),\[\]<>])/);
      if(!op) throw new MathError(`不支持字符「${source[p]}」；乘法请使用 *`,p);
      tokens.push({type:op[0],value:op[0],p});p+=op[0].length;
    }
    if(tokens.length>1024) throw new MathError('表达式过于复杂');
  }
  tokens.push({type:'end',p:source.length}); return tokens;
}
export function parseExpression(source) {
  const tokens=tokenize(source); let i=0,depth=0;
  const take=type=>{const t=tokens[i];if(t.type!==type)throw new MathError(`应为 ${type}，请检查括号和显式乘号`,t.p);i++;return t;};
  const precedence={'==':1,'!=':1,'<':1,'>':1,'<=':1,'>=':1,'+':2,'-':2,'*':3,'/':3,'^':5};
  function expression(min=0) {
    if(++depth>48) throw new MathError('括号或调用嵌套最多 48 层');
    const token=tokens[i++]; let left;
    if(token.type==='number') left={kind:'number',value:token.value,p:token.p};
    else if(token.type==='+'||token.type==='-') left={kind:'unary',op:token.type,arg:expression(4),p:token.p};
    else if(token.type==='(') {left=expression();take(')');}
    else if(token.type==='[') {const items=[];if(tokens[i].type!==']')do{items.push(expression());if(tokens[i].type!==',')break;i++;}while(true);take(']');left={kind:'array',items,p:token.p};}
    else if(token.type==='id') {
      left={kind:'id',name:token.value,p:token.p};
      if(tokens[i].type==='(') {
        i++;const args=[];if(tokens[i].type!==')')do{args.push(expression());if(tokens[i].type!==',')break;i++;}while(true);take(')');
        left={kind:'call',name:token.value,args,p:token.p};
        if(arities[left.name]!==undefined){const a=arities[left.name];if(Array.isArray(a)?!a.includes(args.length):a!==args.length)throw new MathError(`${left.name} 需要 ${Array.isArray(a)?a.join(' 或 '):a} 个参数`,token.p);}
      } else if(tokens[i].type==='[') {i++;const index=expression();take(']');left={kind:'index',name:token.value,index,p:token.p};}
    } else throw new MathError('此处需要数字、变量或函数',token.p);
    while(precedence[tokens[i].type]>=min) {
      const op=tokens[i++],p=precedence[op.type];left={kind:'binary',op:op.type,left,right:expression(p+(op.type==='^'?0:1)),p:op.p};
    }
    depth--;return left;
  }
  const ast=expression();if(tokens[i].type!=='end')throw new MathError('多余输入；省略乘号不受支持，请使用 *',tokens[i].p);
  return ast;
}
export function walk(node,fn) {
  fn(node);if(node.kind==='binary'){walk(node.left,fn);walk(node.right,fn);} else if(node.kind==='unary')walk(node.arg,fn);else if(node.kind==='array')node.items.forEach(n=>walk(n,fn));else if(node.kind==='call')node.args.forEach(n=>walk(n,fn));else if(node.kind==='index')walk(node.index,fn);
}
export function parseDefinition(source) {
  source=normalize(source.trim());const m=source.match(/^([A-Za-z_][A-Za-z_0-9]*)(?:\(([tf])\)|\[([n])\])?\s*=\s*(?![=])([\s\S]+)$/);
  if(!m)throw new MathError('请输入命名定义，例如 a=2、x(t)=cos(2*pi*t) 或 b=[1,0,1]');
  const [,name,continuous,discrete,rhs]=m;
  if(reserved.has(name))throw new MathError(`「${name}」是保留名称，请换一个名称`);
  const variable=continuous||discrete||null,offset=source.length-rhs.length,dependencies=new Set();let ast;
  try{ast=parseExpression(rhs);}catch(error){error.position=(error.position??0)+offset;throw error;}
  walk(ast,node=>{node.p+=offset;});
  walk(ast,node=>{
    if(['id','call','index'].includes(node.kind)&&!reserved.has(node.name))dependencies.add(node.name);
    if(node.kind==='id'&&['t','f','n'].includes(node.name)&&node.name!==variable)throw new MathError(`变量 ${node.name} 不能出现在 ${variable?variable+' 域':'此标量或运算'}定义中`,node.p);
  });
  return {name,variable,ast,dependencies:[...dependencies],source,rhs};
}
export function evaluate(ast,env,variable=null,value=0,budget={remaining:2000000}) {
  function run(n) {
    if(--budget.remaining<0)throw new MathError('计算量超限，请减少对象、点数或表达式复杂度');
    if(n.kind==='number')return c(n.value);
    if(n.kind==='id') {
      if(n.name===variable)return c(value);
      if(constants[n.name])return constants[n.name];
      const object=env.get(n.name);if(!object)throw new MathError(`未定义变量或对象「${n.name}」`,n.p);
      return object.type==='scalar'?object.value:object;
    }
    if(n.kind==='array')return {type:'sequence',values:n.items.map(x=>finite(run(x),x.p)),origin:0,step:1};
    if(n.kind==='index') {
      const obj=env.get(n.name),idx=real(run(n.index),'索引');
      if(obj?.type!=='sequence')throw new MathError(`${n.name} 不是离散序列`,n.p);
      if(!Number.isInteger(idx))throw new MathError('离散索引必须为整数',n.p);
      const pos=idx-(obj.indexOrigin??0);return obj.values[pos]??c();
    }
    if(n.kind==='unary'){const v=run(n.arg);return n.op==='-'?scale(v,-1):v;}
    if(n.kind==='binary') {
      const a=run(n.left),b=run(n.right);
      if(a.re===undefined||b.re===undefined)throw new MathError('函数请显式调用 x(t)，序列请用 b[n]；运算对象需使用专用命令',n.p);
      const operators={'+':add,'-':sub,'*':mul,'/':div,'^':pow};
      if(operators[n.op])return finite(operators[n.op](a,b),n.p);
      const x=real(a),y=real(b),comparisons={'<':x<y,'>':x>y,'<=':x<=y,'>=':x>=y,'==':x===y,'!=':x!==y};return c(comparisons[n.op]?1:0);
    }
    if(n.kind==='call') {
      if(n.name==='If')return run(real(run(n.args[0]))!==0?n.args[1]:n.args[2]);
      const a=n.args.map(run);
      if(!reserved.has(n.name)) {
        const object=env.get(n.name);if(!object)throw new MathError(`未定义函数「${n.name}」`,n.p);
        if(!object.fn||a.length!==1)throw new MathError(`${n.name} 需要一个与其数学域一致的自变量`,n.p);
        if(variable&&object.domain!==variable)throw new MathError(`不能在 ${variable} 域中调用 ${object.domain} 域函数 ${n.name}`,n.p);
        return object.fn(real(a[0]));
      }
      if(env.operation&&/^[A-Z]/.test(n.name))return env.operation(n.name,a,n.p);
      const v=a[0];let result;
      switch(n.name) {
        case 'sin':result=c(Math.sin(v.re)*Math.cosh(v.im),Math.cos(v.re)*Math.sinh(v.im));break;
        case 'cos':result=c(Math.cos(v.re)*Math.cosh(v.im),-Math.sin(v.re)*Math.sinh(v.im));break;
        case 'exp':result=exp(v);break;case 'ln':result=log(v);break;case 'log10':result=scale(log(v),1/Math.LN10);break;
        case 'sqrt':result=pow(v,c(.5));break;case 'abs':result=c(abs(v));break;case 'arg':result=c(principalArg(v));break;
        case 'conj':result=conj(v);break;case 're':result=c(v.re);break;case 'im':result=c(v.im);break;
        case 'sinc':result=c(sinc(real(v)));break;
        case 'rect':{const x=Math.abs(real(v));result=c(x<.5?1:x===.5?.5:0);break;}
        case 'u':{const x=real(v);result=c(x>0?1:x===0?.5:0);break;}
        case 'rc':result=c(raisedCosine(real(v),real(a[1]),real(a[2])));break;
        case 'delta':throw new MathError('delta 仅支持冲激响应中的加权线性时移；不可作为普通数值函数',n.p);
        default:throw new MathError(`函数 ${n.name} 尚未支持`,n.p);
      }
      return finite(result,n.p);
    }
    throw new MathError('表达式类型未支持');
  }
  return run(ast);
}
export const nextPow2 = n => 2**Math.ceil(Math.log2(Math.max(2,n)));
export function fft(values,inverse=false) {
  const n=values.length;if((n&(n-1))!==0)throw new MathError('FFT 点数必须为 2 的幂');
  const out=values.map(v=>c(v.re,v.im));
  for(let i=1,j=0;i<n;i++){let bit=n>>1;for(;j&bit;bit>>=1)j^=bit;j^=bit;if(i<j)[out[i],out[j]]=[out[j],out[i]];}
  for(let len=2;len<=n;len<<=1){const angle=(inverse?2:-2)*Math.PI/len,wlen=c(Math.cos(angle),Math.sin(angle));for(let i=0;i<n;i+=len){let w=c(1);for(let j=0;j<len/2;j++){const u=out[i+j],v=mul(out[i+j+len/2],w);out[i+j]=add(u,v);out[i+j+len/2]=sub(u,v);w=mul(w,wlen);}}}
  return inverse?out.map(v=>scale(v,1/n)):out;
}
export function linearConvolution(a,b) {
  const size=nextPow2(a.length+b.length-1),pad=v=>[...v,...Array.from({length:size-v.length},()=>c())];
  const A=fft(pad(a)),B=fft(pad(b));return fft(A.map((v,i)=>mul(v,B[i])),true).slice(0,a.length+b.length-1);
}
export function interpolate(values,origin,step,x) {
  const index=(x-origin)/step;if(index< -1e-8||index>values.length-1+1e-8)return c();
  const i=Math.min(values.length-1,Math.max(0,Math.floor(index))),v=values[i];return i===values.length-1?v:add(scale(v,1-(index-i)),scale(values[i+1],index-i));
}
export function normalSequence(seed,length) {
  let state=(seed>>>0)||0x9e3779b9;
  const uniform=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return ((state>>>0)+1)/4294967297;};
  return Array.from({length},()=>Math.sqrt(-2*Math.log(uniform()))*Math.cos(2*Math.PI*uniform()));
}
