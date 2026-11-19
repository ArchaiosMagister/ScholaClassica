// Dificultad didáctica orientativa. No sustituye a la revisión filológica.
// La caída fija de -m nunca se cuenta como dificultad seleccionable.
import { FIXED_RULE } from './rules.mjs';

export const DIFFICULTY_LEVELS=Object.freeze([
 {level:1,label:'Fácil'},
 {level:2,label:'Medio'},
 {level:3,label:'Difícil'},
 {level:4,label:'Muy difícil'}
]);
export const DIFFICULTY_FILTERS=Object.freeze([
 {value:'all',label:'Todos los niveles'},
 ...DIFFICULTY_LEVELS.map(x=>({value:'exact-'+x.level,label:'Solo nivel '+x.level+' · '+x.label})),
 ...DIFFICULTY_LEVELS.slice(0,3).map(x=>({value:'upto-'+x.level,label:'Hasta nivel '+x.level+' · '+x.label}))
]);
const RULE_COMPLEXITY=Object.freeze({
 ABER:0, AFER:1.1, APOC:0.2, ASMIL:1.25, ASPIR:0.55,
 CONS:0.5, DIPT:0.55, DISIMIL:1.4, EPENT:1.2, GRIE:0.55,
 METAT:1.5, MONOP:0.1, PALAT:0.9, PROT:0.8, SIMPL:0.25,
 SINC:0.85, SONOR:0.1, VOC:1.15, MIN_MBR:1.6, CUL:1.8
});
export function difficultyScore(word){
 const changes=word.changes.filter(x=>x.rule!==FIXED_RULE.id);
 const distinct=new Set(changes.map(x=>x.rule));
 let overlap=0;
 for(let i=0;i<changes.length;i++){
  for(let j=0;j<i;j++){
   if((changes[i].spans||[]).some(([a,b])=>(changes[j].spans||[]).some(([c,d])=>a<d&&c<b)))overlap++;
  }
 }
 const score=changes.length
   +[...distinct].reduce((n,id)=>n+(RULE_COMPLEXITY[id]??0),0)
   +(changes.length-distinct.size)*0.2+Math.min(overlap,2)*0.25;
 return Math.round(score*100)/100;
}
export function proposedDifficultyLevel(word){
 const score=difficultyScore(word);
 return score<=1.9?1:score<=3.5?2:score<=5.75?3:4;
}
export function makeDifficultyData(words, previous={}){
 const assignments={};
 for(const word of words){
  const prior=previous[word.id];
  assignments[word.id]=prior?.origin==='docente'&&Number.isInteger(prior.level)&&prior.level>=1&&prior.level<=4
   ? {level:prior.level,origin:'docente'}
   : {level:proposedDifficultyLevel(word),origin:'automatico'};
 }
 return {version:1,method:'criterio-didactico-v1',status:'clasificacion-provisional',assignments};
}
export function difficultyErrors(words,data){
 const errors=[];
 if(data?.version!==1||data.method!=='criterio-didactico-v1'||!data.assignments||Array.isArray(data.assignments)||typeof data.assignments!=='object')
  return ['Clasificación de dificultad ausente o en formato no admitido.'];
 const ids=new Set(words.map(w=>w.id));
 for(const id of Object.keys(data.assignments))if(!ids.has(id))errors.push('Dificultad de ID ajeno al banco: '+id);
 for(const word of words){
  const record=data.assignments[word.id];
  if(!record){errors.push('Sin dificultad: '+word.id);continue;}
  if(!Number.isInteger(record.level)||record.level<1||record.level>4)errors.push('Nivel inválido: '+word.id);
  if(!['automatico','docente'].includes(record.origin))errors.push('Origen de nivel inválido: '+word.id);
  if(record.origin==='automatico'&&record.level!==proposedDifficultyLevel(word))errors.push('Propuesta desactualizada: '+word.id);
 }
 return errors;
}
export function difficultyLabel(level){
 const info=DIFFICULTY_LEVELS.find(x=>x.level===level);
 return info?('Nivel '+info.level+' · '+info.label):'Nivel no clasificado';
}
export function filterWordsByDifficulty(words,assignments,filter='all'){
 if(!DIFFICULTY_FILTERS.some(x=>x.value===filter))throw new Error('Filtro de dificultad inválido.');
 if(filter==='all')return words;
 const [kind,n]=filter.split('-'),limit=Number(n);
 return words.filter(w=>{
  const level=assignments[w.id]?.level;
  if(!Number.isInteger(level))throw new Error('Ficha sin clasificación de dificultad: '+w.id);
  return kind==='exact'?level===limit:level<=limit;
 });
}

/**
 * Selección múltiple compartida por Estudiar y Practicar. Mantiene el orden
 * de entrada (incluido el barajado) y no modifica las fichas ni sus normas.
 * Un conjunto vacío deja la lista vacía hasta volver a elegir niveles.
 */
export function filterWordsByDifficultyLevels(words,assignments,levels){
 if(!(levels instanceof Set)||[...levels].some(level=>!DIFFICULTY_LEVELS.some(x=>x.level===level)))
  throw new Error('Selección de niveles de dificultad inválida.');
 return words.filter(w=>{
  const level=assignments[w.id]?.level;
  if(!Number.isInteger(level)||level<1||level>4)
   throw new Error('Ficha sin clasificación de dificultad válida: '+w.id);
  return levels.has(level);
 });
}
