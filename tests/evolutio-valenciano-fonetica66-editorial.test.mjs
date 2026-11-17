import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const base='shared/academic/evolutio-valenciano/';
const read=name=>JSON.parse(readFileSync(join(root,base+name),'utf8'));
const queue=read('cola-fonetica-66-2026-11-17.json');
const matrix=read('matriz-522.json');
const curation=read('conciliacion-curada.json');
const rules=read('normas.json');

test('66 revisions fonètiques individualitzades, amb segments Unicode exactes i cap llei aprovada',()=>{
 assert.equal(queue.schema,'schola-evolutio-va-phonetic-workqueue/v2');
 assert.deepEqual(queue.summary,{
  lexicallySupported:66,editoriallyReviewed:66,
  itemsWithSegmentedHypotheses:47,candidateSegmentsChecked:72,
  itemsWithComplexOrUnassignedChain:19,certifiedPhoneticLaws:0,
  fullyDocumentedHistoricalChains:0,pendingDnv:66,
  pendingHistoricalChain:66,pendingLawsAndSpans:66,
  pendingTeacherApproval:66,playable:0,
  lexicographicEntriesIndividuallyRead:47,lexicographicSourcesDCVB:46,
  lexicographicSourcesGDLC:1,candidateWordsPendingIndividualLexicographicRead:0,
  complexLexicographicEntriesIndividuallyRead:19,complexSourcesDCVB:19,
  totalLexicographicEntriesIndividuallyRead:66,
  complexEntriesWithoutExplicitEtymologyLine:1,
  complexEntriesStillWithoutLawCandidates:19
 });
 assert.equal(queue.entries.length,66);
 assert.equal(new Set(queue.entries.map(x=>x.latin)).size,66);
 assert.deepEqual(new Set(queue.entries.map(x=>x.latin)),
  new Set(curation.lexicallyReviewed.map(x=>x.latin)));
 const allowed=new Set(rules.selectable.map(x=>x.id));
 let totalSpans=0,withChanges=0,withoutChanges=0;
 for(const [i,x] of queue.entries.entries()){
  assert.equal(x.order,i+1);
  assert.equal(x.review.editorialReviewCompleted,true);
  assert.equal(x.review.exactCodepointSpansChecked,true);
  assert.ok(x.review.editorialAssessment.length>55,x.latin);
  const old=matrix.records.find(w=>w.latin===x.latin);
  assert.ok(old,x.latin);
  assert.equal(old.valenciano.resultado,x.form);
  assert.equal(old.valenciano.estadoLexico,'contrastat_lexic_sense_fonetica');
  assert.equal(old.valenciano.normas,null);
  assert.equal(old.valenciano.aptoParaPractica,false);
  assert.equal(x.review.fixedFinalM,x.latin.endsWith('m')
   ?'pèrdua_fixa_no_seleccionable':'no_correspon');
  for(const flag of ['dnvIndividualChecked','documentedHistoricalChain',
   'phoneticLawsIndividuallyVerified','approvedByTeacher','playable'])
   assert.equal(x.review[flag],false,x.latin+': '+flag);
  const changes=x.review.proposedChanges;
  assert.ok(Array.isArray(changes),x.latin);
  if(changes.length){
   withChanges++;
   const audit=x.review.lexicographicEvidenceReview;
   assert.equal(audit.individuallyRead,true,x.latin);
   assert.ok(['DCVB','Gran Diccionari de la Llengua Catalana'].includes(audit.sourceAuthority),x.latin);
   assert.ok(['contrastos-historics-dcvb-16-2026-11-17.json',
    'contrastos-historics-dcvb-restants31-2026-11-17.json'].includes(audit.dossier));
   assert.equal(audit.dnvIndividualChecked,false);
   assert.equal(audit.lawsHistoricallyCertified,false);
   assert.equal(audit.fullHistoricalChainCertified,false);
  }else{
   withoutChanges++;
   assert.equal(x.review.lexicographicEvidenceReview,undefined,x.latin);
   const complex=x.review.complexHistoricalEvidenceReview;
   assert.equal(complex.individuallyRead,true,x.latin);
   assert.equal(complex.dossier,'contrastos-historics-dcvb-complexos19-2026-11-17.json');
   assert.equal(complex.sourceAuthority,'DCVB',x.latin);
   for(const key of ['dnvIndividualChecked','fullHistoricalChainCertified','lawsHistoricallyCertified','teacherApproved','playable'])
    assert.equal(complex[key],false,x.latin+':'+key);
   assert.equal(complex.noLawAssigned,true,x.latin);
  }
  assert.equal(x.review.status,
   changes.length?'hipotesis_segmentades_no_certificades':
   x.latin==='bŏnam'?'sense_llei_seleccionable_identificada':
   'cadena_historica_o_normativa_pendent');
  const chars=[...x.latin];
  const ids=new Set();
  for(const item of changes){
   totalSpans++;
   assert.ok(allowed.has(item.rule),x.latin+'/'+item.rule);
   assert.ok(!ids.has(item.id),x.latin+'/'+item.id);
   ids.add(item.id);
   assert.equal(item.segmentVerified,true);
   assert.equal(item.ruleHistoricallyCertified,false);
   assert.ok(item.editorialReason.length>30,x.latin);
   if(item.rule==='PROT'){
    assert.equal(item.anchor,0);
    assert.deepEqual(item.spans,[]);
    assert.equal(item.fragment,'');
    assert.match(x.latin,/^s(?:t|p|tr)|^strictum/);
   }else{
    assert.equal(item.spans.length,1);
    const [[a,b]]=item.spans;
    assert.ok(Number.isInteger(a)&&Number.isInteger(b)&&a>=0&&a<b&&b<=chars.length,x.latin);
    assert.equal(chars.slice(a,b).join(''),item.fragment);
   }
   assert.notEqual(item.rule,'FIX_M','La pèrdua -m és fixa, mai candidata');
  }
 }
 assert.equal(totalSpans,72);
 assert.equal(withChanges,47);
 assert.equal(withoutChanges,19);
 assert.equal(matrix.summary.aptasParaPractica,0);
 assert.equal(matrix.summary.normasVerificadas,0);
});

