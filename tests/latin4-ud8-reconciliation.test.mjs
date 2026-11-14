import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {join,resolve} from 'node:path';
import {correctLatin4Vocabula} from '../scripts/latin4-lexical-editorial.mjs';
import {reconcileLatin4ExamUd8,LATIN4_UD8_EXAM_REVIEW}
  from '../scripts/latin4-ud8-reconciliation.mjs';

const root=resolve(import.meta.dirname,'..');
const fromJs=readFileSync(join(root,'.sources/vocabula/data.js'),'utf8');
const toJs=readFileSync(join(root,'dist/apps/vocabulario/data.js'),'utf8');
const parse=js=>JSON.parse(js.replace(/^window\.VOCAB\s*=\s*/u,'').replace(/;\s*$/u,''));
const original=parse(fromJs),built=parse(toJs);
const general=original.filter(e=>e.subject==='lat4'&&e.mode==='general');
const examen=original.filter(e=>e.subject==='lat4'&&e.mode==='examen');
const previous=examen.filter(e=>e.units.includes('UD 8–9'));
function scope(target,units,mode='examen'){
 const code=readFileSync(join(root,'dist/apps/vocabulario/scope.js'),'utf8');
 const context={module:{exports:{}}};
 runInNewContext(code,context);
 return context.module.exports.vocabularyForScope(target,'lat4',mode,units);
}
test('Las 17 palabras de Examen UD8–9 tienen una pareja explícita en General UD8',()=>{
 assert.equal(previous.length,17);
 assert.equal(LATIN4_UD8_EXAM_REVIEW.length,17);
 assert.deepEqual(LATIN4_UD8_EXAM_REVIEW.map(x=>x.examId).sort(),
   previous.map(x=>x.id).sort());
 for(const row of LATIN4_UD8_EXAM_REVIEW){
   const e=previous.find(x=>x.id===row.examId);
   const g=general.find(x=>x.id===row.generalId);
   assert.ok(e&&g,row.lemma);
   assert.ok(g.units.includes('UD 8'),row.lemma);
   assert.equal(e.meaning,g.meaning,row.lemma);
 }
});
test('La copia solo reasigna UD8 de examen y conserva IDs, glosas, respuestas y originales',()=>{
 assert.equal(original.length,2055);
 assert.equal(built.length,original.length);
 assert.deepEqual(built,reconcileLatin4ExamUd8(correctLatin4Vocabula(original)));
 const altered=built.filter((e,i)=>e.units.join('|')!==original[i].units.join('|'));
 assert.equal(altered.length,17);
 assert.equal(built.filter(e=>e.subject==='lat4'&&e.mode==='examen'&&
   e.units.includes('UD 8–9')).length,0);
 for(const e of altered){
   const from=original.find(x=>x.id===e.id);
   assert.deepEqual(e.units,['UD 8']);
   assert.deepEqual(e.curricularProvenance.originalUnits,['UD 8–9']);
   assert.ok(e.curricularProvenance.generalUnits.includes('UD 8'));
   assert.deepEqual(e.originals,from.originals);
   assert.deepEqual(e.answers,from.answers);
   assert.equal(e.meaning,from.meaning);
   assert.equal(e.mode,from.mode);
   assert.equal(e.subject,from.subject);
 }
 const sourceCounts=Object.fromEntries(['lat1','lat2','lat4','gr1'].map(key=>
   [key,original.filter(e=>e.subject===key).length]));
 assert.deepEqual(Object.fromEntries(['lat1','lat2','lat4','gr1'].map(key=>
   [key,built.filter(e=>e.subject===key).length])),sourceCounts);
});
test('Filtro Examen UD8 muestra las 17 fichas, sin filtrar General ni alterar UD10',()=>{
 assert.equal(scope(original,['UD 8']).length,0);
 const selected=scope(built,['UD 8']);
 assert.equal(selected.length,17);
 assert.deepEqual(selected.map(e=>e.id).sort(),previous.map(e=>e.id).sort());
 assert.equal(scope(built,['UD 8–9']).length,0);
 assert.equal(scope(built,['UD 8'],'general').length,
   scope(original,['UD 8'],'general').length);
 assert.equal(scope(built,['UD 10']).length,scope(original,['UD 10']).length);
 assert.equal(scope(built,['UD 9']).length,scope(original,['UD 9']).length);
});
test('Si falta o contradice evidencia curricular, se suspende toda la importación',()=>{
 const proof=general.find(g=>g.id===LATIN4_UD8_EXAM_REVIEW[0].generalId);
 const missing=original.filter(x=>x.id!==proof.id);
 assert.throws(()=>reconcileLatin4ExamUd8(correctLatin4Vocabula(missing)),
   /Falta pareja documental/);
 const malformed=original.map(x=>x.id===proof.id?
   {...x,units:['UD 9']}:x);
 assert.throws(()=>reconcileLatin4ExamUd8(correctLatin4Vocabula(malformed)),
   /No está acreditado en General UD8/);
 const changed=original.map(x=>x.id===proof.id?
   {...x,meaning:'glosa distinta'}:x);
 assert.throws(()=>reconcileLatin4ExamUd8(correctLatin4Vocabula(changed)),
   /Difieren las glosas/);
 const changedBlock=original.map(x=>x.id===previous[0].id?
   {...x,units:['UD 8']}:x);
 assert.throws(()=>reconcileLatin4ExamUd8(correctLatin4Vocabula(changedBlock)),
   /Cambió el bloque UD 8–9/);
});
