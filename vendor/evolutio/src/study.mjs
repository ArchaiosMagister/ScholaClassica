// Utilidades puras de consulta. Reutilizan exclusivamente las fichas ya revisadas.
import { RULES } from './rules.mjs';
import { latinU } from './latin.mjs';

// Las variantes tipográficas æ/ae y œ/oe, las cantidades vocálicas y las
// tildes no deben impedir encontrar una ficha. No altera las respuestas
// exigibles en el modo de práctica.
export function normalizeStudyQuery(value) {
  return String(value ?? '')
    .replace(/æ/gi, 'ae').replace(/œ/gi, 'oe')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es').replace(/\s+/g, ' ').trim();
}
// Baraja una copia: no modifica el banco y conserva cada ficha una sola vez.
// El orden se mantiene en la interfaz hasta que el usuario decide barajar de nuevo.
export function shuffleStudyWords(words, random=Math.random) {
  const shuffled=[...words];
  for(let i=shuffled.length-1;i>0;i--){
    const j=Math.floor(random()*(i+1));
    [shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];
  }
  return shuffled;
}
export const sortStudyWords = words => [...words].sort((a,b) =>
  normalizeStudyQuery(a.latin).localeCompare(normalizeStudyQuery(b.latin),'es') || a.id.localeCompare(b.id));
export function findStudyWords(words, query) {
 const q=normalizeStudyQuery(query),latinQuery=normalizeStudyQuery(latinU(query));
 if (!q) return sortStudyWords(words);
 // El alumno puede buscar «vitam» o «uitam»: solo la grafía latina
 // admite esta equivalencia; las respuestas castellanas conservan su v.
 const variants=w=>[
  {form:normalizeStudyQuery(w.latin),query:latinQuery},
  ...(w.answers||[]).map(answer=>({form:normalizeStudyQuery(answer),query:q}))
 ];
 const candidates=words.filter(w=>variants(w).some(({form,query})=>form.includes(query)));
 return candidates.sort((a,b)=>{
  const score=w=>{
   const forms=variants(w);
   return forms.some(({form,query})=>form===query)?0
    :forms.some(({form,query})=>form.startsWith(query))?1:2;
  };
  return score(a)-score(b) || normalizeStudyQuery(a.latin).localeCompare(normalizeStudyQuery(b.latin),'es');
 });
}
export function studyWordsForRule(words, ruleId, subtype='') {
  if (!RULES.some(r=>r.id===ruleId)) return [];
  return sortStudyWords(words.filter(w=>w.changes.some(c=>c.rule===ruleId && (!subtype || c.subtype===subtype))));
}
export function studyRuleCounts(words) {
  return Object.fromEntries(RULES.map(rule=>[rule.id,studyWordsForRule(words,rule.id).length]));
}
export function studySubtypes(words, ruleId) {
  const totals=new Map();
  for(const w of words){
    const seen=new Set(w.changes.filter(c=>c.rule===ruleId && c.subtype).map(c=>c.subtype));
    for(const subtype of seen)totals.set(subtype,(totals.get(subtype)||0)+1);
  }
  return [...totals].sort(([a],[b])=>a.localeCompare(b,'es')).map(([name,count])=>({name,count}));
}
// Los intervalos pertenecen al original latino, nunca se deducen del resultado.
// Se devuelve un índice por carácter Unicode, por lo que admite ligaduras,
// grupos, dos tramos discontiguos y puntos de inserción antes/dentro/después.
export function studyHighlight(word, change) {
  const indices=new Set();
  for(const [a,b] of change.spans??[])for(let i=a;i<b;i++)indices.add(i);
  return {indices,anchor:Number.isInteger(change.anchor)?change.anchor:null};
}
