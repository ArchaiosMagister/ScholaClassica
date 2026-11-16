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
   // Monoptongación au > o y metátesis de dos letras contiguas:
   // «aurum → oro» y «pro → por» son resultados más transparentes de lo
   // que indica una distancia ortográfica carácter a carácter.
   if(i+1<source.length&&j<target.length&&source[i]==='a'&&source[i+1]==='u'&&target[j]==='o'){
    table[i+2][j+1]=Math.min(table[i+2][j+1],cost+0.65);
   }
   if(i+1<source.length&&j+1<target.length
      &&source[i]===target[j+1]&&source[i+1]===target[j]){
    table[i+2][j+2]=Math.min(table[i+2][j+2],cost+0.65);
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

// Revisión editorial de la deducibilidad, exclusiva de ScholaClassica.
// El parecido gráfico proporciona una base útil, pero no capta por sí solo
// las correspondencias fonéticas regulares ni los resultados opacos.
// Estas propuestas NO se etiquetan como decisiones docentes individuales.
// Los IDs están fijados por config/sources.lock.json; ningún étimo se altera.
const CURATED_TIERS=Object.freeze({
 // Un cambio frecuente y resultado inmediatamente reconocible.
 1: [
  'xl-123','xl-136','xl-161','xl-169','xl-172','xl-173','xl-190',
  'xl-199','xl-271','xl-272','xl-303','xl-309','xl-315','xl-539','xl-785',
  'ge-EVF-0230','ge-EVF-0261','ge-EVF-0324','ge-EVF-0350',
  'ge-EVF-0370','ge-EVF-0391','ge-EVF-0416','ge-EVF-0548',
  'ge-EVF-0555','ge-EVF-0556','ge-EVF-0565','ge-EVF-0589'
 ],
 // Evolución recuperable aplicando correspondencias enseñadas en clase.
 2: [
  'xl-36','xl-37','xl-61','xl-70','xl-72','xl-83','xl-110',
  'xl-112','xl-117','xl-119','xl-126','xl-131','xl-134',
  'xl-145','xl-175','xl-182','xl-184','xl-194','xl-205',
  'xl-255','xl-257','xl-277','xl-300','xl-432','xl-452',
  'xl-436','xl-533','xl-567','xl-577','xl-583','xl-585','xl-592','xl-608',
  'xl-722','xl-748','xl-851','xl-1037',
  'xl-733',
  'ge-EVF-0001','ge-EVF-0008','ge-EVF-0203','ge-EVF-0322','ge-EVF-0339',
  'ge-EVF-0351','ge-EVF-0362','ge-EVF-0390','ge-EVF-0400',
  'ge-EVF-1009','ge-EVF-1024','ge-EVF-1025',
  'ge-EVF-0352','ge-EVF-0379','ge-EVF-0393',
  'ge-EVF-1067','ge-EVF-1093','ge-EVF-1114',
  'ge-EVF-1116','ge-EVF-1121','ge-EVF-1123','ge-EVF-1124',
  'ge-EVF-1125','ge-EVF-1185','ge-EVF-1193'
 ],
 // Resultado menos evidente: síncopas, reestructuración o varias etapas.
 3: [
  'xl-150','xl-616','xl-728','xl-98','xl-234','xl-720',
  'xl-1033','xl-1034','xl-1039','xl-1042','xl-1050','xl-1052',
  'ge-EVF-0187','ge-EVF-0823','ge-EVF-1073'
 ],
 // Resultado prácticamente imposible de recuperar sin conocer su historia.
 4: ['ge-EVF-1060']
});
const CURATED_LEVELS=new Map();
for(const [level,ids] of Object.entries(CURATED_TIERS)){
 for(const id of ids){
  if(CURATED_LEVELS.has(id))throw new Error('ID duplicado en revisión de dificultad: '+id);
  CURATED_LEVELS.set(id,Number(level));
 }
}
export function curatedDifficultyLevel(word){
 return CURATED_LEVELS.get(word?.id)??null;
}
export function curatedDifficultyIds(){
 return [...CURATED_LEVELS.keys()];
}

export function resultDifficultyLevel(word){
 // Clasificar sin redondear para evitar saltos artificiales en los umbrales.
 const reviewed=curatedDifficultyLevel(word);
 if(reviewed!==null)return reviewed;
 const score=resultDifficultyComponents(word).score;
 return score<=THRESHOLDS[0]?1:score<=THRESHOLDS[1]?2:score<=THRESHOLDS[2]?3:4;
}
export const RESULT_DIFFICULTY_METHOD='criterio-deducibilidad-v3';