test('Casos de difícil interpretació no reben lleis mecàniques',()=>{
 const get=latin=>queue.entries.find(x=>x.latin===latin);
 for(const latin of ['cadere','germanum','tonare','thesaurum','credere',
  'insŭlam','cŏrpus','podium','pretium','texere','nostrum',
  'magistram','magistrum','sŏlĭdum','continere','bene']){
  assert.deepEqual(get(latin).review.proposedChanges,[],latin);
 }
 assert.equal(get('tonare').review.unresolvedHistoricalIssue,'analogia_lexica');
 assert.match(get('tonare').review.editorialAssessment,/influència de TRO/);
 assert.equal(get('bŏnam').review.status,'sense_llei_seleccionable_identificada');
 assert.equal(get('bŏnam').review.fixedFinalM,'pèrdua_fixa_no_seleccionable');
 const rulesFor=latin=>get(latin).review.proposedChanges.map(x=>x.rule);
 assert.deepEqual(rulesFor('specŭlum'),['PROT','SINC','PALAT']);
 assert.deepEqual(rulesFor('pericŭlum'),['SINC','PALAT']);
 assert.deepEqual(rulesFor('tussem'),['ABER','SIMPL']);
 assert.deepEqual(rulesFor('furcam'),['ABER']);
 assert.deepEqual(rulesFor('uittam'),['SIMPL']);
});

test('Cap anàlisi editorial entra en l’artefacte dels estudiants',()=>{
 const dist=join(root,'dist');
 assert.equal(existsSync(join(dist,'shared/academic/evolutio-valenciano/cola-fonetica-66-2026-11-17.json')),false);
 assert.equal(existsSync(join(dist,'apps/evolucion-fonetica/data/valenciano.json')),false);
 assert.equal(matrix.records.length,522);
 assert.equal(matrix.records.filter(w=>w.valenciano.estadoLexico==='contrastat_lexic_sense_fonetica').length,66);
});
