import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join, resolve} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const from=path=>JSON.parse(readFileSync(join(root,path),'utf8'));
const folder='shared/academic/evolutio-valenciano/';
const matrix=from(folder+'matriz-522.json');
const pilot=from(folder+'pilot-candidats-12-2026-11-18.json');
const audit=from(folder+'reconciliacio-pr45-46-119-2026-11-18.json');
const records=new Map(matrix.records.map(x=>[x.id,x]));
const exclusions=new Set(['noctem','octo','dictum','sigĭllum']);

test('Pilot docent: dotze resultats existents, sense noves normes certificades ni fitxes jugables',()=>{
 assert.equal(pilot.schema,'schola-evolutio-va-pilot-review/v1');
 assert.equal(pilot.summary.selected,12);
 assert.equal(pilot.entries.length,12);
 assert.equal(new Set(pilot.entries.map(x=>x.id)).size,12);
 assert.equal(new Set(pilot.entries.map(x=>x.latin)).size,12);
 assert.deepEqual(pilot.entries.map(x=>x.latin),[
  'tĕrram','pŏrtam','farinam','focum','pontem','catenam','uitam',
  'matrem','buccam','cuppam','aucam','cælum'
 ]);
 assert.equal(matrix.records.length,522);
 assert.equal(matrix.summary.aptasParaPractica,0);
 for(const [index,candidate] of pilot.entries.entries()){
  assert.equal(candidate.order,index+1);
  assert.ok(!exclusions.has(candidate.latin),candidate.latin);
  const record=records.get(candidate.id);
  assert.ok(record,candidate.id);
  assert.equal(record.latin,candidate.latin);
  assert.equal(record.valenciano.resultado,candidate.form);
  assert.equal(record.valenciano.estadoLexico,'documentat');
  assert.equal(record.valenciano.estadoNormas,'analisi_editorial_revisada');
  const norms=record.valenciano.normas;
  assert.deepEqual(candidate.candidateSelectableLaws,norms.filter(x=>x.rule!=='FIX_M').map(x=>x.rule));
  assert.equal(candidate.nonSelectableFinalM,norms.some(x=>x.rule==='FIX_M'));
  assert.ok(candidate.candidateSelectableLaws.length<=2,candidate.latin);
  assert.deepEqual(candidate.lexicalSource,record.valenciano.evidencia);
  for(const evidence of [...candidate.lexicalSource,...candidate.independentPartialContext])
   assert.match(evidence.url,/^https:\/\//);
  assert.equal(candidate.selectionStatus,'candidat_pendent_de_validacio');
  for(const key of ['normativeDnvIndividualChecked','completeHistoricalChainCertified',
   'allSchoolLawsIndividuallyCertified','unicodeSpansHistoricallyCertified','approvedByTeacher','playable'])
   assert.equal(candidate[key],false,candidate.latin+': '+key);
  assert.equal(record.valenciano.aprobadoDocente,false);
  assert.equal(record.valenciano.aptoParaPractica,false);
 }
 for(const count of ['recordsChanged','newlyPlayable','currentDnvChecks','teacherApproved','independentlyCertifiedCompleteChains'])
  assert.equal(pilot.summary[count],0,count);
});

test('Conciliació PR #45/#46/#119: cap regressió filològica silenciosa ni reversions massives',()=>{
 assert.equal(audit.schema,'schola-evolutio-va-pr-reconciliation/v1');
 assert.equal(audit.summary.oldPR46LexicalDocumented,221);
 assert.equal(audit.summary.currentPR119EditorialDocumented,120);
 assert.equal(audit.summary.currentPR119LexicalOnly,66);
 assert.equal(audit.summary.currentPR119TotalLexicallySupported,186);
 assert.equal(audit.summary.formerlyDocumentedNowProposals,38);
 assert.equal(audit.summary.formerlyDocumentedNowPending,3);
 assert.equal(audit.summary.formerRuleSetsNotTransferred,26);
 assert.equal(audit.summary.allRecords,522);
 assert.equal(audit.summary.playable,0);
 assert.equal(audit.formerlyDocumentedNotPromotedOnPR119.length,41);
 assert.equal(new Set(audit.formerlyDocumentedNotPromotedOnPR119.map(x=>x.id)).size,41);
 assert.equal(audit.formerRuleSetsIntentionallyNotPromoted.length,26);
 for(const diff of audit.formerlyDocumentedNotPromotedOnPR119){
  const current=records.get(diff.id);
  assert.ok(current,diff.id);
  assert.equal(current.latin,diff.latin);
  assert.equal(current.valenciano.estadoLexico,diff.status119);
  assert.equal(current.valenciano.resultado??null,diff.form119);
  assert.equal(diff.status46,'documentat');
  assert.ok(['proposta','pendent'].includes(diff.status119));
  assert.equal(current.valenciano.aptoParaPractica,false);
 }
 for(const d of audit.formerRuleSetsIntentionallyNotPromoted){
  const current=records.get(d.id);
  assert.ok(current);
  assert.equal(current.valenciano.normas,null,d.id);
  assert.equal(current.valenciano.estadoNormas,'pendent',d.id);
 }
 assert.deepEqual(new Set(audit.reservedSpanishOnly),new Set(['octo','dictum','sigĭllum']));
 for(const latin of audit.reservedSpanishOnly){
  const record=matrix.records.find(x=>x.latin===latin);
  assert.ok(record,latin);
  assert.equal(record.valenciano.resultado,null);
  assert.equal(record.valenciano.aptoParaPractica,false);
 }
 assert.equal(matrix.records.filter(x=>x.valenciano.estadoLexico==='documentat').length,120);
 assert.equal(matrix.records.filter(x=>x.valenciano.estadoLexico==='contrastat_lexic_sense_fonetica').length,66);
});

test('Reserva docente noctem→nit: divergencia explícita y nunca incorporada al piloto',()=>{
 const noctem=audit.teacherDecisionsFromPR45.find(x=>x.latin==='noctem');
 assert.ok(noctem);
 assert.equal(noctem.stage45,'analisi_editorial_provisional_docent');
 assert.equal(noctem.stage119,'analisi_editorial_revisada');
 assert.deepEqual(noctem.schoolRules45,['VOC','SIMPL','APOC','FIX_M']);
 assert.deepEqual(noctem.schoolRules119,['VOC','SIMPL','FIX_M']);
 assert.equal(noctem.teacherDecisionAppliedToPractice,false);
 const remaining=['matrem','fabam','caballum'];
 for(const latin of remaining){
  const x=audit.teacherDecisionsFromPR45.find(d=>d.latin===latin);
  assert.ok(x,latin);
  assert.deepEqual(x.schoolRules45,x.schoolRules119,latin);
  assert.equal(x.teacherDecisionAppliedToPractice,false);
 }
 assert.equal(pilot.entries.some(x=>x.latin==='noctem'),false);
 assert.equal(matrix.records.filter(x=>x.valenciano.aptoParaPractica).length,0);
});
