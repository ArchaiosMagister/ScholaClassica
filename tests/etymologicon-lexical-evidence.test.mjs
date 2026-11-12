import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {compileTeacherAudit} from '../scripts/compile-etymologicon-gr1.mjs';

test('55 glosas escolares se vinculan por lema y no suplantan una comprobación lexicográfica',()=>{
 const c=compileTeacherAudit();
 const escolar=c.etymons.filter(e=>e.meaningEvidence?.kind==='teacher_curriculum');
 assert.equal(escolar.length,55);
 assert.equal(escolar.filter(x=>x.meaning!==null).length,55);
 assert.equal(escolar.filter(x=>x.meaningCompletionEvidence?.components&&x.meaningEvidence.status==='partial_compound').length,4);
 assert.ok(escolar.every(e=>!e.meaningEvidence.lexicographicConfirmation));
 assert.equal(c.summary.greekMeaningsFromTeacherCurriculum,51);
});
test('significados adicionales externos están relacionados con la misma entrada griega',()=>{
 const c=compileTeacherAudit();
 const expected=[['grc:κρατοσ','poder'],['grc:εργον','trabajo'],['grc:χρονοσ','tiempo'],['grc:δοξα','opinión'],['grc:καρδια','corazón'],['grc:ατελησ','incompleto']];
 for(const [id,term] of expected){
   const item=c.etymons.find(e=>e.id===id);
   assert.ok(item,'Étimo faltante: '+id);
   assert.ok(item.meaning.includes(term));
   assert.equal(item.meaningEvidence.status,'externally_checked');
   assert.equal(item.independentLexicographicReview,true);
 }
 assert.equal(c.summary.greekMeaningsFromExternalLexicons,107);
 assert.equal(c.summary.greekMeaningsCompleted,111);
 assert.equal(c.summary.greekMeaningsPending,0);
});
test('solo las definiciones contrastadas tienen revisión externa; la atelocardia solo consta registrada',()=>{
 const c=compileTeacherAudit();
 assert.equal(c.summary.dictionarySourcesIndependentlyChecked,7);
 assert.equal(c.summary.spanishEntriesOnlyAttested,1);
 const get=w=>c.derivatives.find(x=>x.form===w);
 for(const word of ['prosodia','prosélito','atelectasia','helioterapia','seudónimo','políglota','geniogloso']){
   const d=get(word);
   assert.ok(d);
   assert.ok(['confirmed','confirmed_specialized_not_DLE'].includes(d.dictionaryReview.status));
   assert.ok(d.dictionaryReview.url.startsWith('https://'));
   assert.equal(d.definitions[0].origin,'teacher_audit_original');
   assert.equal(d.lexicalSource.checkedIndependently,false);
 }
 assert.equal(get('atelocardia').dictionaryReview.status,'term_attested_definition_pending');
 assert.equal(get('atelocardia').dictionaryReview.didacticCrosscheck,null);
 assert.ok(get('seudónimo').officialOrthographicVariants.includes('pseudónimo'));
 assert.ok(get('seudónimo').officialOrthographicVariants.includes('seudónima'));
 assert.ok(get('seudónimo').officialOrthographicVariants.includes('pseudónima'));
 assert.ok(get('políglota').officialOrthographicVariants.includes('poliglota'));
});
test('el catálogo mantiene intactos los 111 étimos y 201 derivados sin publicación',()=>{
 const c=compileTeacherAudit();
 assert.equal(c.etymons.length,111);
 assert.equal(c.derivatives.length,201);
 assert.equal(c.relations.length,217);
 assert.equal(c.summary.published,false);
 assert.equal(c.greek2.etymons.length,0);
 assert.equal(c.correctionPolicy.unambiguousOrthographicError,0.5);
});
