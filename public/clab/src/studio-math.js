import {TAU,finiteFourier,sinc} from './insight-math.js';

export function components(s){
  const phi=s.phase*Math.PI/180;
  if(s.kind==='complex')return [{f:s.frequency,re:s.amplitude*Math.cos(phi),im:s.amplitude*Math.sin(phi)}];
  const tones=[{f:s.frequency,a:s.amplitude,p:phi}];
  if(s.kind==='two')tones.push({f:s.frequency*1.7,a:s.amplitude*.5,p:-phi/2});
  return tones.flatMap(t=>[1,-1].map(sign=>({f:sign*t.f,re:t.a/2*Math.cos(t.p),im:sign*t.a/2*Math.sin(t.p)})));
}
export function signalAt(s,t){return components(s).reduce((z,c)=>{const a=TAU*c.f*t;return {re:z.re+c.re*Math.cos(a)-c.im*Math.sin(a),im:z.im+c.re*Math.sin(a)+c.im*Math.cos(a)};},{re:0,im:0});}
export function spectrumAt(s,f){return components(s).reduce((z,c)=>{const a=sinc((c.f-f)*s.duration);return {re:z.re+c.re*a,im:z.im+c.im*a};},{re:0,im:0});}
export const spectralPower=s=>components(s).map(c=>({f:c.f,weight:c.re*c.re+c.im*c.im}));
export const meanPower=s=>spectralPower(s).reduce((a,c)=>a+c.weight,0);
export function windowPower(s){const cs=components(s);let sum=0;for(const a of cs)for(const b of cs)sum+=(a.re*b.re+a.im*b.im)*sinc((a.f-b.f)*s.duration);return sum;}
export function periodogramAt(s,f){const z=spectrumAt(s,f);return s.duration*(z.re*z.re+z.im*z.im);}
export function orbitProject([x,y,z],yaw,pitch,scale=1){
  const a=yaw*Math.PI/180,b=pitch*Math.PI/180,u=x*Math.cos(a)-y*Math.sin(a),v=x*Math.sin(a)+y*Math.cos(a);
  return [scale*u,scale*(v*Math.sin(b)-z*Math.cos(b)),v*Math.cos(b)+z*Math.sin(b)];
}
export function aliasFrequency(f,fs){return Math.abs(((f+fs/2)%fs+fs)%fs-fs/2);}
export const quantize=(x,bits)=>{const L=2**bits,step=2/L;return -1+(Math.max(0,Math.min(L-1,Math.floor((x+1)/step)))+.5)*step;};
export const binaryEntropy=p=>p<=0||p>=1?0:-p*Math.log2(p)-(1-p)*Math.log2(1-p);
export const awgnCapacity=(B,P,N0)=>B===0?0:B*Math.log1p(P/(N0*B))/Math.LN2;
