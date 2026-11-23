import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const base='shared/academic/evolutio-valenciano/';
const read=p=>JSON.parse(readFileSync(join(root,base+p),'utf8'));
const first=read('contrastos-historics-dcvb-16-2026-11-17.json');
const second=read('contrastos-historics-dcvb-restants31-2026-11-17.json');
const complex=read('contrastos-historics-dcvb-complexos19-2026-11-17.json');
const queue=read('cola-fonetica-66-2026-11-17.json');
const matrix=read('matriz-522.json');
const curated=read('conciliacion-curada.json');

test('Les 19 cadenes complexes tenen contrast lexicogràfic sense lleis atribuïdes',()=>{
 assert.equal(complex.schema,'schola-evolutio-va-complex-19-dcvb-audit/v1');
 assert.deepEqual(complex.summary,{
  totalComplexEntries:19,individuallyReadDCVB:19,
  explicitEtymologyDisplayed:18,entryWithoutExplicitEtymologyLine:1,
  explicitSensitivityFlags:15,proposedNewLaws:0,confirmedDnvIndividualChecks:0,
  certifiedHistoricalChains:0,certifiedLaws:0,playable:0
 });
 assert.equal(complex.entries.length,19);
 assert.equal(new Set(complex.entries.map(x=>x.latin)).size,19);
 const old=[...first.entries,...second.entries];
 assert.equal(old.length,47);
 const combined=[...old,...complex.entries];
 assert.equal(combined.length,66);
 assert.equal(new Set(combined.map(x=>x.latin)).size,66);
 assert.deepEqual(new Set(combined.map(x=>x.latin)),new Set(curated.lexicallyReviewed.map(x=>x.latin)));
 assert.equal(queue.summary.totalLexicographicEntriesIndividuallyRead,66);
 assert.equal(queue.summary.lexicographicEntriesIndividuallyRead,47);
 assert.equal(queue.summary.complexLexicographicEntriesIndividuallyRead,19);
 assert.equal(queue.summary.complexSourcesDCVB,19);
 assert.equal(queue.summary.complexEntriesWithoutExplicitEtymologyLine,1);
 assert.equal(queue.summary.complexEntriesStillWithoutLawCandidates,19);
 assert.equal(queue.summary.candidateSegmentsChecked,72);
 for(const [i,r] of complex.entries.entries()){
  assert.equal(r.order,i+1);
  assert.equal(r.source.authority,'DCVB');
  assert.match(r.source.url,/^https:\/\/dcvb\.iec\.cat\/results\.asp\?word=[a-z]+$/);
  assert.equal(r.source.directlyRead,true);
  assert.equal(r.individuallyAssessed,true);
  assert.ok(r.evidenceSummary.length>100,r.latin);
  assert.ok(r.teachingGuardrail.length>55,r.latin);
  assert.ok(r.classification.length>10,r.latin);
  assert.ok(Array.isArray(r.source.dialectOrHistoricalEvidence));
  assert.deepEqual(r.proposedChanges,[],r.latin);
  for(const flag of ['dnvIndividualChecked','fullHistoricalChainCertified',
    'individualLawCertified','teacherApproved','playable'])
   assert.equal(r[flag],false,r.latin+':'+flag);
  const q=queue.entries.find(x=>x.latin===r.latin);
  assert.ok(q,r.latin);
  assert.equal(q.form,r.form);
  assert.deepEqual(q.review.proposedChanges,[]);
  const linked=q.review.complexHistoricalEvidenceReview;
  assert.equal(linked.dossier,'contrastos-historics-dcvb-complexos19-2026-11-17.json');
  assert.equal(linked.sourceUrl,r.source.url);
  assert.equal(linked.sourceAuthority,'DCVB');
  assert.equal(linked.individuallyRead,true);
  assert.equal(linked.uncertaintyClass,r.classification);
  assert.equal(linked.etymologyExplicitlyDisplayed,r.source.etymologyExplicitlyDisplayed);
  assert.equal(linked.noLawAssigned,true);
  for(const flag of ['dnvIndividualChecked','fullHistoricalChainCertified',
    'lawsHistoricallyCertified','teacherApproved','playable'])
   assert.equal(linked[flag],false,r.latin+':'+flag);
  for(const flag of ['dnvIndividualChecked','documentedHistoricalChain',
    'phoneticLawsIndividuallyVerified','approvedByTeacher','playable'])
   assert.equal(q.review[flag],false,r.latin+':'+flag);
  const m=matrix.records.find(x=>x.latin===r.latin);
  assert.ok(m,r.latin);
  assert.equal(m.valenciano.resultado,r.form);
  assert.equal(m.valenciano.estadoLexico,'contrastat_lexic_sense_fonetica');
  assert.equal(m.valenciano.normas,null);
  assert.equal(m.valenciano.aptoParaPractica,false);
 }
 assert.equal(complex.entries.filter(x=>x.teacherSensitive).length,15);
 assert.equal(complex.entries.filter(x=>x.source.etymologyExplicitlyDisplayed).length,18);
 assert.equal(matrix.summary.aptasParaPractica,0);
 assert.equal(matrix.summary.normasVerificadas,0);
});

test('Les variants antigues i dialectals no es fan passar per etapes fonètiques o normes escolars',()=>{
 const by=new Map(complex.entries.map(x=>[x.latin,x]));
 assert.match(by.get('tonare').evidenceSummary,/influència del substantiu TRO/);
 assert.equal(by.get('tonare').classification,'analogia_lexica_no_llei');
 assert.match(by.get('compărāre').evidenceSummary,/COMPĔRĀRE/);
 assert.match(by.get('pilum').evidenceSummary,/PĬLU/);
 assert.match(by.get('magistrum').evidenceSummary,/ultracorrecció/);
 assert.match(by.get('sŏlĭdum').evidenceSummary,/SOL/);
 assert.match(by.get('insŭlam').evidenceSummary,/ISLA/);
 assert.match(by.get('continere').evidenceSummary,/pronunciació valenciana/);
 assert.match(by.get('bene').evidenceSummary,/BEN/);
 assert.match(by.get('cŏrpus').evidenceSummary,/CŎRPUS/);
 assert.equal(by.get('credere').source.etymologyExplicitlyDisplayed,false);
 assert.equal(by.get('bŏnam').classification,'sense_llei_seleccionable');
 assert.deepEqual(by.get('pretium').source.dialectOrHistoricalEvidence,[]);
 const withProposals=queue.entries.filter(x=>x.review.proposedChanges.length>0);
 assert.equal(withProposals.length,47);
 assert.equal(withProposals.filter(x=>x.review.complexHistoricalEvidenceReview).length,0);
 assert.equal(queue.entries.filter(x=>x.review.complexHistoricalEvidenceReview).length,19);
});

test('La revisió de les 19 cadenes és interna, no jugable ni desplegada',()=>{
 const dist=join(root,'dist');
 assert.equal(existsSync(join(dist,'shared/academic/evolutio-valenciano/contrastos-historics-dcvb-complexos19-2026-11-17.json')),false);
 assert.equal(existsSync(join(dist,'apps/evolucion-fonetica/data/valenciano.json')),false);
 assert.equal(matrix.records.length,522);
 assert.equal(curated.lexicallyReviewed.length,66);
 assert.equal(queue.summary.playable,0);
});
