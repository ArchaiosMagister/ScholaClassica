import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {runInNewContext} from 'node:vm';

const root=resolve(import.meta.dirname,'..');
const read=p=>readFileSync(resolve(root,p),'utf8');
const doc=JSON.parse(read('docs/candidatos-sintaxis-lote2-24-2026-11-20.json'));
const appendix=JSON.parse(read('vendor/appendix/assets/curriculum.json'));
const approved=JSON.parse(read('data/repaso-sintaxis-aprobadas.json'));
const source=JSON.parse(read('vendor/vocabula/gramatica-contenidos.js')
  .split('window.GRAMMAR_CONTENT=')[1].trim().replace(/;\s*$/,''));
const compiled=()=>{
 const sandbox={window:{}};
 runInNewContext(read('dist/apps/repaso-gramatica/gramatica-contenidos.js'),sandbox);
 return JSON.parse(JSON.stringify(sandbox.window.GRAMMAR_CONTENT));
};
const oldQuestionKeys=new Set([...source.questions,...approved.questions]
 .map(q=>q.s+'\0'+q.u+'\0'+q.p));

test('24 candidatas, tres cursos, sin aprobación ni cambios en el contenido publicado',()=>{
 assert.equal(doc.schema,'schola-sintaxis-candidaturas/v2');
 assert.equal(doc.status,'propuesta-docente-no-aprobada-no-jugable');
 assert.equal(doc.proposedCount,24);
 assert.equal(doc.candidates.length,24);
 assert.deepEqual(doc.bySubject,{lat1:12,gr1:8,lat4:4});
 assert.deepEqual(doc.baseline,
  {questions:120,syntax:63,originalLegacy:84,previousApproved:36});
 assert.equal(doc.guardrails.approvalRequired,true);
 assert.equal(doc.guardrails.noStudentDeployment,true);
 assert.equal(source.questions.length,84);
 assert.equal(approved.questions.length,36);
 const output=compiled();
 assert.equal(output.questions.length,120);
 assert.equal(output.questions.filter(q=>q.c==='Sintaxis').length,63);
 assert.deepEqual(output.questions.slice(0,84),source.questions);
 assert.deepEqual(output.questions.slice(84),
  approved.questions.map(({candidateId,...q})=>q));
 const key='candidatos-sintaxis-lote2-24-2026-11-20.json';
 for(const path of ['scripts/build.mjs','scripts/build-repaso-gramatica.mjs',
  'scripts/extend-repaso-sintaxis.mjs','public/app.js']){
  assert.ok(!read(path).includes(key),'No importar una candidatura: '+path);
 }
});

test('Todas las nuevas preguntas tienen cuatro respuestas posibles, unívocas y trazadas',()=>{
 const ids=new Set(),keys=new Set(),counts={lat1:0,gr1:0,lat4:0};
 for(const q of doc.candidates){
  assert.equal(q.review,'pendiente-aprobacion-docente',q.candidateId);
  assert.equal(q.c,'Sintaxis');
  assert.ok(q.candidateId.match(/^SIN2-(LAT1|LAT4|GR1)-\d{2}-\d{3}$/));
  assert.ok(!ids.has(q.candidateId));ids.add(q.candidateId);
  assert.ok(q.p.length>25&&q.a.length>3&&q.x.length>35,q.candidateId);
  assert.equal(q.w.length,3,q.candidateId);
  assert.equal(new Set([q.a,...q.w]).size,4,q.candidateId);
  const key=q.s+'\0'+q.u+'\0'+q.p;
  assert.ok(!keys.has(key)&&!oldQuestionKeys.has(key),'Pregunta ya existente: '+q.candidateId);
  keys.add(key);
  assert.ok(['nuevo','acumulativo'].includes(q.scope));
  assert.equal(q.source.file,'vendor/appendix/assets/curriculum.json');
  const unit=appendix[q.source.corpus].units.find(x=>x.number===q.source.unit);
  assert.ok(unit?.topics.some(x=>x.title===q.source.topic),q.candidateId);
  const extra=approved.extraTopics.filter(x=>x.subject===q.s&&x.unit===q.u)
   .map(x=>x.topic);
  const topics=source.syllabi[q.s].find(([name])=>name===q.u)?.[1]??[];
  assert.ok([...topics,...extra].includes(q.t),q.candidateId);
  counts[q.s]++;
  const nr=Number(q.u.replace('UD ',''));
  assert.ok(nr>=1&&nr<=(q.s==='lat4'?8:q.s==='lat1'?10:10),
   'No adelantar currículo en '+q.candidateId);
 }
 assert.deepEqual(counts,doc.bySubject);
});

test('Las dos memorias docentes contienen las 24 preguntas, soluciones y distractores',()=>{
 const matrix=read('docs/PROPUESTA_REPASO_SINTAXIS_LOTE2_2026-11-20.md');
 const report=read('docs/REVISION_REPASO_SINTAXIS_LOTE2_24_2026-11-20.md');
 for(const q of doc.candidates){
  for(const s of [q.candidateId,q.p,q.a]){
   assert.ok(matrix.includes(s),'Matriz desactualizada: '+q.candidateId+' / '+s);
   assert.ok(report.includes(s),'Informe desactualizado: '+q.candidateId+' / '+s);
  }
  for(const w of q.w)assert.ok(report.includes(w),'Falta distractor '+q.candidateId);
  assert.ok(report.includes(q.x),'Falta justificación '+q.candidateId);
 }
 assert.match(report,/pendientes de aprobación/);
});

test('Salvedades de secuenciación: Latin 4.º UD1 sin verbo finito y UD3 de griego acumulativa',()=>{
 const first=doc.candidates.filter(q=>q.s==='lat4'&&q.u==='UD 1');
 assert.equal(first.length,1);
 assert.match(first[0].p,/O puella/u);
 assert.ok(!/(?:\bamat\b|\bportat\b|\bvidet\b)/u.test(first[0].p));
 const gr3=doc.candidates.filter(q=>q.s==='gr1'&&q.u==='UD 3');
 assert.equal(gr3.length,2);
 assert.ok(gr3.every(q=>q.scope==='acumulativo'));
 assert.ok(!doc.candidates.some(q=>q.s==='gr1'&&Number(q.u.slice(3))>=11));
 const dativo=doc.candidates.filter(q=>q.s==='lat1'&&q.u==='UD 4'&&/urbi|filio/u.test(q.p));
 assert.equal(dativo.length,2);
 assert.ok(dativo.every(q=>q.source.topic==='Aposición y dativo de aproximación'));
});
