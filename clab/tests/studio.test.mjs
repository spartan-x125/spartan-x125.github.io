import test from 'node:test';import assert from 'node:assert/strict';
import {makeGraph,compileGraph,validateGraph,blockTypes} from '../src/block-model.js';
import {computeScene} from '../src/engine.js';import {blank,object,makeScene,renameInScene,validateScene} from '../src/scenes.js';
import {finitePowerData,analyticValues,drawCalculator} from '../src/calculator-views.js';
import {units} from '../src/concepts.js';import {derivations} from '../src/derivations.js';import {teachingLabs} from '../src/teaching-labs.js';import {describeSignal} from '../src/signal-roles.js';
import {zoomAt,screenToWorld,snap,orthogonalWire,arrangeGraph,portPoint,NODE_WIDTH,NODE_HEIGHT,fitCamera} from '../src/graph-geometry.js';
import {removeGraphItem,disconnectGraphNode} from '../src/graph-actions.js';
import {noteFormulas,labFormulas} from '../src/formula-tex.js';
import {renderFormula,mathProse} from '../src/math-render.js';
import {splitMathText} from '../src/inline-tex.js';
import {signalLibrary} from '../src/signal-library.js';
const near=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<tol,`${a} ≠ ${b}`);
function runGraph(mode,change=()=>{}){const graph=makeGraph(mode);change(graph);const compiled=compileGraph(graph),scene=blank();scene.objects=compiled.objects;scene.settings={...scene.settings,points:512};const out=computeScene(scene);assert.deepEqual(compiled.errors,{});assert.deepEqual(out.errors,{});return {graph,compiled,out,get:id=>out.results[id]};}
test('editable DSB and AM block chains recover messages with a synchronized local oscillator',()=>{
 for(const mode of ['dsb','am']){const {get}=runGraph(mode,g=>g.nodes.find(n=>n.type==='noise').params.sigma=0);get('b9').values.forEach((z,i)=>{near(z.re,get('b1').values[i].re,1e-9);near(z.im,0);});}
});
test('AM envelope chain recovers a nonnegative envelope; noise is an independent inspectable real node',()=>{
 const {get}=runGraph('envelope',g=>g.nodes.find(n=>n.type==='noise').params.sigma=0);get('b9').values.forEach((z,i)=>near(z.re,get('b1').values[i].re,1e-9));
 const b=runGraph('dsb');b.get('b4').values.forEach(z=>near(z.im,0));b.get('b5').values.forEach((z,i)=>near(z.re,b.get('b3').values[i].re+b.get('b4').values[i].re));
});
test('missing ports invalidate their descendants while unrelated sources remain available; cycles rejected',()=>{
 const graph=makeGraph();graph.edges=graph.edges.filter(e=>e.to!=='b3');const result=compileGraph(graph);assert.ok(result.errors.b3&&result.errors.b9);assert.ok(result.objects.some(o=>o.id==='b1'));assert.ok(!result.objects.some(o=>o.id==='b9'));
 const cyclic=makeGraph();cyclic.edges.push({from:'b9',to:'b1',port:0});assert.throws(()=>validateGraph(cyclic),/端口/);
 const cycle=makeGraph();cycle.edges=cycle.edges.filter(e=>e.to!=='b7'||e.port!==0);cycle.edges.push({from:'b9',to:'b7',port:0});assert.throws(()=>validateGraph(cycle),/循环/);
});
test('graph configuration validation enforces unique ports, valid source types and finite parameters',()=>{
 for(const mutate of [g=>g.nodes[0].params.frequency=NaN,g=>g.nodes[0].params.frequency=-1,g=>g.edges.push({...g.edges[0]}),g=>g.nodes[0].type='Executable']){const g=makeGraph();mutate(g);assert.throws(()=>validateGraph(g));}
});
test('all block operations generate real engine definitions including Hilbert, gain and delay',()=>{
 for(const type of Object.keys(blockTypes)){const g={version:1,nodes:[{id:'b1',type:'source',label:'输入',x:0,y:0,params:{...blockTypes.source.defaults}},{id:'b2',type,label:type,x:200,y:0,params:{...blockTypes[type].defaults}}],edges:blockTypes[type].inputs.map((_,port)=>({from:'b1',to:'b2',port}))};const s=blank();s.objects=compileGraph(g).objects;const out=computeScene(s);assert.deepEqual(out.errors,{},type);}
});
test('power bins and PSD preserve finite-record Parseval and are related by frequency resolution',()=>{
 for(const T of [.5,1,2]){const s=blank();s.settings={...s.settings,tMax:T,points:512};s.objects=[object('x(t)=2*cos(2*pi*3.7*t)+j*sin(2*pi*1.2*t)')];const r=Object.values(computeScene(s).results)[0],data=finitePowerData(r,T);near(data.bins.reduce((a,b)=>a+b.power,0),data.power,1e-10);near(data.bins.reduce((a,b)=>a+b.psd*data.df,0),data.power,1e-10);}
});
test('Hilbert phase and real analytic reconstruction agree at periodic bins; source seeds are deterministic',()=>{
 const s=blank();s.objects=['x(t)=cos(2*pi*3*t)','h=Hilbert(x)','a=Noise(x,.1,22)','b=Noise(x,.1,23)'].map((d,i)=>object(d,i));const out=computeScene(s);assert.deepEqual(out.errors,{});const [x,h,a,b]=s.objects.map(o=>out.results[o.id]);h.values.forEach((z,i)=>near(z.re,Math.sin(2*Math.PI*3*h.x[i]),1e-9));const analytic=analyticValues(x.values);analytic.forEach((z,i)=>{near(z.re,x.values[i].re);near(z.im,h.values[i].re);});assert.notDeepEqual(a.values,b.values);
});
test('semantic signal labels survive renaming and validated scene round trips',()=>{
 const s=makeScene('B01',0),o=s.objects.find(o=>o.definition.startsWith('s(t)'));assert.equal(describeSignal(o,null,s).role,'modulated');o.label='AM已调信号';renameInScene(s,o.id,'rf');const copy=validateScene(JSON.parse(JSON.stringify(s)));assert.equal(copy.objects.find(v=>v.id===o.id).label,'AM已调信号');assert.equal(describeSignal(o,null,s).symbol,'rf');
});
test('29 concept units have actual models and complete step-by-step notes; all teaching models render at defaults',()=>{
 assert.equal(units.length,29);assert.equal(new Set(units.map(u=>u.id)).size,29);for(const u of units){assert.ok(teachingLabs[u.lab],u.id);const n=derivations.find(n=>n.id===u.note);assert.ok(n&&n.steps.length>=4&&n.example.length>30,u.id);}
 for(const [key,lab]of Object.entries(teachingLabs)){const s=Object.fromEntries(lab.controls.map(c=>[c.key,c.value])),r=lab.render(s);assert.ok(r.plots.length>100,key);assert.ok(!/NaN|undefined/.test(r.plots),key);}
});
test('LPF and BPF separate their passbands, while user-defined H(f) and h(t) drive actual outputs',()=>{
 const run=(type,params,expr='cos(2*pi*2*t)+cos(2*pi*12*t)')=>{const g={version:1,nodes:[{id:'b1',type:'formula',label:'输入',x:0,y:0,params:{expression:expr}},{id:'b2',type,label:type,x:200,y:0,params}],edges:[{from:'b1',to:'b2',port:0}]};const s=blank();s.settings.points=1024;s.objects=compileGraph(g).objects;const out=computeScene(s);assert.deepEqual(out.errors,{});return out.results.b2;};
 for(const [type,p,f]of [['lowpass',{cutoff:3},2],['bandpass',{center:12,bandwidth:3},12],['systemF',{expression:'rect(f/6)'},2]]){const r=run(type,p);r.values.forEach((z,i)=>near(z.re,Math.cos(2*Math.PI*f*r.x[i]),1e-9));}
 const identity=run('systemT',{expression:'delta(t)'});identity.values.forEach((z,i)=>near(z.re,Math.cos(2*Math.PI*2*identity.x[i])+Math.cos(2*Math.PI*12*identity.x[i]),1e-9));
});
test('integrator, differentiator and phase lag are mathematically different from a time delay',()=>{
 const s=blank();s.settings.points=2048;s.objects=['x(t)=cos(2*pi*2*t)','integral=Integrate(x,2)','d=Differentiate(x)','p=PhaseDelay(x,pi/2)','z(t)=1','r=Integrate(z,0)'].map((d,i)=>object(d,i));const out=computeScene(s);assert.deepEqual(out.errors,{});const [x,integral,derivative,phase,z,ramp]=s.objects.map(o=>out.results[o.id]);integral.values.forEach((z,i)=>near(z.re,2+Math.sin(4*Math.PI*x.x[i])/(4*Math.PI),3e-7));phase.values.forEach((z,i)=>near(z.re,Math.sin(4*Math.PI*x.x[i]),1e-9));derivative.values.slice(1,-1).forEach((z,i)=>near(z.re,-4*Math.PI*Math.sin(4*Math.PI*x.x[i+1]),1e-4));ramp.values.forEach((z,i)=>near(z.re,ramp.x[i]));
 const g=makeGraph('matched');g.nodes.find(n=>n.type==='noise').params.sigma=0;const ms=blank();ms.settings.points=2048;ms.objects=compileGraph(g).objects;const mr=computeScene(ms);assert.deepEqual(mr.errors,{});const y=mr.results.b4,index=Math.round(.5*2048);near(y.values[index].re,.2,.001);assert.ok(y.values.every(z=>z.re<=y.values[index].re+1e-9));
});
test('canvas zoom keeps the cursor world position fixed; wire routes are orthogonal and placement snaps',()=>{
 const cam={x:50,y:-20,zoom:.7},point=[300,200],next=zoomAt(cam,1.5,point);const a=screenToWorld(point,cam),b=screenToWorld(point,next);near(a[0],b[0]);near(a[1],b[1]);assert.equal(snap(53),60);assert.match(orthogonalWire([100,100],[500,200]),/^M.*H.*V.*H/);assert.match(orthogonalWire([500,100],[100,200]),/V264/);
});
test('common waveform and system templates compile without hidden graph dependencies',()=>{
 for(const template of signalLibrary){const type=template.domain==='frequency'?'systemF':template.domain==='impulse'?'systemT':'formula',g={version:1,nodes:[{id:'b1',type:'source',label:'输入',x:0,y:0,params:{...blockTypes.source.defaults}},{id:'b2',type,label:template.name,x:200,y:0,params:{expression:template.expression}}],edges:type==='formula'?[]:[{from:'b1',to:'b2',port:0}]};const s=blank();s.objects=compileGraph(g).objects;assert.deepEqual(computeScene(s).errors,{},template.name);}
 const bad={version:1,nodes:[{id:'b1',type:'formula',label:'隐藏依赖',x:0,y:0,params:{expression:'b2(t)'}}],edges:[]};assert.throws(()=>validateGraph(bad),/当前数学域/);
});

