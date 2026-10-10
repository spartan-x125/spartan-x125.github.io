import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const argument=(name,fallback)=>{const index=process.argv.indexOf(name);return index>=0?process.argv[index+1]:fallback;};
const projectRoot=path.resolve(fileURLToPath(new URL('../',import.meta.url))),root=path.resolve(argument('--root',projectRoot)),port=Number(argument('--port',process.env.PORT??4173)),standalone=root.toLowerCase()===projectRoot.toLowerCase();
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8'};
http.createServer(async(req,res)=>{
  try{
    let pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    // Also exercise GitHub Pages subpath behavior in the standalone preview.
    if(pathname==='/clab'){res.writeHead(302,{Location:'/clab/'});res.end();return;}
    if(standalone&&pathname.startsWith('/clab/'))pathname=pathname.slice(5);
    const target=path.resolve(root,'.'+pathname);
    if(target!==root&&!target.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
    const file=(await stat(target)).isDirectory()?path.join(target,'index.html'):target;
    const bytes=await readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]??'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(bytes);
  }catch{res.writeHead(404);res.end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}/clab/`));
