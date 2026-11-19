import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {join,resolve} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const read=file=>readFileSync(join(root,file),'utf8');
const lock=JSON.parse(read('config/sources.lock.json')).sources;
const flows=['.github/workflows/integracion.yml','.github/workflows/lexicografia-lemlat3.yml'].map(read);
const sourceTrees={
 appendix:'ac24b5b997d3a37d78ef43de36085b850b22e472',
 evolutio:'91fb41736365ab4bd4f81ca8b265ceb765907354',
 vocabula:'4d801fa31917dc177ce248eff162a9ad545fae7a'
};
const commits={
 appendix:'6e9ae22d98c10f8752329d0fa65ad8dd882dcde9',
 evolutio:'901dacb125ee7894ea9d11faf7b0d0afa7e713b5',
 vocabula:'a7be2161a2401816ede78a96981daaac6850b8d2'
};
test('Ningún workflow descarga las tres fuentes independientes',()=>{
 for(const flow of flows){
  for(const key of Object.keys(sourceTrees)){
   assert.ok(!flow.includes('repository: '+lock[key].repository),key+' se descarga aún');
   assert.ok(!flow.includes('path: .sources/'+key));
   assert.ok(flow.includes('npm run audit:'+key+':vendor'),
     'Falta verificador interno '+key);
   assert.ok(flow.includes('test ! -d .sources/'+key),
     'Falta barrera de checkout '+key);
  }
 }
});
test('Fuentes completas con los SHA y árboles Git originales',()=>{
 for(const [key,tree] of Object.entries(sourceTrees)){
  assert.equal(lock[key].integrated,true);
  assert.equal(lock[key].sourceMode,'vendored');
  assert.equal(lock[key].path,'vendor/'+key);
  assert.equal(lock[key].sha,commits[key]);
  assert.equal(lock[key].treeSha,tree);
  const current=execFileSync('git',['-C',root,'rev-parse','HEAD:vendor/'+key],
    {encoding:'utf8'}).trim();
  assert.equal(current,tree,'Copia de '+key+' no idéntica al original');
 }
 assert.equal(lock.examenes.integrated,false);
});
