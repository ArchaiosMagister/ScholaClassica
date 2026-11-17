import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const base='shared/academic/evolutio-valenciano/';
const read=p=>JSON.parse(readFileSync(join(root,base+p),'utf8'));
const triage=read('triage-27-advertencies-2026-11-17.json');
const first=read('contrastos-historics-dcvb-16-2026-11-17.json');
const second=read('contrastos-historics-dcvb-restants31-2026-11-17.json');
const queue=read('cola-fonetica-66-2026-11-17.json');
const matrix=read('matriz-522.json');

test('Les 27 reserves de les 47 candidatures consten una sola vegada amb categoria i font originals',()=>{
 assert.equal(triage.schema,'schola-evolutio-va-sensitive-47-triage/v1');
 assert.deepEqual(triage.summary,{
  reviewed:47,flagged:27,unflaggedButStillUncertified:20,
  flaggedByCategory:{
   homonimia_i_accepcio:6,vigencia_o_variant_valenciana:4,
   etim_base_i_estrat:5,cadena_i_variants_no_equivalents_a_lleis:12
  },
  dnvChecked:0,individuallyCertifiedLaws:0,teacherApproved:0,playable:0
 });
 const all=[...first.entries,...second.entries];
 const sensitive=all.filter(x=>x.teacherSensitive);
 assert.equal(sensitive.length,27);
 assert.equal(triage.entries.length,27);
 assert.equal(new Set(triage.entries.map(x=>x.latin)).size,27);
 assert.deepEqual(new Set(triage.entries.map(x=>x.latin)),new Set(sensitive.map(x=>x.latin)));
 assert.deepEqual(
  Object.fromEntries(Object.keys(triage.summary.flaggedByCategory).map(k=>[
   k,triage.entries.filter(x=>x.category===k).length
  ])),triage.summary.flaggedByCategory);
 for(const [i,r] of triage.entries.entries()){
  assert.equal(r.order,i+1);
  const original=sensitive.find(x=>x.latin===r.latin);
  assert.ok(original);
  assert.equal(r.form,original.form);
  assert.equal(r.sourceUrl,original.source.url);
  assert.equal(r.evidenceNote,original.individualHistoricalAssessment);
  assert.ok(r.nextAction.length>65);
  assert.equal(r.status,'reserva_docent_no_certificada');
  assert.ok(['contrastos-historics-dcvb-16-2026-11-17.json',
    'contrastos-historics-dcvb-restants31-2026-11-17.json'].includes(r.originalAudit));
  assert.ok(queue.entries.find(x=>x.latin===r.latin).review.proposedChanges.length>0);
  for(const flag of ['dnvIndividualChecked','individualLawCertified','teacherApproved','playable'])
   assert.equal(r[flag],false);
  const m=matrix.records.find(x=>x.latin===r.latin);
  assert.ok(m);
  assert.equal(m.valenciano.normas,null);
  assert.equal(m.valenciano.aptoParaPractica,false);
 }
 assert.equal(queue.entries.filter(x=>x.review.proposedChanges.length>0).length,47);
 assert.equal(matrix.summary.aptasParaPractica,0);
});

test('Reserva docent: cap document provisional es distribueix amb el PWA',()=>{
 const dist=join(root,'dist');
 assert.equal(existsSync(join(dist,'shared/academic/evolutio-valenciano/triage-27-advertencies-2026-11-17.json')),false);
 assert.equal(matrix.records.length,522);
 assert.equal(queue.summary.playable,0);
});
