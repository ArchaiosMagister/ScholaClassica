import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';

const base=resolve(import.meta.dirname,'..');
const folder='shared/academic/evolutio-valenciano/';
const read=p=>JSON.parse(readFileSync(join(base,p),'utf8'));
const review=read(folder+'contrast-independent-pilot12-2026-11-18.json');
const pilot=read(folder+'pilot-candidats-12-2026-11-18.json');
const matrix=read(folder+'matriz-522.json');
const source=read('config/sources.lock.json');
const map=new Map(matrix.records.map(x=>[x.id,x]));
const approved=new Set(['DCVB / IEC','IEC / DIEC2','AVL / DNV','GEC']);

test('Doce contrastes individuados enlazados a su ID, étimo, acepción y lema oficial IEC',()=>{
 assert.equal(review.schema,'schola-evolutio-va-pilot12-independent-research/v1');
 assert.equal(review.entries.length,12);
 assert.equal(review.summary.individuallyCheckedEtymologiesDCVB,12);
 assert.equal(review.summary.officialIEC2CoincidentLemmaSearches,12);
 assert.equal(pilot.independentPhoneticResearch,'contrast-independent-pilot12-2026-11-18.json');
 assert.deepEqual(review.entries.map(x=>x.id),pilot.entries.map(x=>x.id));
 assert.equal(new Set(review.entries.map(x=>x.id)).size,12);
 for(const entry of review.entries){
  const row=map.get(entry.id);
  const candidate=pilot.entries.find(x=>x.id===entry.id);
  assert.ok(row&&candidate,entry.id);
  assert.equal(row.latin,entry.latin);
  assert.equal(row.valenciano.resultado,entry.form);
  assert.equal(candidate.form,entry.form);
  assert.equal(entry.dcVbLexicalEtymology.lemmaAndSpecificEtymologyIndividuallyRead,true);
  assert.deepEqual(entry.dcVbLexicalEtymology.url,candidate.lexicalSource[0].url);
  assert.equal(entry.normative.iec2.entryFoundInOfficialSearch,true);
  assert.equal(entry.normative.iec2.authority,'IEC / DIEC2');
  assert.equal(entry.normative.iec2.url,'https://dlc.iec.cat/Results?EntradaText='+encodeURIComponent(entry.form)+'&operEntrada=0');
  assert.equal(entry.normative.dnv.authority,'AVL / DNV');
  assert.equal(entry.normative.dnv.entryIndividuallyVerified,false);
  assert.ok(entry.semanticSense.length>=18);
  assert.ok(entry.review.explanation.length>=80);
  assert.deepEqual(entry.selectableLaws.map(x=>x.rule),candidate.candidateSelectableLaws);
  const norms=row.valenciano.normas||[];
  assert.deepEqual(entry.selectableLaws.map(x=>x.originalUnicodeSpans),
    norms.filter(x=>x.rule!=='FIX_M').map(x=>x.spans));
  const fixed=norms.find(x=>x.rule==='FIX_M');
  assert.deepEqual(entry.finalM.originalUnicodeSpans,fixed?.spans||[]);
  assert.equal(entry.finalM.selectable,false);
  assert.equal(entry.finalM.separateFromApocope,true);
  assert.equal(entry.finalM.applies,Boolean(fixed));
  for(const field of ['allHistoricalStagesDocumented','completePhoneticChainVerified','teacherApproved','playable'])
   assert.equal(entry.review[field],false,entry.latin+': '+field);
  assert.equal(row.valenciano.aptoParaPractica,false);
 }
 assert.equal(matrix.records.length,522);
 assert.equal(matrix.summary.aptasParaPractica,0);
 assert.equal(source.sources.evolutio.sha,'901dacb125ee7894ea9d11faf7b0d0afa7e713b5');
});

test('DIEC2 ≠ DNV, y ningún contraste general se certifica como cadena completa',()=>{
 assert.equal(review.summary.confirmedIndividualDnvArticles,0);
 assert.equal(review.summary.individualHistoricalChainsFullyCertified,0);
 assert.equal(review.summary.individualApprovedSelectableLawSets,0);
 assert.equal(review.summary.teacherApproved,0);
 assert.equal(review.summary.playable,0);
 assert.match(review.normativeLimits.DNV,/not accessed/);
 assert.match(review.normativeLimits.DIEC2,/not the DNV/);
 assert.match(review.normativeLimits.DCVB,/not a normative/);
 assert.match(review.normativeLimits.GEC,/do not invent/);
 let lawCount=0,specific=0;
 const knownClasses=new Set(['exemple_directe_explicat','llei_general_amb_resultat_etimologic',
  'parella_explicita_sense_mecanisme_detallat']);
 for(const e of review.entries){
  for(const rule of e.selectableLaws){
   lawCount++;
   assert.ok(knownClasses.has(rule.evidenceClass),rule.rule);
   assert.equal(rule.lawHistoricallyFullyCertified,false);
   assert.equal(rule.originalSpanHistoricallyCertified,false);
   assert.ok(rule.sourceReferences.length);
   if(rule.evidenceClass==='exemple_directe_explicat')specific++;
   for(const source of rule.sourceReferences){
    assert.ok(approved.has(source.authority));
    assert.match(source.url,/^https:\/\/www\.enciclopedia\.cat\//);
    assert.ok(source.scope);
   }
  }
 }
 assert.equal(review.summary.simpleCorrespondencesOnlyFixedM,3);
 assert.equal(review.summary.candidatesWithSelectableLaws,9);
 assert.equal(review.summary.candidateSelectableLawInstances,12);
 assert.equal(review.summary.explicitContextualExampleRules,4);
 assert.equal(lawCount,12);
 assert.equal(specific,4);
});

test('No aceptar referencias generales equivocadas ni introducir material inseguro',()=>{
 const oldMisleadingLinks=['/c-16','/p-7','/e-6','/s-9'];
 for(const item of pilot.entries){
  for(const s of item.independentPartialContext){
   assert.match(s.url,/^https:\/\/www\.enciclopedia\.cat/);
   assert.equal(oldMisleadingLinks.some(x=>s.url.endsWith(x)),false,s.url);
  }
 }
 const cel=review.entries.find(x=>x.latin==='cælum');
 assert.equal(cel.selectableLaws.length,2);
 assert.match(cel.review.explanation,/-u final/);
 assert.equal(cel.review.completePhoneticChainVerified,false);
 const mare=review.entries.find(x=>x.latin==='matrem');
 assert.equal(mare.selectableLaws[0].evidenceClass,'parella_explicita_sense_mecanisme_detallat');
 const life=review.entries.find(x=>x.latin==='uitam');
 assert.equal(life.selectableLaws[0].evidenceClass,'exemple_directe_explicat');
 for(const latin of ['tĕrram','pŏrtam','farinam']){
  const entry=review.entries.find(x=>x.latin===latin);
  assert.deepEqual(entry.selectableLaws,[]);
  assert.equal(entry.finalM.applies,true);
 }
 for(const entry of review.entries)
  assert.equal(entry.review.playable,false,entry.latin);
});
