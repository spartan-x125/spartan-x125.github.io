import test from 'node:test';
import assert from 'node:assert/strict';
import {computeScene} from '../src/engine.js';
import {blank,object,makeScene,THEMES,validateScene} from '../src/scenes.js';
import {informationOperation,HAMMING_G,HAMMING_H} from '../src/information.js';
import {c} from '../src/math.js';
const sequence=values=>({type:'sequence',values:values.map(v=>c(v))});
const near=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);
const values=obj=>obj.values.map(v=>v.re);
function run(definitions) {const scene=blank('W3');scene.objects=definitions.map((d,i)=>object(d,i));const output=computeScene(scene);assert.deepEqual(output.errors,{});return {scene,output,get:name=>Object.values(output.results).find(r=>r.name===name)};}

test('entropy and binary mutual information handle deterministic and independent extremes',()=>{
  const out=run(['p=Probabilities([0.5,0.5])','H=Entropy(p)','deterministic=Entropy([1,0])','perfect=BinaryChannel(0.5,0,0)','independent=BinaryChannel(0.5,0.5,0.5)','constant=BinaryChannel(0,0.1,0.1)']);
  near(out.get('H').value.re,1);near(out.get('deterministic').value.re,0);
  near(out.get('perfect').analysis.metrics[3].value,1);near(out.get('independent').analysis.metrics[3].value,0);near(out.get('constant').analysis.metrics[3].value,0);
  const table=out.get('perfect').analysis.table.rows;near(table[0][1],.5);near(table[1][2],.5);
  assert.equal(out.get('perfect').spectrum,undefined);
});

test('capacity separates fixed total power from fixed received SNR and BSC endpoints',()=>{
  const op=(name,args)=>informationOperation(name,args.map(v=>c(v)));
  const power=op('Capacity',[3000,1,.0001]),snr=op('CapacitySNR',[3000,10]);
  near(power.analysis.metrics[0].value,3000*Math.log2(1+1/.3));near(snr.analysis.metrics[0].value,3000*Math.log2(11));
  const wide=op('Capacity',[1e12,1,.0001]).analysis.metrics[0].value;near(wide,1/(.0001*Math.LN2),.001);
  near(op('BinaryCapacity',[0]).analysis.metrics[0].value,1);near(op('BinaryCapacity',[.5]).analysis.metrics[0].value,0);near(op('BinaryCapacity',[1]).analysis.metrics[0].value,1);
  assert.throws(()=>op('Capacity',[3000,1,0]),/N0/);
});

test('Huffman codes are prefix-free and achieve the entropy bound, with deterministic ties',()=>{
  for(const probabilities of [[.5,.25,.125,.125],[.25,.25,.25,.25],[.7,.1,.1,.1],[1,0,0,0]]) {
    const result=informationOperation('Huffman',[sequence(probabilities)]),rows=result.analysis.table.rows,codes=rows.filter((_,i)=>probabilities[i]>0).map(r=>r[2]),H=result.analysis.metrics[0].value,L=result.analysis.metrics[1].value;
    for(let i=0;i<codes.length;i++)for(let j=0;j<codes.length;j++)if(i!==j)assert.equal(codes[j].startsWith(codes[i]),false);
    assert.ok(L>=H-1e-10);if(codes.length>1)assert.ok(L<H+1);else assert.equal(L,1);
    assert.deepEqual(result,informationOperation('Huffman',[sequence(probabilities)]));
    if(probabilities[0]===.5)near(L,1.75);
  }
});

test('all Hamming messages correct every single error; matrix contracts and double-error boundary hold',()=>{
  for(const row of HAMMING_G)for(const parity of HAMMING_H)assert.equal(row.reduce((s,v,i)=>s^(v&parity[i]),0),0);
  const codebook=[];
  for(let m=0;m<16;m++){const payload=Array.from({length:4},(_,j)=>(m>>(3-j))&1),coded=informationOperation('Hamming',[sequence(payload)]);codebook.push(values(coded));
    for(let position=-1;position<7;position++){const received=values(coded);if(position>=0)received[position]^=1;const decoded=informationOperation('HammingDecode',[sequence(received)]);assert.deepEqual(values(decoded),payload);assert.equal(decoded.analysis.table.rows[0][2],position>=0?position+1:'—');}
  }
  let minimum=7;for(let i=0;i<16;i++)for(let j=i+1;j<16;j++)minimum=Math.min(minimum,codebook[i].filter((v,k)=>v!==codebook[j][k]).length);assert.equal(minimum,3);
  const out=computeScene(makeScene('G01',2)),decoded=Object.values(out.results).find(r=>r.name==='decoded');assert.notDeepEqual(values(decoded),[1,0,1,1]);
});

