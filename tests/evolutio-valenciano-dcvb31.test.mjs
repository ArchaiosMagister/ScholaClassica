import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const base='shared/academic/evolutio-valenciano/';
const read=p=>JSON.parse(readFileSync(join(root,base+p),'utf8'));
const first=read('contrastos-historics-dcvb-16-2026-11-17.json');
const second=read('contrastos-historics-dcvb-restants31-2026-11-17.json');
const queue=read('cola-fonetica-66-2026-11-17.json');
const matrix=read('matriz-522.json');

test('Les 47 paraules amb hipòtesis fonètiques tenen un expedient lexicogràfic individual sense duplicats',()=>{
 assert.equal(second.schema,'schola-evolutio-va-dcvb-phonetic-audit/v1');
 assert.deepEqual(second.summary,{
  individualEntriesRead:31,dcvbEntriesRead:30,gdlcEntriesRead:1,
  candidateWordsOriginally:47,previouslyRead:16,totalDirectLexicographicEntriesRead:47,
  stillWithoutDirectLexicographicRead:0,teacherSensitiveCases:20,
  dnvChecked:0,individualLawCertified:0,fullHistoricalChainCertified:0,playable:0
 });
 assert.equal(first.entries.length,16);
 assert.equal(second.entries.length,31);
 const combined=[...first.entries,...second.entries];
 const candidate=queue.entries.filter(x=>x.review.proposedChanges.length>0);
 assert.equal(combined.length,47);
 assert.equal(new Set(combined.map(x=>x.latin)).size,47);
 assert.deepEqual(new Set(combined.map(x=>x.latin)),new Set(candidate.map(x=>x.latin)));
 assert.equal(second.entries.filter(x=>x.teacherSensitive).length,20);
 assert.equal(combined.filter(x=>x.teacherSensitive).length,27);
 assert.equal(second.entries.filter(x=>x.source.authority==='DCVB').length,30);
 assert.equal(second.entries.filter(x=>x.source.authority==='Gran Diccionari de la Llengua Catalana').length,1);
 assert.equal(queue.summary.lexicographicEntriesIndividuallyRead,47);
 assert.equal(queue.summary.lexicographicSourcesDCVB,46);
 assert.equal(queue.summary.lexicographicSourcesGDLC,1);
 assert.equal(queue.summary.candidateWordsPendingIndividualLexicographicRead,0);
 for(const [i,r] of second.entries.entries()){
  assert.equal(r.order,i+1);
  assert.equal(r.etymologicalEntryIndividuallyRead,true);
  assert.ok(r.individualHistoricalAssessment.length>85,r.latin);
  assert.ok(r.source.lookup,r.latin);
  assert.match(r.source.url,/^https:\/\/(dcvb\.iec\.cat|www\.diccionari\.cat)\//,r.latin);
  for(const flag of ['dnvIndividualChecked','individualLawCertified',
   'fullHistoricalChainCertified','teacherApproved','playable'])
   assert.equal(r[flag],false,r.latin+': '+flag);
  const q=queue.entries.find(x=>x.latin===r.latin);
  assert.ok(q,r.latin);
  assert.equal(q.form,r.form);
  assert.ok(q.review.proposedChanges.length>0,r.latin);
  assert.deepEqual(r.lawHypothesesRemainProvisional,
   q.review.proposedChanges.map(x=>({rule:x.rule,spans:x.spans,anchor:x.anchor??null})));
  const tracked=q.review.lexicographicEvidenceReview;
  assert.equal(tracked.dossier,'contrastos-historics-dcvb-restants31-2026-11-17.json');
  assert.equal(tracked.sourceUrl,r.source.url);
  assert.equal(tracked.sourceAuthority,r.source.authority);
  assert.equal(tracked.individuallyRead,true);
  assert.equal(tracked.dnvIndividualChecked,false);
  assert.equal(tracked.lawsHistoricallyCertified,false);
  assert.equal(tracked.fullHistoricalChainCertified,false);
  const m=matrix.records.find(x=>x.latin===r.latin);
  assert.ok(m,r.latin);
  assert.equal(m.valenciano.estadoLexico,'contrastat_lexic_sense_fonetica');
  assert.equal(m.valenciano.normas,null);
  assert.equal(m.valenciano.aptoParaPractica,false);
 }
 for(const r of first.entries){
  const q=queue.entries.find(x=>x.latin===r.latin);
  assert.equal(q.review.lexicographicEvidenceReview.dossier,'contrastos-historics-dcvb-16-2026-11-17.json',r.latin);
 }
 assert.equal(queue.entries.filter(x=>!x.review.proposedChanges.length && x.review.lexicographicEvidenceReview).length,0);
 assert.equal(matrix.summary.aptasParaPractica,0);
 assert.equal(matrix.summary.normasVerificadas,0);
});
test('Les advertències filològiques es conserven sense validar una llei per analogia',()=>{
 const byLatin=new Map(second.entries.map(x=>[x.latin,x]));
 assert.match(byLatin.get('legere').individualHistoricalAssessment,/pronunciacions valencianes/);
 assert.match(byLatin.get('asĭnum').individualHistoricalAssessment,/ha reculat/);
 assert.match(byLatin.get('consilium').individualHistoricalAssessment,/concĭlĭum/);
 assert.match(byLatin.get('pausare').individualHistoricalAssessment,/francès poser/);
 assert.match(byLatin.get('imperatorem').individualHistoricalAssessment,/emperaor/);
 assert.match(byLatin.get('ocŭlos').individualHistoricalAssessment,/plural OCULOS/);
 assert.equal(byLatin.get('cuminum').source.authority,'Gran Diccionari de la Llengua Catalana');
});
test('Cap dossier acadèmic es publica en dist',()=>{
 const dist=join(root,'dist');
 assert.equal(existsSync(join(dist,'shared/academic/evolutio-valenciano/contrastos-historics-dcvb-restants31-2026-11-17.json')),false);
 assert.equal(matrix.records.length,522);
 assert.equal(matrix.summary.contrasteLexicoPendienteFonetica,66);
 assert.equal(queue.summary.playable,0);
});
