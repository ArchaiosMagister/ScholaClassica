import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const dir='shared/academic/evolutio-valenciano/';
const read=name=>JSON.parse(readFileSync(join(root,dir+name),'utf8'));
const trio=read('contrast-avl-gnv-vida-boca-copa-2026-11-18.json');
const parent=read('contrast-independent-pilot12-2026-11-18.json');
const matrix=read('matriz-522.json');
const byLatin=new Map(parent.entries.map(e=>[e.latin,e]));
const byId=new Map(matrix.records.map(e=>[e.id,e]));

test('GNV de l\u0027AVL: tres exemples en la p. 9 amb el fonema documentat exacte; DNV no suplantat',()=>{
 assert.equal(trio.schema,'schola-evolutio-va-avl-gnv-trio/v1');
 assert.equal(trio.entries.length,3);
 assert.deepEqual(trio.entries.map(e=>e.latin),['uitam','buccam','cuppam']);
 assert.deepEqual(trio.entries.map(e=>e.expectedValencianForm),['vida','boca','copa']);
 assert.deepEqual(trio.entries.map(e=>e.officialAVLNormativeExample.phoneticSymbol),['[a]','[o]','[p]']);
 assert.equal(trio.summary.normativeAVLWrittenExamplesConfirmed,3);
 assert.equal(trio.summary.dnvIndividualArticlesConfirmed,0);
 assert.equal(trio.sourceReferences.officialNormativeAVLGNV.authority,'Acadèmia Valenciana de la Llengua');
 assert.match(trio.sourceReferences.officialNormativeAVLGNV.url,/gramatica_normativa_valenciana\.pdf$/);
 assert.equal(trio.sourceReferences.officialNormativeAVLGNV.location.includes('9'),true);
 assert.equal(trio.sourceReferences.officialNormativeAVLGNV.individualDnvArticle,false);
 assert.equal(trio.sourceReferences.DNV.individualEntriesAvailable,false);
 assert.equal(trio.summary.completeHistoricalChainsCertified,0);
 assert.equal(trio.summary.teacherApproved,0);
 assert.equal(trio.summary.playable,0);
 for(const e of trio.entries){
  assert.equal(e.officialAVLNormativeExample.pagePrinted,9);
  assert.equal(e.officialAVLNormativeExample.pdfPageIndex,8);
  assert.equal(e.officialAVLNormativeExample.attested,true);
  assert.equal(e.officialAVLNormativeExample.sourceNotDnv,true);
  assert.equal(e.officialAVLNormativeExample.form,e.expectedValencianForm);
  assert.equal(e.currentDnvIndividualEntryChecked,false);
  assert.equal(e.fullHistoricalChainCertified,false);
  assert.equal(e.allLawsAuthorizedForAssessment,false);
  assert.equal(e.teacherApproved,false);
  assert.equal(e.playable,false);
  const record=byId.get(e.id);
  const prior=byLatin.get(e.latin);
  assert.ok(record&&prior,e.latin);
  assert.equal(record.latin,e.latin);
  assert.equal(record.valenciano.resultado,e.expectedValencianForm);
  assert.equal(prior.form,e.expectedValencianForm);
  assert.equal(prior.dcVbLexicalEtymology.url,e.lexicalDCVB.url);
  assert.equal(record.valenciano.aptoParaPractica,false);
  assert.equal(record.valenciano.aprobadoDocente,false);
  assert.deepEqual(e.nonSelectableFinalM.originalUnicodeSpans,prior.finalM.originalUnicodeSpans);
  assert.equal(e.nonSelectableFinalM.selectable,false);
  assert.equal(e.nonSelectableFinalM.fragment,'m');
 }
 assert.match(trio.entries.find(e=>e.latin==='cuppam').officialAVLNormativeExample.role,/no és verificació directa del timbre/);
 assert.match(trio.entries.find(e=>e.latin==='buccam').philologicalCaution,/\[ɔ\]/);
});

test('GEC fonètica: quatre mecanismes de parella explícita més una regla general; trams de llatí intactes',()=>{
 assert.equal(trio.summary.directWordSpecificHistoricalMechanismReferences,4);
 assert.equal(trio.summary.generalRulesWithSourceAndSpecificEtymon,1);
 assert.equal(trio.summary.selectableLaws,5);
 const actual=trio.entries.flatMap(e=>e.historicalSchoolRules.map(r=>r.evidenceKind));
 assert.equal(actual.filter(x=>x==='parella_i_llei_expresses').length,4);
 assert.equal(actual.filter(x=>x==='patro_general_mes_etimologia').length,1);
 assert.deepEqual(trio.entries.map(e=>e.historicalSchoolRules.map(r=>r.rule)),[
  ['SONOR'],['ABER','SIMPL'],['ABER','SIMPL']
 ]);
 for(const e of trio.entries){
  const prior=byLatin.get(e.latin);
  assert.deepEqual(e.historicalSchoolRules.map(r=>r.rule),prior.selectableLaws.map(r=>r.rule));
  for(const [i,r]of e.historicalSchoolRules.entries()){
   assert.deepEqual(r.originalUnicodeSpans,prior.selectableLaws[i].originalUnicodeSpans);
   assert.equal(r.originalUnicodeSpans.length,1);
   const [start,end]=r.originalUnicodeSpans[0];
   assert.ok(start>=0&&end>start&&end<=e.latin.length);
   assert.equal(e.latin.slice(start,end),r.latinFragment);
   assert.match(r.sourceUrl,/^https:\/\/www\.enciclopedia\.cat\//);
   assert.equal(r.completeHistoricalChain,false);
   assert.equal(r.approvedForEvaluation,false);
  }
 }
 const entry=trio.entries.find(e=>e.latin==='uitam');
 assert.match(entry.philologicalCaution,/VOCALITZACIÓ/);
 assert.equal(entry.nonSelectableFinalM.present,true);
 assert.equal(matrix.records.length,522);
 assert.equal(matrix.summary.aptasParaPractica,0);
 assert.equal(matrix.records.filter(e=>e.valenciano.aptoParaPractica).length,0);
});
