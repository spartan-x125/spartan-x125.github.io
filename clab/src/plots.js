export const format=(n,digits=4)=>{
  if(n===undefined||!Number.isFinite(n))return '—';
  if(Math.abs(n)<1e-11)return '0';
  if(Math.abs(n)>=1e5||Math.abs(n)<.0001)return n.toExponential(2);
  return Number(n.toPrecision(digits)).toString();
};
export const magnitude=v=>Math.hypot(v.re,v.im);
export const phase=v=>{const value=Math.atan2(v.im,v.re);return value<=-Math.PI?Math.PI:value;};
export const component=(v,representation)=>({re:v.re,im:v.im,abs:magnitude(v),arg:phase(v)})[representation]??v.re;
export const complexText=v=>Math.abs(v.im)<1e-9?format(v.re):`${format(v.re)} ${v.im<0?'−':'+'} j${format(Math.abs(v.im))}`;
const labels={re:'实部',im:'虚部',abs:'模',arg:'相位 / rad'};
const names={time:'时域与序列',spectrum:'双边幅度谱',response:'系统频率响应',constellation:'星座与复平面',eye:'眼图'};
export class PlotManager {
  constructor(container,onSelect,onLayout=()=>{}){this.container=container;this.onSelect=onSelect;this.onLayout=onLayout;this.ranges={};this.axes={time:'s',spectrum:'Hz'};this.cursors={};this.cards=new Map();this.activeIndex=0;this.selected=null;this.observer=new ResizeObserver(()=>this.drawAll());this.observer.observe(container);}
  update(scene,output,selected,index=0){this.scene=scene;this.output=output;this.selected=selected;this.activeIndex=index;this.axes={time:'s',spectrum:'Hz',...scene.views.axes};this.ranges=structuredClone(scene.views.plotRanges??{});this.syncCards();this.drawAll();}
  saveLayout(){this.onLayout({axes:{...this.axes},plotRanges:structuredClone(this.ranges)});}
  syncCards(){
    for(const view of Object.keys(names)){
      if(!this.scene.views[view]){this.cards.get(view)?.card.remove();this.cards.delete(view);continue;}
      if(this.cards.has(view))continue;
      const card=document.createElement('article');card.className=`plot-card ${view}`;card.dataset.plot=view;
      const header=document.createElement('div');header.className='plot-card-header';
      const title=document.createElement('div');title.className='plot-name';title.textContent=names[view];
      const actions=document.createElement('div');actions.className='plot-actions';
      if(view==='time'||view==='spectrum'){
        const select=document.createElement('select');select.setAttribute('aria-label',`${names[view]}坐标单位`);
        const units=view==='time'?['s','n']:['Hz','sampledHz','cycles/sample'];
        units.forEach(unit=>{const option=document.createElement('option');option.value=unit;option.textContent=unit==='sampledHz'?'采样 Hz':unit;select.append(option);});select.value=this.axes[view];
        select.addEventListener('change',()=>{this.axes[view]=select.value;delete this.ranges[view];this.draw(view);this.saveLayout();});actions.append(select);
      }
      for(const [text,titleText,callback]of[['−','缩小视图',()=>this.zoom(view,1.6)],['＋','放大视图',()=>this.zoom(view,.65)],['↺','恢复视图',()=>{delete this.ranges[view];this.draw(view);this.saveLayout();}],['↓','导出图像',()=>this.export(view)]]){
        const b=document.createElement('button');b.textContent=text;b.title=titleText;b.setAttribute('aria-label',titleText);b.addEventListener('click',callback);actions.append(b);
      }
      header.append(title,actions);const canvas=document.createElement('canvas');canvas.setAttribute('role','img');canvas.setAttribute('aria-label',`${names[view]}，使用下方图例识别对象，可点击读取数值。`);
      const legend=document.createElement('div');legend.className='plot-legend';const caption=document.createElement('p');caption.className='plot-caption';caption.hidden=true;card.append(header,canvas,legend,caption);this.container.append(card);this.cards.set(view,{card,canvas,legend,caption});
      let pointer=null,moved=false;
      canvas.addEventListener('pointerdown',e=>{pointer={x:e.offsetX,range:this.currentRanges?.[view]};moved=false;if(e.pointerType==='mouse')canvas.setPointerCapture(e.pointerId);});
      canvas.addEventListener('pointermove',e=>{
        if(pointer&&e.pointerType==='mouse'&&Math.abs(e.offsetX-pointer.x)>5&&pointer.range){moved=true;const dx=(e.offsetX-pointer.x)/(canvas.clientWidth-65)*(pointer.range.xmax-pointer.range.xmin);this.ranges[view]={...pointer.range,xmin:pointer.range.xmin-dx,xmax:pointer.range.xmax-dx};this.draw(view);}
      });
      canvas.addEventListener('pointerup',e=>{if(!moved)this.pick(view,e.offsetX,e.offsetY);else this.saveLayout();pointer=null;});
      canvas.addEventListener('pointercancel',()=>{pointer=null;});
      canvas.addEventListener('wheel',e=>{if(e.ctrlKey){e.preventDefault();this.zoom(view,e.deltaY>0?1.25:.8);}}, {passive:false});
    }
    if(!this.cards.size){const empty=document.createElement('div');empty.className='plot-empty';empty.textContent='在上方选择一个视图，开始观察。';this.container.replaceChildren(empty);}else this.container.querySelector('.plot-empty')?.remove();
  }
  collect(view,scene=this.scene,output=this.output,dashed=false){
    const curves=[],hidden=scene.views.hiddenObjects?.[view]??[];let skipped=0;
    for(const obj of scene.objects){
      const result=output?.results?.[obj.id];if(!obj.visible||hidden.includes(obj.id)||!result||['scalar','information'].includes(result.type))continue;
      const base={id:obj.id,name:result.name+(dashed?' · 冻结':''),color:obj.color,dashed,result,representation:obj.representation??'re'};
      if(view==='time'){
        const unit=result.domain==='t'?'s':result.axisUnit??'n';if(unit!==this.axes.time){if(result.domain!=='f')skipped++;continue;}
        if(result.type==='impulse')curves.push({...base,x:result.impulses.map(v=>v.delay),y:result.impulses.map(v=>component(v.weight,base.representation)),stems:true,impulse:true});
        else if(result.domain!=='f')curves.push({...base,x:result.x,y:result.values.map(v=>component(v,base.representation)),stems:result.type==='sequence'});
      }else if(view==='spectrum'){
        const spectrum=result.domain==='f'&&result.frequencyKind==='spectrum'?{frequencies:result.x,amplitudes:result.values}:result.spectrum;
        if(!spectrum)continue;const unit=result.sampleRate?'sampledHz':result.spectrumUnit??result.axisUnit??'Hz';if(unit!==this.axes.spectrum){skipped++;continue;}
        curves.push({...base,x:spectrum.frequencies,y:spectrum.amplitudes.map(magnitude)});
      }else if(view==='response'){
        if(result.domain==='f'&&result.frequencyKind==='response')curves.push({...base,x:result.x,y:result.values.map(magnitude)});
      }else if(view==='constellation'){
        if(result.modulation||(result.domain==='t'&&result.values?.some(v=>Math.abs(v.im)>1e-8)))curves.push({...base,x:result.values.map(v=>v.re),y:result.values.map(v=>v.im),scatter:result.type==='sequence',trajectory:result.domain==='t'});
      }else if(view==='eye'&&result.domain==='t'&&result.symbolPeriod){
        const Ts=result.symbolPeriod,x=result.x;const count=Math.floor((x.at(-1)-x[0])/Ts)-1;
        for(let k=0;k<count&&k<100;k++){const origin=Math.max(0,Math.ceil(x[0]/Ts))*Ts+k*Ts,indices=[];for(let i=0;i<x.length;i++)if(x[i]>=origin&&x[i]<=origin+2*Ts)indices.push(i);if(indices.length>1)curves.push({...base,name:base.name,x:indices.map(i=>(x[i]-origin)/Ts-1),y:indices.map(i=>component(result.values[i],base.representation)),eye:true});}
      }
    }
    return {curves,skipped};
  }
  drawAll(){for(const view of this.cards.keys())this.draw(view);}
  autoRange(view,curves){
    let xmin=Infinity,xmax=-Infinity,ymin=Infinity,ymax=-Infinity;
    const settings=this.scene.settings;
    if(view==='time'&&this.axes.time==='s'){xmin=settings.tMin;xmax=settings.tMax;}
    if(view==='spectrum'&&['Hz','sampledHz'].includes(this.axes.spectrum)||view==='response'){xmin=settings.fMin;xmax=settings.fMax;}
    if(view==='eye'){xmin=-1;xmax=1;}
    for(const curve of curves)for(let i=0;i<curve.x.length;i++){const x=curve.x[i],y=curve.y[i];if(!Number.isFinite(x)||!Number.isFinite(y))continue;if(!['time','spectrum','response','eye'].includes(view)||!Number.isFinite(xmin)){xmin=Math.min(xmin,x);xmax=Math.max(xmax,x);}if((view==='time'&&this.axes.time==='n')||(view==='spectrum'&&this.axes.spectrum==='cycles/sample')){xmin=Math.min(xmin,x);xmax=Math.max(xmax,x);}if(x>=xmin&&x<=xmax){ymin=Math.min(ymin,y);ymax=Math.max(ymax,y);}}
    if(!Number.isFinite(xmin)){xmin=view==='constellation'?-1.5:0;xmax=view==='constellation'?1.5:1;}
    if(xmin===xmax){xmin-=1;xmax+=1;}
    if(!Number.isFinite(ymin)){ymin=-1;ymax=1;}
    if(view==='spectrum'||view==='response'){ymin=0;ymax=Math.max(.1,ymax)*1.15;}
    else if(view==='constellation'){const max=Math.max(1.3,Math.abs(xmin)*1.2,Math.abs(xmax)*1.2,Math.abs(ymin)*1.2,Math.abs(ymax)*1.2);xmin=-max;xmax=max;ymin=-max;ymax=max;}
    else{const span=Math.max(.3,ymax-ymin);ymin-=span*.15;ymax+=span*.15;}
    return {xmin,xmax,ymin,ymax};
  }
  draw(view){
    const item=this.cards.get(view);if(!item||!this.output)return;
    const {canvas,legend,caption}=item,{curves,skipped}=this.collect(view);
    const axisSelect=item.card.querySelector('select');if(axisSelect)axisSelect.value=this.axes[view];
    if(this.scene.frozen&&this.output.frozen)curves.push(...this.collect(view,this.scene.frozen.scene,this.output.frozen,true).curves);
    const w=canvas.clientWidth,h=canvas.clientHeight;if(w<10||h<10)return;
    const ratio=Math.min(2,devicePixelRatio||1);canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);const ctx=canvas.getContext('2d');ctx.scale(ratio,ratio);
    const bounds=this.ranges[view]??this.autoRange(view,curves);this.currentRanges??={};this.currentRanges[view]=bounds;
    const {xmin,xmax,ymin,ymax}=bounds,l=49,r=w-17,top=15,bottom=h-34;
    const px=x=>l+(x-xmin)/(xmax-xmin)*(r-l),py=y=>bottom-(y-ymin)/(ymax-ymin)*(bottom-top);
    ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.lineWidth=1;ctx.font='9px Consolas,monospace';
    for(let k=0;k<=6;k++){const x=xmin+k*(xmax-xmin)/6,y=ymin+k*(ymax-ymin)/6;ctx.strokeStyle='#edf1e9';ctx.beginPath();ctx.moveTo(px(x),top);ctx.lineTo(px(x),bottom);ctx.moveTo(l,py(y));ctx.lineTo(r,py(y));ctx.stroke();ctx.fillStyle='#9aa597';ctx.textAlign='center';ctx.fillText(format(x,3),px(x),bottom+15);ctx.textAlign='right';ctx.fillText(format(y,3),l-8,py(y)+3);}
    if(view==='constellation'){ctx.fillStyle='#eff6ee66';ctx.fillRect(px(0),top,r-px(0),py(0)-top);ctx.fillStyle='#f7f0e866';ctx.fillRect(l,py(0),px(0)-l,bottom-py(0));}
    ctx.strokeStyle='#c9d4c3';ctx.beginPath();if(0>=xmin&&0<=xmax){ctx.moveTo(px(0),top);ctx.lineTo(px(0),bottom);}if(0>=ymin&&0<=ymax){ctx.moveTo(l,py(0));ctx.lineTo(r,py(0));}ctx.stroke();
    ctx.fillStyle='#8f9d88';ctx.textAlign='right';ctx.fillText(view==='constellation'?'I':view==='eye'?'t / Ts':view==='time'?this.axes.time==='s'?'t / s':'索引 n':`f / ${view==='response'||this.axes.spectrum==='sampledHz'?'Hz':this.axes.spectrum}`,r,h-6);ctx.textAlign='left';ctx.fillText(view==='constellation'?'Q':view==='spectrum'?(this.axes.spectrum==='sampledHz'?'|Xs| · 采样 DTFT':'|X| · 有限记录'):view==='response'?'|H|':view==='eye'?'幅度':this.axes.time==='n'?'序列值':'幅度（各对象所选分量）',l,10);
    ctx.save();ctx.beginPath();ctx.rect(l,top,r-l,bottom-top);ctx.clip();
    curves.forEach((curve,idx)=>{
      ctx.strokeStyle=curve.color;ctx.fillStyle=curve.color;ctx.lineWidth=curve.dashed?1.4:1.6;ctx.globalAlpha=curve.dashed?.5:curve.eye?.38:1;ctx.setLineDash(curve.dashed?[4,4]:idx%3===1?[7,2]:idx%3===2?[2,2]:[]);
      if(curve.stems||curve.scatter){ctx.setLineDash(curve.dashed?[3,3]:[]);for(let i=0;i<curve.x.length;i++){if(curve.x[i]<xmin||curve.x[i]>xmax)continue;const x=px(curve.x[i]),y=py(curve.y[i]);if(curve.stems){ctx.beginPath();ctx.moveTo(x,py(0));ctx.lineTo(x,y);ctx.stroke();}ctx.beginPath();ctx.arc(x,y,curve.scatter?3.6:2.4,0,2*Math.PI);if(curve.dashed)ctx.stroke();else ctx.fill();}}
      else{ctx.beginPath();let previous=false;for(let i=0;i<curve.x.length;i++){const x=curve.x[i],y=curve.y[i];if(x<xmin-(xmax-xmin)*.01||x>xmax+(xmax-xmin)*.01){previous=false;continue;}if(previous)ctx.lineTo(px(x),py(y));else{ctx.moveTo(px(x),py(y));previous=true;}}ctx.stroke();}
      if(!curve.dashed&&curve.id===this.selected&&!curve.eye&&['time','constellation'].includes(view)&&this.activeIndex<curve.x.length){const i=this.activeIndex;ctx.globalAlpha=1;ctx.setLineDash([]);ctx.beginPath();ctx.arc(px(curve.x[i]),py(curve.y[i]),6,0,2*Math.PI);ctx.stroke();}
    });
    ctx.globalAlpha=1;ctx.setLineDash([]);
    const cursor=this.cursors[view];if(cursor&&view!=='constellation'){ctx.strokeStyle='#788b6c';ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(px(cursor.x),top);ctx.lineTo(px(cursor.x),bottom);ctx.stroke();}
    ctx.restore();
    if(!curves.length){ctx.fillStyle='#a2ae99';ctx.font='12px Segoe UI,Microsoft YaHei,sans-serif';ctx.textAlign='center';ctx.fillText({time:'显示信号或序列；可切换 s / n 坐标',spectrum:'显示信号或序列以观察频谱',response:'添加 H(f)=... 并开启对象显示',constellation:'显示 BPSK/QPSK 符号或复信号轨迹',eye:'添加 Shape 输出，或打开脉冲成形示例'}[view],w/2,h/2);}
    const unique=new Map(curves.map(c=>[c.name,c])),legendKey=JSON.stringify([...unique.values()].map(c=>[c.name,c.color,c.dashed,c.representation]));if(item.legendKey!==legendKey){legend.replaceChildren();for(const curve of unique.values()){const item=document.createElement('span');item.className='legend-item';const swatch=document.createElement('i');swatch.className='legend-swatch'+(curve.dashed?' dashed':'');swatch.style.setProperty('--object-color',curve.color);item.append(swatch,document.createTextNode(curve.name+(['time','eye'].includes(view)?` · ${labels[curve.representation]}`:'')));legend.append(item);}item.legendKey=legendKey;}
    caption.textContent={time:'点击读数 · 鼠标拖动平移 · Ctrl + 滚轮缩放 · 数值信号为有限采样近似',spectrum:this.axes.spectrum==='sampledHz'?'有限采样冲激列 DTFT · 谱副本幅度以 fs 为周期 · 不乘 Δt，与连续积分谱分组比较':this.axes.spectrum==='Hz'?'连续记录数值傅里叶变换 · 矩形窗 · 乘 Δt · 非 PSD；采样 DTFT 通过坐标菜单独立观察':'有限序列 DFT 频点 · cycles/sample · 采样率未知，不作连续积分归一化',response:'自定义幅频响应 · 因果性及稳定性未判定 · 相位请在对象详情读取',constellation:'BPSK 按 I=0 判决；QPSK 按 I/Q 象限判决 · 点击选择符号；复信号显示轨迹',eye:'两符号周期折叠 · 幅度表示各对象所选分量 · 眼图不能直接证明误码率'}[view]+(skipped?` · ${skipped} 个不同单位的对象未叠加，请切换坐标`:'');
    canvas.setAttribute('aria-label',`${names[view]}。对象：${[...unique.keys()].join('、')||'暂无'}。${caption.textContent}`);
    this.drawn??={};this.drawn[view]={curves,bounds,l,r,top,bottom};
  }
  zoom(view,factor){const bounds=this.currentRanges?.[view];if(!bounds)return;const center=(bounds.xmin+bounds.xmax)/2,half=(bounds.xmax-bounds.xmin)/2*factor;this.ranges[view]={...bounds,xmin:center-half,xmax:center+half};this.draw(view);this.saveLayout();}
  pick(view,x,y){
    const data=this.drawn?.[view];if(!data)return;const {curves,bounds,l,r,top,bottom}=data,targetX=bounds.xmin+(x-l)/(r-l)*(bounds.xmax-bounds.xmin),targetY=bounds.ymax-(y-top)/(bottom-top)*(bounds.ymax-bounds.ymin);let best=null,dist=Infinity;
    for(const curve of curves){if(curve.dashed||curve.eye)continue;for(let i=0;i<curve.x.length;i++){const d=((curve.x[i]-targetX)/(bounds.xmax-bounds.xmin))**2+(view==='constellation'?((curve.y[i]-targetY)/(bounds.ymax-bounds.ymin))**2:0);if(d<dist){dist=d;best={id:curve.id,index:i,x:curve.x[i],y:curve.y[i],view};}}}
    if(best){this.cursors[view]=best;this.onSelect(best);this.draw(view);}
  }
  export(view){
    const item=this.cards.get(view);if(!item)return;const canvas=document.createElement('canvas'),w=1100,h=550,ctx=canvas.getContext('2d');canvas.width=w;canvas.height=h;ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.fillStyle='#23352f';ctx.font='18px sans-serif';ctx.fillText(`Clab · ${this.scene.name} · ${names[view]}`,30,32);ctx.drawImage(item.canvas,30,50,w-60,380);ctx.font='12px sans-serif';ctx.fillStyle='#78896d';ctx.fillText(item.legend.textContent,30,453);ctx.fillText(`t=[${this.scene.settings.tMin}, ${this.scene.settings.tMax}) s；N=${this.scene.settings.points}；seed=${this.scene.settings.seed}；矩形窗`,30,478);
    const params=this.scene.objects.filter(o=>this.output.results[o.id]?.type==='scalar').map(o=>o.definition).join(' · ');ctx.fillText(params.slice(0,125),30,501);ctx.fillText(item.caption.textContent.slice(0,115),30,525);canvas.toBlob(blob=>{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`clab-${view}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);},'image/png');
  }
}
