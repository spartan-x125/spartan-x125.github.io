export const NODE_WIDTH=164,NODE_HEIGHT=120,GRID=20;
export const snap=v=>Math.round(v/GRID)*GRID;
export function freePlacement(nodes,x,y){const fits=(a,b)=>a>=0&&b>=0&&nodes.every(n=>a+NODE_WIDTH+16<=n.x||n.x+NODE_WIDTH+16<=a||b+NODE_HEIGHT+16<=n.y||n.y+NODE_HEIGHT+16<=b);x=Math.max(0,snap(x));y=Math.max(0,snap(y));for(let r=0;r<30;r++)for(let dx=-r;dx<=r;dx++)for(const dy of r===0?[0]:[-r,r]){const a=x+dx*GRID,b=y+dy*GRID;if(fits(a,b))return [a,b];}return [x,y+700];}
export const portPoint=(node,port)=>[node.x+(port==='out'?NODE_WIDTH:0),node.y+64+(port==='out'?0:Number(port)*28)];
export function orthogonalWire(a,b,nodes=[]){
 if(nodes.length)return routeWire(a,b,nodes);
 const lead=24;
 if(b[0]>a[0]+2*lead){const middle=snap((a[0]+b[0])/2);return `M${a}H${middle}V${b[1]}H${b[0]}`;}
 const bypass=Math.max(a[1],b[1])+64;return `M${a}H${a[0]+lead}V${bypass}H${b[0]-lead}V${b[1]}H${b[0]}`;
}

// Keep the primary signal path in one row; auxiliary sources sit beside their consumer.
export function arrangeGraph(graph){
 const next=structuredClone(graph),nodes=next.nodes,byId=new Map(nodes.map(n=>[n.id,n])),memo=new Map();
 const path=id=>{if(memo.has(id))return memo.get(id);const incoming=next.edges.filter(e=>e.to===id).sort((a,b)=>a.port-b.port);const parent=incoming[0];const result=parent?[...path(parent.from),id]:[id];memo.set(id,result);return result;};
 const sinks=nodes.filter(n=>!next.edges.some(e=>e.from===n.id)),rank=n=>(n.type==='output'?100:0)+path(n.id).length;
 const sink=sinks.sort((a,b)=>rank(b)-rank(a))[0];if(!sink)return {...next,layoutVersion:2};
 const main=path(sink.id),placed=new Set(),occupied=new Map();
 const put=(id,column,row)=>{while(occupied.has(column+':'+row))row++;const n=byId.get(id);n.x=40+column*220;n.y=60+row*200;placed.add(id);occupied.set(column+':'+row,id);};
 main.forEach((id,column)=>put(id,column,0));
 const explored=new Set(),placeInputs=id=>{if(explored.has(id))return;explored.add(id);const n=byId.get(id),column=Math.round((n.x-40)/220);for(const e of next.edges.filter(e=>e.to===id).sort((a,b)=>a.port-b.port)){if(!placed.has(e.from))put(e.from,Math.max(0,column-1),Math.max(1,Math.round((n.y-60)/200)));placeInputs(e.from);}};
 main.forEach(placeInputs);
 for(const n of nodes)if(!placed.has(n.id)){const parent=next.edges.find(e=>e.to===n.id&&placed.has(e.from)),column=parent?Math.round((byId.get(parent.from).x-40)/220)+1:0;put(n.id,column,1);placeInputs(n.id);}
 return {...next,layoutVersion:2};
}

