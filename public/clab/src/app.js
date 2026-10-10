import {blank,makeScene,THEMES,TOOLS,object,uid,validateScene,renameInScene} from './scenes.js';
import {parseDefinition,normalize,arities,reserved} from './math.js';
import {PlotManager,format,complexText,phase} from './plots.js';
import {InformationViews} from './information-views.js';
const $=selector=>document.querySelector(selector),clone=value=>structuredClone(value);
const el=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;};
const WORKSPACE_KEY='clab:workspace:v1',LIBRARY_KEY='clab:scenes:v1';
let workbenches={W1:makeScene('A01',2),W2:makeScene('D01',1),W3:makeScene('E03',0)},active='W1',scene,output=null,selected=null,index=0,cursor=null;
let history={W1:{undo:[],redo:[]},W2:{undo:[],redo:[]},W3:{undo:[],redo:[]}},lastGroup=null,lastHistoryAt=0,worker,job=0,pending=null,busy=false;
let lastEditor=null,selection={start:0,end:0},keyGroup='basic',templates=[],playing=null,autosaveTimer,toastTimer,parameterTimer;
let storageError=null;
let mutationQueue=Promise.resolve();const groupRevisions=new Map();
const pendingParameters=new Map(),parameterValues=new Map();
let navigationGeneration=0;
try{const stored=JSON.parse(localStorage.getItem(WORKSPACE_KEY)??'null');if(stored){for(const key of ['W1','W2','W3'])if(stored.workbenches[key]){validateScene(stored.workbenches[key]);workbenches[key]=stored.workbenches[key];}active=['W1','W2','W3'].includes(stored.active)?stored.active:'W1';}}catch(error){storageError='本地记录无法恢复，已保留原记录；当前打开默认示例。可尝试导入备份。';}
scene=workbenches[active];selected=scene.objects.find(o=>o.visible)?.id??scene.objects[0]?.id;
function toast(message,error=false){const node=$('#toast');node.textContent=message;node.classList.toggle('error',error);node.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{node.hidden=true;},error?6500:3200);}
function persist(){clearTimeout(autosaveTimer);autosaveTimer=setTimeout(()=>{try{workbenches[active]=scene;localStorage.setItem(WORKSPACE_KEY,JSON.stringify({version:1,active,workbenches}));}catch(error){toast('保存失败，请导出场景备份。',true);}},350);}
function resetWorker(){worker?.terminate();worker=new Worker(new URL('./worker.js',import.meta.url),{type:'module'});worker.onmessage=({data})=>{if(data.id!==job||!pending||data.progress)return;const finish=pending;pending=null;finish(data);};worker.onerror=event=>{if(pending){const finish=pending;pending=null;finish({fatal:`计算线程无法启动：${event.message||'请使用 HTTP 本地预览，不要直接打开 HTML 文件'}`});}setBusy(false);};}
// Keep the last accepted drawing intact while the worker computes a new batch.
function setBusy(value){busy=value;}
function calculate(candidate){if(pending){pending({cancelled:true});pending=null;resetWorker();}if(!worker)resetWorker();const id=++job;setBusy(true);return new Promise(resolve=>{pending=resolve;worker.postMessage({id,scene:candidate});});}
function scheduleParameter(id,name,value,immediate=false){const update={id,name,value,workbench:active,generation:navigationGeneration};parameterValues.set(id,value);pendingParameters.set(id,update);if(immediate)flushParameters();else if(!parameterTimer)parameterTimer=setTimeout(flushParameters,16);}
function flushParameters(){clearTimeout(parameterTimer);parameterTimer=null;const updates=[...pendingParameters.values()];pendingParameters.clear();for(const entry of updates){if(entry.workbench!==active||entry.generation!==navigationGeneration)continue;change(s=>{s.objects.find(o=>o.id===entry.id).definition=`${entry.name}=${entry.value}`;},{group:`parameter:${entry.id}`,keepInputs:true}).then(ok=>{if(!ok&&parameterValues.get(entry.id)===entry.value){parameterValues.delete(entry.id);updateParameterRows();}});}}
function clearParameters(){clearTimeout(parameterTimer);parameterTimer=null;pendingParameters.clear();parameterValues.clear();}
function pushHistory(group){const now=performance.now(),h=history[active];if(!group||lastGroup!==group||now-lastHistoryAt>800){h.undo.push(clone(scene));if(h.undo.length>50)h.undo.shift();}h.redo=[];lastGroup=group;lastHistoryAt=now;}
function change(mutator,options={}){
  const requestedWorkbench=active,generation=navigationGeneration,group=options.group,revision=group?(groupRevisions.get(group)??0)+1:0;
  if(group)groupRevisions.set(group,revision);
  const task=mutationQueue.then(()=>{
    if(requestedWorkbench!==active||generation!==navigationGeneration||group&&groupRevisions.get(group)!==revision)return false;
    return performChange(mutator,options);
  });mutationQueue=task.catch(error=>{setBusy(false);toast(error.message,true);return false;});return task;
}
async function performChange(mutator,{validate=true,group=null,message=null,keepInputs=false}={}){
  const workbench=active,candidate=clone(scene);
  try{mutator(candidate);}catch(error){toast(error.message,true);return false;}
  const data=await calculate(candidate);if(data.cancelled||workbench!==active)return false;
  setBusy(false);if(data.fatal){toast(data.fatal,true);return false;}
  const newlyInvalid=Object.entries(data.result.errors).find(([id,error])=>!output?.errors[id]||output.errors[id].message!==error.message);
  if(validate&&newlyInvalid){const [id,error]=newlyInvalid,textarea=document.querySelector(`[data-object-id="${CSS.escape(id)}"] .definition-input`);if(textarea){showDraftError(textarea,error);textarea.focus();}else $('#new-error').textContent=`${error.message}（表达式第 ${error.position+1} 个字符附近）`;toast('定义尚未生效：'+error.message,true);return false;}
  pushHistory(group);scene=candidate;workbenches[active]=scene;output=data.result;render(keepInputs);persist();if(message)toast(message);return true;
}
async function recalculate(){const data=await calculate(scene);if(data.cancelled)return;setBusy(false);if(data.fatal){toast(data.fatal,true);return;}output=data.result;render();}
function stopPlay(){if(playing)cancelAnimationFrame(playing.frame);playing=null;$('#play-button').textContent='▶';$('#play-button').setAttribute('aria-label','播放观察过程');}
async function replaceScene(next,{record=true}={}){clearParameters();navigationGeneration++;stopPlay();if(next.workbench!==active){workbenches[active]=scene;active=next.workbench;scene=workbenches[active];}if(record)pushHistory();scene=clone(next);workbenches[active]=scene;output=null;selected=scene.objects.find(o=>o.visible)?.id??scene.objects[0]?.id;index=0;cursor=null;plots.ranges={};plots.cursors={};render();persist();await recalculate();}
async function undo(redo=false){const h=history[active],from=redo?h.redo:h.undo,to=redo?h.undo:h.redo;if(!from.length)return;to.push(clone(scene));const target=from.pop();lastGroup=null;await replaceScene(target,{record:false});}
function selectObject(id,newIndex=index,newCursor=null){if(selected!==id){stopPlay();newIndex=0;}selected=id;index=newIndex;cursor=newCursor;if(playing){playing.position=index;playing.last=null;}renderInspector();updatePlayback();updateVisuals();document.querySelectorAll('.object-row').forEach(row=>row.classList.toggle('selected',row.dataset.objectId===selected));}
const plots=new PlotManager($('#plots'),pick=>{selectObject(pick.id,pick.index,pick);if(pick.view==='constellation')mobilePanel('inspector');},layout=>change(s=>Object.assign(s.views,layout),{group:'plot-layout',keepInputs:true}));
const informationViews=new InformationViews($('#information-views'),(id,bitIndex)=>{
  const ast=parseDefinition(scene.objects.find(o=>o.id===id).definition).ast,maskName=ast.args[1].name;
  const mask=scene.objects.find(o=>parseDefinition(o.definition).name===maskName);
  change(s=>{const target=s.objects.find(o=>o.id===mask.id),values=parseDefinition(target.definition).ast.items.map(v=>v.value);values[bitIndex]^=1;target.definition=`${maskName}=[${values.join(',')}]`;});
},id=>selectObject(id));
function updateVisuals(){plots.update(scene,output,selected,index);$('#plots').hidden=!['time','spectrum','response','constellation','eye'].some(key=>scene.views[key]);informationViews.update(scene,output,selected,index);}
function typeLabel(result,definition){if(result)return {scalar:'参数',signal:'时域信号',frequency:'频域函数',impulse:'理想冲激',sequence:result.sampleRate?'采样序列':'离散序列',information:'信息与编码'}[result.type];try{const d=parseDefinition(definition);return d.variable?{t:'时域函数',f:'频域函数',n:'离散函数'}[d.variable]:'定义';}catch{return '未生效';}}
function render(keepInputs=false){
  if(document.activeElement!==$('#scene-name'))$('#scene-name').value=scene.name;$('#object-count').textContent=`${scene.objects.length}/48`;
  document.querySelectorAll('[data-workbench]').forEach(b=>b.classList.toggle('active',b.dataset.workbench===active));
  $('#undo-button').disabled=!history[active].undo.length;$('#redo-button').disabled=!history[active].redo.length;
  $('#freeze-button').textContent=scene.frozen?'◫ 移除比较':'◫ 冻结比较';
  if(keepInputs){updateParameterRows();refreshReadout();updatePlayback();updateVisuals();return;}
  const spec=THEMES.find(t=>t.id===scene.theme);
  $('#plot-title').textContent=spec?.title??'自由工作台';
  const select=$('#theme-select');select.replaceChildren();const option=el('option',null,'自由工作台');option.value='';select.append(option);for(const theme of THEMES.filter(t=>t.workbench===active)){const option=el('option',null,theme.title);option.value=theme.id;select.append(option);}select.value=scene.theme??'';
  const presets=$('#preset-buttons');presets.replaceChildren();if(spec)spec.presets.forEach((preset,i)=>{const b=el('button',i===scene.preset?'active':'',preset.name);b.type='button';b.addEventListener('click',()=>replaceScene(makeScene(spec.id,i)));presets.append(b);});
  renderObjects();
  document.querySelectorAll('[data-view]').forEach(input=>{input.checked=!!scene.views[input.dataset.view];input.closest('label').hidden=active==='W3'&&['spectrum','response','constellation','eye'].includes(input.dataset.view)||input.dataset.view==='information'&&active!=='W3'&&!Object.values(output?.results??{}).some(r=>r.analysis);});
  $('#time-view-label').textContent=active==='W3'?'序列':'时域';$('#calculation-settings').hidden=active==='W3';$('#new-definition').placeholder=active==='W3'?'例如 code=Hamming([1,0,1,1])':'例如 z(t)=x(t)+y(t)';
  if(document.activeElement!==$('#notes'))$('#notes').value=scene.notes;for(const key of ['tMin','tMax','fMin','fMax','points','seed'])if(document.activeElement!==$('#settings-form').elements[key])$('#settings-form').elements[key].value=scene.settings[key];
  $('#comparison-label').hidden=!scene.frozen;if(scene.frozen)$('#comparison-label').textContent=`冻结：${scene.frozen.name}`;
  renderModel(spec);renderInspector();updatePlayback();updateVisuals();
  if(output){const count=Object.keys(output.errors).length;$('#compute-state').hidden=!count;$('#compute-state').textContent=count?`${count} 个对象不可计算`:'';
    $('#grid-status').textContent=`N=${scene.settings.points} · Δt=${format(output.dt)} s · 内部 fs=${format(output.internalRate)} Hz`;
  }
  if(!$('#math-keyboard').hidden)renderKeyboard();
}
function renderObjects(){
  const list=$('#object-list'),drafts=new Map(),focused=document.activeElement,scrollTop=list.scrollTop;
  const focusState=focused?.matches('.definition-input')?{id:focused.dataset.id,start:focused.selectionStart,end:focused.selectionEnd}:null;
  for(const row of list.querySelectorAll('.object-row')){const area=row.querySelector('.definition-input');if(area&&area.value!==row.dataset.appliedDefinition)drafts.set(row.dataset.objectId,{value:area.value,error:row.querySelector('.inline-error')?.textContent??''});}
  list.replaceChildren();
  if(!scene.objects.length)list.append(el('div','empty-object','暂无对象'));
  for(const obj of scene.objects){
    const result=output?.results[obj.id],row=el('div','object-row'+(selected===obj.id?' selected':''));row.dataset.objectId=obj.id;row.dataset.appliedDefinition=obj.definition;row.style.setProperty('--object-color',obj.color);
    const head=el('div','object-row-head'),visibility=el('button','visibility-button'+(obj.visible?'':' off'),obj.visible?'✓':'');visibility.title='切换显示，保留计算';visibility.setAttribute('aria-label',`${obj.visible?'隐藏':'显示'} ${result?.name??'对象'}`);visibility.addEventListener('click',()=>change(s=>{s.objects.find(o=>o.id===obj.id).visible=!obj.visible;}));
    const name=el('span','object-symbol',result?.name??obj.definition.split(/[=(\[]/)[0].trim()),type=el('span','object-type',typeLabel(result,obj.definition)),remove=el('button','delete-button','×');remove.title='删除对象；可撤销';remove.setAttribute('aria-label',`删除 ${name.textContent}`);remove.addEventListener('click',()=>{
      const dependencies=scene.objects.filter(o=>output?.results[o.id]?.dependencies.includes(name.textContent)).map(o=>output.results[o.id].name);
      change(s=>{s.objects=s.objects.filter(o=>o.id!==obj.id);if(selected===obj.id)selected=s.objects[0]?.id;},{validate:false,message:dependencies.length?`已删除；${dependencies.join('、')} 的引用失效，可撤销恢复。`:'对象已删除，可撤销。'});
    });head.append(visibility,name,type,remove);
    const textarea=el('textarea','definition-input');textarea.value=obj.definition;textarea.rows=1;textarea.spellcheck=false;textarea.autocomplete='off';textarea.setAttribute('aria-label',`编辑 ${name.textContent} 定义`);textarea.dataset.editor='true';textarea.dataset.id=obj.id;
    const savedDraft=drafts.get(obj.id);if(savedDraft&&savedDraft.value!==obj.definition)textarea.value=savedDraft.value;
    const draft=el('div','draft-toolbar');draft.hidden=textarea.value===obj.definition;draft.append(el('span',null,'草稿'));const apply=el('button','button compact','应用');apply.addEventListener('click',()=>applyDefinition(textarea));draft.append(apply);const error=el('p','inline-error');error.setAttribute('role','alert');if(savedDraft&&!draft.hidden)error.textContent=savedDraft.error;
    textarea.addEventListener('input',()=>{draft.hidden=textarea.value===obj.definition;error.textContent='';completeInput(textarea);});textarea.addEventListener('focus',()=>{selectObject(obj.id);trackEditor(textarea);});bindEditor(textarea);
    row.append(head,textarea,draft,error);
    if(output?.errors[obj.id])error.textContent=output.errors[obj.id].message;
    if(result?.type==='scalar'&&Math.abs(result.value.im)<1e-10&&obj.slider){
      const controls=el('div','parameter-control'),range=document.createElement('input'),number=document.createElement('input');range.type='range';number.type='number';
      for(const input of [range,number]){input.min=obj.slider.min;input.max=obj.slider.max;input.step=obj.slider.step;input.value=result.value.re;input.setAttribute('aria-label',`${result.name} 精确参数，范围 ${obj.slider.min} 到 ${obj.slider.max} ${obj.slider.unit}`);input.dataset.parameterId=obj.id;}
      const alignedMin=Math.ceil(obj.slider.min/obj.slider.step)*obj.slider.step,alignedMax=Math.floor(obj.slider.max/obj.slider.step)*obj.slider.step,fromZero=result.value.re/obj.slider.step,fromMinimum=(result.value.re-obj.slider.min)/obj.slider.step;if(alignedMin<alignedMax&&Math.abs(fromZero-Math.round(fromZero))<1e-8&&Math.abs(fromMinimum-Math.round(fromMinimum))>1e-8){range.min=alignedMin;range.max=alignedMax;range.value=result.value.re;}
      const update=input=>{const value=Number(input.value);if(!Number.isFinite(value)||value<obj.slider.min||value>obj.slider.max){toast(`参数应在 ${obj.slider.min} 到 ${obj.slider.max} 之间`,true);return;}number.value=value;scheduleParameter(obj.id,result.name,value,input!==range);};
      range.addEventListener('input',()=>update(range));number.addEventListener('change',()=>update(number));controls.append(range,number,el('span',null,obj.slider.unit));row.append(controls);
    }
    row.addEventListener('click',event=>{if(!event.target.closest('button,textarea,input,select'))selectObject(obj.id);});list.append(row);
  }
  list.scrollTop=scrollTop;
  if(focusState){const area=list.querySelector(`[data-object-id="${CSS.escape(focusState.id)}"] .definition-input`);if(area){area.focus({preventScroll:true});area.setSelectionRange(Math.min(focusState.start,area.value.length),Math.min(focusState.end,area.value.length));}}
}
function updateParameterRows(){for(const obj of scene.objects){const result=output?.results[obj.id],row=document.querySelector(`[data-object-id="${CSS.escape(obj.id)}"]`);if(!row||result?.type!=='scalar')continue;const area=row.querySelector('textarea'),hasDraft=area.value!==row.dataset.appliedDefinition;if(!hasDraft&&document.activeElement!==area)area.value=obj.definition;row.dataset.appliedDefinition=obj.definition;if(parameterValues.get(obj.id)===result.value.re)parameterValues.delete(obj.id);const value=parameterValues.get(obj.id)??result.value.re;row.querySelectorAll('[data-parameter-id]').forEach(input=>{if(document.activeElement!==input)input.value=value;});}}
function showDraftError(textarea,error){const row=textarea.closest('.object-row');if(row){row.querySelector('.inline-error').textContent=`${error.message}（第 ${error.position+1} 个字符附近；草稿尚未生效）`;row.querySelector('.draft-toolbar').hidden=false;}}
async function applyDefinition(textarea){const id=textarea.dataset.id,definition=textarea.value;try{parseDefinition(definition);}catch(e){showDraftError(textarea,e);if(textarea.id==='new-definition')$('#new-error').textContent=`${e.message}（第 ${e.position+1} 个字符附近）`;return;}
  const ok=await change(s=>{if(id)s.objects.find(o=>o.id===id).definition=definition;else{if(s.objects.length>=48)throw new Error('每个场景最多 48 个对象');const next=object(definition,s.objects.length);s.objects.push(next);selected=next.id;}});
  if(ok){$('#new-error').textContent='';if(!id){textarea.value='';textarea.focus();}$('#suggestions').hidden=true;}
}
function readoutAt(result,id){
  const dataIndex=Math.max(0,Math.min(index,(result.values?.length??1)-1));
  let value=result.values?.[dataIndex],position=result.x?.[dataIndex],label;
  if(cursor?.id===id&&cursor.view==='spectrum'){value=result.spectrum?.amplitudes[cursor.index]??result.values?.[cursor.index];position=cursor.x;label=`f=${format(position)} ${result.spectrumUnit??result.axisUnit??'Hz'}`;}
  else if(cursor?.id===id&&cursor.view==='response'){value=result.values?.[cursor.index];label=`f=${format(cursor.x)} Hz`;}
  else label=`${result.domain==='f'?'f':result.domain==='t'||result.sampleRate?'t':'n'}=${format(position)} ${result.domain==='f'?'Hz':result.domain==='t'||result.sampleRate?'s':''} · 第 ${dataIndex+1} 点`;
  const k=result.bitsPerSymbol,start=dataIndex*k;
  return {value,label,magnitude:value?`模 ${format(Math.hypot(value.re,value.im))} · 相位 ${format(phase(value))} rad`:'',bits:result.modulation&&result.bits?`符号 ${dataIndex} ↔ 比特 ${result.bits.slice(start,start+k).join('')} · I=${format(value?.re)} / Q=${format(value?.im)}`:''};
}
function renderInspector(){
  const target=$('#inspector'),conditionsOpen=target.dataset.selected===selected&&target.querySelector('.object-conditions')?.open;target.replaceChildren();target.dataset.selected=selected;const obj=scene.objects.find(o=>o.id===selected),result=output?.results[selected];
  if(!obj)return;
  const section=el('section','inspector-selected'),heading=el('div','selected-title',result?.name??'对象');heading.append(el('span',null,typeLabel(result,obj.definition)));section.append(heading,el('div','selected-formula',obj.definition));
  const controls=el('div','selected-controls'),color=document.createElement('input');color.type='color';color.value=obj.color;color.setAttribute('aria-label','对象颜色');color.addEventListener('change',()=>change(s=>s.objects.find(o=>o.id===obj.id).color=color.value));
  const representation=document.createElement('select');representation.setAttribute('aria-label','复数表示方式');for(const [value,text]of[['re','实部'],['im','虚部'],['abs','模'],['arg','相位（rad）']]){const option=el('option',null,text);option.value=value;representation.append(option);}representation.value=obj.representation;representation.hidden=result?.type==='information'||active==='W3';representation.addEventListener('change',()=>change(s=>s.objects.find(o=>o.id===obj.id).representation=representation.value));controls.append(color,representation);section.append(controls);
  const rename=el('div','rename-control'),nameInput=document.createElement('input');nameInput.value=result?.name??obj.definition.split(/[=(\[]/)[0].trim();nameInput.setAttribute('aria-label','对象新名称');const renameButton=el('button','button compact','改名');renameButton.addEventListener('click',()=>change(s=>renameInScene(s,obj.id,nameInput.value.trim()),{message:'对象与下游引用已一起改名'}));rename.append(nameInput,renameButton);section.append(rename);
  if(result){
    if(result.dependencies.length)section.append(el('p','dependency-list','依赖 '+result.dependencies.join(' → ')));
    if(result.type==='scalar'){
      const readout=el('div','readout');readout.append(el('p',null,'当前值'),el('strong',null,complexText(result.value)));section.append(readout);
      if(Math.abs(result.value.im)<1e-10){const configure=el('button','button full compact',obj.slider?'设置滑块范围与单位':'启用参数滑块');configure.addEventListener('click',()=>sliderDialog(obj,result));section.append(configure);}
    }else if(active==='W3'&&result.analysis){
      // Structured results are already present in the central view.
    }else if(result.type==='information'){
      const readout=el('div','readout');for(const metric of result.analysis.metrics??[])readout.append(el('p',null,metric.label),el('strong',null,typeof metric.value==='number'?format(metric.value):metric.value),el('small',null,metric.unit??''));section.append(readout);
    }else{
      const readout=el('div','readout');
      const sample=readoutAt(result,obj.id);readout.append(el('p','sample-position',sample.label));
      if(sample.value){readout.append(el('strong',null,complexText(sample.value)),el('small','sample-magnitude',sample.magnitude));}
      if(result.type==='impulse')readout.append(el('small',null,result.impulses.map(k=>`时延 ${format(k.delay)} s，权重 ${complexText(k.weight)}`).join('；')));
      if(result.bitErrors!==undefined)readout.append(el('small',null,`观测 ${result.bitErrors}/${result.totalBits} 比特错误；不代表理论 BER。`));
      if(sample.bits)readout.append(el('div','selected-bit',sample.bits));
      section.append(readout);
      for(const [view,text]of active==='W3'?[]:[['time','时域'],['spectrum','频谱'],['response','频响'],['constellation','星座'],['eye','眼图']]){
        const label=el('label','plot-selection'),check=document.createElement('input');check.type='checkbox';check.checked=!(scene.views.hiddenObjects?.[view]??[]).includes(obj.id);check.addEventListener('change',()=>change(s=>{s.views.hiddenObjects??={};const set=new Set(s.views.hiddenObjects[view]??[]);if(check.checked)set.delete(obj.id);else set.add(obj.id);s.views.hiddenObjects[view]=[...set];}));label.append(check,document.createTextNode(text));section.append(label);
      }
    }
    if(result.model&&result.type!=='scalar'){const conditions=el('details','object-conditions');conditions.open=!!conditionsOpen;conditions.append(el('summary',null,'模型条件'),el('p','object-model',result.model));section.append(conditions);}
  }else if(output?.errors[obj.id])section.append(el('p','inline-error',output.errors[obj.id].message));
  target.append(section);
}
function renderModel(spec){const body=$('#model-info');body.replaceChildren();if(spec){for(const [label,text]of[['公式',spec.formula],['模型条件',spec.conditions],['先修概念',spec.prerequisites],['留意',spec.misconception]]){const p=el('p');p.append(el('strong',null,label+'：'),document.createTextNode(text));body.append(p);}}else body.append(el('p',null,'自由场景采用有限窗口数值计算；不提供一般符号求解。'));
  body.append(el('p',null,'统一约定：sinc(v)=sin(πv)/(πv)，sinc(0)=1；rect(±1/2)=1/2；u(0)=1/2；对数与根号为复主值。时间 / s、频率 / Hz。'));
}
function refreshReadout(){const result=output?.results[selected],section=$('#inspector');if(!result||!section.querySelector('.selected-formula'))return;section.querySelector('.selected-formula').textContent=scene.objects.find(o=>o.id===selected).definition;if(result.type==='information'){section.querySelectorAll('.readout strong').forEach((node,i)=>{const metric=result.analysis.metrics?.[i];if(metric)node.textContent=typeof metric.value==='number'?format(metric.value):metric.value;});return;}const sample=result.type==='scalar'?{value:result.value}:readoutAt(result,selected);if(sample.value&&section.querySelector('.readout strong'))section.querySelector('.readout strong').textContent=complexText(sample.value);for(const [selector,text]of [['.sample-position',sample.label],['.sample-magnitude',sample.magnitude],['.selected-bit',sample.bits]]){const node=section.querySelector(selector);if(node)node.textContent=text;}}
function updatePlayback(){const result=output?.results[selected],steps=result?.analysis?.steps,length=steps?.length??result?.values?.length??0,max=Math.max(0,length-1),hidden=!length||result?.type==='scalar'||active==='W3'&&!steps?.length;index=Math.min(index,max);$('#play-position').max=max;$('#play-position').value=index;$('#play-label').textContent=steps?`步 ${index+1}`:result?.modulation?`符号 ${index}`:`点 ${index+1}`;$('#playback-bar').hidden=hidden;if(hidden||!max)stopPlay();}
function mobilePanel(name){$('#workspace').dataset.mobile=name;document.querySelectorAll('[data-mobile]').forEach(b=>{if(b.tagName==='BUTTON')b.classList.toggle('active',b.dataset.mobile===name);});requestAnimationFrame(()=>plots.drawAll());}
function openModal(title){$('#modal-title').textContent=title;$('#modal-body').replaceChildren();$('#modal').showModal();return $('#modal-body');}
function sliderDialog(obj,result){const body=openModal('参数范围与单位'),form=el('form','setting-editor'),current=obj.slider??{min:Math.min(0,result.value.re-1),max:Math.max(2,result.value.re*2),step:.01,unit:''};
  for(const [key,label]of[['min','最小值'],['max','最大值'],['step','步长'],['unit','单位']]){const container=el('label',null,label),input=document.createElement('input');input.name=key;input.type=key==='unit'?'text':'number';input.step='any';input.value=current[key];input.required=key!=='unit';container.append(input);form.append(container);}
  const save=el('button','button primary','应用'),error=el('p','inline-error');save.type='submit';form.append(save,error);form.addEventListener('submit',async e=>{e.preventDefault();const min=Number(form.elements.min.value),max=Number(form.elements.max.value),step=Number(form.elements.step.value);if(![min,max,step].every(Number.isFinite)||max<=min||step<=0||result.value.re<min||result.value.re>max){error.textContent='范围须递增、包含当前值，步长须大于零。';return;}if(await change(s=>s.objects.find(o=>o.id===obj.id).slider={min,max,step,unit:form.elements.unit.value.slice(0,20)}))$('#modal').close();});body.append(form);
}
function catalog(){const body=openModal('工具与可编辑示例'),search=document.createElement('input');search.className='catalog-search';search.type='search';search.placeholder='搜索信号、卷积、混叠、眼图…';search.setAttribute('aria-label','搜索工具与示例');const grid=el('div','catalog-grid');body.append(search,grid);
  const refresh=()=>{grid.replaceChildren();const q=search.value.trim().toLowerCase();for(const theme of THEMES.filter(t=>(t.title+t.subtitle+t.id+t.formula+t.guides.join(' ')).toLowerCase().includes(q))){const b=el('button','catalog-item');const title=el('strong',null,theme.title);b.append(title);b.addEventListener('click',()=>{if(active!==theme.workbench)workbenches[active]=scene;$('#modal').close();replaceScene(makeScene(theme.id,0));});grid.append(b);}for(const tool of TOOLS.filter(t=>(t.label+t.definition+t.help).toLowerCase().includes(q))){const b=el('button','catalog-item');b.append(el('strong',null,tool.label),el('code',null,tool.definition));b.addEventListener('click',()=>{$('#modal').close();mobilePanel('objects');$('#new-definition').value=uniqueTemplate(tool.definition);$('#new-definition').focus();trackEditor($('#new-definition'));});grid.append(b);}if(!grid.children.length)grid.append(el('p','small-note','没有找到已实现的工具。'));};search.addEventListener('input',refresh);refresh();search.focus();
}
function uniqueTemplate(definition){const parsed=parseDefinition(definition),names=new Set(scene.objects.map(o=>{try{return parseDefinition(o.definition).name;}catch{return '';}}));if(!names.has(parsed.name))return definition;let suffix=2;while(names.has(parsed.name+suffix))suffix++;return definition.replace(new RegExp(`^${parsed.name}`),parsed.name+suffix);}
function help(syntaxOnly=false){const body=openModal(syntaxOnly?'表达式语法速查':'欢迎来到 Clab');body.innerHTML=syntaxOnly?`<p>显式乘法使用 <code>*</code>，幂使用 <code>^</code>。变量须先定义；函数与序列需显式调用。</p><pre>a=2\nf0=5\nx(t)=a*cos(2*pi*f0*t)\nh(t)=exp(-t/0.1)*u(t)/0.1\nH(f)=rect(f/16)\ny=Convolve(x,h)\nz=Filter(x,H)\nX=Fourier(x)\nsamples=Sample(y,40)\nb=[0,1,1,0]\ns=QPSK(b)</pre><p>常用函数：sin、cos、exp、ln、log10、sqrt、abs、arg、conj、re、im、sinc、rect、u、If、rc。支持 π、τ、α 等别名。</p><p>分段：<code>g(t)=If(t&gt;=0,exp(-t),0)</code>。冲激：<code>h(t)=delta(t)+0.4*delta(t-0.02)</code>，仅支持常量权重及线性时移，不支持冲激乘积或混合普通函数。</p><p>卷积与乘法不同：<code>Convolve(x,h)</code> 是卷积，<code>x(t)*h(t)</code> 是逐点相乘。时间与频率函数不能隐式混用。未知采样率序列使用归一化频率。</p><p>逆变换：<code>InverseFourier(X)</code>；成形：<code>Shape(s,p,Ts)</code>；噪声：<code>AWGN(s,EbN0)</code> 用于符号、<code>Noise(x,sigma)</code> 用于波形。AM 用表达式，SSB 用 <code>SSB(m,fc)</code>。</p><p>本原型只接收受支持的线性表达式，不解析任意 LaTeX、微积分、矩阵、H(s)/H(z) 或任意程序。</p>`:`<p>在这里输入自己的信号和系统，改变一个条件，观察关联的波形、频谱和接收结果。</p><h3>从一个定义开始</h3><p>输入 <code>a=1</code>，再输入 <code>x(t)=a*cos(2*pi*5*t)</code>。表达式修改先保留为草稿，点击应用后才生效。滑块可以在对象详情中设置范围与单位。</p><h3>建立关联与比较</h3><p>添加滤波器，用 Convolve 或 Filter 连接已有信号。点击对象圆点切换显示，计算关系继续保留。冻结比较保留原参数与范围；撤销和重做可以恢复关联。</p><h3>读取与观察</h3><p>点击图形读取关键点，使用 ＋ / − 放缩，鼠标拖动平移。移动端通过表达式、图形、详情三个面板切换；实体输入与数学键盘共用表达式。播放栏逐步移动信号或符号游标，不模拟实时物理过程。</p><h3>保存自己的发现</h3><p>工作台自动保存到当前浏览器。保存场景可创建命名副本；导出 JSON 后可在其他设备导入。清除浏览器存储会清除本地记录。</p><h3>计算边界</h3><p>全部在本地浏览器计算，无账户与云同步。W1 / W2 / W3 共 39 个可编辑预设。一般符号计算与跨场景对象库尚未实现；数值条件可在对象详情展开。</p><p>公式参考：<a href="https://www.dspguide.com/ch11/2.htm" target="_blank" rel="noopener">DSP Guide · sinc</a>、<a href="https://www.mathworks.com/help/comm/ug/filtering.html" target="_blank" rel="noopener">MathWorks · 成形与通信滤波</a>。</p>`;}
function library(){const body=openModal('保存在此设备的场景');let entries=[];try{entries=JSON.parse(localStorage.getItem(LIBRARY_KEY)??'[]');if(!Array.isArray(entries))entries=[];}catch{toast('无法读取本地场景列表',true);}
  if(!entries.length)body.append(el('p','small-note','还没有命名保存的场景。当前工作台仍会自动保存。'));
  for(const entry of entries){const row=el('div','library-row'),description=el('div');description.append(el('strong',null,entry.scene.name),el('small',null,entry.scene.workbench+' · '+new Date(entry.savedAt).toLocaleString('zh-CN')));const load=el('button','button compact','打开');load.addEventListener('click',()=>{try{validateScene(entry.scene);$('#modal').close();replaceScene(entry.scene);}catch(e){toast(e.message,true);}});row.append(description,load);body.append(row);}
  const actions=el('div','note-actions'),exportButton=el('button','button','导出当前场景'),importButton=el('button','button','导入场景');exportButton.addEventListener('click',exportScene);importButton.addEventListener('click',()=>$('#import-file').click());actions.append(exportButton,importButton);body.append(actions);
}
function saveScene(){try{let entries=JSON.parse(localStorage.getItem(LIBRARY_KEY)??'[]');if(!Array.isArray(entries))entries=[];entries=entries.filter(e=>e.scene.id!==scene.id);entries.unshift({savedAt:Date.now(),scene:clone(scene)});localStorage.setItem(LIBRARY_KEY,JSON.stringify(entries.slice(0,20)));persist();toast('已保存');}catch{toast('保存失败，请导出场景文件备份。',true);}}
function exportScene(){const blob=new Blob([JSON.stringify(scene,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`clab-${scene.name.replace(/[<>:"/\\|?*]/g,'-')}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),500);toast('场景备份已导出，导入时将按本版本模型重新计算。');}
function trackEditor(editor){lastEditor=editor;selection={start:editor.selectionStart,end:editor.selectionEnd};}
function bindEditor(editor){
  let previousEdit=null;
  editor.addEventListener('beforeinput',()=>{previousEdit={start:editor.selectionStart,end:editor.selectionEnd,length:editor.value.length};});
  editor.addEventListener('input',()=>{if(previousEdit&&lastEditor===editor){const delta=editor.value.length-previousEdit.length;templates=templates.filter(p=>p.end<=previousEdit.start||p.start>=previousEdit.end&&!(previousEdit.start===previousEdit.end&&p.start===previousEdit.start)).map(p=>p.start>=previousEdit.end?{start:p.start+delta,end:p.end+delta}:p);previousEdit=null;}trackEditor(editor);});
  editor.addEventListener('select',()=>trackEditor(editor));editor.addEventListener('keyup',()=>trackEditor(editor));editor.addEventListener('click',()=>trackEditor(editor));editor.addEventListener('keydown',e=>{
    if(e.isComposing)return;if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();applyDefinition(editor);}
    if(e.key==='Tab'){
      const next=templates.find(p=>p.start>editor.selectionStart);if(next){e.preventDefault();editor.setSelectionRange(next.start,next.end);trackEditor(editor);return;}
      const first=$('#suggestions button');if(!$('#suggestions').hidden&&first){e.preventDefault();first.click();}
    }
  });}
function completeInput(editor){const names=scene.objects.map(o=>{try{return parseDefinition(o.definition).name;}catch{return '';}}),prefix=editor.value.slice(0,editor.selectionStart).match(/[A-Za-z_][\w]*$/)?.[0];const box=$('#suggestions');box.replaceChildren();if(!prefix){box.hidden=true;return;}
  const matches=[...Object.keys(arities),...names].filter(name=>name.toLowerCase().startsWith(prefix.toLowerCase())&&name!==prefix).slice(0,6);for(const name of matches){const count=arities[name],button=el('button',null,count!==undefined?`${name}(${Array.from({length:Array.isArray(count)?count[0]:count},(_,i)=>'arg'+(i+1)).join(', ')})`:name);button.addEventListener('pointerdown',e=>e.preventDefault());button.addEventListener('click',()=>{const end=editor.selectionStart,start=end-prefix.length;editor.setRangeText(name,start,end,'end');editor.dispatchEvent(new Event('input'));box.hidden=true;editor.focus();trackEditor(editor);});box.append(button);}box.hidden=!matches.length;
}
const KEYS={
  encoding:[['概率','Probabilities([□,□])'],['熵','Entropy(□)'],['二元信道','BinaryChannel(□,□,□)'],['容量','Capacity(□,□,□)'],['BSC','BinaryCapacity(□)'],['Huffman','Huffman(□)'],['汉明编码','Hamming(□)'],['汉明译码','HammingDecode(□)'],['⊕','Xor(□,□)'],['CRC','CRCEncode(□,□)'],['CRC 校验','CRCCheck(□,□)'],['卷积编码','Convolutional(□)'],['Viterbi','Viterbi(□)'],['LFSR','LFSR([1,0,0],□)'],['周期相关','PeriodicCorrelation(□)']],
  basic:[['0','0'],['1','1'],['2','2'],['3','3'],['4','4'],['5','5'],['6','6'],['7','7'],['8','8'],['9','9'],['+','+'],['−','-'],['×','*'],['÷','/'],['( )','(□)'],['a/b','(□)/(□)'],['x²','(□)^2'],['xⁿ','(□)^(□)'],['√','sqrt(□)'],['下标','_□'],['[序列]','[□,□]'],['←','@left'],['→','@right'],['⌫','@delete'],['↵','@apply']],
  functions:[['π','pi'],['e','e'],['j','j'],['t','t'],['f','f'],['n','n'],['α','alpha'],['β','beta'],['τ','tau'],['ω','omega'],['φ','phi'],['μ','mu'],['sin','sin(□)'],['cos','cos(□)'],['exp','exp(□)'],['ln','ln(□)'],['log10','log10(□)'],['|x|','abs(□)'],['arg','arg(□)'],['conj','conj(□)'],['Re','re(□)'],['Im','im(□)']],
  signals:[['sinc','sinc(□)'],['rect','rect(□)'],['u','u(□)'],['δ','delta(t-□)'],['分段','If(□,□,□)'],['时移','x(t-□)'],['卷积','Convolve(□,□)'],['FFT','Fourier(□)'],['IFFT','InverseFourier(□)'],['滤波','Filter(□,□)'],['采样','Sample(□,□)'],['RC','rc(t,□,□)'],['成形','Shape(□,□,□)'],['BPSK','BPSK(□)'],['QPSK','QPSK(□)']]
};
function insertKey(template){const editor=lastEditor?.isConnected?lastEditor:$('#new-definition');editor.focus();editor.setSelectionRange(selection.start,selection.end);const start=editor.selectionStart,end=editor.selectionEnd,selectedText=editor.value.slice(start,end);
  if(template.startsWith('@')){if(template==='@apply')applyDefinition(editor);else if(template==='@delete'){editor.setRangeText('',start===end?Math.max(0,start-1):start,end,'end');editor.dispatchEvent(new Event('input'));}else{const next=template==='@left'?Math.max(0,start-1):Math.min(editor.value.length,end+1);editor.setSelectionRange(next,next);}trackEditor(editor);return;}
  if(selectedText&&template.includes('□'))template=template.replace('□',selectedText);
  templates=[];for(let i=0;i<template.length;i++)if(template[i]==='□')templates.push({start:start+i,end:start+i+1});editor.setRangeText(template,start,end,'end');if(templates.length)editor.setSelectionRange(templates[0].start,templates[0].end);editor.dispatchEvent(new Event('input'));trackEditor(editor);
}
function renderKeyboard(){const box=$('#keyboard-keys');box.replaceChildren();const keys=keyGroup==='objects'?scene.objects.map(obj=>{try{const d=parseDefinition(obj.definition);return [d.name,d.variable==='t'?d.name+'(t)':d.variable==='f'?d.name+'(f)':d.name];}catch{return null;}}).filter(Boolean):KEYS[keyGroup];for(const [label,text]of keys){const button=el('button',null,label);button.title=text;button.addEventListener('pointerdown',e=>e.preventDefault());button.addEventListener('click',()=>insertKey(text));box.append(button);}if(!keys.length)box.append(el('p','small-note','先创建一个命名对象。'));}
$('#new-definition').dataset.editor='true';bindEditor($('#new-definition'));$('#new-definition').addEventListener('focus',()=>trackEditor($('#new-definition')));$('#new-definition').addEventListener('input',()=>{completeInput($('#new-definition'));$('#new-error').textContent='';});
$('#new-object-form').addEventListener('submit',e=>{e.preventDefault();applyDefinition($('#new-definition'));});
$('#add-button').addEventListener('click',()=>{mobilePanel('objects');$('#new-definition').focus();});
document.querySelectorAll('[data-workbench]').forEach(button=>button.addEventListener('click',async()=>{if(button.dataset.workbench===active)return;clearParameters();navigationGeneration++;stopPlay();workbenches[active]=scene;active=button.dataset.workbench;scene=workbenches[active];output=null;selected=scene.objects.find(o=>o.visible)?.id??scene.objects[0]?.id;index=0;cursor=null;plots.ranges={};plots.cursors={};render();persist();await recalculate();}));
document.querySelectorAll('.mobile-tabs [data-mobile]').forEach(button=>button.addEventListener('click',()=>mobilePanel(button.dataset.mobile)));
$('#theme-select').addEventListener('change',()=>{if($('#theme-select').value)replaceScene(makeScene($('#theme-select').value,0));else change(s=>{s.theme=null;s.preset=0;});});
$('#undo-button').addEventListener('click',()=>undo());$('#redo-button').addEventListener('click',()=>undo(true));
$('#blank-button').addEventListener('click',()=>replaceScene(blank(active)));
$('#save-button').addEventListener('click',saveScene);$('#library-button').addEventListener('click',library);$('#export-button').addEventListener('click',exportScene);$('#import-button').addEventListener('click',()=>$('#import-file').click());
$('#catalog-button').addEventListener('click',catalog);$('#syntax-button').addEventListener('click',()=>help(true));
$('#close-modal').addEventListener('click',()=>$('#modal').close());$('#modal').addEventListener('click',e=>{if(e.target===$('#modal')){const r=$('#modal').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('#modal').close();}});
$('#scene-name').addEventListener('change',()=>change(s=>{s.name=$('#scene-name').value.trim()||'未命名场景';}));
$('#notes').addEventListener('change',()=>change(s=>{s.notes=$('#notes').value;},{group:'notes'}));$('#notes').addEventListener('input',()=>{scene.notes=$('#notes').value;persist();});
document.querySelectorAll('[data-view]').forEach(input=>input.addEventListener('change',()=>change(s=>{s.views[input.dataset.view]=input.checked;})));
$('#freeze-button').addEventListener('click',()=>change(s=>{s.frozen=s.frozen?null:{name:s.name,createdAt:Date.now(),scene:clone({...s,frozen:null})};}));
$('#comparison-label').addEventListener('click',()=>{if(!scene.frozen)return;const body=openModal('冻结场景的定义与条件'),frozen=scene.frozen.scene;body.append(el('p',null,scene.frozen.name));if(frozen.workbench!=='W3')body.append(el('p',null,`时间 [${frozen.settings.tMin},${frozen.settings.tMax}) s；频率 [${frozen.settings.fMin},${frozen.settings.fMax}] Hz；N=${frozen.settings.points}；种子 ${frozen.settings.seed}`));body.append(el('pre',null,frozen.objects.map(o=>o.definition).join('\n')));if(frozen.notes)body.append(el('p',null,frozen.notes));});
$('#settings-form').addEventListener('submit',async e=>{e.preventDefault();const settings=Object.fromEntries(['tMin','tMax','fMin','fMax','points','seed'].map(key=>[key,Number(e.currentTarget.elements[key].value)]));const ok=await change(s=>{s.settings=settings;s.views.plotRanges={};});$('#settings-error').textContent=ok?'':'计算条件未应用，请检查范围或数值结果。';});
$('#new-seed').addEventListener('click',()=>change(s=>{s.settings.seed=crypto.getRandomValues(new Uint32Array(1))[0];},{message:'种子已更换，随机样本已重新生成。'}));
$('#import-file').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>8*1024*1024)throw new Error('场景文件不能超过 8 MB');const data=validateScene(JSON.parse(await file.text())),result=await calculate(data);setBusy(false);if(result.cancelled)return;if(result.fatal)throw new Error(result.fatal);if(Object.keys(result.result.errors).length)throw new Error('导入场景存在无效定义：'+Object.values(result.result.errors)[0].message);if(active!==data.workbench)workbenches[active]=scene;$('#modal').close();await replaceScene({...data,id:uid()});toast('场景已导入并重新计算。');}catch(error){toast('无法导入：'+error.message,true);}finally{e.target.value='';}});
$('#keyboard-button').addEventListener('click',()=>{$('#math-keyboard').hidden=!$('#math-keyboard').hidden;if(!$('#math-keyboard').hidden)renderKeyboard();});$('#close-keyboard').addEventListener('click',()=>{$('#math-keyboard').hidden=true;});
document.querySelectorAll('[data-keygroup]').forEach(button=>button.addEventListener('click',()=>{keyGroup=button.dataset.keygroup;document.querySelectorAll('[data-keygroup]').forEach(b=>b.classList.toggle('active',b===button));renderKeyboard();}));
function movePlay(next,light=false){index=Math.max(0,Math.min(Number($('#play-position').max),next));cursor=null;if(playing&&!light){playing.position=index;playing.last=null;}updatePlayback();refreshReadout();plots.activeIndex=index;for(const view of ['time','constellation'])plots.draw(view);informationViews.update(scene,output,selected,index);}
$('#play-position').addEventListener('input',()=>movePlay(Number($('#play-position').value)));$('#step-button').addEventListener('click',()=>{stopPlay();movePlay(index+1);});$('#replay-button').addEventListener('click',()=>{stopPlay();movePlay(0);});
$('#play-button').addEventListener('click',()=>{if(playing){stopPlay();return;}if($('#playback-bar').hidden||!Number($('#play-position').max))return;if(index>=Number($('#play-position').max))movePlay(0);$('#play-button').textContent='Ⅱ';$('#play-button').setAttribute('aria-label','暂停观察过程');playing={frame:0,last:null,position:index};const animate=time=>{if(!playing)return;const state=playing,result=output?.results[selected],max=Number($('#play-position').max),discrete=result?.type==='sequence'||result?.analysis?.steps;const delta=state.last===null?0:Math.min(.08,(time-state.last)/1000);state.last=time;state.position+=delta*(discrete?6:Math.max(1,max/12))*Number($('#play-speed').value);const next=Math.min(max,Math.floor(state.position));if(next!==index)movePlay(next,true);if(!playing)return;if(next>=max){stopPlay();return;}state.frame=requestAnimationFrame(animate);};playing.frame=requestAnimationFrame(animate);});
document.addEventListener('keydown',e=>{if(e.isComposing)return;if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();saveScene();}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&!e.target.closest('textarea,input')){e.preventDefault();undo(e.shiftKey);}if(e.key==='Escape')stopPlay();});
window.addEventListener('beforeunload',()=>{try{workbenches[active]=scene;localStorage.setItem(WORKSPACE_KEY,JSON.stringify({version:1,active,workbenches}));}catch{}});
render();recalculate();if(storageError)toast(storageError,true);
