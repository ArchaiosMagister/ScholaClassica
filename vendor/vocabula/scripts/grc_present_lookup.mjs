#!/usr/bin/env node
/**
 * Lematización offline del presente de indicativo griego (ático escolar).
 * Devuelve todas las lecturas del inventario, con grado de verificación.
 * Sin red, dependencias de terceros ni modificación de la autocorrección.
 */
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const dataUrl = new URL('../data/grc-present-indicative-offline.json', import.meta.url);
export const corpus = JSON.parse(readFileSync(dataUrl, 'utf8'));

export function normalizeGreek(input) {
  return String(input ?? '').trim().toLowerCase().normalize('NFD')
    .replace(/\u0345/g, 'ι') // conservar la diferencia de iota suscrita
    .replace(/\p{M}/gu, '').replace(/ς/g, 'σ')
    .replace(/[·.,;!?¿¡‘’'"«»]/gu, '').replace(/\s+/gu, ' ')
    .normalize('NFC');
}
function exactGreek(input) {
  return String(input ?? '').trim().toLowerCase().normalize('NFC')
    .replace(/[·.,;!?¿¡‘’'"«»]/gu, '');
}
export function expandOptionalNu(surface) {
  if (!surface.endsWith('(ν)')) return [surface];
  return [surface.slice(0, -3), surface.slice(0, -3) + 'ν'];
}
export function buildIndex(data = corpus) {
  const index = new Map();
  for (const lexeme of data.entries) {
    for (const paradigm of lexeme.paradigms) {
      for (const [personNumber, surface] of Object.entries(paradigm.forms)) {
        const person = Number(personNumber[0]);
        const number = personNumber.slice(1) === 'sg' ? 'singular' : 'plural';
        for (const sourceVariant of [surface, ...(paradigm.alternates?.[personNumber] ?? [])]) {
          for (const variant of expandOptionalNu(sourceVariant)) {
            const key = normalizeGreek(variant);
            if (!index.has(key)) index.set(key, []);
            const record = {
              lemma: lexeme.lemma,
              form: surface,
              matched_variant: variant,
              voice: paradigm.voice,
              deponent: lexeme.deponent,
              inflection: lexeme.inflection,
              tense: 'present',
              mood: 'indicative',
              person,
              number,
              status: paradigm.status,
              verification: paradigm.review?.per_person?.[personNumber] ?? 'unreviewed',
              review_tier: paradigm.review?.tier ?? 'unreviewed',
              source_urls: paradigm.review?.source_urls ?? []
            };
            const records = index.get(key);
            if (!records.some(x =>
              x.lemma === record.lemma && x.voice === record.voice &&
              x.person === person && x.number === number
            )) records.push(record);
          }
        }
      }
    }
  }
  return index;
}
const index = buildIndex();
/**
 * Incluye coincidencias sin diacríticos, indicándolo en accent_match.
 * No desambigua por contexto y tampoco presupone que un lema de fuera
 * del vocabulario sea imposible (p.ej. εἶμι y εἰμί pueden confluir sin acentos).
 */
export function lemmatizeGreekPresent(surface) {
  if (!String(surface ?? '').trim()) return [];
  const query = exactGreek(surface);
  return (index.get(normalizeGreek(surface)) ?? []).map(record => ({
    ...record,
    accent_match: exactGreek(record.matched_variant) === query ? 'exact' : 'folded'
  }));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const input = process.argv.slice(2).join(' ');
  if (!input) {
    console.error('Uso: node scripts/grc_present_lookup.mjs <forma griega>');
    process.exitCode = 2;
  } else console.log(JSON.stringify(lemmatizeGreekPresent(input), null, 2));
}
