import katex from '../vendor/katex/katex.js';
import {splitMathText} from './inline-tex.js';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderFormula(tex,{display=true}={}){
 const spaced=tex.replaceAll('\\\\','\\\\[.45em]');
 const source=display?'\\begin{gathered}'+spaced+'\\end{gathered}':tex;
 return katex.renderToString(source,{displayMode:display,throwOnError:true,strict:'ignore',trust:false,output:'htmlAndMathml'});
}
export const formulaBlock=tex=>'<div class="formula math-block" tabindex="0" aria-label="数学公式">'+renderFormula(tex)+'</div>';
// Explicit inline TeX can be used in explanatory prose without interpreting user input as HTML.
export function mathProse(text,{displayStyle=false}={}){const render=tex=>{try{return renderFormula((displayStyle?'\\displaystyle ':'')+tex,{display:false});}catch{return escape(tex);}};return String(text).split(/(\$[^$\n]+\$)/g).map(s=>s.startsWith('$')&&s.endsWith('$')?render(s.slice(1,-1)):splitMathText(s).map(part=>part.tex?render(part.tex):escape(part.text)).join('')).join('');}
