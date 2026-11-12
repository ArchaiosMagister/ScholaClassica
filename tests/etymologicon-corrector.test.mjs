import test from 'node:test';
import assert from 'node:assert/strict';
import {compileTeacherAudit} from '../scripts/compile-etymologicon-gr1.mjs';
import {createWriteTwoCorrector} from '../shared/academic/greek-etymology/corrector/write-two.mjs';

const bank=compileTeacherAudit();
const corrector=createWriteTwoCorrector(bank);
const derivativeById=new Map(bank.derivatives.map(d=>[d.id,d]));
const eligible=bank.etymons.filter(e=>e.editorialStatus==='approved_for_documented_derivatives');
const forEtymon=e=>e.teacherApprovedDerivatives.map(id=>derivativeById.get(id).form);
const evaluate=(id,first,second)=>corrector.grade(id,[first,second]);

test('el motor únicamente admite el banco editorial de Griego I; nunca candidatos ni Griego II',()=>{
 assert.throws(()=>createWriteTwoCorrector({schema:'etymologicon-candidates/v1',course:'gr1'}),/catálogo auditado/);
 assert.throws(()=>createWriteTwoCorrector({...bank,course:'gr2'}),/Griego I/);
 assert.throws(()=>corrector.grade('grc:inexistente',['a','b']),/Étimo desconocido/);
 assert.throws(()=>corrector.grade('grc:προσ',['prosodia']),/exactamente dos/);
 assert.throws(()=>corrector.grade('grc:προσ',['prosodia',null]),/exactamente dos/);
 assert.equal(corrector.isEligible('grc:δικη'),false);
 assert.equal(corrector.isEligible('grc:προσ'),true);
});
test('todos los 108 étimos elegibles permiten dos derivados distintos a 1 punto cada uno',()=>{
 assert.equal(eligible.length,108);
 for(const e of eligible){
   const [first,second]=forEtymon(e);
   assert.ok(first&&second,e.lemma);
   const result=evaluate(e.id,first,second);
   assert.equal(result.status,'evaluated',e.id);
   assert.deepEqual(result.answers.map(x=>x.points),[1,1],e.id);
   assert.equal(result.total,2,e.id);
   assert.equal(result.maximum,2);
 }
});
test('los 217 vínculos editoriales dan 1 punto solo a su propio étimo',()=>{
 assert.equal(bank.relations.length,217);
 for(const rel of bank.relations){
   const d=derivativeById.get(rel.derivativeId);
   const result=evaluate(rel.etymonId,d.form,'');
   assert.equal(result.answers[0].status,'exact',rel.id);
   assert.equal(result.answers[0].points,1,rel.id);
   assert.equal(result.total,1,rel.id);
 }
});
test('mayúsculas, tildes de variantes y espacios accidentales no restan puntos',()=>{
 const r=evaluate('grc:προσ','  PRO SÉ LITO   ',' pROSoDiA ');
 assert.equal(r.total,2);
 assert.deepEqual(r.answers.map(x=>x.status),['exact','exact']);
 const variant=bank.derivatives.find(d=>d.form==='icono');
 const rel=bank.relations.find(r=>r.derivativeId===variant.id);
 assert.ok(rel);
 const two=bank.etymons.find(x=>x.id===rel.etymonId).teacherApprovedDerivatives
   .filter(id=>id!==variant.id).map(id=>derivativeById.get(id).form)[0];
 const exact=evaluate(rel.etymonId,'ÍCONO',two);
 const alternate=evaluate(rel.etymonId,' icono ',two);
 assert.equal(exact.answers[0].points,1);
 assert.equal(alternate.answers[0].points,1);
 const accepted=bank.derivatives.filter(d=>d.officialOrthographicVariants.length>0);
 for(const d of accepted){
   const own=bank.relations.find(r=>r.derivativeId===d.id);
   for(const spelling of d.officialOrthographicVariants){
     const rr=evaluate(own.etymonId,spelling,'');
     assert.equal(rr.answers[0].status,'exact',d.form+' / '+spelling);
     assert.equal(rr.answers[0].points,1,d.form+' / '+spelling);
   }
 }
});
test('una errata inequívoca recibe 0,5 y muestra la grafía correcta',()=>{
 const one=evaluate('grc:προσ','proselito','prosodia');
 assert.equal(one.answers[0].status,'orthographic_error');
 assert.equal(one.answers[0].points,0.5);
 assert.equal(one.answers[0].correctForm,'prosélito');
 assert.ok(one.answers[0].highlight.correctSpelling);
 assert.equal(one.total,1.5);
 const mixed=evaluate('grc:προσ','proselitto','prosodia');
 assert.equal(mixed.answers[0].points,0.5,'acentuación + letra duplicada');
 const transpose=evaluate('grc:προσ','proéslito','prosodia');
 assert.equal(transpose.answers[0].points,0.5,'transposición adyacente');
});
test('el mismo derivado nunca se puntúa dos veces, ni con errata y forma exacta',()=>{
 let r=evaluate('grc:προσ','prosélito','prosélito');
 assert.deepEqual(r.answers.map(x=>x.points),[1,0]);
 assert.equal(r.answers[1].status,'duplicate');
 assert.equal(r.total,1);
 r=evaluate('grc:προσ','proselito','prosélito');
 assert.deepEqual(r.answers.map(x=>x.points),[0,1]);
 assert.equal(r.answers[0].status,'duplicate');
 assert.equal(r.total,1);
 const d=bank.derivatives.find(x=>x.form==='icono');
 const rel=bank.relations.find(x=>x.derivativeId===d.id);
 r=evaluate(rel.etymonId,'icono','ícono');
 assert.deepEqual(r.answers.map(x=>x.points),[1,0]);
 assert.equal(r.answers[1].status,'duplicate');
});
test('exclusiones, otras etimologías, plurales y respuestas no catalogadas no puntúan',()=>{
 const r=evaluate('grc:προσ','heliópolis','ginecólogo');
 assert.deepEqual(r.answers.map(x=>x.points),[0,0]);
 assert.deepEqual(r.answers.map(x=>x.status),['excluded','other_etymon']);
 const unknown=evaluate('grc:προσ','supercalifragilistico','prosodias');
 assert.equal(unknown.total,0);
 assert.ok(unknown.answers.every(x=>x.points===0));
 assert.ok(unknown.answers.some(x=>x.message.includes('no demuestra')));
 const blank=evaluate('grc:προσ','  ','');
 assert.equal(blank.total,0);
 assert.deepEqual(blank.answers.map(x=>x.status),['blank','blank']);
});
test('los tres étimos reservados para consulta no pueden producir exámenes',()=>{
 for(const id of ['grc:δικη','grc:δωρον','grc:παιδιον']){
   const r=evaluate(id,'justicia','derecho');
   assert.equal(r.status,'not_eligible');
   assert.equal(r.total,0);
   assert.ok(r.answers.every(x=>x.status==='not_eligible'));
 }
});
test('los parecidos ambiguos no permiten atribuir automáticamente un derivado',()=>{
 const fake={
   schema:'etymologicon-audited-catalog/v1',course:'gr1',
   etymons:[{id:'grc:test',editorialStatus:'approved_for_documented_derivatives',
     teacherApprovedDerivatives:['es:antropología','es:antropolojía']}],
   derivatives:[{id:'es:antropología',form:'antropología',officialOrthographicVariants:[],editorialStatus:'teacher_audit_approved'},
                {id:'es:antropolojía',form:'antropolojía',officialOrthographicVariants:[],editorialStatus:'teacher_audit_approved'}],
   relations:[{id:'rel1',etymonId:'grc:test',derivativeId:'es:antropología',editorialStatus:'teacher_audit_approved',eligibleFor:['write_two']},
              {id:'rel2',etymonId:'grc:test',derivativeId:'es:antropolojía',editorialStatus:'teacher_audit_approved',eligibleFor:['write_two']}],
   excluded:[]
 };
 const tiny=createWriteTwoCorrector(fake);
 const r=tiny.grade('grc:test',['antropoloía','antropología']);
 assert.equal(r.answers[0].points,0);
 assert.equal(r.answers[0].status,'ambiguous');
 assert.equal(r.answers[1].points,1);
 assert.equal(r.total,1);
 assert.throws(()=>createWriteTwoCorrector({...fake,
   derivatives:fake.derivatives.map((d,i)=>({...d,officialOrthographicVariants:i?['ANTROPOLOGÍA']:[]}))}),/ambigua/);
});
test('el corrector no cambia la selección docente ni activa nuevas modalidades',()=>{
 assert.equal(bank.derivatives.length,201);
 assert.equal(bank.relations.length,217);
 assert.equal(bank.editorialDecisions.length,22);
 assert.ok(bank.relations.every(x=>!x.inverseReady&&!x.decompositionReady));
 assert.equal(bank.greek2.etymons.length,0);
 assert.equal(bank.summary.published,false);
 assert.equal(bank.correctionPolicy.correctDerivative,1);
 assert.equal(bank.correctionPolicy.unambiguousOrthographicError,0.5);
 assert.equal(bank.correctionPolicy.incorrectOrUncatalogued,0);
});
