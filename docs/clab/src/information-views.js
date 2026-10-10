import {parseDefinition} from './math.js';
import {format} from './plots.js';

const node=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
function svgNode(tag,attrs={},text) {const e=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [key,value] of Object.entries(attrs))e.setAttribute(key,value);if(text!==undefined)e.textContent=text;return e;}
const display=v=>typeof v==='number'?format(v):String(v);
const titles={probability:'概率分布', 'binary-channel':'二元信道', 'bsc-capacity':'BSC 容量', 'awgn-capacity':'AWGN 容量',huffman:'哈夫曼树',hamming:'汉明码', 'hamming-decode':'伴随式译码','crc-encode':'CRC 编码','crc-check':'CRC 校验',convolutional:'卷积编码',viterbi:'Viterbi 格图',lfsr:'序列发生器',correlation:'周期相关'};

export class InformationViews {
  constructor(container,onFlip,onSelect) {this.container=container;this.onFlip=onFlip;this.onSelect=onSelect;this.cards=new Map();this.cardStates=new Map();this.observer=new ResizeObserver(()=>this.redrawCharts());this.observer.observe(container);}
  update(scene,output,selected,index=0) {
    this.scene=scene;this.output=output;this.selected=selected;this.index=index;
    this.container.hidden=!scene.views.information;
    if(this.container.hidden)return;
    const objects=scene.objects.filter(o=>o.visible&&output?.results[o.id]?.analysis);
    const dirty=[];
    for(const [id,card] of this.cards)if(!objects.some(o=>o.id===id)){card.remove();this.cards.delete(id);this.cardStates.delete(id);}
    for(const object of objects) {
      let card=this.cards.get(object.id);
      if(!card){card=node('article','information-card');card.dataset.informationObject=object.id;this.cards.set(object.id,card);this.container.append(card);}
      const result=output.results[object.id],data=result.analysis;
      const frozen=scene.frozen&&output.frozen?Object.values(output.frozen.results).find(r=>r.name===result.name)?.analysis:null;
      card.style.setProperty('--object-color',object.color);card.classList.toggle('selected',object.id===selected);
      const previous=this.cardStates.get(object.id);
      if(previous?.result===result&&previous.frozen===frozen){this.updateStage(card,data,object.id===selected?index:null);continue;}
      const openDetails=new Map([...card.querySelectorAll('details')].map(d=>[d.querySelector('summary').textContent,d.open]));
      const scrollPositions=[...card.querySelectorAll('.information-table-wrap,.structure-scroll,.bit-strip')].map(e=>({left:e.scrollLeft,top:e.scrollTop}));
      this.cardStates.set(object.id,{result,frozen});dirty.push(object.id);
      const heading=node('div','information-heading'),button=node('button','information-title',result.name+' · '+(titles[data.kind]??'序列'));button.addEventListener('click',()=>this.onSelect(object.id));heading.append(button);
      const items=[];if(data.metrics?.length){const metrics=node('div','information-metrics');for(const m of data.metrics){const block=node('div');block.append(node('span',null,m.label),node('strong',null,display(m.value)),node('span','metric-unit',m.unit));metrics.append(block);}items.push(metrics);}
      if(frozen?.metrics?.length){const comparison=node('details','information-details');comparison.append(node('summary',null,'冻结数值'));const text=node('div','frozen-metrics');frozen.metrics.forEach(m=>text.append(node('p',null,m.label+'：'+display(m.value)+(m.unit?' '+m.unit:''))));comparison.append(text);items.push(comparison);}
      if(data.chart){const plot=node('div','information-chart');plot.dataset.chartId=object.id;items.push(plot);}
      if(result.values&&data.kind!=='probability'&&data.kind!=='correlation') {
        const section=node('div','codeword-section');const labels=node('div','codeword-label',data.received?'接收码字':'输出序列');section.append(labels);
        const strip=node('div','bit-strip');const editable=this.isEditable(object);
        result.values.forEach((v,i)=>{const bit=node(editable?'button':'span','bit-cell'+(data.transmitted&&data.transmitted[i]!==v.re?' flipped':''),v.re);if(editable){bit.setAttribute('aria-label',`翻转 ${result.name} 第 ${i+1} 位`);bit.addEventListener('click',()=>this.onFlip(object.id,i));}else bit.title=`第 ${i+1} 位`;strip.append(bit);});section.append(strip);items.push(section);
      }
      if(data.tree) {const wrap=node('div','structure-scroll');wrap.append(this.tree(data.tree,data.steps[object.id===selected?index:0]));items.push(wrap);}
      if(data.kind==='viterbi') {const wrap=node('div','structure-scroll');wrap.append(this.trellis(data,object.id===selected?index:0));items.push(wrap);}
      if(data.kind==='lfsr'){const step=data.steps[object.id===selected?Math.min(index,data.steps.length-1):0],register=node('div','register-display');register.append(node('span',null,'寄存器'));step.before.split('').forEach(v=>register.append(node('strong',null,v)));register.append(node('span',null,'→ '+step.after+' · 输出 '+step.out));items.push(register);}
      if(data.table){const process=['lfsr','convolutional','viterbi'].includes(data.kind),table=data.received&&data.kind==='hamming'?{...data.table,headers:['消息','发送码字']}:data.table;items.push(this.table(table,process&&object.id===selected?index:null,process));}
      if(data.steps?.length&&['crc-encode','crc-check','huffman'].includes(data.kind)) {
        const steps=node('details','information-details');steps.append(node('summary',null,data.kind==='huffman'?'合并步骤':data.kind==='crc-check'?'校验步骤':'编码步骤'));
        const table=data.kind==='huffman'?{headers:['步','左概率','右概率','合并'],rows:data.steps.map((s,i)=>[i+1,s.a,s.b,s.sum])}:{headers:['位移','异或','当前余数记录'],rows:data.steps.map(s=>[s.offset,s.subtract?'是':'—',s.bits.join('')])};
        steps.append(this.table(table,object.id===selected?index:null,true));items.push(steps);
      }
      if(data.matrices){const details=node('details','information-details');details.append(node('summary',null,'G / H 矩阵与码字集合'));for(const [name,values]of Object.entries(data.matrices)){details.append(node('h3',null,name),node('pre','code-matrix',values.map(row=>row.join(' ')).join('\n')));}details.append(this.table({headers:['消息','码字'],rows:data.codebook}));items.push(details);}
      card.replaceChildren(heading,...items);
      card.querySelectorAll('details').forEach(d=>{d.open=openDetails.get(d.querySelector('summary').textContent)??false;});
      card.querySelectorAll('.information-table-wrap,.structure-scroll,.bit-strip').forEach((e,i)=>{if(scrollPositions[i]){e.scrollLeft=scrollPositions[i].left;e.scrollTop=scrollPositions[i].top;}});
    }
    if(!objects.length){let empty=this.container.querySelector('.information-empty');if(!empty){empty=node('p','information-empty','暂无结果');this.container.append(empty);}}else this.container.querySelector('.information-empty')?.remove();
    this.redrawCharts(dirty);
  }
  isEditable(object){try{const ast=parseDefinition(object.definition).ast;if(ast.kind!=='call'||ast.name!=='Xor'||ast.args[1].kind!=='id'||!this.output.results[object.id]?.analysis?.received)return false;const mask=this.scene.objects.map(o=>parseDefinition(o.definition)).find(d=>d.name===ast.args[1].name);return mask?.ast.kind==='array'&&mask.ast.items.every(n=>n.kind==='number'&&[0,1].includes(n.value));}catch{return false;}}
  table(data,index=null,process=false) {const wrap=node('div','information-table-wrap'),table=node('table','information-table');if(process)table.dataset.process='true';const head=node('thead'),tr=node('tr');data.headers.forEach(h=>tr.append(node('th',null,h)));head.append(tr);const body=node('tbody');data.rows.forEach((row,i)=>{const tr=node('tr',i===index?'current-step':'');row.forEach(value=>tr.append(node('td',null,display(value))));body.append(tr);});table.append(head,body);wrap.append(table);return wrap;}
  updateStage(card,data,index){
    const stage=String(index),changed=card.dataset.stageIndex!==stage;card.dataset.stageIndex=stage;
    card.querySelectorAll('table[data-process] tbody').forEach(body=>[...body.children].forEach((row,i)=>row.classList.toggle('current-step',i===index)));
    if(data.tree){const step=data.steps[index??0];card.querySelectorAll('[data-tree-id]').forEach(e=>e.classList.toggle('highlighted',!!step&&[step.left,step.right,step.parent].includes(Number(e.dataset.treeId))));}
    if(data.kind==='viterbi')card.querySelector('.trellis-column').setAttribute('x',40+((index??0)+1)*74-18);
    if(data.kind==='lfsr'){const step=data.steps[index??0],register=card.querySelector('.register-display');register.querySelectorAll('strong').forEach((e,i)=>e.textContent=step.before[i]);register.lastElementChild.textContent='→ '+step.after+' · 输出 '+step.out;}
    if(!changed||index===null)return;
    const behavior=matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth';
    for(const row of card.querySelectorAll('.current-step')){const wrap=row.closest('.information-table-wrap');if(!wrap.clientHeight)continue;const visible=wrap.getBoundingClientRect(),current=row.getBoundingClientRect(),header=wrap.querySelector('thead').getBoundingClientRect().height;if(current.top<visible.top+header)wrap.scrollTo({top:wrap.scrollTop+current.top-visible.top-header,behavior});else if(current.bottom>visible.bottom)wrap.scrollTo({top:wrap.scrollTop+current.bottom-visible.bottom+1,behavior});}
    if(data.kind==='viterbi'){const wrap=card.querySelector('.structure-scroll'),position=40+(index+1)*74;if(wrap.clientWidth)wrap.scrollTo({left:Math.max(0,Math.min(wrap.scrollWidth-wrap.clientWidth,position-wrap.clientWidth/2)),behavior});}
  }
  redrawCharts(ids=null) {
    if(this.container.hidden||!this.output)return;
    for(const [id,card]of this.cards){if(ids&&!ids.includes(id))continue;const host=card.querySelector('.information-chart'),result=this.output.results[id];if(!host||!result)continue;const chart=result.analysis.chart;const frozen=this.scene.frozen&&this.output.frozen?Object.values(this.output.frozen.results).find(r=>r.name===result.name)?.analysis?.chart:null;host.replaceChildren(this.chart(chart,frozen,result.analysis.marker,card.clientWidth));}
  }
  chart(chart,frozen,marker,width) {
    const W=Math.max(270,(width||620)-32),H=230,l=58,r=W-16,top=16,bottom=192;
    const curves=[chart];if(frozen&&frozen.xLabel===chart.xLabel&&frozen.yLabel===chart.yLabel)curves.push(frozen);
    let xmin=Math.min(...curves.flatMap(c=>c.x)),xmax=Math.max(...curves.flatMap(c=>c.x)),ymin=Math.min(0,...curves.flatMap(c=>c.y)),ymax=Math.max(.01,...curves.flatMap(c=>c.y));
    if(chart.bars){xmin-=.5;xmax+=.5;}if(xmin===xmax){xmin-=.5;xmax+=.5;}ymax+=Math.max(.05,(ymax-ymin)*.1);
    const px=x=>l+(x-xmin)/(xmax-xmin)*(r-l),py=y=>bottom-(y-ymin)/(ymax-ymin)*(bottom-top),svg=svgNode('svg',{viewBox:`0 0 ${W} ${H}`,role:'img','aria-label':chart.xLabel+' / '+chart.yLabel});
    for(let k=0;k<=4;k++){const x=xmin+(xmax-xmin)*k/4,y=ymin+(ymax-ymin)*k/4;svg.append(svgNode('path',{d:`M${l} ${py(y)}H${r}`,'class':'chart-grid'}),svgNode('text',{x:l-7,y:py(y)+4,'text-anchor':'end','class':'chart-tick'},format(y,3)),svgNode('text',{x:px(x),y:bottom+17,'text-anchor':'middle','class':'chart-tick'},chart.bars?'':format(x,3)));}
    svg.append(svgNode('text',{x:l,y:11,'class':'chart-label'},chart.yLabel),svgNode('text',{x:r,y:H-5,'text-anchor':'end','class':'chart-label'},chart.xLabel));
    curves.forEach((curve,i)=>{if(curve.bars){curve.x.forEach((x,k)=>{const barW=Math.max(3,Math.min(38,(r-l)/(curve.x.length*1.8))),y=curve.y[k];svg.append(svgNode('rect',{x:px(x)-barW/2,y:Math.min(py(y),py(0)),width:barW,height:Math.max(1,Math.abs(py(0)-py(y))),'class':i?'chart-bar frozen':'chart-bar'}),svgNode('text',{x:px(x),y:bottom+17,'text-anchor':'middle','class':'chart-tick'},x));});}else svg.append(svgNode('path',{d:curve.x.map((x,k)=>(k?'L':'M')+px(x)+' '+py(curve.y[k])).join(''),'class':i?'chart-line frozen':'chart-line'}));});
    if(marker)svg.append(svgNode('circle',{cx:px(marker.x),cy:py(marker.y),r:5,'class':'chart-marker'}));return svg;
  }
  tree(tree,step) {
    const nodes=new Map(tree.nodes.map(n=>[n.id,n])),positions=new Map();let leaves=0,maxDepth=0;
    function place(id,depth){const n=nodes.get(id);maxDepth=Math.max(maxDepth,depth);const x=n.symbol!==undefined?(leaves++*72+40):(place(n.left,depth+1)+place(n.right,depth+1))/2;positions.set(id,{x,y:depth*66+24});return x;}
    place(tree.root,0);const W=Math.max(290,leaves*72+8),H=maxDepth*66+54,svg=svgNode('svg',{viewBox:`0 0 ${W} ${H}`,width:W,height:H,role:'img','aria-label':'哈夫曼编码树'});
    for(const n of tree.nodes){const p=positions.get(n.id);if(n.symbol===undefined)for(const [branch,id]of [[0,n.left],[1,n.right]]){const q=positions.get(id);svg.append(svgNode('line',{x1:p.x,y1:p.y+10,x2:q.x,y2:q.y-12,'class':'tree-edge'}),svgNode('text',{x:(p.x+q.x)/2+4,y:(p.y+q.y)/2,'class':'chart-tick'},branch));}}
    for(const n of tree.nodes){const p=positions.get(n.id);svg.append(svgNode('rect',{x:p.x-29,y:p.y-13,width:58,height:28,rx:8,'data-tree-id':n.id,'class':step&&[step.left,step.right,step.parent].includes(n.id)?'tree-node highlighted':'tree-node'}),svgNode('text',{x:p.x,y:p.y+5,'text-anchor':'middle','class':'tree-label'},(n.symbol!==undefined?'s'+(n.symbol+1)+' ':'')+format(n.weight,2)));}return svg;
  }
  trellis(data,index) {
    const dx=74,W=(data.steps.length+1)*dx+40,H=232,svg=svgNode('svg',{viewBox:`0 0 ${W} ${H}`,width:W,height:H,role:'img','aria-label':'Viterbi 幸存路径与路径度量格图'}),x=t=>40+t*dx,y=s=>24+s*54;
    svg.append(svgNode('rect',{x:x(index+1)-18,y:7,width:36,height:196,'class':'trellis-column'}));
    data.steps.forEach((step,t)=>{step.survivors.forEach((edge,to)=>{if(edge)svg.append(svgNode('line',{x1:x(t),y1:y(edge.from),x2:x(t+1),y2:y(to),'class':'trellis-edge'}));});});
    data.path.forEach(edge=>svg.append(svgNode('line',{x1:x(edge.time),y1:y(edge.from),x2:x(edge.time+1),y2:y(edge.to),'class':'trellis-path'})));
    for(let t=0;t<=data.steps.length;t++){for(let s=0;s<4;s++){const metric=t?data.steps[t-1].metrics[s]:s?Infinity:0;svg.append(svgNode('circle',{cx:x(t),cy:y(s),r:13,'class':'tree-node'}),svgNode('text',{x:x(t),y:y(s)+4,'text-anchor':'middle','class':'tree-label'},Number.isFinite(metric)?metric:'∞'));}svg.append(svgNode('text',{x:x(t),y:H-14,'text-anchor':'middle','class':'chart-label'},t?data.steps[t-1].received:'初态'));}
    for(let s=0;s<4;s++)svg.append(svgNode('text',{x:3,y:y(s)+4,'class':'chart-tick'},s.toString(2).padStart(2,'0')));return svg;
  }
}
