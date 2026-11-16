// Exclusión didáctica SOLO de los sorteos de práctica de ScholaClassica.
// El banco, las 522 fichas de consulta y sus identificadores se conservan.
// El resultado castellano es la referencia: «Chimæram → quimera»,
// «Pharum → faro» y «Lycæum → liceo» son nombres comunes y siguen entrando.
// No debe excluirse una palabra solo porque el étimo latino lleve mayúscula.
export function isProperName(word){
 if(!Array.isArray(word?.answers)||!word.answers.length)
  throw new Error('Ficha de Evolutio sin resultados: '+(word?.id??'?'));
 return word.answers.some(answer=>/^\p{Lu}/u.test(String(answer)));
}
export function isPracticeWordEligible(word){
 return !isProperName(word);
}
export function eligiblePracticeWords(words){
 return words.filter(isPracticeWordEligible);
}
