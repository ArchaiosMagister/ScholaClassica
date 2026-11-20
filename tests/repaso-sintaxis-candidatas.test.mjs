import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const read=p=>readFileSync(resolve(root,p),'utf8');
const doc=JSON.parse(read('docs/candidatos-sintaxis-appendix-2026-11-20.json'));
const curriculum=JSON.parse(read('vendor/appendix/assets/curriculum.json'));
const legacy=JSON.parse(read('vendor/vocabula/gramatica-contenidos.js')
  .split('window.GRAMMAR_CONTENT=')[1].trim().replace(/;\s*$/,''));

test('Propuestas de sintaxis aisladas, no aprobadas ni incorporadas al módulo',()=>{
 assert.equal(doc.schema,'schola-sintaxis-candidaturas/v1');
 assert.equal(doc.status,'solo-propuesta-no-jugable');
 assert.equal(doc.policy.appendOnlyIfApproved,true);
 assert.equal(doc.policy.noStudentDeployment,true);
 assert.equal(doc.baseline.total,84);
 assert.equal(legacy.questions.length,84);
 assert.equal(legacy.questions.filter(q=>q.c==='Sintaxis').length,27);
 assert.equal(doc.count,36);
 assert.equal(doc.candidates.length,36);
 for(const path of ['scripts/build.mjs','scripts/build-repaso-gramatica.mjs','public/app.js']){
  assert.ok(!read(path).includes('candidatos-sintaxis-appendix-2026-11-20.json'),
    'No se deben compilar candidaturas: '+path);
 }
});
test('El informe docente muestra las mismas 36 preguntas y soluciones que el JSON revisado',()=>{
 const report=read('docs/PROPUESTA_REPASO_SINTAXIS_APPENDIX_2026-11-20.md');
 for(const q of doc.candidates){
  const row='| '+q.u+' | '+q.p+' | '+q.a+' |';
  assert.ok(report.includes(row),'Informe desactualizado para '+q.candidateId);
 }
 const first=doc.candidates.filter(q=>q.s==='lat4'&&q.u==='UD 1');
 assert.equal(first.length,2);
 assert.ok(first.every(q=>!/(?:\\bamat\\b|\\bdat\\b|\\bvidet\\b)/u.test(q.p)),
  'UD1 de 4.º no debe adelantar el presente verbal de UD2');
});
test('Cobertura propuesta: 16 preguntas en las ocho UD de 4.º y diez por bachillerato',()=>{
 const tally=s=>doc.candidates.filter(q=>q.s===s);
 assert.equal(tally('lat4').length,16);
 assert.equal(tally('lat1').length,10);
 assert.equal(tally('gr1').length,10);
 for(let n=1;n<=8;n++)
  assert.equal(tally('lat4').filter(q=>q.u==='UD '+n).length,2);
 for(let n=1;n<=10;n++){
  assert.equal(tally('lat1').filter(q=>q.u==='UD '+n).length,1);
  assert.equal(tally('gr1').filter(q=>q.u==='UD '+n).length,1);
 }
 assert.ok(tally('lat4').every(q=>Number(q.u.slice(3))<=8));
 assert.ok(tally('gr1').every(q=>Number(q.u.slice(3))<=10));
});
test('Todas las candidaturas son preguntas autocorregibles trazadas al Appendix',()=>{
 const seenId=new Set(),seenPrompt=new Set(),missingTopics=[];
 for(const q of doc.candidates){
  assert.equal(q.review,'pendiente-aprobacion-docente');
  assert.equal(q.c,'Sintaxis');
  assert.ok(q.p.length>20&&q.a&&q.x.length>20);
  assert.equal(q.w.length,3);
  assert.equal(new Set([q.a,...q.w]).size,4,'Opciones contradictorias: '+q.candidateId);
  assert.ok(!seenId.has(q.candidateId));
  seenId.add(q.candidateId);
  const promptKey=q.s+'|'+q.u+'|'+q.p;
  assert.ok(!seenPrompt.has(promptKey));
  seenPrompt.add(promptKey);
  assert.ok(!legacy.questions.some(old=>old.s===q.s&&old.u===q.u&&old.p===q.p),
    'Pregunta ya presente en banco legado: '+q.candidateId);
  assert.ok(['nuevo','acumulativo'].includes(q.scope));
  assert.equal(q.source.file,'vendor/appendix/assets/curriculum.json');
  const unit=curriculum[q.source.corpus].units.find(v=>v.number===q.source.unit);
  assert.ok(unit&&unit.topics.some(topic=>topic.title===q.source.topic),
    'Fuente no comprobable: '+q.candidateId);
  assert.equal(typeof q.alignment.topicMatchesLegacySyllabus,'boolean');
  assert.ok(legacy.syllabi[q.s].some(([name])=>name===q.u));
  if(!q.alignment.topicMatchesLegacySyllabus)missingTopics.push(q.s+'|'+q.u+'|'+q.t);
 }
 assert.deepEqual(missingTopics,[
  'lat1|UD 4|Aposición y dativo de aproximación',
  'lat1|UD 7|Dativo posesivo'
 ]);
 assert.match(read('vendor/appendix/casos.html'),/Predicativo del sujeto/i);
});
