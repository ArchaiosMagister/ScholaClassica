import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {assessOriginalDependencies} from '../scripts/audit-original-source-retirement.mjs';

const root=resolve(import.meta.dirname,'..');
const read=path=>readFileSync(join(root,path),'utf8');
const inputs=()=>[JSON.parse(read('config/sources.lock.json')),
 read('scripts/build.mjs'),read('.github/workflows/integracion.yml')];

test('Appendix y Vocabula internos; solo Evolutio requiere checkout externo',()=>{
 const report=assessOriginalDependencies(...inputs());
 assert.equal(report.schema,'schola-original-source-retirement-audit/v3');
 assert.deepEqual(report.integrated.map(x=>x.module),['appendix','evolutio','vocabula']);
 assert.deepEqual(report.integrated.map(x=>x.sourceMode),
  ['vendored','external_checkout','vendored']);
 assert.equal(report.sourceReposRequiredForBuild,1);
 assert.deepEqual(report.integrated.filter(x=>x.localVendorIncluded).map(x=>x.module),
  ['appendix','vocabula']);
 for(const d of report.integrated){
  assert.equal(d.safeToArchiveSource,false);
  assert.equal(d.safeToDeleteSource,false);
  assert.match(d.sha,/^[a-f0-9]{40}$/);
  assert.match(d.repository,/^ArchaiosMagister\//);
 }
 assert.equal(report.generalSafeToArchive,false);
 assert.equal(report.generalSafeToDelete,false);
 assert.equal(report.independent.integrated,false);
 assert.equal(report.independent.repository,'ArchaiosMagister/GeneradorExamenes');
});

test('La auditoría rechaza un Appendix interno sin verificación',()=>{
 const [lock,build,ci]=inputs();
 assert.throws(()=>assessOriginalDependencies(lock,
  build.replace("const source=join(root,'vendor/appendix');",
    "const source=join(root,'vendor/appendix-modificado');"),ci),
  /fuente interna verificada/);
 assert.throws(()=>assessOriginalDependencies(lock,build,
  ci.replace('npm run audit:appendix:vendor','npm run audit:appendix:omitido')),
  /fuente interna verificada/);
});

test('La auditoría impide un Vocabula sin verificador o con checkout reintroducido',()=>{
 const [lock,build,ci]=inputs();
 assert.throws(()=>assessOriginalDependencies(lock,
  build.replace("const vocabulaSource=join(root,'vendor/vocabula');",
    "const vocabulaSource=join(root,'vendor/vocabula-otro');"),ci),
  /fuente interna verificada/);
 assert.throws(()=>assessOriginalDependencies(lock,build,
  ci.replace('npm run audit:vocabula:vendor','npm run audit:vocabula:omitido')),
  /fuente interna verificada/);
 assert.throws(()=>assessOriginalDependencies(lock,build,
  ci+'\nrepository: ArchaiosMagister/VocabulaLatinaGraecaque\n'),
  /desacoplados/);
 const changed=structuredClone(lock);
 changed.sources.vocabula.treeSha='0'.repeat(40);
 // Aunque formalmente sea un SHA, debe estar anclado al verificador de integridad.
 assert.notEqual(changed.sources.vocabula.treeSha,lock.sources.vocabula.treeSha);
});
test('Evolutio sigue requiriendo el checkout externo fijado',()=>{
 const [lock,build,ci]=inputs();
 assert.throws(()=>assessOriginalDependencies(lock,build,
  ci.replace('repository: ArchaiosMagister/EvolucionFonetica','repository: OMITIDO')),
  /desacoplados/);
 assert.throws(()=>assessOriginalDependencies(lock,
  build.replace('const phonetics=resolve(process.env.EVOLUTIO_SOURCE',
    'const phonetics=resolve(process.env.OMITIDO'),ci),
  /desacoplados/);
});
