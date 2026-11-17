import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const prefix='shared/academic/evolutio-valenciano/';
const read=p=>JSON.parse(readFileSync(join(root,prefix+p),'utf8'));
const dossier=read('contrast-precis-fonetica-diec2-iec5-2026-11-17.json');
const queue=read('cola-fonetica-66-2026-11-17.json');
const matrix=read('matriz-522.json');
const curated=read('conciliacion-curada.json');

test('Cinc revisions de fonts amb 1 VOC explícita, sense fingir DNV ni cadenes completes',()=>{
 assert.equal(dossier.schema,'schola-evolutio-va-source-precision-5/v1');
 assert.deepEqual(dossier.summary,{
  entries:5,individualRuleDirectlyStatedInAcademicDictionary:1,
  medievalWitnessWithIndividualLatinEtymon:1,
  medievalOrthographyAndValencianPronunciation:1,
  comparativeOccitanNotTransferred:1,
  etymologyWithoutSeparateGeminateEvidence:1,
  currentDnvEntriesVerified:0,fullChainsCertified:0,schoolLawsPromoted:0,
  teacherApproved:0,playable:0
 });
 assert.equal(dossier.entries.length,5);
 assert.deepEqual(new Set(dossier.entries.map(x=>x.latin)),new Set([
  'bibere','meliorem','mulierem','roborem','committere'
 ]));
 assert.equal(queue.summary.iecDIEC2DirectlyExplainedRuleCandidates,1);
 assert.equal(queue.summary.iecHistoricalIndividualMedievalAttestations,1);
 assert.equal(queue.summary.sourcePrecisionFiveReviewed,5);
 assert.equal(queue.summary.sourcePrecisionEntriesStillMissingDnv,5);
 assert.equal(queue.summary.schoolLawsCertifiedThroughSourcePrecision,0);
 assert.equal(queue.summary.totalEntriesWithIndependentSpecificEvidence,30);
 assert.equal(queue.entries.filter(x=>x.review.independentSpecificEvidence||
  x.review.followupHistoricalEvidence||x.review.specificLawSourceVerification).length,25);
 for(const [i,item] of dossier.entries.entries()){
  assert.equal(item.order,i+1);
  assert.equal(item.individualSourceReviewCompleted,true);
  assert.ok(item.evidence.length>115,item.latin);
  assert.ok(item.limitation.length>125,item.latin);
  for(const key of ['schoolLawCertified','fullEvolutionChainCertified',
   'currentDnvIndividualChecked','teacherApproved','playable'])
   assert.equal(item[key],false,item.latin+'/'+key);
  for(const source of item.sourceKeys){
   assert.ok(dossier.sources[source],item.latin+'/'+source);
   assert.match(dossier.sources[source].url,/^https:\/\//);
   assert.equal(dossier.sources[source].isDnv,false);
  }
  const row=queue.entries.find(x=>x.latin===item.latin);
  assert.ok(row&&row.form===item.form,item.latin);
  const link=row.review.specificLawSourceVerification;
  assert.ok(link,item.latin);
  assert.equal(link.dossier,'contrast-precis-fonetica-diec2-iec5-2026-11-17.json');
  assert.deepEqual(link.sourceKeys,item.sourceKeys);
  assert.equal(link.sourceReviewCompleted,true);
  assert.equal(link.evidenceKind,item.kind);
  for(const key of ['currentDnvIndividualChecked','fullHistoricalChainCertified',
   'schoolLawsIndividuallyCertified','teacherApproved','playable'])
    assert.equal(link[key],false,item.latin+'/'+key);
  const m=matrix.records.find(x=>x.latin===item.latin);
  assert.ok(m,item.latin);
  assert.equal(m.valenciano.resultado,item.form);
  assert.equal(m.valenciano.normas,null);
  assert.equal(m.valenciano.aptoParaPractica,false);
 }
});

test('El DIEC2 documenta la segona b de BIBERE, no certifica ABER ni l evolució total',()=>{
 const b=dossier.entries.find(x=>x.latin==='bibere');
 assert.deepEqual(b.sourceSpecificMechanism,{
  rule:'VOC',latinFragment:'b',latinSpan:[2,3],
  sourceTextMeaning:'El DIEC2 explica de manera explícita la vocalització de la segona b de bibere com a origen de beure.',
  directStatement:true,sourceKey:'diec2_optimot'
 });
 assert.equal(b.lawCandidateSourceSupported,'VOC');
 const row=queue.entries.find(x=>x.latin==='bibere');
 const voc=row.review.proposedChanges.find(x=>x.rule==='VOC');
 const aber=row.review.proposedChanges.find(x=>x.rule==='ABER');
 assert.deepEqual(voc.spans,[[2,3]]);
 assert.equal(voc.fragment,'b');
 assert.equal(aber.fragment,'i');
 assert.equal(voc.ruleHistoricallyCertified,false);
 assert.equal(aber.ruleHistoricallyCertified,false);
 assert.equal(row.review.phoneticLawsIndividuallyVerified,false);
 assert.equal(row.review.specificLawSourceVerification.sourceExplicitlyIdentifiesMechanism,true);
 assert.equal(row.review.specificLawSourceVerification.candidateRuleAndCodepointSpanMatch,true);
 assert.equal(dossier.sources.diec2_optimot.primaryFor,'mechanism');
 assert.equal(dossier.sources.persee_clusters.primaryFor,'comparative_analysis');
});

test('Testimonis medievals, paral·lel occità i doble geminada no s homologuen com a lleis',()=>{
 const items=new Map(dossier.entries.map(x=>[x.latin,x]));
 assert.equal(items.get('meliorem').kind,'testimoni_medieval_individual');
 assert.match(items.get('meliorem').evidence,/millor \[10r, 11\]/);
 assert.match(dossier.sources.iec_rabella.scope,/pàgina del PDF 186/);
 assert.equal(items.get('meliorem').sourceSpecificMechanism,null);
 assert.match(items.get('mulierem').evidence,/segle XI/);
 assert.match(items.get('mulierem').limitation,/grafia/);
 assert.equal(dossier.sources.viccionari_muller.primaryFor,'secondary_summary_only');
 assert.match(items.get('roborem').limitation,/occità/);
 assert.equal(items.get('roborem').kind,'comparacio_romanca_no_transferible');
 assert.equal(items.get('roborem').sourceSpecificMechanism,null);
 assert.equal(items.get('committere').kind,'etimologia_i_morfologia_no_cadena');
 assert.deepEqual(queue.entries.find(x=>x.latin==='committere')
  .review.proposedChanges.map(x=>x.rule),['SIMPL','SIMPL']);
 for(const latin of ['meliorem','mulierem','roborem','committere']){
  const r=queue.entries.find(x=>x.latin===latin).review.specificLawSourceVerification;
  assert.equal(r.individuallySupportedRule,null,latin);
  assert.equal(r.sourceExplicitlyIdentifiesMechanism,false,latin);
  assert.equal(r.candidateRuleAndCodepointSpanMatch,false,latin);
 }
});

test('Continuïtat del bloqueig de publicació i de les 522 fitxes històriques',()=>{
 assert.equal(queue.entries.length,66);
 assert.equal(curated.lexicallyReviewed.length,66);
 assert.equal(matrix.records.length,522);
 assert.equal(queue.summary.certifiedPhoneticLaws,0);
 assert.equal(queue.summary.fullyDocumentedHistoricalChains,0);
 assert.equal(queue.summary.currentDnvIndividualChecks,0);
 assert.equal(queue.summary.pendingDnv,66);
 assert.equal(queue.summary.playable,0);
 assert.equal(matrix.summary.normasVerificadas,0);
 assert.equal(matrix.summary.aptasParaPractica,0);
 assert.equal(existsSync(join(root,'dist',prefix,'contrast-precis-fonetica-diec2-iec5-2026-11-17.json')),false);
});
