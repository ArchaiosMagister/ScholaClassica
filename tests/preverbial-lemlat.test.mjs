import test from 'node:test';
import assert from 'node:assert/strict';
import {queryWords,matchLemlat} from '../scripts/audit-preverbial-lemlat.mjs';
import {targetsFor} from '../scripts/audit-preverbial-lexicon.mjs';
test('lote completo sin duplicar grafías de infinitivo',()=>{
  const t=targetsFor(), words=queryWords(t);
  assert.equal(t.length,987);
  assert.equal(words.length,new Set(words).size);
  assert.ok(words.includes('clamare'));
  assert.ok(words.includes('habere'));
});
test('no acepta otros tiempos ni otras categorías ni confunde los lemas de infinitivos homógrafos',()=>{
  const targets=[{family:'cado',lemma:'incido',infinitive:'incidere'},{family:'clamo',lemma:'clamo',infinitive:'clamare'},{family:'porto',lemma:'porto',infinitive:'portare'}];
  const evidence=[
    {lemma:'incidere',form:'incidere',features:['V','NFIN','PRS']},
    {lemma:'clamare',form:'clamare',features:['V','NFIN','PST']},
    {lemma:'porto',form:'portare',features:['N']},
    {lemma:'alius',form:'portare',features:['V','NFIN','PRS']}
  ];
  assert.deepEqual(matchLemlat(targets,evidence).map(r=>r.status),['solo-forma-infinitiva','sin-evidencia','infinitivo-otro-lema']);
});

test('conserva ambas familias de incido sin atribuirles una misma entrada léxica',()=>{
  const targets=['cado','caedo'].map(family=>({family,lemma:'incido',infinitive:'incidere'}));
  const row={lemma:'incido',form:'incidere',features:['V','NFIN','PRS'],reference:'LEMLAT3:x:A1:F1'};
  const results=matchLemlat(targets,[row]);
  assert.deepEqual(results.map(r=>r.family),['cado','caedo']);
  assert.deepEqual(results.map(r=>r.status),['homografo-sin-resolver','homografo-sin-resolver']);
  assert.deepEqual(results[0].evidence,[row]);
  assert.equal(matchLemlat(targets.slice(0,1),[row])[0].status,'lema-infinitivo-presente');
  assert.equal(matchLemlat(targets.slice(0,1),[row,{...row,reference:'LEMLAT3:y:A2:F1'}])[0].status,'homografo-sin-resolver');
  assert.equal(matchLemlat(targets.slice(0,1),[row,{...row,reference:'LEMLAT3:x:A2:F1'}])[0].status,'lema-infinitivo-presente');
});