test('ideal impulses retain weights and analytic spectra instead of sampled power',()=>{
 const s=blank();s.objects=[object('h(t)=delta(t-.2)-.5*delta(t-.4)')];const result=computeScene(s).results[s.objects[0].id],html=drawCalculator({signals:[{object:s.objects[0],result,role:{label:'系统冲激响应',title:'h(t)'}}],views:new Set(['time','spectrum','power','psd']),T:1,F:24,orbit:{}});
 assert.match(html,/冲激权重/);assert.match(html,/解析幅度谱/);assert.match(html,/不定义有限均方功率/);assert.ok(!/NaN|undefined/.test(html));
});

test('arrangement straightens the primary path without changing its computation or overlapping nodes',()=>{
 for(const mode of ['dsb','am','envelope','matched']){const original=makeGraph(mode);original.nodes.forEach((n,i)=>{n.x=i%3*180;n.y=i*140;});const arranged=arrangeGraph(original);assert.deepEqual(compileGraph(arranged).objects,compileGraph(original).objects);assert.deepEqual(arrangeGraph(arranged),arranged);
  for(const a of arranged.nodes)for(const b of arranged.nodes)if(a!==b)assert.ok(a.x+NODE_WIDTH<=b.x||b.x+NODE_WIDTH<=a.x||a.y+NODE_HEIGHT<=b.y||b.y+NODE_HEIGHT<=a.y);
  for(const e of arranged.edges.filter(e=>e.port===0)){const a=arranged.nodes.find(n=>n.id===e.from),b=arranged.nodes.find(n=>n.id===e.to);assert.ok(a.x<b.x);assert.equal(portPoint(a,'out')[1],portPoint(b,0)[1]);}
  for(const width of [280,700,1100]){const cam=fitCamera(arranged.nodes,width,380);for(const n of arranged.nodes){assert.ok(n.x*cam.zoom+cam.x>=0);assert.ok((n.x+NODE_WIDTH)*cam.zoom+cam.x<=width);}}
 }
});

