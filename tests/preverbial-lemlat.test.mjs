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
  assert.deepEqual(matchLemlat(targets,evidence).map(r=>r.status),['lema-infinitivo-presente','sin-evidencia','infinitivo-otro-lema']);
});
