// Local integration only. This script never invokes Git or performs network writes.
import {readFile,writeFile,cp,mkdir,access,copyFile,unlink} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
let blog=path.dirname(root);
try{await access(path.join(blog,'astro.config.mjs'));}catch{blog='D:/code/PersonalBlog/spartan-x125.github.io';}
await access(path.join(blog,'astro.config.mjs'));
const sourceDirectory=path.join(blog,'clab');
// A self-contained source folder; no Git metadata, build output, or editor state.
if(root.toLowerCase()!==sourceDirectory.toLowerCase()){
  await mkdir(sourceDirectory,{recursive:true});
  for(const file of ['index.html','style.css','src','tests','scripts','REQUIREMENTS.md','README.md','VALIDATION.md','package.json','.gitignore','.nojekyll'])await cp(path.join(root,file),path.join(sourceDirectory,file),{recursive:true});
}
const destination=path.join(blog,'public','clab');
await mkdir(destination,{recursive:true});
await cp(path.join(root,'dist'),destination,{recursive:true});
// Keep the source document under a different filename from Astro's output.
// These are generated Clab files, never user-authored blog content.
await copyFile(path.join(destination,'index.html'),path.join(destination,'app.html'));
await unlink(path.join(destination,'index.html'));
const edits=[
  ['src/components/SiteHeader.astro',"  { name: '关于我', url: '/about/', icon: 'user' },","  { name: '关于我', url: '/about/', icon: 'user' },\n  { name: 'Clab 通信实验室', url: '/clab/', icon: 'wave' },"],
  ['src/data/desktopIcons.ts',"  archive: 'M4 3h16v4H4zM5 7v14h14V7M9 11h6M10 15h4',","  archive: 'M4 3h16v4H4zM5 7v14h14V7M9 11h6M10 15h4',\n  wave: 'M2 12Q7 0 12 12T22 12M2 21h20M3 3v18',"],
  ['public/desktop.js',"|updates\\/?$)/", "|updates\\/?$|clab(?:\\/|$))/"],
  ['public/desktop.js',"width: url.startsWith('/posts/') && url !== '/posts/' ? 720 : 610", "width: url.startsWith('/clab') ? 1100 : url.startsWith('/posts/') && url !== '/posts/' ? 720 : 610"],
  ['public/desktop.js',"const name = $('main h1', doc)?.textContent || $('main .feed h2', doc)?.textContent || win.title;", "const name = url.startsWith('/clab') ? 'Clab · 通信实验室' : $('main h1', doc)?.textContent || $('main .feed h2', doc)?.textContent || win.title;"],
  ['.github/workflows/deploy.yml','path: ./dist','path: ./docs']
];
// Check all replacements before changing any existing source files.
const contents=new Map();
for(const [file,before,after]of edits){const absolute=path.join(blog,file);let source=contents.get(absolute)??await readFile(absolute,'utf8');if(source.includes(after))continue;if(!source.includes(before))throw new Error(`预期片段不存在，请手动检查 ${file}`);source=source.replace(before,after);contents.set(absolute,source);}
for(const [file,source]of contents)await writeFile(file,source);
// Astro's dev server serves public files by filename, not directory index.
// Prerender this thin entry to the same static /clab/index.html in production.
const entry=path.join(blog,'src/pages/clab/index.astro');
const route="---\n// Clab static entry: reads the self-contained public app only during dev/build.\nimport { readFile } from 'node:fs/promises';\nimport { resolve } from 'node:path';\nconst html = (await readFile(resolve('public/clab/app.html'), 'utf8')).replace('<head>', '<head><base href=\"/clab/\">');\n---\n<Fragment set:html={html} />\n";
let currentEntry=null;try{currentEntry=await readFile(entry,'utf8');}catch(error){if(error.code!=='ENOENT')throw error;}
if(currentEntry&&currentEntry!==route&&!currentEntry.includes('// Clab static entry:'))throw new Error('已有 /clab 路由，请检查后再合并');
await mkdir(path.dirname(entry),{recursive:true});await writeFile(entry,route);
const packagePath=path.join(blog,'package.json'),blogPackage=JSON.parse(await readFile(packagePath,'utf8'));
blogPackage.scripts['sync:clab']='node clab/scripts/sync-blog.mjs';
for(const hook of ['predev','prebuild']){
  const original=blogPackage.scripts[hook];
  if(original&&!original.includes('sync:clab'))throw new Error(`已有 ${hook}，请检查后合并 Clab 同步步骤`);
  blogPackage.scripts[hook]='npm run sync:clab';
}
await writeFile(packagePath,JSON.stringify(blogPackage,null,2)+'\n');
console.log('已在本地接入 /clab/，并添加博客启动器入口；未执行提交或推送。');
