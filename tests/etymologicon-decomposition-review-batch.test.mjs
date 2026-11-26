import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {compileTeacherAudit} from '../scripts/compile-etymologicon-gr1.mjs';
import {createLearnerCatalog} from '../scripts/build-etymologicon.mjs';
import {expandGreekI} from '../scripts/expand-etymologicon-gr1.mjs';
import {createStudyCatalog} from '../scripts/compile-etymologicon-study.mjs';
import {createDecompositionCatalog} from '../scripts/compile-etymologicon-decomposition.mjs';
const base=compileTeacherAudit(), learners=createLearnerCatalog(base), expanded=expandGreekI(learners), study=createStudyCatalog(base,expanded);
const batch=JSON.parse(readFileSync(new URL('../shared/academic/greek-etymology/decomposition/gr1-review-batch-20261126.json',import.meta.url),'utf8'));
const pilot=createDecompositionCatalog(learners);
const key=s=>s.normalize('NFD').replace(/\p{M}/gu,'').replace(/ς/g,'σ').toLowerCase();
test('primer lote cotejado permanece separado del piloto y mantiene progresión curricular',()=>{
  assert.equal(batch.items.length,9);
  assert.equal(new Set(batch.items.map(w=>w.form)).size,9);
  assert.equal(batch.publicationAllowed,false);
  for(const row of batch.items){
    const word=study.words.find(w=>w.form===row.form);
    assert.ok(word,row.form);
    assert.equal(word.lexicographicStatus,'dle_consultado_individualmente',row.form);
    assert.equal(word.components.length,2,row.form);
    assert.deepEqual(word.components.map(c=>key(c.greek)),row.components.map(c=>key(c.greek)),row.form);
    const etymons=row.components.map(c=>expanded.etymons.find(e=>e.lemma.split('|').some(part=>key(part.split(',')[0].replace(/\s*\(.*/, '').trim())===key(c.greek))));
    assert.ok(etymons.every(e=>e?.editorialStatus==='approved_for_documented_derivatives'),row.form);
    const first=Math.max(...etymons.map(e=>Math.min(...e.units.map(u=>Number(u.slice(2))))));
    assert.equal(row.introducedAtUnit,'UD'+first,row.form);
    assert.equal(row.enabledForPractice,false);
    assert.equal(row.enabledForExams,false);
    assert.ok(!pilot.entries.some(e=>e.form===row.form),row.form);
    assert.ok(row.evidence.url.startsWith('https://dle.rae.es/'));
  }
  assert.equal(pilot.entries.length,16);
});
