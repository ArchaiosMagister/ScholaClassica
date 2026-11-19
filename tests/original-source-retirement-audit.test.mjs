import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {assessOriginalDependencies} from '../scripts/audit-original-source-retirement.mjs';

const root=resolve(import.meta.dirname,'..');
const read=p=>readFileSync(join(root,p),'utf8');
const get=()=>[JSON.parse(read('config/sources.lock.json')),
  read('scripts/build.mjs'),read('.github/workflows/integracion.yml')];

test('Las tres fuentes originales son internas: cero checkouts de los módulos',()=>{
 const report=assessOriginalDependencies(...get());
 assert.equal(report.schema,'schola-original-source-retirement-audit/v4');
 assert.deepEqual(report.integrated.map(x=>x.module),['appendix','evolutio','vocabula']);
 assert.deepEqual(report.integrated.map(x=>x.sourceMode),['vendored','vendored','vendored']);
 assert.equal(report.sourceReposRequiredForBuild,0);
 assert.deepEqual(report.integrated.filter(x=>x.localVendorIncluded).map(x=>x.module),
   ['appendix','evolutio','vocabula']);
 for(const x of report.integrated){
  assert.equal(x.compileAutonomous,true);
  assert.equal(x.workflowFetchesOriginal,false);
  assert.equal(x.buildUsesOriginal,false);
  assert.equal(x.safeToArchiveSource,false);
  assert.equal(x.safeToDeleteSource,false);
  assert.match(x.sha,/^[a-f0-9]{40}$/);
 }
 assert.equal(report.generalSafeToArchive,false);
 assert.equal(report.generalSafeToDelete,false);
 assert.equal(report.independent.integrated,false);
 assert.equal(report.independent.repository,'ArchaiosMagister/GeneradorExamenes');
});
test('Se detectan rutas internas inexistentes, falta de verificación y checkout reintroducido',()=>{
 const [lock,build,ci]=get();
 const cases=[
  ['appendix',"const source=join(root,'vendor/appendix');",'npm run audit:appendix:vendor'],
  ['evolutio',"const phonetics=join(root,'vendor/evolutio');",'npm run audit:evolutio:vendor'],
  ['vocabula',"const vocabulaSource=join(root,'vendor/vocabula');",'npm run audit:vocabula:vendor']
 ];
 for(const [key,buildAnchor,workflowAnchor] of cases){
  assert.throws(()=>assessOriginalDependencies(lock,build.replace(buildAnchor,
    buildAnchor.replace('/'+key,"/"+key+"-incorrecto")),ci),/fuente interna verificada/);
  assert.throws(()=>assessOriginalDependencies(lock,build,
    ci.replaceAll(workflowAnchor,workflowAnchor+'-disabled')),/fuente interna verificada/);
  assert.throws(()=>assessOriginalDependencies(lock,build,
    ci+'\nrepository: '+lock.sources[key].repository+'\n'),/desacoplados/);
 }
});
test('El auditor no permite desanclar los árboles o cambiar la declaración de fuente',()=>{
 const [lock,build,ci]=get();
 const change=structuredClone(lock);
 change.sources.evolutio.sourceMode='external_checkout';
 assert.throws(()=>assessOriginalDependencies(change,build,ci),/Lock de evolutio/);
 change.sources.evolutio.sourceMode='vendored';
 change.sources.evolutio.treeSha='';
 assert.throws(()=>assessOriginalDependencies(change,build,ci),/Lock de evolutio/);
});
