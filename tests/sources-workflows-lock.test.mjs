import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {join,resolve} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const read=file=>readFileSync(join(root,file),'utf8');
const lock=JSON.parse(read('config/sources.lock.json')).sources;
const flows=['.github/workflows/integracion.yml','.github/workflows/lexicografia-lemlat3.yml']
 .map(read);
const checkoutRef=(workflow,repository)=>{
 const name=repository.split('/')[1];
 const regex=new RegExp('repository:\\s*ArchaiosMagister/'+name+'\\s+ref:\\s*([a-f0-9]{40})','g');
 const refs=[...workflow.matchAll(regex)].map(x=>x[1]);
 assert.equal(refs.length,1,'Checkout ausente o duplicado: '+repository);
 return refs[0];
};

test('Solo Evolutio requiere checkout externo con el SHA inmutable en los dos workflows',()=>{
 for(const flow of flows){
  assert.equal(checkoutRef(flow,lock.evolutio.repository),lock.evolutio.sha);
  assert.ok(flow.includes('path: .sources/evolutio'));
  for(const key of ['appendix','vocabula']){
   assert.ok(!flow.includes('repository: '+lock[key].repository),
     key+': no debe descargarse el repositorio externo');
   assert.ok(!flow.includes('path: .sources/'+key));
   assert.ok(flow.includes('npm run audit:'+key+':vendor'));
   assert.ok(flow.includes('test ! -d .sources/'+key));
  }
 }
});
test('Appendix y Vocabula conservan los árboles fuente completos de Git',()=>{
 for(const [key,path,expected] of [
  ['appendix','vendor/appendix','ac24b5b997d3a37d78ef43de36085b850b22e472'],
  ['vocabula','vendor/vocabula','4d801fa31917dc177ce248eff162a9ad545fae7a']
 ]){
  assert.equal(lock[key].sourceMode,'vendored');
  assert.equal(lock[key].path,path);
  assert.equal(lock[key].treeSha,expected);
  const tree=execFileSync('git',['-C',root,'rev-parse','HEAD:'+path],{encoding:'utf8'}).trim();
  assert.equal(tree,expected);
 }
 assert.equal(lock.appendix.sha,'6e9ae22d98c10f8752329d0fa65ad8dd882dcde9');
 assert.equal(lock.vocabula.sha,'a7be2161a2401816ede78a96981daaac6850b8d2');
});
