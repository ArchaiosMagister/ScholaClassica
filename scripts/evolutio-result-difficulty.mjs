// Adaptación didáctica exclusiva de Evolutio en ScholaClassica.
// Estima la previsibilidad de la forma romance: 85 % distancia al resultado,
// 15 % carga de transformaciones anotadas (sin la -m fija).
// No evalúa frecuencia léxica ni sustituye las decisiones docentes.
const OUTCOME_WEIGHT=0.85;
const RULE_WEIGHT=0.15;
const THRESHOLDS=Object.freeze([0.23,0.36,0.50]);
const SUBSTITUTIONS=Object.freeze({
 'u:v':0.08,'v:u':0.08,'i:j':0.45,'f:h':0.4,
 'p:b':0.65,'t:d':0.65,'c:g':0.65,'u:o':0.65,
 'i:e':0.7,'b:v':0.7,'n:ñ':0.75,'l:j':0.85,'t:c':0.8
});
function plain(value){
 return String(value??'').toLocaleLowerCase('es')
  .replace(/æ/g,'ae').replace(/œ/g,'oe')
  .normalize('NFD').replace(/[\u0300-\u036f]/g,'');
}
// Alineación determinista por coste mínimo. No contabiliza como dificultad
// sustantiva la -m acusativa ni la diferencia gráfica u/v; contempla o > ue,
// e > ie como correspondencias frecuentes, sin presuponer que sean únicas.
export function resultSpellingDistance(latin,castellano){
 const source=[...plain(latin)],target=[...plain(castellano)];
 if(!source.length||!target.length)throw new Error('Se necesitan étimo y resultado castellano.');
 const table=Array.from({length:source.length+1},()=>Array(target.length+1).fill(Infinity));
 table[0][0]=0;
 for(let i=0;i<=source.length;i++){
  for(let j=0;j<=target.length;j++){
   const cost=table[i][j];
   if(!Number.isFinite(cost))continue;
   if(i<source.length){
    const deletion=i===source.length-1&&source[i]==='m'?0.1:1;
    table[i+1][j]=Math.min(table[i+1][j],cost+deletion);
   }
   if(j<target.length)table[i][j+1]=Math.min(table[i][j+1],cost+1);
   if(i<source.length&&j<target.length){
    const old=source[i],next=target[j];
    const substitution=old===next?0:(SUBSTITUTIONS[old+':'+next]??1);
    table[i+1][j+1]=Math.min(table[i+1][j+1],cost+substitution);
   }
   if(i<source.length&&j+1<target.length){
    if((source[i]==='o'&&target[j]==='u'&&target[j+1]==='e')
      ||(source[i]==='e'&&target[j]==='i'&&target[j+1]==='e')){
     table[i+1][j+2]=Math.min(table[i+1][j+2],cost+0.65);
    }
   }
  }
 }
 return table[source.length][target.length]/Math.max(source.length,target.length,3);
}
export function resultDifficultyComponents(word){
 if(!Array.isArray(word?.answers)||!word.answers.length||!Array.isArray(word?.changes))
  throw new Error('Ficha sin resultados o normas.');
 const resultDistance=Math.min(...word.answers.map(answer=>resultSpellingDistance(word.latin,answer)));
 const assessedChanges=word.changes.filter(change=>change.rule!=='FIX_M').length;
 const ruleLoad=Math.min(assessedChanges,5)/5;
 const score=OUTCOME_WEIGHT*resultDistance+RULE_WEIGHT*ruleLoad;
 return {resultDistance,ruleLoad,score};
}
export function resultDifficultyScore(word){
 return Math.round(resultDifficultyComponents(word).score*10000)/10000;
}
export function resultDifficultyLevel(word){
 const score=resultDifficultyScore(word);
 return score<=THRESHOLDS[0]?1:score<=THRESHOLDS[1]?2:score<=THRESHOLDS[2]?3:4;
}
export const RESULT_DIFFICULTY_METHOD='criterio-resultado-v2';
