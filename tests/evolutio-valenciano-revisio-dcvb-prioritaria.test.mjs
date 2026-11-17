import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const academic='shared/academic/evolutio-valenciano/';
const read=name=>JSON.parse(readFileSync(join(root,academic+name),'utf8'));
const review=read('revisio-dcvb-prioritaria-2026-11-17.json');
const originalAudit=read('auditoria-pendents-146-2026-11-17.json');
const matrix=read('matriz-522.json');

test('Revisió prioritària DCVB: fonts individualitzades i cap certificació simulada',()=>{
  assert.equal(review.schema,'schola-evolutio-va-dcvb-targeted-review/v1');
  assert.deepEqual(review.summary,{
    reviewed:18,lexicalCorrespondencesSupported:16,reservedForLoanStratum:1,reservedForValencianForm:1,
    dnvIndividualChecked:0,rulesCertified:0,teacherApproved:0,playable:0,
    curationEntriesPromoted:0
  });
  assert.equal(review.items.length,18);
  assert.equal(new Set(review.items.map(x=>x.latin)).size,18);
  assert.equal(review.items.filter(x=>x.reviewOutcome==='etimologia_i_acepcio_dcvb_contrastades').length,16);
  assert.equal(review.items.filter(x=>x.reviewOutcome==='reserva_per_estrat_de_prestec').length,1);
  assert.equal(review.items.filter(x=>x.reviewOutcome==='reserva_per_variant_valenciana').length,1);
  for(const item of review.items){
    assert.equal(item.source.authority,'DCVB');
    assert.match(item.source.url,/^https:\/\/dcvb\.iec\.cat\/results\.asp\?word=[^\s]+$/);
    assert.equal(item.lexicalContrast,true);
    for(const flag of ['dnvIndividualChecked','rulesCertified','teacherApproved','playable'])
      assert.equal(item[flag],false,item.latin+': '+flag);
    assert.equal(item.stillProposalInMatrix,true);
    const before=originalAudit.items.find(x=>x.latin===item.latin);
    assert.ok(before,item.latin+' no existía en la auditoría original');
    assert.equal(before.proposta,item.proposta);
    assert.equal(before.outcome,'pendent_contrast_individual');
    const registered=matrix.records.find(x=>x.latin===item.latin);
    assert.ok(registered,item.latin+' no existía en la matriz');
    assert.equal(registered.valenciano.resultado,item.proposta);
    assert.equal(registered.valenciano.estadoLexico,'proposta');
    assert.notEqual(registered.valenciano.dnvIndividualChecked,true); // Campo opcional en fichas aún propuestas
    assert.equal(registered.valenciano.aprobadoDocente,false);
    assert.equal(registered.valenciano.aptoParaPractica,false);
  }
  const membre=review.items.find(x=>x.latin==='membrum');
  assert.ok(membre.requiresLayerDecision);
  assert.equal(membre.reviewOutcome,'reserva_per_estrat_de_prestec');
  const cuir=review.items.find(x=>x.latin==='cŏrium');
  assert.ok(cuir.requiresLayerDecision);
  assert.equal(cuir.reviewOutcome,'reserva_per_variant_valenciana');
  assert.equal(matrix.summary.aptasParaPractica,0);
  assert.equal(matrix.records.length,522);
});
