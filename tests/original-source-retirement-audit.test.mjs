import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {assessOriginalDependencies} from '../scripts/audit-original-source-retirement.mjs';

const root=resolve(import.meta.dirname,'..');
const read=path=>readFileSync(join(root,path),'utf8');

test('Los originales siguen fijados a commits y la compilación castellana requiere su código',()=>{
 const lock=JSON.parse(read('config/sources.lock.json'));
 const report=assessOriginalDependencies(lock,read('scripts/build.mjs'),read('.github/workflows/integracion.yml'));
 assert.equal(report.schema,'schola-original-source-retirement-audit/v1');
 assert.equal(report.integrated.length,3);
 assert.equal(new Set(report.integrated.map(x=>x.repository)).size,3);
 assert.deepEqual(report.integrated.map(x=>x.module),['appendix','evolutio','vocabula']);
 assert.equal(report.sourceReposRequiredForBuild,3);
 assert.equal(report.generalSafeToDelete,false);
 for(const dependency of report.integrated){
  assert.equal(dependency.buildUsesOriginal,true);
  assert.equal(dependency.workflowFetchesOriginal,true);
  assert.equal(dependency.safeToDeleteSource,false);
  assert.match(dependency.sha,/^[a-f0-9]{40}$/);
  assert.match(dependency.repository,/^ArchaiosMagister\//);
 }
 assert.equal(report.independent.integrated,false);
 assert.equal(report.independent.repository,'ArchaiosMagister/GeneradorExamenes');
});
test('El auditor detecta dependencias sin checkout correspondiente en el workflow',()=>{
 const lock=JSON.parse(read('config/sources.lock.json'));
 const build=read('scripts/build.mjs');
 const ci=read('.github/workflows/integracion.yml');
 assert.throws(()=>assessOriginalDependencies(lock,build,ci.replace('repository: ArchaiosMagister/Appendix-grammaticae','repository: NO-CHECKOUT')),
  /desacoplado/);
 const removed=build.replace('const phonetics=resolve(process.env.EVOLUTIO_SOURCE','const phonetics=resolve(process.env.RETIRED_SOURCE');
 assert.throws(()=>assessOriginalDependencies(lock,removed,ci),/desacoplado/);
});
