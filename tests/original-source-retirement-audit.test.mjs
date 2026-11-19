import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {assessOriginalDependencies} from '../scripts/audit-original-source-retirement.mjs';

const root=resolve(import.meta.dirname,'..');
const read=path=>readFileSync(join(root,path),'utf8');
const input=()=>[JSON.parse(read('config/sources.lock.json')),
 read('scripts/build.mjs'),read('.github/workflows/integracion.yml')];

test('Appendix tiene fuente interna; Evolutio y Vocabula conservan su checkout',()=>{
 const report=assessOriginalDependencies(...input());
 assert.equal(report.schema,'schola-original-source-retirement-audit/v2');
 assert.equal(report.integrated.length,3);
 assert.deepEqual(report.integrated.map(x=>x.module),['appendix','evolutio','vocabula']);
 assert.deepEqual(report.integrated.map(x=>x.sourceMode),['vendored','external_checkout','external_checkout']);
 assert.equal(report.sourceReposRequiredForBuild,2);
 assert.equal(report.integrated[0].compileAutonomous,true);
 assert.equal(report.integrated[0].localVendorIncluded,true);
 assert.equal(report.integrated[0].workflowFetchesOriginal,false);
 assert.equal(report.generalSafeToArchive,false);
 assert.equal(report.generalSafeToDelete,false);
 for(const dep of report.integrated){
  assert.equal(dep.safeToArchiveSource,false);
  assert.equal(dep.safeToDeleteSource,false);
  assert.match(dep.sha,/^[a-f0-9]{40}$/);
  assert.match(dep.repository,/^ArchaiosMagister\//);
 }
 assert.equal(report.independent.integrated,false);
 assert.equal(report.independent.repository,'ArchaiosMagister/GeneradorExamenes');
});
test('Fallar si Appendix pierde el vendor o vuelve a descargar un checkout inesperado',()=>{
 const [lock,build,ci]=input();
 assert.throws(()=>assessOriginalDependencies(lock,
   build.replace("const source=join(root,'vendor/appendix');",
     "const source=join(root,'vendor/appendix-incorrecto');"),ci),
   /fuente interna verificada/);
 assert.throws(()=>assessOriginalDependencies(lock,build,
   ci.replace('npm run audit:appendix:vendor','npm run audit:appendix:sin-verificar')),
   /fuente interna verificada/);
 assert.throws(()=>assessOriginalDependencies(lock,build,
   ci+'\nrepository: ArchaiosMagister/Appendix-grammaticae\n'),
   /desacoplados/);
});
test('Fallar si los checkouts activos dejan de coincidir con los orígenes fijados',()=>{
 const [lock,build,ci]=input();
 assert.throws(()=>assessOriginalDependencies(lock,build,
  ci.replace('repository: ArchaiosMagister/EvolucionFonetica','repository: OMITIDO')),
 /desacoplados/);
 assert.throws(()=>assessOriginalDependencies(lock,
  build.replace('const vocabulaSource=resolve(process.env.VOCABULA_SOURCE',
    'const vocabulaSource=resolve(process.env.OMITIDO'),ci),/desacoplados/);
});
