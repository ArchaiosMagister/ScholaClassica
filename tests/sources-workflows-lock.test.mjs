import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
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
test('Los dos workflows usan los SHA inmutables de sources.lock.json',()=>{
 const ci=read('.github/workflows/integracion.yml');
 const lemlat=read('.github/workflows/lexicografia-lemlat3.yml');
 for(const key of ['appendix','vocabula','evolutio']){
  assert.equal(checkoutRef(ci,lock[key].repository),lock[key].sha,'Integración desincronizada: '+key);
  assert.equal(checkoutRef(lemlat,lock[key].repository),lock[key].sha,'LEMLAT3 desincronizado: '+key);
 }
});