test('CRC matches hand division, detects each one-bit error and exposes a polynomial-multiple miss',()=>{
  const g=sequence([1,1,0,1]),coded=informationOperation('CRCEncode',[sequence([1,0,1,1]),g]);assert.deepEqual(values(coded),[1,0,1,1,1,0,0]);
  const check=v=>informationOperation('CRCCheck',[sequence(v),g]).analysis.metrics;
  assert.equal(check(values(coded))[0].value,'000');assert.equal(check(values(coded))[1].value,'未检出错误');
  for(let i=0;i<7;i++){const v=values(coded);v[i]^=1;assert.equal(check(v)[1].value,'检出错误');}
  const missed=values(coded).map((v,i)=>v^[1,1,0,1,0,0,0][i]);assert.notDeepEqual(missed,values(coded));assert.equal(check(missed)[1].value,'未检出错误');
});

test('terminated convolutional output matches a hand example and Viterbi agrees with exhaustive path search',()=>{
  const encode=payload=>values(informationOperation('Convolutional',[sequence(payload)]));
  assert.deepEqual(encode([1,0,1]),[1,1,1,0,0,0,1,0,1,1]);
  const candidates=Array.from({length:16},(_,i)=>{const payload=Array.from({length:4},(_,j)=>(i>>(3-j))&1);return {payload,coded:encode(payload)};});
  for(const candidate of candidates){assert.deepEqual(values(informationOperation('Viterbi',[sequence(candidate.coded)])),candidate.payload);
    for(let error=0;error<candidate.coded.length;error++){const received=[...candidate.coded];received[error]^=1;const decoded=informationOperation('Viterbi',[sequence(received)]),distance=code=>code.filter((v,k)=>v!==received[k]).length,best=Math.min(...candidates.map(c=>distance(c.coded)));assert.equal(decoded.analysis.metrics[0].value,best);assert.equal(distance(encode(values(decoded))),best);}
  }
});

test('verified LFSR has seven distinct nonzero states, periodic correlation and reversible scrambling',()=>{
  const pn=informationOperation('LFSR',[sequence([1,0,0]),c(14)]);assert.deepEqual(values(pn).slice(0,7),[0,0,1,0,1,1,1]);assert.deepEqual(values(pn).slice(0,7),values(pn).slice(7));assert.equal(new Set(pn.analysis.steps.slice(0,7).map(s=>s.before)).size,7);
  const correlation=informationOperation('PeriodicCorrelation',[sequence(values(pn).slice(0,7))]);near(correlation.values[0].re,1);values(correlation).slice(1).forEach(v=>near(v,-1/7));
  const payload=sequence(Array.from({length:14},(_,i)=>i%2)),scrambled=informationOperation('Xor',[payload,pn]);assert.deepEqual(values(informationOperation('Xor',[scrambled,pn])),values(payload));
  assert.throws(()=>informationOperation('LFSR',[sequence([0,0,0]),c(7)]),/非零/);
});

test('W3 rejects malformed distributions, messages and polynomials and round-trips all 21 presets',()=>{
  for(const def of ['bad=Probabilities([0.7,0.7])','bad=Probabilities([-1,2])','bad=Hamming([1,0,1])','bad=HammingDecode([1,0,1])','bad=CRCEncode([1,0,1],[0,1,1])','bad=Xor([1],[1,0])','bad=Viterbi([1,0,1])']) {const scene=blank('W3');scene.objects=[object(def)];assert.ok(Object.keys(computeScene(scene).errors).length,def);}
  for(const theme of THEMES.filter(t=>t.workbench==='W3'))for(let i=0;i<3;i++){const scene=makeScene(theme.id,i),copy=validateScene(JSON.parse(JSON.stringify(scene)));assert.deepEqual(computeScene(copy).errors,{});assert.equal(copy.workbench,'W3');assert.ok(Object.values(computeScene(copy).results).some(r=>r.analysis));}
});
