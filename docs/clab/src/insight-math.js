// Analytic teaching models, separate from the finite-record workbench engine.
export const TAU=2*Math.PI;
export const sinc=x=>Math.abs(x)<1e-10?1:Math.sin(Math.PI*x)/(Math.PI*x);
export const grid=(a,b,n=321)=>Array.from({length:n},(_,i)=>a+(b-a)*i/(n-1));
export const integrate=(fn,a,b,n=2048)=>{const h=(b-a)/n;let s=0;for(let i=0;i<n;i++)s+=fn(a+(i+.5)*h);return s*h;};
export function qfunc(x){
  if(x===0)return .5;
  const z=Math.abs(x),t=1/(1+.2316419*z);
  const tail=Math.exp(-z*z/2)/Math.sqrt(TAU)*t*(.319381530+t*(-.356563782+t*(1.781477937+t*(-1.821255978+t*1.330274429))));
  return x>=0?tail:1-tail;
}
export const gaussian=(x,mu,sigma)=>Math.exp(-.5*((x-mu)/sigma)**2)/(sigma*Math.sqrt(TAU));
export function decisionStats(C,sigma,prior=.5,threshold=0){
  if(!(sigma>0&&prior>0&&prior<1&&C>=0))throw new RangeError('判决参数超出范围');
  const errorPlus=qfunc((C-threshold)/sigma),errorMinus=qfunc((C+threshold)/sigma);
  const optimum=C>1e-12?sigma*sigma/(2*C)*Math.log((1-prior)/prior):null;
  return {errorPlus,errorMinus,error:prior*errorPlus+(1-prior)*errorMinus,optimum,
    bestError:C>1e-12?prior*qfunc((C-optimum)/sigma)+(1-prior)*qfunc((C+optimum)/sigma):Math.min(prior,1-prior)};
}
export function projectionStats(angle,energy=1,N0=.5,gain=1){
  const C=gain*Math.sqrt(energy)*Math.cos(angle),sigma=Math.abs(gain)*Math.sqrt(N0/2);
  return {C,sigma,snr:C*C/(sigma*sigma),optimalSnr:2*energy/N0};
}
export function finiteFourier(f0,f,T=1,phase=0,real=false){
  // Symmetric observation [-T/2,T/2]; divide the integral by T.
  const a=sinc((f0-f)*T),b=real?sinc((f0+f)*T):0,k=real?.5:1;
  return {re:k*(a+b)*Math.cos(phase),im:k*(a-b)*Math.sin(phase)};
}
export function pamModel(mean,variance,Ts,duty){
  const width=Ts*duty,shape=f=>width*width*sinc(f*width)**2;
  return {continuous:f=>variance/Ts*shape(f),lines:Array.from({length:9},(_,i)=>{const k=i-4;return {f:k/Ts,weight:mean*mean/(Ts*Ts)*shape(k/Ts)};}),
    randomPower:variance*duty,meanPower:mean*mean*duty,totalPower:(variance+mean*mean)*duty};
}
export function raisedCosine(t,Ts,alpha){
  const x=t/Ts;if(Math.abs(x)<1e-10)return 1;
  if(alpha===0)return sinc(x);
  if(Math.abs(Math.abs(2*alpha*x)-1)<1e-7)return Math.PI/4*sinc(1/(2*alpha));
  return sinc(x)*Math.cos(Math.PI*alpha*x)/(1-(2*alpha*x)**2);
}
export function basebandSample(symbols,k,offset=0,alpha=.35){
  const target=symbols[k]*raisedCosine(offset,1,alpha);
  const isi=symbols.reduce((s,a,n)=>s+(n===k?0:a*raisedCosine(k+offset-n,1,alpha)),0);
  return {target,isi,total:target+isi};
}
export function noiseModel({N0=1,B=1,gain=1,sidebands=2}){
  return {inputPower:sidebands*N0*B,outputDensity:sidebands*gain*gain*N0/8,outputPower:sidebands*gain*gain*N0*B/4};
}
export function phaseMoments(t,tau,halfwidth=Math.PI,frequency=1){
  const m=u=>Math.cos(TAU*frequency*u)*sinc(halfwidth/Math.PI);
  const correlation=.5*Math.cos(TAU*frequency*tau)+.5*Math.cos(TAU*frequency*(2*t+tau))*sinc(2*halfwidth/Math.PI);
  return {mean:m(t),correlation,covariance:correlation-m(t)*m(t+tau)};
}
export function correlationDemo(angle,dc=0){
  const a=grid(0,TAU,257).slice(0,-1).map(t=>Math.SQRT2*Math.cos(t));
  const b=grid(0,TAU,257).slice(0,-1).map(t=>Math.SQRT2*Math.cos(t-angle)+dc);
  const n=a.length,mean=v=>v.reduce((s,x)=>s+x,0)/n,ma=mean(a),mb=mean(b);
  const dot=a.reduce((s,x,i)=>s+x*b[i],0)/n,ea=mean(a.map(x=>x*x)),eb=mean(b.map(x=>x*x));
  const cov=dot-ma*mb,va=ea-ma*ma,vb=eb-mb*mb;
  return {a,b,raw:dot/Math.sqrt(ea*eb),centered:cov/Math.sqrt(va*vb),covariance:cov};
}
export const rectangleConvolution=(t,width=1)=>Math.max(0,Math.min(width,t)-Math.max(0,t-width));