test('routed signal wires avoid component interiors, including the long reference branch',()=>{
 const graph=makeGraph('matched');for(const edge of graph.edges){const a=graph.nodes.find(n=>n.id===edge.from),b=graph.nodes.find(n=>n.id===edge.to),d=orthogonalWire(portPoint(a,'out'),portPoint(b,edge.port),graph.nodes),tokens=d.match(/[MHV][^MHV]+/g);let p;
  for(const token of tokens){const op=token[0],v=token.slice(1).split(',').map(Number);if(op==='M'){p=v;continue;}const q=op==='H'?[v[0],p[1]]:[p[0],v[0]];for(const n of graph.nodes){const hit=p[0]===q[0]?p[0]>n.x&&p[0]<n.x+NODE_WIDTH&&Math.max(p[1],q[1])>n.y&&Math.min(p[1],q[1])<n.y+NODE_HEIGHT:p[1]>n.y&&p[1]<n.y+NODE_HEIGHT&&Math.max(p[0],q[0])>n.x&&Math.min(p[0],q[0])<n.x+NODE_WIDTH;assert.ok(!hit,edge.from+'→'+edge.to+' intersects '+n.id);}p=q;}
 }
});

test('deletion removes attached wires, disconnection preserves components, and snapshots remain recoverable',()=>{
 const graph=makeGraph(),snapshot=JSON.stringify(graph),node=removeGraphItem(graph,{nodeId:'b5'});assert.equal(node.nodes.length,graph.nodes.length-1);assert.ok(node.edges.every(e=>e.from!=='b5'&&e.to!=='b5'));validateGraph(node);assert.ok(compileGraph(node).errors.b9);assert.ok(compileGraph(node).objects.some(o=>o.id==='b1'));
 const wire=removeGraphItem(graph,{edgeIndex:0});assert.equal(wire.nodes.length,graph.nodes.length);assert.equal(wire.edges.length,graph.edges.length-1);assert.equal(disconnectGraphNode(graph,'b5').nodes.length,graph.nodes.length);assert.ok(disconnectGraphNode(graph,'b5').edges.every(e=>e.from!=='b5'&&e.to!=='b5'));assert.equal(JSON.stringify(graph),snapshot);assert.equal(removeGraphItem(graph,{nodeId:'missing'}),null);
});

