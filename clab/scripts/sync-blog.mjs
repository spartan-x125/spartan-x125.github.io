// Called by the blog's predev/prebuild hooks. Copies only generated public assets.
import {access,mkdir,copyFile,cp} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import './build-notes.mjs';
import './build-derivations.mjs';
const project=path.resolve(fileURLToPath(new URL('../',import.meta.url))),blog=path.dirname(project);
try{await access(path.join(blog,'astro.config.mjs'));}catch{throw new Error('请在博客根目录的 clab/ 源码目录中运行此同步脚本。');}
const destination=path.join(blog,'public','clab');
await mkdir(destination,{recursive:true});
await copyFile(path.join(project,'index.html'),path.join(destination,'app.html'));
await copyFile(path.join(project,'style.css'),path.join(destination,'style.css'));
for(const file of ['workbench.html','studio.css','insights.html','insights.css'])await copyFile(path.join(project,file),path.join(destination,file));
await copyFile(path.join(project,'.nojekyll'),path.join(destination,'.nojekyll'));
await cp(path.join(project,'src'),path.join(destination,'src'),{recursive:true});
await cp(path.join(project,'vendor'),path.join(destination,'vendor'),{recursive:true});
await cp(path.join(project,'notes'),path.join(destination,'notes'),{recursive:true});
console.log('Clab: 已将 clab/ 源码同步至 /clab/ 发布资源。');
