import { families, latin1Units } from './banco.mjs';

const normalize = value => String(value ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();

// El buscador devuelve familias completas, no reconstruye ni inventa étimos.
export function studyFamilies(query = '', base = 'all', { latinI = false, unit = 'all' } = {}) {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  return Object.entries(families)
    .filter(([key, family]) => {
      if (base !== 'all' && key !== base) return false;
      if (latinI && (!latin1Units[key] || (unit !== 'all' && latin1Units[key] > Number(unit)))) return false;
      const corpus = normalize([key, family.entry, family.meaning,
        ...family.compounds.flat(), ...family.derivatives.flat(), ...(family.reservedCompounds ?? []).flat()].join(' '));
      return terms.every(term => corpus.includes(term));
    })
    .sort(([a], [b]) => a.localeCompare(b, 'la'));
}

export function familyOrigins(base, family) {
  return [
    { lemma: family.lemma ?? base, infinitive: '', prefix: '', meaning: family.meaning },
    ...family.compounds.map(([lemma, infinitive, prefix, meaning]) => ({ lemma, infinitive, prefix, meaning })),
  ].map(origin => ({
    ...origin,
    compositionLabel: family.compositionLabel ?? 'Preverbio',
    derivatives: family.derivatives.filter(([lemma]) => lemma === origin.lemma),
  }));
}
