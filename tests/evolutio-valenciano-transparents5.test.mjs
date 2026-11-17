import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {join, resolve} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const folder='shared/academic/evolutio-valenciano/';
const read=name=>JSON.parse(readFileSync(join(root, folder+name),'utf8'));
const dossier=read('contrast-transparents5-dcvb-gec-2026-11-17.json');
const queue=read('cola-fonetica-66-2026-11-17.json');
const matrix=read('matriz-522.json');
const curation=read('conciliacion-curada.json');
const expected=new Set(['uittam','furcam','putare','nigram','signa']);

test('Cinco correspondencias transparentes con fuentes y seis candidaturas sin aprobar',()=>{
 assert.equal(dossier.schema,'schola-evolutio-valencia-transparent-five-research/v1');
 assert.deepEqual(dossier.summary,{
  individualEtymologicalComparisons:5,additionalWordsCovered:5,
  contextualRuleAssessments:6,individualHistoricalLawDemonstrations:0,
  fullHistoricalChainsCertified:0,currentDnvArticlesVerified:0,
  teacherApproved:0,playable:0
 });
 assert.equal(dossier.entries.length,5);
 assert.deepEqual(new Set(dossier.entries.map(x=>x.latin)),expected);
 assert.equal(queue.summary.transparentFiveIndividuallyReviewed,5);
 assert.equal(queue.summary.transparentFiveCandidateLawsAssessed,6);
 assert.equal(queue.summary.transparentFiveCertifiedLaws,0);
 assert.equal(queue.summary.totalEntriesWithIndependentSpecificEvidence,30);
 assert.equal(queue.summary.newPartialEtymologicalEntries,5);
 const withExisting=queue.entries.filter(x=>x.review.independentSpecificEvidence||
   x.review.followupHistoricalEvidence||x.review.specificLawSourceVerification);
 assert.equal(withExisting.length,25);
 assert.ok(withExisting.every(x=>!expected.has(x.latin)));
 assert.equal(queue.entries.filter(x=>x.review.transparentFiveEvidenceReview).length,5);
 let observedCandidates=0;
 for(const [i,x] of dossier.entries.entries()){
  assert.equal(x.order,i+1);
  assert.equal(x.lexicographicCheckCompleted,true);
  assert.equal(x.contextualSoundLawEvidence,true);
  assert.ok(x.evidence.length>110,x.latin);
  assert.ok(x.guard.length>160,x.latin);
  assert.ok(Array.isArray(x.assessment)&&x.assessment.length>0,x.latin);
  for(const key of ['individuallyHistoricallyVerified',
    'allIntermediateFormsHistoricallyAttested','allSchoolLawsCertified',
    'currentDnvEntryChecked','teacherApproved','playable'])
   assert.equal(x[key],false,x.latin+'/'+key);
  for(const k of x.sourceKeys){
   assert.ok(dossier.sourceReferences[k],x.latin+'/'+k);
   assert.match(dossier.sourceReferences[k].url,/^https:\/\//,k);
  }
  const q=queue.entries.find(y=>y.latin===x.latin);
  assert.ok(q&&q.form===x.form,x.latin);
  const link=q.review.transparentFiveEvidenceReview;
  assert.equal(link.dossier,'contrast-transparents5-dcvb-gec-2026-11-17.json');
  assert.equal(link.class,x.class);
  assert.deepEqual(link.sourceKeys,x.sourceKeys);
  assert.equal(link.individuallyReviewed,true);
  for(const key of ['dnvIndividualChecked','completeHistoricalChain',
   'phoneticLawsIndividuallyVerified','approvedByTeacher','playable'])
   assert.equal(link[key],false,x.latin+'/'+key);
  assert.equal(link.assessedCandidateRules.length,x.assessment.length);
  for(const a of x.assessment){
   observedCandidates++;
   assert.equal(a.certified,false);
   const original=q.review.proposedChanges.find(y=>y.rule===a.rule&&y.fragment===a.fragment);
   assert.ok(original,x.latin+'/'+a.rule);
   assert.equal(original.ruleHistoricallyCertified,false,x.latin+'/'+a.rule);
   const linked=link.assessedCandidateRules.find(y=>y.rule===a.rule&&y.fragment===a.fragment);
   assert.ok(linked);
   assert.deepEqual(linked.spans,original.spans);
   assert.equal(linked.support,a.support);
   assert.equal(linked.certified,false);
  }
  const row=matrix.records.find(y=>y.latin===x.latin);
  assert.ok(row,x.latin);
  assert.equal(row.valenciano.resultado,x.form);
  assert.equal(row.valenciano.normas,null);
  assert.equal(row.valenciano.aptoParaPractica,false);
 }
 assert.equal(observedCandidates,6);
});

test('Control etimológico de acusativos, accepciones y homógrafos',()=>{
 const m=new Map(dossier.entries.map(x=>[x.latin,x]));
 assert.match(m.get('uittam').evidence,/vĭtta/);
 assert.match(m.get('uittam').guard,/acusatiu/);
 assert.deepEqual(m.get('uittam').assessment.map(x=>x.rule),['SIMPL']);
 assert.match(m.get('furcam').guard,/FORÇA/);
 assert.match(m.get('furcam').evidence,/fŭrca/);
 assert.deepEqual(m.get('furcam').assessment.map(x=>x.rule),['ABER']);
 assert.match(m.get('putare').evidence,/poðáɾ/);
 assert.deepEqual(m.get('putare').assessment.map(x=>x.rule),['SONOR','ABER']);
 assert.match(m.get('nigram').evidence,/llatí nĭgru/);
 assert.match(m.get('nigram').guard,/femení/);
 assert.match(m.get('signa').evidence,/plural de sĭgnum/);
 assert.match(m.get('signa').guard,/SENYA 2/);
 assert.deepEqual(m.get('signa').assessment.map(x=>x.rule),['PALAT']);
 assert.equal(m.get('signa').class,'plural_llati_reanalitzat_com_singular');
 const ruleIds=new Set(m.get('uittam').assessment.map(x=>x.rule));
 assert.ok(ruleIds.has('SIMPL'));
});

test('No promueve leyes generales de GEC a verificaciones individuales ni publica documentos',()=>{
 assert.equal(queue.summary.certifiedPhoneticLaws,0);
 assert.equal(queue.summary.fullyDocumentedHistoricalChains,0);
 assert.equal(queue.summary.currentDnvIndividualChecks,0);
 assert.equal(queue.summary.playable,0);
 assert.equal(queue.summary.pendingDnv,66);
 assert.equal(queue.summary.itemsWithSegmentedHypotheses,47);
 assert.equal(queue.summary.candidateSegmentsChecked,72);
 assert.equal(queue.entries.reduce((n,x)=>n+x.review.proposedChanges.length,0),72);
 assert.equal(matrix.records.length,522);
 assert.equal(curation.lexicallyReviewed.length,66);
 assert.equal(matrix.summary.aptasParaPractica,0);
 assert.equal(existsSync(join(root,'dist',folder,'contrast-transparents5-dcvb-gec-2026-11-17.json')),false);
 assert.equal(existsSync(join(root,'dist','apps/evolucion-fonetica/data/valenciano.json')),false);
});
