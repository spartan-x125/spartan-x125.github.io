export function removeGraphItem(graph,{nodeId,edgeIndex}={}){
 const next=structuredClone(graph);
 if(Number.isInteger(edgeIndex)&&edgeIndex>=0&&edgeIndex<next.edges.length)next.edges.splice(edgeIndex,1);
 else if(nodeId&&next.nodes.some(n=>n.id===nodeId)){next.nodes=next.nodes.filter(n=>n.id!==nodeId);next.edges=next.edges.filter(e=>e.from!==nodeId&&e.to!==nodeId);}
 else return null;
 return next;
}
export function disconnectGraphNode(graph,id,direction='all'){
 const next=structuredClone(graph);
 next.edges=next.edges.filter(e=>(direction==='input'||direction==='all'?e.to!==id:true)&&(direction==='output'||direction==='all'?e.from!==id:true));
 return next.edges.length===graph.edges.length?null:next;
}
