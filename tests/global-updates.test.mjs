import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {buildGlobalUpdates} from '../scripts/build-global-updates.mjs';

test('el inventario detecta módulos presentes y futuros y verifica su versión',async()=>{
 const out=await mkdtemp(join(tmpdir(),'schola-global-'));
 try{
  for(const id of ['modificacion-preverbial','futuro']){
   await mkdir(join(out,'apps',id),{recursive:true});
   await writeFile(join(out,'apps',id,'index.html'),'<h1>'+id+'</h1>');
   await writeFile(join(out,'apps',id,'app.mjs'),'export const version=1;');
  }
  const list=await buildGlobalUpdates(out);
  assert.deepEqual(list.map(m=>m.id),['futuro','modificacion-preverbial']);
  assert.deepEqual(JSON.parse(await readFile(join(out,'global-updates.json'),'utf8')),{schema:1,modules:list});
  const worker=await readFile(join(out,'apps/futuro/sw.js'),'utf8');
  assert.match(worker,/schola-futuro-global-/);
  assert.match(worker,/SCHOLA_GLOBAL_ACTIVATE/);
  assert.match(worker,/SCHOLA_GLOBAL_VERSION/);
  assert.ok(worker.includes(list[0].revision));
  assert.match(worker,/startsWith\(PREFIX\)/);
  assert.match(worker,/includeUncontrolled:true/);
  assert.doesNotMatch(worker,/localStorage|indexedDB|sessionStorage/);
  // Simula otra compilación limpia de un módulo cuyo código ha cambiado.
  for(const id of ['futuro','modificacion-preverbial'])await rm(join(out,'apps',id,'sw.js'));
  await writeFile(join(out,'apps/futuro/app.mjs'),'export const version=2;');
  const next=await buildGlobalUpdates(out);
  assert.notEqual(next[0].revision,list[0].revision);
  assert.equal(next[1].revision,list[1].revision);
 }finally{await rm(out,{recursive:true,force:true});}
});