// Test simple orthogonal channels first, then use an obstacle-aware visibility grid.
function routeWire(a,b,nodes){
 const lead=20,start=[a[0]+lead,a[1]],end=[b[0]-lead,b[1]],pad=10;
 const boxes=nodes.map(n=>[n.x-pad,n.y-pad,n.x+NODE_WIDTH+pad,n.y+NODE_HEIGHT+pad]);
 const clear=(p,q)=>boxes.every(([l,t,r,b])=>p[0]===q[0]?!(p[0]>l&&p[0]<r&&Math.max(p[1],q[1])>t&&Math.min(p[1],q[1])<b):!(p[1]>t&&p[1]<b&&Math.max(p[0],q[0])>l&&Math.min(p[0],q[0])<r));
 const simplify=points=>points.filter((p,i)=>!i||p[0]!==points[i-1][0]||p[1]!==points[i-1][1]).filter((p,i,all)=>!i||i===all.length-1||!((all[i-1][0]===p[0]&&p[0]===all[i+1][0])||(all[i-1][1]===p[1]&&p[1]===all[i+1][1])));
 const candidates=[[start,[end[0],start[1]],end],[start,[start[0],end[1]],end]];
 for(const y of [...new Set(boxes.flatMap(box=>[box[1]-10,box[3]+10]))])candidates.push([start,[start[0],y],[end[0],y],end]);
 const valid=candidates.filter(p=>p.slice(1).every((q,i)=>clear(p[i],q))),cost=p=>p.slice(1).reduce((v,q,i)=>v+Math.abs(p[i][0]-q[0])+Math.abs(p[i][1]-q[1])+18,0);
 let route=valid.sort((p,q)=>cost(p)-cost(q))[0];
 if(!route){
  const xs=[...new Set([start[0],end[0],...boxes.flatMap(b=>[b[0]-10,b[2]+10])])].sort((x,y)=>x-y),ys=[...new Set([start[1],end[1],...boxes.flatMap(b=>[b[1]-10,b[3]+10])])].sort((x,y)=>x-y);
  const key=(x,y,d)=>`${x},${y},${d}`,queue=[{x:xs.indexOf(start[0]),y:ys.indexOf(start[1]),d:0,g:0,points:[start]}],best=new Map();
  while(queue.length){queue.sort((p,q)=>p.g+Math.abs(xs[p.x]-end[0])+Math.abs(ys[p.y]-end[1])-q.g-Math.abs(xs[q.x]-end[0])-Math.abs(ys[q.y]-end[1]));const p=queue.shift(),point=[xs[p.x],ys[p.y]];if(point[0]===end[0]&&point[1]===end[1]){route=p.points;break;}
   for(const [dx,dy,d]of [[-1,0,1],[1,0,1],[0,-1,2],[0,1,2]]){const x=p.x+dx,y=p.y+dy;if(x<0||x>=xs.length||y<0||y>=ys.length)continue;const q=[xs[x],ys[y]];if(!clear(point,q))continue;const g=p.g+Math.abs(q[0]-point[0])+Math.abs(q[1]-point[1])+(p.d&&p.d!==d?18:0),k=key(x,y,d);if(g>=(best.get(k)??Infinity))continue;best.set(k,g);queue.push({x,y,d,g,points:[...p.points,q]});}
  }
 }
 const points=simplify([a,...(route??[start,[start[0],end[1]],end]),b]);
 return points.map((p,i)=>!i?`M${p}`:p[0]===points[i-1][0]?`V${p[1]}`:`H${p[0]}`).join('');
}
export const screenToWorld=(point,camera)=>[(point[0]-camera.x)/camera.zoom,(point[1]-camera.y)/camera.zoom];
export function zoomAt(camera,factor,point){const before=screenToWorld(point,camera),zoom=Math.max(.025,Math.min(1.8,camera.zoom*factor));return {zoom,x:point[0]-before[0]*zoom,y:point[1]-before[1]*zoom};}
export function fitCamera(nodes,width,height){if(!nodes.length)return {x:40,y:40,zoom:1};const xs=nodes.map(n=>n.x),ys=nodes.map(n=>n.y),minx=Math.min(...xs)-40,miny=Math.min(...ys)-40,w=Math.max(...xs)-minx+NODE_WIDTH+40,h=Math.max(...ys)-miny+NODE_HEIGHT+40,zoom=Math.max(.025,Math.min(1.1,width/w,height/h));return {zoom,x:(width-w*zoom)/2-minx*zoom,y:(height-h*zoom)/2-miny*zoom};}
