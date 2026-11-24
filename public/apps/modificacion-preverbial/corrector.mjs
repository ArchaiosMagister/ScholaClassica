import { families } from './banco.mjs';

function normalizeWord(value) {
  return value.trim().toLowerCase().normalize('NFC');
}

function normalizeLatin(value) {
  return normalizeWord(value).normalize('NFD')
    .replace(/[\u0304\u0306]/gu, '')
    .replaceAll('æ', 'ae').replaceAll('œ', 'oe')
    .replaceAll('v', 'u').replaceAll('j', 'i');
}

export function correctRound(round, compoundAnswers, wordAnswers) {
  const proposed = new Set();
  const compounds = round.prompts.map(({ base }, index) => {
    const seen = new Set();
    const family = families[base];
    return compoundAnswers[index].map(answer => {
      const key = normalizeLatin(answer);
      if (!key) return { status: 'empty' };
      if (key === base || key === family.entry.split(', ')[1]) return { status: 'base' };
      const entry = family.compounds.find(([lemma, infinitive]) =>
        key === normalizeLatin(lemma) || key === normalizeLatin(infinitive));
      if (!entry) return { status: 'unknown' };
      const [lemma] = entry;
      if (seen.has(lemma)) return { status: 'duplicate', entry };
      seen.add(lemma);
      proposed.add(lemma);
      return { status: 'correct', entry };
    });
  });

  const countedWords = new Set();
  const countedClassesByBase = new Map();
  const availableWords = round.prompts.flatMap(({ base }) =>
    families[base].derivatives.map(entry => ({ base, entry })));
  const words = wordAnswers.map(answer => {
    const key = normalizeWord(answer);
    if (!key) return { status: 'empty' };
    const match = availableWords.find(({ entry: [, , es, val] }) => key === es || key === val);
    if (!match) return { status: 'unknown' };

    const { base, entry } = match;
    const [origin, wordClass] = entry;
    if (countedWords.has(entry)) return { ...match, status: 'duplicate' };
    if (origin !== base && !proposed.has(origin)) return { ...match, status: 'origin' };
    if (!countedClassesByBase.has(base)) countedClassesByBase.set(base, new Set());
    const countedClasses = countedClassesByBase.get(base);
    if (countedClasses.has(wordClass)) return { ...match, status: 'class' };

    countedClasses.add(wordClass);
    countedWords.add(entry);
    return { ...match, status: 'correct' };
  });

  return {
    compounds, words,
    points: [...compounds.flat(), ...words].filter(item => item.status === 'correct').length,
  };
}
