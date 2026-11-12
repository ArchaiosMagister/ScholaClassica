import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {compileTeacherAudit} from '../scripts/compile-etymologicon-gr1.mjs';

const audit=JSON.parse(readFileSync(new URL('../shared/academic/greek-etymology/review/meaning-drafts-audit-v1.json',import.meta.url),'utf8'));
const catalog=compileTeacherAudit();
const byId=new Map(catalog.etymons.map(x=>[x.id,x]));

test('las 29 propuestas se revisaron sin omitir ni repetir fichas',()=>{
 assert.equal(audit.schema,'etymologicon-29-meaning-review/v1');
 assert.equal(audit.records.length,29);
 assert.equal(new Set(audit.records.map(x=>x.id)).size,29);
 assert.equal(audit.counts.dictionaryEntries,25);
 assert.equal(audit.counts.citedLexiconInCorpus,3);
 assert.equal(audit.counts.specializedAttestation,1);
 assert.equal(audit.publicationAllowed,false);
 for(const row of audit.records){
   const etymon=byId.get(row.id);
   assert.ok(etymon,'Missing '+row.id);
   assert.equal(etymon.meaning,row.reviewedMeaning);
   assert.equal(row.originalStatus,'meaning_draft_pending_dictionary_check');
   assert.equal(etymon.meaningReviewStatus,'source_reviewed_after_draft');
   assert.ok(etymon.independentLexicographicReview);
   assert.deepEqual(etymon.meaningCompletionEvidence.verifiedSources,row.sourceRefs);
   assert.equal(row.reviewDoesNotChangeExamEligibility,true);
 }
});
test('ninguna de las 29 propuestas permanece como pendiente sin fuente',()=>{
 assert.equal(catalog.summary.reviewedDraftMeanings,29);
 assert.equal(catalog.summary.meaningCompletionDrafts,0);
 assert.equal(catalog.summary.meaningsWithExternalEvidence,60);
 assert.equal(catalog.summary.meaningsOnlyTeacherCurriculum,51);
 assert.equal(catalog.summary.greekMeaningsFromExternalLexicons,56);
 assert.equal(catalog.summary.academicContextEvidences,4);
 assert.equal(catalog.summary.greekMeaningsCompleted,111);
 assert.equal(catalog.summary.greekMeaningsPendingIndependentReview,51);
});
test('la revisión de compuestos conserva dos fuentes y evita falsas equivalencias',()=>{
 for(const lemma of ['πράττω | πράγμα','γράφω | γράμμα','σοφός | σοφία','λέγω | λόγος']){
  const entry=catalog.etymons.find(x=>x.lemma===lemma);
  assert.ok(entry,'Compound '+lemma);
  assert.equal(entry.meaningCompletionEvidence.verifiedSources.length,2);
 }
 const an=catalog.etymons.find(x=>x.lemma==='ἀνά');
 assert.match(an.meaning,/en composición/);
 const autos=catalog.etymons.find(x=>x.lemma==='αὐτός');
 assert.match(autos.meaning,/el mismo/);
 const glotta=catalog.etymons.find(x=>x.lemma==='γλῶττα');
 assert.match(glotta.meaningCompletionEvidence.reviewNote,/ática/);
 const algos=catalog.etymons.find(x=>x.lemma==='ἄλγος');
 assert.match(algos.meaning,/anímico/);
});
test('mantener cerrados el banco editorial, Griego II y las modalidades aún no autorizadas',()=>{
 assert.equal(catalog.etymons.length,111);
 assert.equal(catalog.derivatives.length,201);
 assert.equal(catalog.relations.length,217);
 assert.equal(catalog.greek2.etymons.length,0);
 assert.equal(catalog.summary.published,false);
 assert.ok(catalog.relations.every(x=>x.inverseReady===false&&x.decompositionReady===false));
});
