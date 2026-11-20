import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {runInNewContext} from 'node:vm';
import {extendGrammarReview} from '../scripts/extend-repaso-sintaxis.mjs';
import {extendGrammarReviewBatchTwo} from '../scripts/extend-repaso-sintaxis-lote2.mjs';

const root=resolve(import.meta.dirname,'..');
const read=path=>readFileSync(resolve(root,path),'utf8');
const original=read('vendor/vocabula/gramatica-contenidos.js');
const approval=JSON.parse(read('data/repaso-sintaxis-aprobadas.json'));
const review=JSON.parse(read('docs/candidatos-sintaxis-appendix-2026-11-20.json'));
const parse=source=>{
 const sandbox={window:{}};
 runInNewContext(source,sandbox);
 return JSON.parse(JSON.stringify(sandbox.window.GRAMMAR_CONTENT));
};

test('Aprobación de las 36 candidatas, con equivalencia exacta respecto al lote revisado',()=>{
 assert.equal(approval.schema,'schola-sintaxis-aprobada/v1');
 assert.equal(approval.originalQuestionCount,84);
 assert.equal(approval.approvedQuestionCount,36);
 assert.equal(approval.questions.length,36);
 assert.equal(review.candidates.length,36);
 const names=['s','u','t','c','p','a','w','x'];
 for(let i=0;i<approval.questions.length;i++){
  const question=approval.questions[i],reviewed=review.candidates[i];
  assert.equal(question.candidateId,reviewed.candidateId);
  assert.deepEqual(Object.fromEntries(names.map(k=>[k,question[k]])),
   Object.fromEntries(names.map(k=>[k,reviewed[k]])),
   'No modificar silenciosamente un contenido ya aprobado: '+question.candidateId);
 }
 assert.deepEqual(approval.extraTopics,[
  {subject:'lat1',unit:'UD 4',topic:'Aposición y dativo de aproximación'},
  {subject:'lat1',unit:'UD 7',topic:'Dativo posesivo'}
 ]);
});

test('La adaptación solo cambia el artefacto: 84 IDs estables y 36 preguntas nuevas al final',()=>{
 const source=parse(original),generated=parse(extendGrammarReview(original,approval));
 assert.equal(source.questions.length,84);
 assert.equal(generated.questions.length,120);
 assert.deepEqual(generated.questions.slice(0,84),source.questions);
 assert.deepEqual(generated.questions.slice(84),approval.questions.map(({candidateId,...q})=>q));
 assert.equal(generated.questions.filter(q=>q.c==='Sintaxis').length,63);
 for(let i=0;i<84;i++){
  const before=source.questions[i],after=generated.questions[i];
  assert.equal(before.s+'|'+before.u+'|concept-'+i,after.s+'|'+after.u+'|concept-'+i);
 }
 assert.deepEqual(generated.syllabi.gr1,source.syllabi.gr1);
 assert.deepEqual(generated.syllabi.lat4,source.syllabi.lat4);
 for(const n of [4,7]){
  const old=source.syllabi.lat1.find(([u])=>u==='UD '+n)[1];
  const current=generated.syllabi.lat1.find(([u])=>u==='UD '+n)[1];
  assert.deepEqual(current.slice(0,old.length),old,'Epígrafes precedentes intactos');
  assert.equal(current.length,old.length+1);
 }
});

test('Errores futuros en listas, asignación, duplicados y permisos bloquean la ampliación',()=>{
 const alter=fn=>{const p=structuredClone(approval);fn(p);return ()=>extendGrammarReview(original,p);};
 assert.throws(alter(p=>p.questions.pop()),/36/);
 assert.throws(alter(p=>p.questions[0].u='UD 9'),/Unidad fuera del currículo/);
 assert.throws(alter(p=>p.questions[0].candidateId=p.questions[1].candidateId),/duplicado/i);
 assert.throws(alter(p=>p.questions[0].w[0]=p.questions[0].a),/Opciones duplicadas/);
 assert.throws(alter(p=>p.questions[0].t='Tema inexistente'),/Tema fuera del temario/);
 assert.throws(alter(p=>p.extraTopics.pop()),/temas/);
});

test('El despliegue incorpora exactamente lo aprobado y no introduce datos docentes privados',()=>{
 const dist=read('dist/apps/repaso-gramatica/gramatica-contenidos.js');
 const second=JSON.parse(read('data/repaso-sintaxis-lote2-aprobadas.json'));
 const transformed=parse(extendGrammarReviewBatchTwo(extendGrammarReview(original,approval),second));
 assert.deepEqual(parse(dist),transformed);
 assert.ok(!dist.includes('sourceCandidateId'));
 const v=read('dist/apps/vocabulario/index.html');
 assert.doesNotMatch(v,/gramatica-contenidos\.js/);
 const sw=read('dist/apps/repaso-gramatica/sw.js');
 assert.match(sw,/schola-repaso-gramatica-/);
 assert.match(sw,/gramatica-contenidos\.js/);
});
