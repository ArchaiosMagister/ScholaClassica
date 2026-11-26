import assert from 'node:assert/strict';
import test from 'node:test';
import { families, rounds } from '../public/apps/modificacion-preverbial/banco.mjs';
import { checkBase, correctRound } from '../public/apps/modificacion-preverbial/corrector.mjs';

test('cada ronda ofrece una solución válida de 3 + 2 compuestos y cinco derivados', () => {
  for (const round of rounds) {
    const compounds = round.prompts.map(({ base, lemma, model }) => {
      assert.ok(lemma === base || families[base].compounds.some(([name]) => name === lemma));
      return model;
    });
    assert.deepEqual(compounds.map(group => group.length), [3, 2]);
    assert.equal(round.words.length, 5);
    assert.equal(correctRound(round, compounds, round.words).points, 10, round.label);
  }
});

test('el banco atribuye cada grafía a una sola familia y a un lema registrado', () => {
  const spellings = new Set();
  for (const [base, family] of Object.entries(families)) {
    const lemmas = new Set([family.lemma ?? base, ...family.compounds.map(([lemma]) => lemma)]);
    for (const [lemma, wordClass, es, val] of family.derivatives) {
      assert.ok(lemmas.has(lemma), lemma);
      assert.ok(['sustantivo', 'verbo', 'adjetivo'].includes(wordClass), wordClass);
      for (const word of new Set([es, val].filter(Boolean))) {
        assert.ok(!spellings.has(word), word);
        spellings.add(word);
      }
    }
  }
});

test('acepta infinitivos y variantes latinas y puntúa la deduplicación y las clases por familia', () => {
  const result = correctRound(rounds[0],
    [[' CONFĔRRE ', 'confero', 'præferre'], ['attraho', 'trahere']],
    ['conferencia', 'conferència', 'preferente', 'atractiu', 'atraure']);
  assert.deepEqual(result.compounds.map(group => group.map(item => item.status)), [
    ['correct', 'duplicate', 'correct'], ['correct', 'base'],
  ]);
  assert.deepEqual(result.words.map(item => item.status), [
    'correct', 'duplicate', 'correct', 'correct', 'correct',
  ]);
  assert.equal(result.points, 7);
});

test('explica el vínculo pendiente, la clase repetida y las grafías que no reconoce', () => {
  const result = correctRound(rounds[0],
    [['confero', 'differo', ''], ['attraho', 'ducere']],
    ['referencia', 'conferir', 'diferir', 'atraccio', '']);
  assert.deepEqual(result.words.map(item => item.status), [
    'origin', 'correct', 'class', 'unknown', 'empty',
  ]);
  assert.equal(result.compounds[1][1].status, 'unknown');
  assert.equal(result.points, 4);
});

test('la forma prefijada y conjugada exige el verbo simple en primera persona', () => {
  const prompt = rounds.flatMap(round => round.prompts).find(item => item.form === 'profugerunt');
  assert.equal(checkBase(prompt, ' FŬGIO '), 'correct');
  assert.equal(checkBase(prompt, 'profugerunt'), 'compound');
  assert.equal(checkBase(prompt, 'profugio'), 'compound');
  assert.equal(checkBase(prompt, 'refugere'), 'compound');
  assert.equal(checkBase(prompt, 'fugere'), 'infinitive');
  assert.equal(checkBase(prompt, 'fugi'), 'unknown');
  assert.equal(checkBase(prompt, '  '), 'empty');
  const unprefixed = rounds.flatMap(round => round.prompts).find(item => item.form === 'pugnatum');
  assert.equal(checkBase(unprefixed, 'pugnatum'), 'inflected');
  assert.equal(checkBase(unprefixed, 'pugno'), 'correct');
});
