import {chart,curve,colors,fmt,esc} from './concept-labs.js';
import {fft,c} from './math.js';
import {orbitProject} from './studio-math.js';
const magnitude=z=>Math.hypot(z.re,z.im);
export function finitePowerData(r,T){
 if(r.domain!=='t'||!r.values?.length||!r.spectrum)throw Error('功率谱需要连续时间采样结果');
 const power=r.values.reduce((a,z)=>a+z.re*z.re+z.im*z.im,0)/r.values.length;
 return {power,df:1/T,bins:r.spectrum.frequencies.map((f,i)=>({f,power:magnitude(r.spectrum.amplitudes[i])**2/T**2,psd:magnitude(r.spectrum.amplitudes[i])**2/T}))};
}
export function analyticValues(values){const N=values.length,X=fft(values);return fft(X.map((v,k)=>{const scale=k===0||k===N/2?1:k<N/2?2:0;return c(v.re*scale,v.im*scale);}),true);}
export function orbitFigure(title,points,labels,{yaw=-30,pitch=25}={},extent=1){
 const W=680,H=400,project=p=>{const [x,y]=orbitProject(p,yaw,pitch,140);return [W/2+x,H/2+y];},line=(a,b)=>{const p=project(a),q=project(b);return `M${p}L${q}`;},axes=[[[1.35,0,0],labels[0]],[[0,1.35,0],labels[1]],[[0,0,1.35],labels[2]]];
 const grid=[];for(let k=-1;k<=1;k+=.5){grid.push(`<path d="${line([-1,k,0],[1,k,0])} ${line([k,-1,0],[k,1,0])}" stroke="#e5ebf4"/>`);}
 const p=points.map((v,i)=>`${i?'L':'M'}${project(v.slice(0,3)).join(',')}`).join(' ');
 return `<figure class="plot-card orbit-card"><figcaption>${esc(title)}</figcaption><div class="orbit-toolbar"><span>拖动旋转</span><button data-orbit-reset>复位</button><button data-orbit-kind>频谱 / 轨迹</button></div><svg data-orbit viewBox="0 0 ${W} ${H}" role="img" tabindex="0" aria-label="可旋转三维视图；方向键旋转"><title>三维复数坐标，拖动或方向键旋转</title>${grid.join('')}${axes.map(([a,label])=>{const z=project(a);return `<path d="${line(a.map(v=>-v*.85),a)}" stroke="#b8c6da"/><text x="${z[0]}" y="${z[1]-10}" text-anchor="middle">${esc(label)}</text>`;}).join('')}<path d="${p}" stroke="${colors.green}" stroke-width="2" fill="none" vector-effect="non-scaling-stroke"/></svg></figure>`;
}
export function drawCalculator({signals,views,T,F,sharedScale=true,overlay,focus,orbit,spatialKind='spectrum',complexKind='analytic'}){
 const plots=[],active=signals.filter(s=>s.result),wave=active.filter(s=>s.result.domain==='t'&&s.result.values),freq=active.filter(s=>s.result.domain==='f'),sets=overlay&&wave.length?[wave]:wave.map(s=>[s]);
 for(const set of sets){const title=overlay?set.map(s=>s.role.label).join(' / '):set[0].role.label,series=fn=>set.map(s=>curve(s.role.title,s.object.color,fn(s.result)));
  if(views.has('time')){const mx=Math.max(.1,...(sharedScale?wave:set).flatMap(s=>s.result.values.map(z=>Math.abs(z.re))));plots.push(chart(`${title} · 时域`,{series:series(r=>r.x.map((x,i)=>[x,r.values[i].re])),vlines:set.filter(q=>Number.isFinite(q.object.sampleAt)).map(q=>({x:q.object.sampleAt,label:'匹配采样 T'})),xrange:[0,T],yrange:[-mx*1.15,mx*1.15],xlabel:'t / s',ylabel:'实部 / 归一幅度'}));}
  if(views.has('spectrum')){const curves=series(r=>r.spectrum.frequencies.flatMap((f,i)=>Math.abs(f)<=F?[[f,magnitude(r.spectrum.amplitudes[i])/T]]:[])),mx=Math.max(.01,...(sharedScale?wave.flatMap(s=>s.result.spectrum.frequencies.flatMap((f,i)=>Math.abs(f)<=F?[magnitude(s.result.spectrum.amplitudes[i])/T]:[])):curves.flatMap(q=>q.points.map(p=>p[1]))));plots.push(chart(`${title} · 幅度谱`,{series:curves,xrange:[-F,F],yrange:[0,mx*1.15],xlabel:'f / Hz',ylabel:'|X_T| / T'}));}
  for(const type of ['power','psd'])if(views.has(type)){const seriesData=set.map(s=>({s,data:finitePowerData(s.result,T).bins.filter(b=>Math.abs(b.f)<=F)})),mx=Math.max(.01,...(sharedScale?wave.map(s=>({data:finitePowerData(s.result,T).bins.filter(b=>Math.abs(b.f)<=F)})):seriesData).flatMap(q=>q.data.map(b=>b[type==='power'?'power':'psd']))),titleSuffix=type==='power'?'频点功率':'功率谱密度';plots.push(chart(`${title} · ${titleSuffix}`,{...(type==='power'?{stems:seriesData.flatMap(({s,data})=>data.map(b=>({x:b.f,y:b.power,color:s.object.color,label:s.role.title})))}:{series:seriesData.map(({s,data})=>curve(s.role.title,s.object.color,data.map(b=>[b.f,b.psd])))}),xrange:[-F,F],yrange:[0,mx*1.15],xlabel:`f / Hz；Δf=${fmt(1/T)}Hz`,ylabel:type==='power'?'P_k / 归一功率':'S_T / 归一功率·Hz⁻¹'}));}
 }
 for(const s of freq){const r=s.result,mx=Math.max(.01,...r.values.map(magnitude));plots.push(chart(s.role.label+' · 频率响应',{series:[curve(s.role.title,s.object.color,r.x.map((x,i)=>[x,magnitude(r.values[i])]))],xrange:[-F,F],yrange:[0,mx*1.1],xlabel:'f / Hz',ylabel:'|H(f)|'}));}
 for(const s of active.filter(s=>s.result.type==='impulse')){
  const terms=s.result.impulses,mx=Math.max(.1,...terms.map(k=>magnitude(k.weight)));
  if(views.has('time'))plots.push(chart(s.role.label+' · 理想冲激',{stems:terms.flatMap(k=>[{x:k.delay,y:k.weight.re,color:s.object.color,label:'实部权重'},...(Math.abs(k.weight.im)>1e-9?[{x:k.delay,y:k.weight.im,color:colors.orange,label:'虚部权重'}]:[])]),xrange:[0,T],yrange:[-mx*1.15,mx*1.15],xlabel:'t / s',ylabel:'冲激权重（非幅值）'}));
  if(views.has('spectrum'))plots.push(chart(s.role.label+' · 解析幅度谱',{series:[curve(s.role.title,s.object.color,Array.from({length:513},(_,i)=>{const f=-F+2*F*i/512;let re=0,im=0;for(const k of terms){const a=-2*Math.PI*f*k.delay;re+=k.weight.re*Math.cos(a)-k.weight.im*Math.sin(a);im+=k.weight.re*Math.sin(a)+k.weight.im*Math.cos(a);}return [f,Math.hypot(re,im)];}))],xrange:[-F,F],yrange:[0,Math.max(.1,terms.reduce((a,k)=>a+magnitude(k.weight),0))*1.15],xlabel:'f / Hz',ylabel:'|X(f)|'}));
  if(views.has('power')||views.has('psd'))plots.push('<div class="empty-plot">理想冲激不作平方采样，不定义有限均方功率。请观察时域权重和解析频谱。</div>');
 }
 const picked=wave.find(s=>s.object.id===focus)??wave[0];
 if(picked){const r=picked.result;
  if(views.has('complex')){const isReal=r.values.every(z=>Math.abs(z.im)<1e-9),a=complexKind==='analytic'&&isReal?analyticValues(r.values):r.values,mx=Math.max(.1,...a.map(magnitude))*1.15;plots.push(chart(`${picked.role.label} · ${isReal&&complexKind==='analytic'?'解析信号':'原信号'}复平面`,{square:true,series:[curve('复数轨迹',picked.object.color,a.map(z=>[z.re,z.im]))],dots:[{x:a[0].re,y:a[0].im,color:colors.orange}],xrange:[-mx,mx],yrange:[-mx,mx],xlabel:'Re',ylabel:'Im'}));}
  if(views.has('three')){let pts,labels;if(spatialKind==='time'){const mx=Math.max(.1,...r.values.map(magnitude));pts=r.values.map((z,i)=>[2*r.x[i]/T-1,z.re/mx,z.im/mx]);labels=['t / s','Re x','Im x'];}else{const a=r.spectrum.frequencies.flatMap((f,i)=>Math.abs(f)<=F?[[f,r.spectrum.amplitudes[i]]]:[]),mx=Math.max(.001,...a.map(p=>magnitude(p[1])));pts=a.map(([f,z])=>[f/F,z.re/mx,z.im/mx]);labels=['f / Hz','Re X_T','Im X_T'];}plots.push(orbitFigure(`${picked.role.label} · ${spatialKind==='time'?'时域复轨迹':'三维复频谱'}`,pts,labels,orbit));}
 }
 return plots.join('')||'<div class="empty-plot">选择一个信号和图形视图。</div>';
}
