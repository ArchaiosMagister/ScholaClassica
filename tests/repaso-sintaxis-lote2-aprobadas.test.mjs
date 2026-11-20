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
const first=JSON.parse(read('data/repaso-sintaxis-aprobadas.json'));
const second=JSON.parse(read('data/repaso-sintaxis-lote2-aprobadas.json'));
const candidates=JSON.parse(read('docs/candidatos-sintaxis-lote2-24-2026-11-20.json'));
const parse=source=>{
 const sandbox={window:{}};
 runInNewContext(source,sandbox);
 return JSON.parse(JSON.stringify(sandbox.window.GRAMMAR_CONTENT));
};
const initial=extendGrammarReview(original,first);
const canonical='Dativo complemento adjetival (también dativo de aproximación)';

test('Los 24 ejercicios se aprueban sin alterar 22 de las candidatas y corrigiendo únicamente los dos dativos',()=>{
 assert.equal(second.schema,'schola-sintaxis-lote2-aprobada/v1');
 assert.equal(second.originalQuestionCount,120);
 assert.equal(second.approvedQuestionCount,24);
 assert.equal(second.questions.length,24);
 assert.equal(candidates.candidates.length,24);
 assert.equal(second.nomenclature.primary,'Dativo complemento adjetival');
 assert.equal(second.nomenclature.alsoAccepted,'Dativo de aproximación');
 assert.deepEqual(second.nomenclature.appliesTo,[
  'SIN2-LAT1-04-003','SIN2-LAT1-04-004'
 ]);
 const fields=['s','u','t','c','p','a','w','x'];
 for(let i=0;i<24;i++){
  const input=candidates.candidates[i],approved=second.questions[i];
  assert.equal(input.candidateId,approved.candidateId);
  const changed=second.nomenclature.appliesTo.includes(approved.candidateId);
  for(const field of fields){
   if(changed&&['p','a','x'].includes(field))continue;
   assert.deepEqual(approved[field],input[field],
    'No se puede modificar otra respuesta aprobada sin decisión docente '+approved.candidateId);
  }
  if(changed){
   assert.equal(approved.a,canonical);
   assert.match(approved.p,/función sintáctica/);
   assert.match(approved.x,/dativo complemento adjetival/i);
   assert.match(approved.x,/dativo de aproximación/i);
   assert.equal(approved.w.length,3);
  }
 }
});

test('El motor concatena 84+36+24, conserva todos los índices y limita la categoría de dativo adjetival',()=>{
 const previous=parse(initial);
 const result=parse(extendGrammarReviewBatchTwo(initial,second));
 assert.equal(previous.questions.length,120);
 assert.equal(result.questions.length,144);
 assert.equal(result.questions.filter(q=>q.c==='Sintaxis').length,87);
 assert.deepEqual(result.questions.slice(0,120),previous.questions,
  'No se debe alterar el progreso asociado a concept-0…119');
 assert.deepEqual(result.syllabi,previous.syllabi,
  'El currículo original y las dos ampliaciones anteriores permanecen intactos');
 assert.deepEqual(result.questions.slice(120),
  second.questions.map(({candidateId,...question})=>question));
 for(const [id,index] of [['SIN2-LAT1-04-003',122],['SIN2-LAT1-04-004',123]]){
  const q=result.questions[index],approved=second.questions.find(x=>x.candidateId===id);
  assert.equal(q.p,approved.p);
  assert.equal(q.a,canonical);
  assert.ok(q.w.every(x=>x!==canonical));
 }
 assert.equal(result.questions.filter(q=>q.u==='UD 0').length,6);
 assert.deepEqual(parse(read('dist/apps/repaso-gramatica/gramatica-contenidos.js')),result);
 assert.ok(!read('vendor/vocabula/gramatica-contenidos.js').includes('SIN2-'));
 assert.ok(!read('dist/apps/vocabulario/index.html').includes('gramatica-contenidos.js'));
 const sw=read('dist/apps/repaso-gramatica/sw.js');
 assert.match(sw,/schola-repaso-gramatica-/);
});

test('El guardián bloquea modificaciones no autorizadas, duplicados, fuera de currículo y etiquetas erróneas',()=>{
 const alter=fn=>{const data=structuredClone(second);fn(data);return ()=>extendGrammarReviewBatchTwo(initial,data);};
 assert.throws(alter(x=>x.questions.pop()),/24/);
 assert.throws(alter(x=>x.questions[0].u='UD 11'),/Unidad fuera del currículo/);
 assert.throws(alter(x=>x.questions[0].candidateId=x.questions[1].candidateId),/repetido/i);
 assert.throws(alter(x=>x.questions[0].p=first.questions.find(q=>q.s==='lat1'&&q.u==='UD 1').p),/Pregunta duplicada/);
 assert.throws(alter(x=>x.questions[0].t='Tema inexistente'),/Epígrafe/);
 assert.throws(alter(x=>x.questions[0].w[0]=x.questions[0].a),/Opciones duplicadas/);
 assert.throws(alter(x=>x.questions.find(q=>q.candidateId==='SIN2-LAT1-04-003').a='Dativo de semejanza'),/dativo adjetival/);
 assert.throws(alter(x=>x.questions.find(q=>q.candidateId==='SIN2-LAT1-04-004').a='Dativo de aproximación'),/dativo adjetival/);
 assert.throws(alter(x=>x.nomenclature.alsoAccepted='Dativo posesivo'),/Dativo de aproximación/);
});
