import test from 'node:test';
import assert from 'node:assert/strict';
import {computeScene} from '../src/engine.js';
import {c,parseDefinition,parseExpression,evaluate,linearConvolution,fft,raisedCosine,sinc,normalSequence} from '../src/math.js';
import {blank,object,THEMES,makeScene,renameInScene,validateScene} from '../src/scenes.js';
const near=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<tol,`${a} vs ${b}, tolerance ${tol}`);
function scene(definitions,settings={}){const s=blank();s.objects=definitions.map((d,i)=>object(d,i));Object.assign(s.settings,settings);return s;}
function run(definitions,settings={}){const s=scene(definitions,settings),out=computeScene(s);assert.deepEqual(out.errors,{});return {s,out,get:name=>Object.values(out.results).find(r=>r.name===name)};}
test('parser precedence, aliases, complex functions and lazy branches',()=>{
  near(evaluate(parseExpression('-2^2'),new Map()).re,-4);
  near(evaluate(parseExpression('2^3^2'),new Map()).re,512);
  const env=new Map();near(evaluate(parseExpression('If(1>0,2,1/0)'),env).re,2);
  near(evaluate(parseExpression('abs(exp(j*pi))'),env).re,1);
  near(evaluate(parseExpression('sqrt(-1)'),env).im,1);
  near(evaluate(parseExpression('arg(-1)'),env).re,Math.PI);
  near(evaluate(parseExpression('ln(-1)'),env).im,Math.PI);
  const def=parseDefinition('x(t)=cos(2*π*τ*t)');assert.deepEqual(def.dependencies,['tau']);
  assert.throws(()=>parseDefinition('pi=3'),/保留/);
  assert.throws(()=>parseDefinition('x(t)=2t'),/显式|省略/);
  assert.throws(()=>parseDefinition('x(t)=sin(t,1)'),/1 个/);
  assert.throws(()=>parseDefinition('x(t)=cos(f)'),/f 不能/);
  assert.throws(()=>parseDefinition('x(t)=globalThis.alert(1)'),/不支持/);
});
test('FFT round trip and linear convolution zero extension',()=>{
  const x=[c(1),c(2,1),c(-3),c(4,-2)],back=fft(fft(x),true);back.forEach((v,i)=>{near(v.re,x[i].re);near(v.im,x[i].im);});
  assert.equal(linearConvolution([c(1),c(2)],[c(1),c(3)]).length,3);
  linearConvolution([c(1),c(2)],[c(1),c(3)]).forEach((v,i)=>near(v.re,[1,5,6][i]));
});
test('definitions update downstream only and hide leaves calculation intact',()=>{
  const s=scene(['a=1','x(t)=a*cos(2*pi*5*t)','h(t)=delta(t)','y=Convolve(x,h)','independent(t)=cos(2*pi*12*t)']),cache=new Map();
  const first=computeScene(s,cache);assert.deepEqual(first.errors,{});s.objects[0].definition='a=2';s.objects[1].visible=false;
  const second=computeScene(s,cache);assert.deepEqual(second.errors,{});assert.deepEqual(new Set(second.dirty),new Set(['a','x','y']));
  near(second.results[s.objects[3].id].values[0].re,2);
  for(let i=0;i<80;i++)assert.deepEqual(computeScene(s,cache).errors,{});
});
test('undefined names, cycles, duplicate names, incompatible domains and singularities report errors',()=>{
  for(const definitions of [['x(t)=q*t'],['a=b+1','b=a+1'],['a=1','a=2'],['b=[1,0]','x(t)=t','y=Convolve(x,b)'],['x(t)=1/t'],['H(f)=f','x(t)=H(t)'],['x(t)=sqrt(-1)*t','samples=Sample(x,-2)']])assert.ok(Object.keys(computeScene(scene(definitions)).errors).length);
});
test('step and causal exponential convolution approximate zero-state analytic response',()=>{
  const {get}=run(['tau=0.1','x(t)=u(t)','h(t)=exp(-t/tau)*u(t)/tau','y=Convolve(x,h)'],{tMin:-1,tMax:1,points:2048});
  const y=get('y');for(const t of [.1,.2,.4,.6]){const i=Math.round((t+1)/2*2048);near(y.values[i].re,1-Math.exp(-y.x[i]/.1),.011);}
});
test('ideal delayed impulses produce weighted shifted complex signal exactly',()=>{
  const {get}=run(['d=0.02','x(t)=exp(j*2*pi*5*t)','h(t)=delta(t)+0.4*delta(t-d)','y=Convolve(x,h)']);
  get('y').values.forEach((v,i)=>{const t=get('y').x[i];near(v.re,Math.cos(2*Math.PI*5*t)+.4*Math.cos(2*Math.PI*5*(t-.02)));near(v.im,Math.sin(2*Math.PI*5*t)+.4*Math.sin(2*Math.PI*5*(t-.02)));});
  assert.ok(Object.keys(computeScene(scene(['h(t)=delta(t)*delta(t)'])).errors).length);
  assert.ok(Object.keys(computeScene(scene(['h(t)=delta(t*t)'])).errors).length);
});
test('continuous FFT amplitude and time-origin phase agree with cosine and complex tone',()=>{
  const {get}=run(['x(t)=cos(2*pi*5*t)','X=Fourier(x)','z(t)=exp(j*2*pi*5*t)','Z=Fourier(z)'],{tMin:-.25,tMax:.75});
  const spectrum=get('x').spectrum,k=spectrum.frequencies.indexOf(5);near(spectrum.amplitudes[k].re,.5,1e-8);near(spectrum.amplitudes[k].im,0);
  near(get('z').spectrum.amplitudes[k].re,1);
});
test('arbitrary frequency function inverse and forward round trip retain complex record',()=>{
  const {get}=run(['x(t)=exp(j*2*pi*5*t)','X=Fourier(x)','back=InverseFourier(X)','H(f)=rect(f/16)','h=InverseFourier(H)']);
  get('back').values.forEach((v,i)=>{near(v.re,get('x').values[i].re);near(v.im,get('x').values[i].im);});assert.equal(get('h').values.length,1024);
});
test('frequency filter passes low tone and rejects high tone away from boundaries',()=>{
  const {get}=run(['x(t)=cos(2*pi*5*t)+0.5*cos(2*pi*12*t)','H(f)=rect(f/16)','y=Filter(x,H)']);
  const y=get('y'),err=y.values.slice(256,768).reduce((s,v,j)=>s+(v.re-Math.cos(2*Math.PI*5*y.x[j+256]))**2,0);assert.ok(Math.sqrt(err/512)<.07);
});
test('finite discrete convolution is distinct from pointwise multiplication',()=>{
  const {get}=run(['a=[1,2,3]','h=[1,0.5]','y=Convolve(a,h)']);get('y').values.forEach((v,i)=>near(v.re,[1,2.5,4,1.5][i]));assert.equal(get('y').axisUnit,'n');assert.equal(get('y').spectrumUnit,'cycles/sample');
});
test('1kHz sampled at 1.5kHz equals 0.5kHz sequence; sample metadata is retained',()=>{
  const {get}=run(['x(t)=cos(2*pi*1000*t)','s=Sample(x,1500)','r=Reconstruct(s)'],{tMin:-.01,tMax:.01});const s=get('s');assert.equal(s.sampleRate,1500);s.values.forEach((v,i)=>near(v.re,Math.cos(2*Math.PI*500*s.x[i])));
});
test('sampled finite DTFT has periodic spectral replicas without fake continuous normalization',()=>{
  const {get}=run(['x(t)=cos(2*pi*1000*t)','s=Sample(x,1500)','S=Fourier(s)'],{tMin:-.01,tMax:.01,fMin:-3000,fMax:-3000+1500/256*1023});
  assert.equal(get('S').sampleRate,1500);const values=get('s').values,times=get('s').x;
  const dtft=f=>values.reduce((sum,v,k)=>sum+v.re*Math.cos(-2*Math.PI*f*times[k]),0);
  near(dtft(500),dtft(2000),1e-8);const spectrum=get('s').spectrum;near(spectrum.amplitudes[100].re,spectrum.amplitudes[356].re);near(spectrum.amplitudes[100].im,spectrum.amplitudes[356].im);near(get('S').values[100].re,spectrum.amplitudes[100].re);assert.ok(spectrum.frequencies[0]<=-3000);
});
test('raised cosine has correct removable singularity and Nyquist zeroes',()=>{
  near(sinc(0),1);near(raisedCosine(0,.1,.25),1);near(raisedCosine(.2,.1,.25),.25/2*Math.sin(Math.PI/(2*.25)));
  for(const alpha of [0,.25,.8,1])for(const k of [-3,-2,-1,1,2,3])near(raisedCosine(k*.1,.1,alpha),0,1e-8);
  const {get}=run(['a=[1,-1,1,1]','p(t)=rc(t,0.1,0.25)','x=Shape(a,p,0.1)','samples=Sample(x,10)']);get('samples').values.slice(0,4).forEach((v,i)=>near(v.re,[1,-1,1,1][i]));
});
test('matching rectangular pulse peaks at T with pulse energy',()=>{
  const {get}=run(['T=0.25','s(t)=rect((t-T/2)/T)','y=Matched(s,s,T)'],{tMin:-.5,tMax:1.5,points:2048});const y=get('y'),i=y.x.indexOf(.25);near(y.values[i].re,.25,.002);near(Math.max(...y.values.map(v=>v.re)),y.values[i].re,.002);
});
test('BPSK and Gray QPSK recover bits without noise; odd QPSK rejected',()=>{
  for(const op of ['BPSK','QPSK']){const {get}=run(['b=[0,1,1,0,0,1,0,1]',`s=${op}(b)`,'r=Detect(s)']);assert.equal(get('r').bitErrors,0);get('s').values.forEach(v=>near(v.re*v.re+v.im*v.im,1));}
  assert.ok(Object.keys(computeScene(scene(['b=[1,0,1]','s=QPSK(b)'])).errors).length);
});
test('fixed-seed AWGN repeats; higher Eb/N0 scales the same sample; variance calibration',()=>{
  const s=scene(['b=[0,1,1,0,0,1,0,1]','s=QPSK(b)','db=0','r=AWGN(s,db)']),a=computeScene(s),b=computeScene(s);assert.deepEqual(a.results[s.objects[3].id].values,b.results[s.objects[3].id].values);
  s.objects[2].definition='db=20';const higher=computeScene(s);near((a.results[s.objects[3].id].values[0].re-a.results[s.objects[1].id].values[0].re)/10,higher.results[s.objects[3].id].values[0].re-higher.results[s.objects[1].id].values[0].re);
  const z=normalSequence(801,40000),mean=z.reduce((a,b)=>a+b,0)/z.length,variance=z.reduce((a,b)=>a+(b-mean)**2,0)/z.length;near(mean,0,.025);near(variance,1,.04);
});
test('all 39 editable presets compute with identical engine and stay bounded',()=>{
  for(const spec of THEMES){assert.equal(spec.presets.length,3);for(let i=0;i<3;i++){const s=makeScene(spec.id,i),out=computeScene(s);assert.deepEqual(out.errors,{},`${spec.id}/${i}`);assert.ok(out.elapsed<8000);}}
});
test('rename updates references, round-trip records validate and unsafe import is rejected',()=>{
  const s=scene(['a=2','x(t)=a*cos(2*pi*t)','X=Fourier(x)']);renameInScene(s,s.objects[1].id,'input');assert.match(s.objects[2].definition,/Fourier\(input\)/);assert.deepEqual(computeScene(s).errors,{});validateScene(JSON.parse(JSON.stringify(s)));
  const bad=structuredClone(s);bad.objects[0].color='url(javascript:alert(1))';assert.throws(()=>validateScene(bad));
  assert.throws(()=>computeScene(scene(['x(t)=t'],{points:1000000})),/点数/);
});
