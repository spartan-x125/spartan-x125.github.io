import test from 'node:test';
import assert from 'node:assert/strict';
import {TAU,integrate,qfunc,decisionStats,projectionStats,finiteFourier,pamModel,raisedCosine,basebandSample,noiseModel,phaseMoments,correlationDemo,rectangleConvolution} from '../src/insight-math.js';
import {chapters} from '../src/insight-content.js';
const close=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);

test('Gaussian tail agrees with known values and symmetry',()=>{
  close(qfunc(0),.5);close(qfunc(1),.158655253931457,1e-7);close(qfunc(3),.00134989803163,1e-7);
  close(qfunc(-2)+qfunc(2),1);close(qfunc(Infinity),0);close(qfunc(-Infinity),1);
});
test('finite Fourier analytic result agrees with independent midpoint integration',()=>{
  for(const real of [false,true]){
    const f0=2.7,f=1.8,T=1.35,phase=.7,z=finiteFourier(f0,f,T,phase,real);
    const re=integrate(t=>{const a=TAU*f0*t+phase,b=TAU*f*t;return real?Math.cos(a)*Math.cos(b):Math.cos(a-b);},-T/2,T/2,20000)/T;
    const im=integrate(t=>{const a=TAU*f0*t+phase,b=TAU*f*t;return real?-Math.cos(a)*Math.sin(b):Math.sin(a-b);},-T/2,T/2,20000)/T;
    close(z.re,re,2e-8);close(z.im,im,2e-8);
  }
  close(finiteFourier(3,3,1,0).re,1);close(finiteFourier(3,2,1,0).re,0);
  close(finiteFourier(3,3,1,0,true).re,.5);close(finiteFourier(3,-3,1,0,true).re,.5);
});
test('DC changes normalized energy correlation but not centered correlation',()=>{
  const d=correlationDemo(.65,1.4);close(d.raw,Math.cos(.65)/Math.sqrt(1+1.4**2));close(d.centered,Math.cos(.65));
});
test('changing template gain preserves SNR; rotating it reduces SNR',()=>{
  const a=projectionStats(.4,2,.3,1),b=projectionStats(.4,2,.3,2);
  close(b.C,2*a.C);close(b.sigma,2*a.sigma);close(b.snr,a.snr);
  close(projectionStats(0,2,.3).snr,4/.3);assert.ok(projectionStats(Math.PI/2).snr<1e-25);
});
test('MAP threshold direction, weighted tails and zero-separation limits',()=>{
  const zero=decisionStats(1,.8,.8,0),optimal=decisionStats(1,.8,.8,zero.optimum);
  assert.ok(zero.optimum<0);assert.ok(optimal.error<zero.error);
  close(optimal.error,.8*optimal.errorPlus+.2*optimal.errorMinus);
  close(decisionStats(0,1,.8,0).error,.5);close(decisionStats(0,1,.8,-Infinity).error,.2);
  close(decisionStats(0,1,.8,0).bestError,.2);
});
test('PAM PSD and infinite line-weight sum reproduce rectangle average power',()=>{
  const mean=.7,variance=.8,Ts=1.3,duty=.6,m=pamModel(mean,variance,Ts,duty);
  const continuousPower=integrate(m.continuous,-300,300,120000);
  close(continuousPower,variance*duty,.001);
  const linePower=Array.from({length:4001},(_,i)=>i-2000).reduce((p,k)=>{const x=k*duty,sinc=Math.abs(x)<1e-12?1:Math.sin(Math.PI*x)/(Math.PI*x);return p+mean*mean*duty*duty*sinc*sinc;},0);
  close(linePower,mean*mean*duty,.0001);close(m.totalPower,(variance+mean*mean)*duty);
  const full=pamModel(mean,variance,Ts,1);close(full.lines[4].weight,mean*mean);
  for(const [i,l] of full.lines.entries())if(i!==4)assert.ok(l.weight<1e-25);
});
test('RC singular limits and integer-grid Nyquist zeros',()=>{
  for(const alpha of [0,.25,.5,1]){
    close(raisedCosine(0,1,alpha),1);
    for(let k=-5;k<=5;k++)if(k)close(raisedCosine(k,1,alpha),0);
  }
  close(raisedCosine(.5,1,1),.5);close(raisedCosine(-.5,1,1),.5);
  close(raisedCosine(.5+1e-6,1,1),.5,3e-6);
});
test('overlapping RC pulses have zero ISI on-grid and nonzero ISI off-grid',()=>{
  const symbols=[1,-1,1,1,-1,1,-1,-1,1];
  for(let k=0;k<symbols.length;k++){const d=basebandSample(symbols,k,0,.35);close(d.total,symbols[k]);close(d.isi,0);}
  assert.ok(Math.abs(basebandSample(symbols,4,.3,.35).isi)>.01);
});
test('noise PSD areas track sideband selection and squared mixer gain',()=>{
  const dsb=noiseModel({N0:1,B:3,gain:2,sidebands:2}),ssb=noiseModel({N0:1,B:3,gain:2,sidebands:1});
  close(dsb.outputPower,6);close(ssb.outputPower,3);close(dsb.outputDensity*6,dsb.outputPower);
  close(dsb.outputPower,4*noiseModel({N0:1,B:3,gain:1,sidebands:2}).outputPower);
});
test('random-phase moment formula agrees with phase-domain integration',()=>{
  const t=.37,tau=.29,width=1.1,d=phaseMoments(t,tau,width);
  close(d.mean,integrate(p=>Math.cos(TAU*t+p),-width,width,20000)/(2*width),1e-8);
  close(d.correlation,integrate(p=>Math.cos(TAU*t+p)*Math.cos(TAU*(t+tau)+p),-width,width,20000)/(2*width),1e-8);
  close(phaseMoments(t,tau,Math.PI).mean,0);close(phaseMoments(t,tau,Math.PI).correlation,.5*Math.cos(TAU*tau));
  // Half-circle phase can hide t in the correlation while leaving a nonconstant mean.
  close(phaseMoments(0,tau,Math.PI/2).correlation,phaseMoments(.2,tau,Math.PI/2).correlation);
  assert.ok(Math.abs(phaseMoments(0,tau,Math.PI/2).mean-phaseMoments(.2,tau,Math.PI/2).mean)>.1);
});
test('two rectangular lowpass envelopes convolve to a triangle; h_eq halves h_L',()=>{
  close(rectangleConvolution(-1),0);close(rectangleConvolution(.5),.5);close(rectangleConvolution(1),1);close(rectangleConvolution(1.5),.5);close(rectangleConvolution(2),0);
  const a=1,b=2,T=1;close(.5*a*b*rectangleConvolution(T,T),1);
});
test('document chapter and source relationships are complete and unique',()=>{
  assert.equal(chapters.length,14);assert.equal(new Set(chapters.map(c=>c.id)).size,14);
  const used=new Set(chapters.flatMap(c=>c.sources));for(let i=1;i<=27;i++)assert.ok(used.has('S'+String(i).padStart(2,'0')));
  for(const c of chapters){assert.ok(c.evidence.length>20);assert.ok(c.sections.length>=4);}
});
