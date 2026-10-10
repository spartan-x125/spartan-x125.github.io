import {computeScene} from './engine.js';
const cache=new Map();
let frozenKey=null,frozenResult=null;
self.onmessage=({data:{id,scene}})=>{
  try {
    const result=computeScene(scene,cache,(done,total)=>self.postMessage({id,progress:{done,total}}));
    if(scene.frozen){const key=JSON.stringify(scene.frozen.scene);if(key!==frozenKey){frozenResult=computeScene(scene.frozen.scene);frozenKey=key;}result.frozen=frozenResult;}
    self.postMessage({id,result});
  }
  catch(error){self.postMessage({id,fatal:error.message});}
};