test('all derivation steps and teaching formulas render as local KaTeX with accessible MathML',()=>{
 for(const n of derivations){assert.equal(noteFormulas[n.id].length,n.steps.length,n.id);for(const tex of noteFormulas[n.id]){const html=renderFormula(tex);assert.match(html,/class="katex"/);assert.match(html,/<math /);assert.ok(!html.includes('katex-error'));}}
 for(const id of Object.keys(teachingLabs)){assert.ok(labFormulas[id],id);assert.match(renderFormula(labFormulas[id]),/class="katex"/);}assert.match(mathProse('关系 $Y=XH$。<img>'),/katex/);assert.ok(!mathProse('<img>').includes('<img>'));
});

test('flow cards, inline equations, legends and worked examples use valid TeX as well as display blocks',()=>{
 const strings=[...derivations.flatMap(n=>[n.assumptions,n.example,n.result,...n.steps.map(s=>s.text)]),...units.flatMap(u=>[u.title,u.summary,u.left,u.right,...u.path]),...Object.values(teachingLabs).flatMap(l=>{const d=l.render(Object.fromEntries(l.controls.map(c=>[c.key,c.value])));return[d.condition,d.conclusion,...d.metrics.flatMap(m=>[m.label,m.value])];})];
 for(const s of strings)for(const p of splitMathText(s))if(p.tex)assert.match(renderFormula(p.tex,{display:false}),/class="katex"/);
 for(const formula of ['x(t)','X_T(f)','|X_T|²/T','∫S_T df=P_T'])assert.match(mathProse(formula,{displayStyle:true}),/class="katex"/);
 assert.match(mathProse('|X_T|²/T'),/\\frac/);assert.match(mathProse('h=(1/τ)e⁻ᵗ/τu(t)'),/e\^\{-t/);assert.match(mathProse('P_b=Q(√3.99)≈0.02288'),/\\sqrt/);
});
