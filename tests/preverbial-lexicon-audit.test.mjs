import test from 'node:test';
import assert from 'node:assert/strict';
import {targetsFor,makeMatcher,derivativeQueue} from '../scripts/audit-preverbial-lexicon.mjs';
import {families} from '../public/apps/modificacion-preverbial/banco.mjs';
test('audita los 120 verbos simples y los 867 compuestos sin mezclar reservas',()=>{
  const targets=targetsFor();
  assert.equal(targets.length,987);
  assert.equal(targets.filter(t=>t.kind==='simple').length,120);
  assert.equal(targets.filter(t=>t.kind==='compuesto').length,867);
  assert.ok(targets.every(t=>t.lemma&&t.infinitive));
  assert.equal(targets.filter(t=>t.lemma==='volo').length,2);
  assert.ok(!targets.some(t=>t.lemma==='possum'));
});
test('distingue coincidencias, formas de otro lema y ausencia de evidencia',()=>{
  const targets=[{lemma:'fero',infinitive:'ferre'},{lemma:'amo',infinitive:'amare'},{lemma:'lego',infinitive:'legere'},{lemma:'cado',infinitive:'cadere'}];
  const m=makeMatcher(targets);
  for(const [lemma,form,tag] of [['ferō','ferre','V;NFIN'],['alius','amare','V;NFIN'],['legō','legit','V;IND'],['cado','cadere','N']])m.ingest({lemma,form,features:tag.split(';'),rawFeatures:tag});
  assert.deepEqual(m.report().map(t=>t.status),['coincidencia-lema-forma','forma-otro-lema','lema-sin-forma','lema-sin-forma']);
});
test('genera fichas de cotejo para todas las grafías sin declarar verificaciones inexistentes',()=>{
  const q=derivativeQueue();
  assert.equal(q.filter(r=>r.language==='es').length,Object.values(families).reduce((n,f)=>n+f.derivatives.length,0));
  assert.equal(q.filter(r=>r.language==='val').length,Object.values(families).reduce((n,f)=>n+f.derivatives.filter(d=>d[3]).length,0));
  assert.ok(q.every(r=>r.status==='pendiente-cotejo-individual'));
  for(const [family,word] of [['carpo','carpir'],['caedo','preciso'],['tego','techo'],['iungo','subjuntivo']]) assert.ok(q.some(r=>r.family===family&&r.word===word));
});
