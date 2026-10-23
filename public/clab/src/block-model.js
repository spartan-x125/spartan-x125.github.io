import {parseDefinition} from './math.js';
import {roleOptions} from './signal-roles.js';
import {arrangeGraph} from './graph-geometry.js';
export const blockTypes={
 source:{name:'信号源',inputs:[],defaults:{amplitude:1,frequency:2,phase:0,offset:0}},
 carrier:{name:'载波',inputs:[],defaults:{amplitude:1,frequency:12,phase:0}},
 noise:{name:'噪声源',inputs:[],defaults:{sigma:.15,seed:801}},
 multiply:{name:'乘法器',inputs:['信号','本振'],defaults:{}},
 add:{name:'加法器',inputs:['信号','噪声 / 信号'],defaults:{}},
 gain:{name:'增益',inputs:['信号'],defaults:{gain:2}},
 lowpass:{name:'低通滤波',inputs:['信号'],defaults:{cutoff:3}},
 bandpass:{name:'带通滤波',inputs:['信号'],defaults:{center:12,bandwidth:3}},
 systemF:{name:'自定义 H(f)',inputs:['信号'],defaults:{expression:'rect(f/6)'}},
 systemT:{name:'自定义 h(t)',inputs:['信号'],defaults:{expression:'5*exp(-5*t)*u(t)'}},
 matched:{name:'匹配滤波',inputs:['接收信号','参考模板'],defaults:{sampleTime:.5}},
 hilbert:{name:'Hilbert',inputs:['信号'],defaults:{}},
 envelope:{name:'包络检波',inputs:['信号'],defaults:{}},
 delay:{name:'延时',inputs:['信号'],defaults:{delay:.05}},
 phase:{name:'相位延后',inputs:['信号'],defaults:{phase:45}},
 integrate:{name:'积分器',inputs:['信号'],defaults:{initial:0}},
 differentiate:{name:'微分器',inputs:['信号'],defaults:{}},
 constant:{name:'常量源',inputs:[],defaults:{value:1}},
 formula:{name:'表达式源',inputs:[],defaults:{expression:'cos(2*pi*2*t)'}},
 function:{name:'数学运算',inputs:['信号 u'],defaults:{expression:'u'}},
 output:{name:'输出',inputs:['信号'],defaults:{}}
};
export const blockParams={amplitude:['幅度',0,3,.05,''],frequency:['频率',.25,30,.25,'Hz'],phase:['相位',-180,180,1,'°'],offset:['直流',0,2,.05,''],sigma:['噪声标准差',0,1,.01,''],seed:['随机种子',0,9999,1,''],gain:['增益',-4,4,.1,''],cutoff:['截止频率',.5,20,.25,'Hz'],delay:['延时',0,.5,.005,'s']};
Object.assign(blockParams,{initial:['积分初值',-10,10,.1,''],value:['常量',-10,10,.1,''],expression:['表达式']});
Object.assign(blockParams,{center:['中心频率',.25,64,.25,'Hz'],bandwidth:['半带宽 B',.25,32,.25,'Hz'],sampleTime:['匹配采样时刻 T',.05,4,.05,'s']});
export function validateGraph(g){
 if(!g||g.version!==1||!Array.isArray(g.nodes)||g.nodes.length>24||!Array.isArray(g.edges)||g.edges.length>48)throw Error('框图格式不合法');
 const ids=new Set();for(const n of g.nodes){if(!/^b\d+$/.test(n.id)||ids.has(n.id)||!blockTypes[n.type]||typeof n.label!=='string'||n.label.length>40||![n.x,n.y].every(Number.isFinite)||n.role!==undefined&&!roleOptions[n.role])throw Error('元件不合法');ids.add(n.id);for(const [key,value]of Object.entries(blockTypes[n.type].defaults)){const v=n.params?.[key],spec=blockParams[key];if(typeof value==='string'){if(typeof v!=='string'||v.length>512)throw Error('表达式最多512字符');const def=parseDefinition(`btemp(${n.type==='systemF'?'f':'t'})=`+v);if(def.dependencies.some(name=>name!=='u'||n.type!=='function'))throw Error('只能使用当前数学域变量和已连接的输入u');}else if(!Number.isFinite(v)||v<spec[1]||v>spec[2]||key==='seed'&&!Number.isInteger(v))throw Error('元件参数不合法：'+key);}if(n.type==='bandpass'&&n.params.bandwidth>n.params.center)throw Error('BPF下截止不能小于0；请使半带宽不大于中心频率');}
 const ports=new Set();for(const e of g.edges){const target=g.nodes.find(n=>n.id===e.to),p=e.to+':'+e.port;if(!ids.has(e.from)||!target||!Number.isInteger(e.port)||e.port<0||e.port>=blockTypes[target.type].inputs.length||ports.has(p))throw Error('连线端口不合法');ports.add(p);}
 const visiting=new Set(),done=new Set();function visit(id){if(visiting.has(id))throw Error('不能连接成循环；需要明确反馈模型');if(done.has(id))return;visiting.add(id);for(const e of g.edges.filter(e=>e.to===id))visit(e.from);visiting.delete(id);done.add(id);}g.nodes.forEach(n=>visit(n.id));return g;
}
export function compileGraph(g){
 validateGraph(g);const objects=[],errors={},ordered=[],done=new Set();
 function visit(n){if(done.has(n.id))return;const spec=blockTypes[n.type],edges=spec.inputs.map((_,i)=>g.edges.find(e=>e.to===n.id&&e.port===i));
  for(const e of edges)if(e)visit(g.nodes.find(q=>q.id===e.from));
  done.add(n.id);if(edges.some(e=>!e)){errors[n.id]='请连接'+spec.inputs.filter((_,i)=>!edges[i]).join('、');return;}
  if(edges.some(e=>errors[e.from])){errors[n.id]='上游尚未连接完整';return;}
  const p=n.params,a=edges.map(e=>e.from),id=n.id,f=Number(p.frequency),phase=(p.phase??0)*Math.PI/180;let def,role='intermediate';
  switch(n.type){
   case 'source':def=`${id}(t)=${p.offset}+${p.amplitude}*cos(2*pi*${f}*t+(${phase}))`;role='message';break;
   case 'carrier':def=`${id}(t)=${p.amplitude}*cos(2*pi*${f}*t+(${phase}))`;role='carrier';break;
   case 'noise':objects.push({id:'zero_'+id,definition:`z_${id}(t)=0`,visible:false,color:'#aab6c6'});objects.push({id:'raw_'+id,definition:`w_${id}=Noise(z_${id},${p.sigma},${p.seed})`,visible:false,color:'#aab6c6'});def=`${id}(t)=re(w_${id}(t))`;role='noise';break;
   case 'multiply':def=`${id}(t)=${a[0]}(t)*${a[1]}(t)`;role=['received','modulated'].includes(objects.find(o=>o.id===a[0])?.role)?'intermediate':'modulated';break;
   case 'add':def=`${id}(t)=${a[0]}(t)+${a[1]}(t)`;role='received';break;
   case 'gain':def=`${id}(t)=(${p.gain})*${a[0]}(t)`;break;
   case 'lowpass':objects.push({id:'filter_'+id,definition:`H_${id}(f)=rect(f/(2*${p.cutoff}))`,visible:false,color:'#aab6c6',role:'system'});def=`${id}=PeriodicFilter(${a[0]},H_${id})`;break;
   case 'bandpass':objects.push({id:'filter_'+id,definition:`H_${id}(f)=rect((abs(f)-${p.center})/(2*${p.bandwidth}))`,visible:false,color:'#aab6c6',role:'system'});def=`${id}=PeriodicFilter(${a[0]},H_${id})`;break;
   case 'systemF':objects.push({id:'filter_'+id,definition:`H_${id}(f)=${p.expression}`,visible:false,color:'#aab6c6',role:'system'});def=`${id}=PeriodicFilter(${a[0]},H_${id})`;break;
   case 'systemT':objects.push({id:'impulse_'+id,definition:`h_${id}(t)=${p.expression}`,visible:false,color:'#aab6c6',role:'system'});def=`${id}=Convolve(${a[0]},h_${id})`;break;
   case 'matched':def=`${id}=Matched(${a[0]},${a[1]},${p.sampleTime})`;break;
   case 'hilbert':def=`${id}=Hilbert(${a[0]})`;break;
   case 'envelope':def=`${id}=Envelope(${a[0]})`;break;
   case 'delay':def=`${id}(t)=${a[0]}(t-${p.delay})`;break;
   case 'phase':def=`${id}=PhaseDelay(${a[0]},${p.phase*Math.PI/180})`;break;
   case 'integrate':def=`${id}=Integrate(${a[0]},${p.initial})`;break;
   case 'differentiate':def=`${id}=Differentiate(${a[0]})`;break;
   case 'constant':def=`${id}(t)=${p.value}`;role='input';break;
   case 'formula':def=`${id}(t)=${p.expression}`;role='message';break;
   case 'function':def=`${id}(t)=${p.expression.replace(/\bu\b(?!\s*\()/g,`(${a[0]}(t))`)}`;break;
   case 'output':def=`${id}(t)=${a[0]}(t)`;role='output';break;
  }
  role=n.role??role;const sampleAt=n.type==='matched'?p.sampleTime:n.type==='output'?objects.find(o=>o.id===a[0])?.sampleAt:undefined;objects.push({id,definition:def,visible:true,color:role==='noise'?'#d9566b':role==='output'?'#ed8a3c':role==='message'?'#3269e8':'#8271bd',role,label:n.label,sampleAt,representation:'re'});ordered.push(id);
 }
 g.nodes.forEach(visit);return {objects,errors,ordered};
}
export function makeGraph(mode='dsb'){
 const node=(i,type,label,x,y,params={})=>({id:'b'+i,type,label,x,y,params:{...blockTypes[type].defaults,...params}}),edge=(from,to,port=0)=>({from:'b'+from,to:'b'+to,port});
 if(mode==='matched'){const nodes=[node(1,'formula','参考发送脉冲',40,80,{expression:'rect((t-0.2)/0.2)'}),node(2,'noise','信道噪声',40,280),node(3,'add','含噪接收信号',280,80),node(4,'matched','匹配滤波输出',520,80),node(5,'output','相关输出',760,80)];nodes[0].role='reference';return arrangeGraph({version:1,preset:mode,nodes,edges:[edge(1,3),edge(2,3,1),edge(3,4),edge(1,4,1),edge(4,5)]});}
 const nodes=[node(1,'source','消息信号',40,60),node(2,'carrier','调制载波',40,240),node(3,'multiply',mode==='am'?'AM已调信号':'DSB已调信号',260,60),node(4,'noise','信道噪声',260,240),node(5,'add','接收信号',480,60),node(6,'carrier','解调本振',480,240,{amplitude:2}),node(7,'multiply','相干解调',700,60),node(8,'lowpass','LPF低通输出',700,380),node(9,'output','恢复消息',480,500)];
 if(mode==='am')nodes[0].params.offset=1;
 if(mode==='envelope'){nodes[0].params.offset=1;nodes[0].params.amplitude=.6;nodes[6].type='envelope';nodes[6].label='包络检波';nodes[6].params={};nodes.splice(nodes.findIndex(n=>n.id==='b6'),1);}
 const edges=[edge(1,3),edge(2,3,1),edge(3,5),edge(4,5,1),edge(5,7),edge(7,8),edge(8,9)];if(mode!=='envelope')edges.push(edge(6,7,1));
 return arrangeGraph({version:1,preset:mode,nodes,edges});
}
