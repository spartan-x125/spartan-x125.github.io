import {mkdir,copyFile,cp} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url)),dist=path.join(root,'dist');
await mkdir(dist,{recursive:true});
for(const file of ['index.html','style.css'])await copyFile(path.join(root,file),path.join(dist,file));
await cp(path.join(root,'src'),path.join(dist,'src'),{recursive:true});
await copyFile(path.join(root,'.nojekyll'),path.join(dist,'.nojekyll'));
console.log('Clab 静态文件已生成：'+dist);
