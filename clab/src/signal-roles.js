export const roleOptions={input:'输入信号',message:'消息信号',carrier:'载波',modulated:'已调信号',noise:'噪声',received:'接收信号',system:'系统响应',output:'输出信号',symbols:'发送符号',samples:'采样结果',reference:'参考模板',intermediate:'中间信号',parameter:'参数'};
export const stages={input:'输入',modulation:'调制',channel:'信道',system:'系统',output:'输出',reference:'参考'};
const stageFor={input:'input',message:'input',carrier:'modulation',modulated:'modulation',noise:'channel',received:'channel',system:'system',output:'output',symbols:'input',samples:'output',reference:'reference',intermediate:'system',parameter:'reference'};
const presetMeaning={
 A01:{x:['input','输入信号'],H:['system','滤波响应'],y:['output','滤波输出'],X:['intermediate','输入频谱']},
 A04:{s:['input','发送信号'],r:['received','含噪接收信号'],h:['system','匹配滤波响应'],q:['reference','失配模板'],y:['output','相关输出'],matched:['output','匹配输出']},
 B01:{m:['message','消息信号'],s:['modulated','AM已调信号'],dsb:['modulated','DSB已调信号'],ssb:['modulated','SSB已调信号'],mixed:['intermediate','相干混频结果'],recovered:['output','解调输出'],envelope:['output','包络检波输出'],H:['system','解调低通']},
 E01:{x:['input','原信号'],samples:['samples','采样结果'],reconstructed:['output','重建波形']},
 C02:{a:['symbols','发送码元'],p:['system','成形脉冲'],x:['input','发送基带波形'],r:['received','接收基带波形'],samples:['samples','判决采样']},
 D01:{b:['input','发送比特'],s:['symbols','发送星座符号'],r:['received','接收星座符号'],wave:['modulated','已调带通波形'],decoded:['output','判决比特']}
};
export function describeSignal(obj,result,scene){
  const name=result?.name??obj.definition.split(/[=(]/)[0].trim(),type=result?.type;
  const preset=presetMeaning[scene?.theme]?.[name];let role=obj.role??preset?.[0];
  if(!role){
    if(type==='scalar'||(!result&&/^[\w]+\s*=\s*-?[\d.]+$/.test(obj.definition)))role='parameter';
    else if(/^(H|h)$/.test(name))role='system';
    else if(/^(m|message)$/.test(name))role='message';
    else if(/^(carrier|carr)$/.test(name))role='carrier';
    else if(/^(n|noise)$/.test(name))role='noise';
    else if(/^(r|received|noisy)$/.test(name))role='received';
    else if(/^(y|recovered|detected|decoded|reconstructed)$/.test(name))role='output';
    else if(/^(samples|sampled)$/.test(name))role='samples';
    else if(/^(q|template)$/.test(name))role='reference';
    else if(/^(s|dsb|ssb)$/.test(name)&&scene?.theme==='B01')role='modulated';
    else if(result?.modulation&&name!=='r')role='symbols';
    else if(/^(x|s|bits|data|input)$/.test(name))role='input';
    else role='intermediate';
  }
  if(!roleOptions[role])role='intermediate';
  const label=obj.label||preset?.[1]||roleOptions[role];
  return {role,label,symbol:name,stage:stageFor[role],title:`${label} · ${name}${result?.domain==='t'?'(t)':result?.domain==='f'?'(f)':''}`};
}
