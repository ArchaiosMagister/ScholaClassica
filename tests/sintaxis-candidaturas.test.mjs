import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const read=path=>readFileSync(join(root,path),'utf8');
const data=JSON.parse(read('docs/candidatos-sintaxis-appendix-2026-11-20.json'));
const syllabus=JSON.parse(read('vendor/appendix/assets/curriculum.json'));
const legacy=JSON.parse(read('vendor/vocabula/gramatica-contenidos.js')
 .split('window.GRAMMAR_CONTENT=')[1].trim().replace(/;\s*$/,''));
const expected={lat4:16,lat1:10,gr1:10};
const bounds={lat4:8,lat1:10,gr1:10};
const exceptions=new Set(['SIN-LAT1-04-020','SIN-LAT1-07-023']);

test('36 candidatas de sintaxis quedan exclusivamente en documentación pendiente de aprobación',()=>{
 assert.equal(data.schema,'schola-sintaxis-candidaturas/v1');
 assert.equal(data.status,'solo-propuesta-no-jugable');
 assert.equal(data.policy.appendOnlyIfApproved,true);
 assert.equal(data.policy.noStudentDeployment,true);
 assert.equal(data.policy.doNotReorderLegacyQuestions,true);
 assert.equal(data.policy.existingAcademicContentImmutable,true);
 assert.equal(data.candidates.length,36);
 assert.equal(data.count,36);
 assert.deepEqual(data.baseline,{source:'vendor/vocabula/gramatica-contenidos.js',
  total:84,syntaxTotal:27});
 assert.equal(legacy.questions.length,84);
 assert.equal(legacy.questions.filter(x=>x.c==='Sintaxis').length,27);
 assert.ok(!read('scripts/build-repaso-gramatica.mjs').includes('candidatos-sintaxis-appendix'),
  'Ninguna candidatura puede compilarse automáticamente en el módulo');
});

test('Propuestas únicas, corregibles, con procedencia curricular y unidades vigentes',()=>{
 const counter={lat4:0,lat1:0,gr1:0};
 const ids=new Set(),questions=new Set();
 for(const c of data.candidates){
  assert.ok(Object.hasOwn(expected,c.s),'Curso desconocido');
  assert.match(c.candidateId,/^SIN-(LAT4|LAT1|GR1)-\d{2}-\d{3}$/);
  assert.equal(c.c,'Sintaxis');
  assert.equal(c.review,'pendiente-aprobacion-docente');
  assert.ok(c.p.length>15&&c.a.length>1&&c.x.length>25);
  assert.ok(Array.isArray(c.w)&&c.w.length===3);
  assert.equal(new Set([c.a,...c.w]).size,4,'Opciones indistinguibles: '+c.candidateId);
  assert.ok(!ids.has(c.candidateId),'ID duplicado');ids.add(c.candidateId);
  assert.ok(!questions.has(c.s+c.u+c.p),'Pregunta duplicada');
  questions.add(c.s+c.u+c.p);
  assert.ok(!legacy.questions.some(q=>q.s===c.s&&q.u===c.u&&q.p===c.p),
   'Pregunta ya existente: '+c.candidateId);
  const n=Number(c.u.match(/^UD (\d+)$/)?.[1]);
  assert.ok(n>=1&&n<=bounds[c.s],'Unidad no impartida: '+c.candidateId);
  assert.ok(legacy.syllabi[c.s].some(([unit])=>unit===c.u));
  const topics=legacy.syllabi[c.s].find(([unit])=>unit===c.u)[1];
  assert.equal(c.alignment.topicMatchesLegacySyllabus,topics.includes(c.t));
  assert.equal(!topics.includes(c.t),exceptions.has(c.candidateId),
   'Un epígrafe ajeno al banco requiere decisión curricular individual');
  const corpus=c.s==='gr1'?'griego':'latin';
  assert.equal(c.source.file,'vendor/appendix/assets/curriculum.json');
  assert.equal(c.source.corpus,corpus);
  const sourceUnit=syllabus[corpus].units.find(z=>z.number===c.source.unit);
  assert.ok(sourceUnit,'Fuente sin unidad '+c.candidateId);
  assert.ok(sourceUnit.topics.some(z=>z.title===c.source.topic),
   'Tema no encontrado en Appendix: '+c.candidateId);
  if(c.source.additionalPage){
   const page=read(c.source.additionalPage);
   assert.ok(page.length>1000&&c.source.note,'Documento de apoyo incompleto');
  }
  assert.ok(['nuevo','acumulativo'].includes(c.scope));
  counter[c.s]++;
 }
 assert.deepEqual(counter,expected);
});

test('La propuesta no adelanta formas verbales en Latín 4.º UD1 y mantiene UD9-10 fuera',()=>{
 const lat4=data.candidates.filter(c=>c.s==='lat4');
 for(let n=1;n<=8;n++){
  assert.equal(lat4.filter(c=>c.u==='UD '+n).length,2,'Reparto incompleto UD'+n);
 }
 for(const c of lat4.filter(c=>c.u==='UD 1')){
  assert.doesNotMatch(c.p,/\b(?:amat|dat|laudat|videt|laborat|amabat|est)\b/i,
   'En UD1 el presente verbal aún no ha sido introducido');
 }
 assert.equal(data.candidates.filter(c=>c.s==='lat4'&&/UD (?:9|10)$/.test(c.u)).length,0);
});

test('Los dos epígrafes adicionales de Latín I precisan autorización docente',()=>{
 assert.deepEqual(data.candidates.filter(c=>!c.alignment.topicMatchesLegacySyllabus)
  .map(c=>c.candidateId).sort(),[...exceptions].sort());
 assert.deepEqual([...data.policy.extraReviewRequired].sort(),[...exceptions].sort());
 for(const id of exceptions){
  const c=data.candidates.find(x=>x.candidateId===id);
  assert.ok(c.alignment.requiredLegacyTopicUpdate);
  assert.equal(c.source.unit,Number(c.u.slice(3)));
 }
});
