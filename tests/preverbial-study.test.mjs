import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { families } from '../public/apps/modificacion-preverbial/banco.mjs';
import { studyFamilies, familyOrigins } from '../public/apps/modificacion-preverbial/study.mjs';

test('el estudio consulta todas las familias del mismo banco de práctica, en orden alfabético', () => {
  const keys = studyFamilies().map(([key]) => key);
  assert.deepEqual(keys, Object.keys(families).sort((a,b) => a.localeCompare(b,'la')));
  for (const [base, family] of studyFamilies()) {
    const origins = familyOrigins(base, family);
    assert.equal(origins[0].lemma, base);
    assert.equal(origins.length, family.compounds.length + 1);
    assert.equal(origins.flatMap(origin => origin.derivatives).length, family.derivatives.length);
    for (const origin of origins) {
      assert.ok(origin.derivatives.every(([lemma]) => lemma === origin.lemma));
    }
  }
});

test('busca bases, infinitivos, preverbios, glosas y derivados en ambas lenguas', () => {
  for (const [query, key] of [
    ['FERO','fero'], ['accipere','capio'], ['recepcion','capio'],
    ['recepció','capio'], ['atraure','traho'], ['arrastrar','traho'],
    ['subter','fugio'], ['perficio perfección','facio']
  ]) assert.ok(studyFamilies(query).some(([base]) => base === key), query);
  assert.deepEqual(studyFamilies('recepción','fero'), []);
  assert.deepEqual(studyFamilies('','mitto').map(([key])=>key), ['mitto']);
  assert.deepEqual(studyFamilies('zzzzzzzz'), []);
  assert.deepEqual(studyFamilies('','unknown'), []);
});

test('la navegación enlaza estudio y práctica y conserva Latín I', async () => {
  const load = name => readFile(new URL('../public/apps/modificacion-preverbial/'+name, import.meta.url),'utf8');
  const [practice, study, practiceJs, studyJs] = await Promise.all(['index.html','estudio.html','practica.mjs','estudio.mjs'].map(load));
  assert.match(practice,/href="\.\/estudio\.html" id="study-link"/);
  assert.match(study,/href="\.\/index\.html" id="practice-link"/);
  assert.ok(practiceJs.includes('./estudio.html?subject=lat1'));
  assert.ok(studyJs.includes('./index.html?subject=lat1'));
  assert.match(study,/aria-current="page">Estudiar/);
});
