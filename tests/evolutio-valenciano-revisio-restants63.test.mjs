import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const base='shared/academic/evolutio-valenciano/';
const read=name=>JSON.parse(readFileSync(join(root,base+name),'utf8'));
const original=read('auditoria-pendents-146-2026-11-17.json');
const first=read('revisio-dcvb-prioritaria-2026-11-17.json');
const rest=read('revisio-restants-63-2026-11-17.json');
const matrix=read('matriz-522.json');
test('Revisió filològica global: les 81 propostes prèvies tenen exactament una revisió, sense tocar la matriu',()=>{
 const originalQueue=original.items.filter(x=>x.outcome==='pendent_contrast_individual');
 assert.equal(originalQueue.length,81);
 assert.equal(first.items.length,18);
 assert.equal(rest.entries.length,63);
 const together=[...first.items,...rest.entries];
 assert.equal(together.length,81);
 assert.equal(new Set(together.map(r=>r.latin)).size,81);
 assert.deepEqual(new Set(together.map(r=>r.latin)),new Set(originalQueue.map(r=>r.latin)));
 assert.deepEqual(rest.summary,{
  originalQueue:81,previousReviewed:18,reviewedThisBatch:63,reviewedTotal:81,
  lexicalCorrespondencesSupported:50,individuallyReserved:13,
  noIndividualEtymologyRecovered:1,confirmedDnv:0,
  certifiedRules:0,approvedForPractice:0,promotedToMatrix:0
 });
 for(const [i,item] of rest.entries.entries()){
  const origin=originalQueue.find(r=>r.latin===item.latin);
  assert.ok(origin,item.latin);
  assert.equal(item.order,i+1);
  assert.equal(item.proposta,origin.proposta);
  assert.ok(['relacio_lexica_etimologica_documentada','reserva_filologica'].includes(item.lexicalReview));
  if(item.lexicalReview==='relacio_lexica_etimologica_documentada')
   assert.ok(item.evidence?.authority&&item.evidence?.url,item.latin);
  if(item.individualContrast==='documentacio_etimologica_no_recuperada')
   assert.equal(item.lexicalReview,'reserva_filologica');
  assert.ok(item.note.length>25,item.latin);
  assert.equal(item.stillProposalInMatrix,true);
  for(const flag of ['dnvIndividualChecked','rulesCertified','teacherApproved','playable'])
   assert.equal(item[flag],false,item.latin+': '+flag);
  const m=matrix.records.find(w=>w.latin===item.latin);
  assert.ok(m,item.latin);
  assert.equal(m.valenciano.resultado,item.proposta);
  assert.equal(m.valenciano.estadoLexico,'proposta');
  assert.equal(m.valenciano.aprobadoDocente,false);
  assert.equal(m.valenciano.aptoParaPractica,false);
 }
 assert.deepEqual(matrix.summary,{
  total:522,lexicoDocumentado:120,propuestas:118,sinPropuesta:284,
  reservasSoloCastellano:3,normasVerificadas:0,aptasParaPractica:0,
  analisisEditoriales:120,casosConDiscrepancia:0
 });
});
test('Casos de riesgo documentados sin inventar cadenas patrimoniales',()=>{
 const byLatin=new Map(rest.entries.map(r=>[r.latin,r]));
 for(const latin of ['datum','luxum','leguminem','planctum','pluuiam','sensum','stabĭlem','uitium','acutiare','iacere','uiduam','mutabĭlem','curtare'])
  assert.equal(byLatin.get(latin).lexicalReview,'reserva_filologica',latin);
 assert.match(byLatin.get('leguminem').note,/acusatiu/);
 assert.match(byLatin.get('sensum').note,/germànic/);
 assert.match(byLatin.get('pluuiam').note,/vulgar/);
 assert.match(byLatin.get('datum').note,/incerta/);
 const noSource=rest.entries.filter(r=>r.individualContrast==='documentacio_etimologica_no_recuperada');
 assert.deepEqual(noSource.map(r=>r.latin),['mutabĭlem']);
 assert.equal(new Set(rest.entries.map(r=>r.latin)).size,63);
 assert.equal(matrix.records.length,522);
 assert.equal(matrix.records.filter(w=>w.valenciano.aptoParaPractica).length,0);
});
