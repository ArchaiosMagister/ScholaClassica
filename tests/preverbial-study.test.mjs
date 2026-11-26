import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { families, rounds, latin1Units } from '../public/apps/modificacion-preverbial/banco.mjs';
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

test('el estudio de Latín I respeta la programación acumulativa y no incorpora fligo sin ficha', () => {
  assert.equal(Object.keys(latin1Units).length, 27);
  assert.equal(Object.keys(families).length, 38);
  assert.equal(studyFamilies('', 'all', { latinI:true }).length, 27);
  for (const [unit, count] of [[2,4],[3,8],[4,12],[5,16],[6,20],[7,24],[8,24],[9,27],[10,27]]) {
    const entries = studyFamilies('', 'all', { latinI:true, unit });
    assert.equal(entries.length, count, 'UD'+unit);
    assert.ok(entries.every(([base])=>latin1Units[base]<=unit));
    assert.ok(rounds.some(round=>!round.source && round.prompts.every(({base})=>latin1Units[base] && latin1Units[base]<=unit)));
  }
  assert.deepEqual(studyFamilies('','fligo',{latinI:true}), []);
  assert.equal(studyFamilies('','traho',{latinI:true}).length, 0);
  assert.equal(studyFamilies('','traho').length, 1);
  for (const base of Object.keys(latin1Units)) {
    assert.ok(rounds.some(round=>!round.source && round.prompts.every(prompt=>latin1Units[prompt.base]) && round.prompts.some(prompt=>prompt.base===base)), base);
  }
});

test('cada familia añadida dispone de significado, compuestos y derivados sin duplicidades internas', () => {
  for (const [base, family] of Object.entries(families)) {
    assert.ok(family.entry && family.meaning, base);
    assert.ok(family.compounds.length >= 3, base);
    assert.equal(new Set(family.compounds.map(([lemma])=>lemma)).size, family.compounds.length);
    assert.ok(family.derivatives.length >= 2, base);
    assert.ok(family.compounds.every(row=>row.length===4 && row.every(Boolean)), base);
  }
});

test('Latín II ofrece las nueve familias nuevas sin adelantar contenidos de Latín I', () => {
  for (const base of ['ago','caedo','cedo','claudo','lego','scribo','sum','teneo','venio']) {
    assert.equal(studyFamilies('',base).length,1);
    assert.equal(studyFamilies('',base,{latinI:true}).length,0);
    assert.ok(rounds.some(round=>round.prompts.some(prompt=>prompt.base===base)),base);
  }
  assert.equal(studyFamilies('occidere').filter(([key])=>['caedo','cado'].includes(key)).length,2);
  assert.equal(rounds.length,39);
});
