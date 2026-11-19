import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {analyzeSources,sourceReport} from '../scripts/check-source-updates.mjs';

const root=resolve(import.meta.dirname,'..');
const read=p=>JSON.parse(readFileSync(join(root,p),'utf8'));

test('Los tres avisos legados aprobados no alteran las fuentes académicas congeladas',()=>{
 const lock=read('config/sources.lock.json');
 const notices=read('config/legacy-transition-approved-heads.json');
 assert.equal(notices.schema,'schola-legacy-transition-heads/v1');
 const names=Object.keys(notices.approved).sort();
 assert.deepEqual(names,[
  'ArchaiosMagister/Appendix-grammaticae',
  'ArchaiosMagister/EvolucionFonetica',
  'ArchaiosMagister/VocabulaLatinaGraecaque'
 ]);
 const heads={};
 for(const [repo,approved] of Object.entries(notices.approved)){
  const src=Object.values(lock.sources).find(x=>x.repository===repo);
  assert.ok(src&&src.integrated,'Solo permitir orígenes académicos integrados');
  assert.equal(approved.kind,'legacy-transition');
  assert.equal(approved.pinned,src.sha);
  assert.match(approved.head,/^[0-9a-f]{40}$/);
  assert.notEqual(approved.head,approved.pinned);
  heads[repo]=approved.head;
 }
 const rows=analyzeSources(lock,heads,notices.approved);
 assert.equal(rows.length,3);
 assert.equal(rows.filter(x=>x.outdated).length,0);
 assert.equal(rows.filter(x=>x.legacyNoticeOnly).length,3);
 const report=sourceReport(rows);
 assert.match(report,/Sin cambios académicos pendientes/);
 assert.match(report,/Solo aviso legado auditado/);
 assert.doesNotMatch(report,/Revisión pendiente de \d+ fuente/);
});
test('El monitor sigue avisando ante un solo commit académico o un permiso mal anclado',()=>{
 const lock=read('config/sources.lock.json');
 const notices=read('config/legacy-transition-approved-heads.json');
 const heads=Object.fromEntries(Object.entries(notices.approved).map(([k,v])=>[k,v.head]));
 heads['ArchaiosMagister/EvolucionFonetica']='f'.repeat(40);
 const rows=analyzeSources(lock,heads,notices.approved);
 assert.equal(rows.filter(x=>x.outdated).length,1);
 assert.equal(rows.find(x=>x.id==='evolutio').legacyNoticeOnly,false);
 assert.match(sourceReport(rows),/Revisión pendiente de 1 fuente/);
 const broken=structuredClone(notices.approved);
 broken['ArchaiosMagister/Appendix-grammaticae'].pinned='0'.repeat(40);
 const again=analyzeSources(lock,heads,broken);
 assert.equal(again.find(x=>x.id==='appendix').outdated,true);
 assert.equal(again.filter(x=>x.outdated).length,2);
});
