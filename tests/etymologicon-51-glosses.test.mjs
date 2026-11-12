import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {compileTeacherAudit} from '../scripts/compile-etymologicon-gr1.mjs';
const catalog=compileTeacherAudit();
const audit=JSON.parse(readFileSync(new URL('../shared/academic/greek-etymology/review/teacher-glosses-lexicon-v1.json',import.meta.url),'utf8'));
const teacher=JSON.parse(readFileSync(new URL('../shared/academic/greek-etymology/review/lexical-evidence-v1.json',import.meta.url),'utf8'));
const byId=new Map(catalog.etymons.map(e=>[e.id,e]));
const sourceTeacher=new Map(teacher.teacherGlosses.filter(e=>!e.primaryLemmaOnly).map(e=>[e.etymonId,e]));

test('las 51 glosas docentes están documentadas por su lema y fuente sin duplicaciones',()=>{
 assert.equal(audit.schema,'etymologicon-teacher-lexicon-review/v1');
 assert.equal(audit.records.length,51);
 assert.equal(sourceTeacher.size,51);
 assert.equal(new Set(audit.records.map(x=>x.etymonId)).size,51);
 assert.equal(audit.publicationAllowed,false);
 for(const row of audit.records){
   const old=sourceTeacher.get(row.etymonId), e=byId.get(row.etymonId);
   assert.ok(old&&e,'Etimo o glosa original inexistente: '+row.etymonId);
   assert.equal(row.sourceLemma,old.sourceLemma);
   assert.equal(row.sourceGloss,old.curricularGloss);
   assert.equal(e.meaningEvidence.kind,'teacher_curriculum','No perder procedencia original');
   assert.equal(e.meaningEvidence.lexicographicConfirmation,false,'La ficha original no se debe reescribir');
   assert.equal(e.teacherSourceGloss!==null,true);
   assert.equal(e.meaning,row.reviewedMeaning);
   assert.equal(e.lexicalReview.status,'teacher_gloss_lexically_checked');
   assert.equal(e.lexicalReview.source.url,row.reference.url);
   assert.equal(e.meaningReviewStatus,'teacher_gloss_lexically_checked');
   assert.equal(e.independentLexicographicReview,true);
   assert.ok(e.lexicalReview.editorialNote);
   assert.ok(/^https:\/\/(atlas\.perseus\.tufts\.edu|logeion\.uchicago\.edu)\//.test(row.reference.url));
   assert.equal(row.changeApprovedDerivatives,false);
   assert.equal(row.changeExamEligibility,false);
 }
});
test('111 étimos con fuente externa sin confundir tipos de fuentes y la identidad del banco',()=>{
 assert.equal(audit.summary.reviewedTeacherOnly,51);
 assert.equal(catalog.summary.meaningsWithExternalEvidence,111);
 assert.equal(catalog.summary.reviewedTeacherGlosses,51);
 assert.equal(catalog.summary.meaningsOnlyTeacherCurriculum,0);
 assert.equal(catalog.summary.greekMeaningsPendingIndependentReview,0);
 assert.equal(catalog.summary.greekMeaningsFromExternalLexicons,107);
 assert.equal(catalog.summary.academicContextEvidences,4);
 assert.equal(catalog.etymons.filter(e=>e.independentLexicographicReview).length,111);
 assert.equal(catalog.derivatives.length,201);
 assert.equal(catalog.relations.length,217);
 assert.equal(catalog.greek2.etymons.length,0);
 assert.equal(catalog.summary.published,false);
 assert.ok(catalog.relations.every(r=>!r.inverseReady&&!r.decompositionReady));
});
test('los matices semánticos, regímenes y grafías importantes están preservados',()=>{
 const review=id=>byId.get(id).lexicalReview;
 assert.match(byId.get('grc:βιβλιον').meaning,/documento/);
 assert.match(byId.get('grc:βιοσ').meaning,/curso de vida/);
 assert.match(byId.get('grc:λογοσ').meaning,/razón/);
 assert.match(byId.get('grc:δικη').meaning,/procedimiento judicial/);
 assert.equal(byId.get('grc:δικη').editorialStatus,'reference_only');
 assert.equal(byId.get('grc:δωρον').editorialStatus,'reference_only');
 assert.match(byId.get('grc:δια').meaning,/genitivo/);
 assert.match(byId.get('grc:δια').meaning,/acusativo/);
 assert.match(byId.get('grc:μετα').meaning,/genitivo/);
 assert.match(byId.get('grc:μετα').meaning,/acusativo/);
 assert.match(byId.get('grc:υπο').meaning,/agente/);
 assert.match(byId.get('grc:ανθρωποσ').meaning,/ser humano/);
 assert.match(byId.get('grc:ανηρ').meaning,/varón/);
 assert.match(byId.get('grc:χρημα').meaning,/plural/);
 assert.match(byId.get('grc:κεφαλη').lexicalReview.documentedHeadword,/κεφαλή/);
 assert.match(review('grc:θεοσ').documentedHeadword,/θεός/);
 assert.match(review('grc:θαλαττα').editorialNote,/ática/);
 assert.equal(audit.records.filter(x=>x.reference.kind==='lexicon_headword_index').length,1);
 assert.equal(audit.records.filter(x=>x.reference.kind==='logeion_dictionary_entry').length,1);
});
test('las glosas agrupadas previamente aprobadas permanecen independientes del nuevo lote de 51',()=>{
 for(const id of ['grc:γραφω','grc:σοφοσ','grc:αρχη','grc:λεγω']){
   const e=byId.get(id);
   assert.equal(e.meaningEvidence.status,'partial_compound');
   const evidence=e.meaningCompletionEvidence;
  assert.equal(evidence.components.parts.length,2);
  if(evidence.verifiedSources){
    assert.equal(evidence.verifiedSources.length,2);
  }else{
    // ἀρχή / ἄρχω se validó antes de la revisión de las 29 propuestas:
    // se acreditan ambos miembros directamente dentro de la pareja.
    assert.equal(e.id,'grc:αρχη');
    assert.ok(evidence.components.parts.every(part=>part.individualEvidence?.checked &&
      part.individualEvidence.url.startsWith('https://')));
  }
   assert.equal(e.lexicalReview,undefined);
 }
 assert.equal(catalog.correctionPolicy.correctDerivative,1);
 assert.equal(catalog.correctionPolicy.unambiguousOrthographicError,0.5);
 assert.equal(catalog.correctionPolicy.incorrectOrUncatalogued,0);
});
