import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {join,resolve} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const read=file=>readFileSync(join(root,file),'utf8');
const lock=JSON.parse(read('config/sources.lock.json')).sources;
function checkoutRef(workflow,repository){
 const name=repository.split('/')[1];
 const regex=new RegExp('repository:\\s*ArchaiosMagister/'+name+'\\s+ref:\\s*([a-f0-9]{40})','g');
 const refs=[...workflow.matchAll(regex)].map(match=>match[1]);
 assert.equal(refs.length,1,'Checkout inexistente o duplicado: '+repository);
 return refs[0];
}
test('Los dos workflows fijan los SHA externos de Evolutio y Vocabula',()=>{
 const ci=read('.github/workflows/integracion.yml');
 const lemlat=read('.github/workflows/lexicografia-lemlat3.yml');
 for(const key of ['vocabula','evolutio']){
  assert.equal(checkoutRef(ci,lock[key].repository),lock[key].sha,'Integración desincronizada: '+key);
  assert.equal(checkoutRef(lemlat,lock[key].repository),lock[key].sha,'LEMLAT3 desincronizado: '+key);
 }
});
test('Appendix ya no precisa checkout externo y conserva todos los SHA originales',()=>{
 const ci=read('.github/workflows/integracion.yml');
 const lemlat=read('.github/workflows/lexicografia-lemlat3.yml');
 for(const workflow of [ci,lemlat]){
  assert.ok(!workflow.includes('repository: '+lock.appendix.repository));
  assert.ok(!workflow.includes('path: .sources/appendix'));
  assert.ok(workflow.includes('npm run audit:appendix:vendor'));
 }
 assert.equal(lock.appendix.sourceMode,'vendored');
 assert.equal(lock.appendix.path,'vendor/appendix');
 assert.equal(lock.appendix.treeSha,'ac24b5b997d3a37d78ef43de36085b850b22e472');
 assert.equal(lock.appendix.sha,'6e9ae22d98c10f8752329d0fa65ad8dd882dcde9');
 const tree=execFileSync('git',['-C',root,'rev-parse','HEAD:vendor/appendix'],{encoding:'utf8'}).trim();
 assert.equal(tree,lock.appendix.treeSha);
});
