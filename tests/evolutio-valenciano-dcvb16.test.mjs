import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const base='shared/academic/evolutio-valenciano/';
const read=p=>JSON.parse(readFileSync(join(root,base+p),'utf8'));
const dossier=read('contrastos-historics-dcvb-16-2026-11-17.json');
const queue=read('cola-fonetica-66-2026-11-17.json');
const matrix=read('matriz-522.json');
const curated=read('conciliacion-curada.json');

test('16 fitxes DCVB contrastades directament, sense inventar DNV ni certificar lleis',()=>{
 assert.equal(dossier.schema,'schola-evolutio-va-dcvb-phonetic-audit/v1');
 assert.deepEqual(dossier.summary,{
  totalCandidateWords:47,individualDcvbEntriesRead:16,
  remainingIndividualDcvbReviews:31,examplesWithIntermediateAttestation:4,
  teacherSensitiveCases:7,directDnvChecked:0,lawRulesCertified:0,
  fullHistoricalChainsCertified:0,playable:0
 });
 assert.equal(dossier.entries.length,16);
 assert.equal(new Set(dossier.entries.map(x=>x.latin)).size,16);
 const candidateEntries=queue.entries.filter(x=>x.review.proposedChanges.length>0);
 assert.equal(candidateEntries.length,47);
 assert.equal(candidateEntries.filter(x=>!dossier.entries.some(y=>y.latin===x.latin)).length,31);
 assert.equal(dossier.entries.filter(x=>x.historicalVariantOrChain!==null).length,4);
 assert.equal(dossier.entries.filter(x=>x.teacherSensitive).length,7);
 for(const [i,r] of dossier.entries.entries()){
  assert.equal(r.order,i+1);
  const q=queue.entries.find(x=>x.latin===r.latin);
  const m=matrix.records.find(x=>x.latin===r.latin);
  const c=curated.lexicallyReviewed.find(x=>x.latin===r.latin);
  assert.ok(q&&m&&c,r.latin);
  assert.equal(r.form,q.form);
  assert.equal(r.form,m.valenciano.resultado);
  assert.equal(r.form,c.form);
  assert.ok(q.review.proposedChanges.length>0,r.latin);
  assert.equal(r.source.authority,'DCVB');
  assert.match(r.source.url,/^https:\/\/dcvb\.iec\.cat\/results\.asp\?word=[a-z]+$/);
  assert.ok(r.individualHistoricalAssessment.length>85,r.latin);
  assert.ok(r.source.readScope);
  assert.equal(r.etymologicalEntryIndividuallyRead,true);
  for(const flag of ['dnvIndividualChecked','individualLawCertified',
   'fullHistoricalChainCertified','teacherApproved','playable'])
   assert.equal(r[flag],false,r.latin+': '+flag);
  assert.deepEqual(r.lawHypothesesRemainProvisional,
   q.review.proposedChanges.map(x=>({rule:x.rule,spans:x.spans,anchor:x.anchor??null})));
  assert.equal(q.review.phoneticLawsIndividuallyVerified,false);
  assert.equal(m.valenciano.aptoParaPractica,false);
  assert.equal(m.valenciano.normas,null);
  assert.equal(m.valenciano.estadoLexico,'contrastat_lexic_sense_fonetica');
 }
 assert.equal(matrix.summary.aptasParaPractica,0);
});

test('Evidència de variants antigues no equival a una llei fonètica certificada',()=>{
 const get=l=>dossier.entries.find(x=>x.latin===l);
 assert.match(get('monstrare').historicalVariantOrChain,/monstrar/);
 assert.match(get('tædam').historicalVariantOrChain,/teda > tesa > tea/);
 assert.match(get('ausare').historicalVariantOrChain,/ausar/);
 assert.match(get('mulierem').historicalVariantOrChain,/muler/);
 assert.match(get('picare').individualHistoricalAssessment,/adherir amb pega/);
 assert.match(get('angustum').individualHistoricalAssessment,/no especifica pronúncia valenciana/);
 assert.match(get('strictum').individualHistoricalAssessment,/no queda acreditada/);
 assert.match(get('capere').individualHistoricalAssessment,/analogia/);
 for(const latin of ['picare','tædam','strictum','ausare','luctam','angustum','seminare'])
  assert.equal(get(latin).teacherSensitive,true,latin);
});

test('El dossier privat no es filtra al paquet PWA ni altera el castellà',()=>{
 const dist=join(root,'dist');
 assert.equal(existsSync(join(dist,'shared/academic/evolutio-valenciano/contrastos-historics-dcvb-16-2026-11-17.json')),false);
 assert.equal(matrix.records.length,522);
 assert.equal(queue.entries.length,66);
 assert.equal(matrix.summary.lexicoDocumentado,120);
 assert.equal(matrix.summary.contrasteLexicoPendienteFonetica,66);
});
