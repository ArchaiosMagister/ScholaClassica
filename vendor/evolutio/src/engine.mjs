import { RULES, FIXED_RULE } from './rules.mjs';
export const chars = text => [...text.normalize('NFC')];
export const normAnswer = text => String(text ?? '').normalize('NFC').trim().replace(/\s+/gu,' ').toLocaleLowerCase('es');
export const resultMatches = (word, answer) => word.answers.some(value => normAnswer(value) === normAnswer(answer));
export const requiredRules = word => [...new Set(word.changes.filter(x => x.rule !== FIXED_RULE.id).map(x => x.rule))];
// Orden de las opciones de las tarjetas: norma fija primero si procede;
// en las restantes palabras nunca se muestra. No modifica los filtros.
export function optionRuleIds(word, selected){
 const regular=[...new Set([...selected].filter(id=>id!==FIXED_RULE.id))];
 return word.changes.some(change=>change.rule===FIXED_RULE.id)
   ? [FIXED_RULE.id,...regular]
   : regular;
}
export const availableWords = (words, selected) => words.filter(w => {
  const needed = requiredRules(w);
  return needed.length > 0 && needed.every(id => selected.has(id));
});
// Repaso focalizado: basta con que la palabra contenga la norma elegida,
// aunque intervengan otras leyes. Las normas fijas nunca son un foco elegible.
const isSelectableRule = id => RULES.some(r => r.id === id);
export const availableFocusedWords = (words, ruleId) =>
  isSelectableRule(ruleId) ? words.filter(w => w.changes.some(t => t.rule === ruleId)) : [];
export const assessedChanges = (word, focusRule = null) =>
  focusRule === null ? word.changes : word.changes.filter(t => t.rule === focusRule && isSelectableRule(focusRule));
export function chooseFromPool(pool, count, rng = Math.random) {
  const shuffled = [...pool];
  for (let i=shuffled.length-1;i>0;i--) { const j=Math.floor(rng()*(i+1)); [shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]]; }
  return shuffled.slice(0,Math.min(Math.max(0,Math.floor(count)),shuffled.length));
}
export const chooseWords = (words, selected, count, rng = Math.random) =>
  chooseFromPool(availableWords(words, selected),count,rng);
export const chooseFocusedWords = (words, ruleId, count, rng = Math.random) =>
  chooseFromPool(availableFocusedWords(words,ruleId),count,rng);
const sameRanges = (a,b) => JSON.stringify([...a].sort((x,y)=>x[0]-y[0]||x[1]-y[1])) === JSON.stringify([...b].sort((x,y)=>x[0]-y[0]||x[1]-y[1]));
export function changeMatches(guess, actual) {
  return guess.rule === actual.rule && (guess.anchor ?? null) === (actual.anchor ?? null) && sameRanges(guess.spans ?? [],actual.spans ?? []);
}
export function gradeChange(word, guess, solvedIds = new Set()) {
  const matched = word.changes.find(item => !solvedIds.has(item.id) && changeMatches(guess,item));
  if (matched) return {correct:true, id:matched.id, note:matched.note};
  const repeated=word.changes.some(item=>solvedIds.has(item.id)&&changeMatches(guess,item));
  return {correct:false, repeated, note:repeated?'Ese cambio ya está identificado.':'Revisa el fragmento y la norma. No se revela la solución.'};
}
export function isComplete(word, solvedIds){return word.changes.every(t=>solvedIds.has(t.id));}
export function validationErrors(dataset) {
  const errors=[], known=new Set([...RULES.map(r=>r.id),FIXED_RULE.id]);
  if (dataset?.version !== 1 || !Array.isArray(dataset.words)) return ['Formato o versión de banco incorrectos.'];
  const ids=new Set(), forms=new Set();
  for(const word of dataset.words) {
    if(!word.id || ids.has(word.id))errors.push(`ID duplicado/vacío: ${word.id}`);
    ids.add(word.id);
    const letters=chars(word.latin ?? '');
    if (!letters.length || !Array.isArray(word.answers)||!word.answers.length||word.answers.some(x=>!normAnswer(x)))errors.push(`${word.id}: faltan forma o respuestas`);
    if (/[vV]/u.test(word.latin??''))errors.push(`${word.id}: en los lemas latinos se emplea u, no v`);
    const formKey=word.latin?.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es');
    if(forms.has(formKey))errors.push(`${word.id}: forma latina repetida en el piloto`);
    forms.add(formKey);
    if(!word.source?.row || !word.source?.lot)errors.push(`${word.id}: falta la referencia de origen`);
    if(word.status!=='reviewed-pilot') errors.push(`${word.id}: sin control filológico del lote`);
    if (!Array.isArray(word.changes)||!word.changes.length)errors.push(`${word.id}: sin cambios`);
    const changes=new Set();
    for(const item of word.changes??[]) {
      if(!known.has(item.rule))errors.push(`${word.id}: norma desconocida ${item.rule}`);
      if(item.rule==='CUL' && !RULES.find(r=>r.id==='CUL').subtypes.includes(item.subtype))errors.push(`${word.id}: subtipo -CUL- desconocido o ausente`);
      if(!item.id||changes.has(item.id))errors.push(`${word.id}: cambio repetido`);
      changes.add(item.id);
      if(!item.note || typeof item.output !== 'string')errors.push(`${word.id}: falta explicación o resultado`);
      if (!Array.isArray(item.spans) || (!item.spans.length && !Number.isInteger(item.anchor)))errors.push(`${word.id}/${item.id}: sin fragmento ni inserción`);
      for(const span of item.spans??[]) {
        if(!Array.isArray(span)||span.length!==2||!span.every(Number.isInteger)||span[0]<0||span[1]>letters.length||span[0]>=span[1])errors.push(`${word.id}/${item.id}: intervalo inválido`);
      }
      if(item.anchor!==undefined && (!Number.isInteger(item.anchor)||item.anchor<0||item.anchor>letters.length))errors.push(`${word.id}/${item.id}: inserción inválida`);
      if(item.rule===FIXED_RULE.id && (item.spans.length!==1 || item.spans[0][0]!==letters.length-1 || letters.at(-1)?.toLowerCase()!=='m'))errors.push(`${word.id}: -m fija mal ubicada`);
      if(item.rule===FIXED_RULE.id && item.anchor!==undefined)errors.push(`${word.id}: norma fija no puede ser inserción`);
    }
    if(letters.at(-1)?.toLowerCase()==='m' && !word.changes.some(x=>x.rule===FIXED_RULE.id))errors.push(`${word.id}: falta -m fija`);
    if(letters.at(-1)?.toLowerCase()!=='m' && word.changes.some(x=>x.rule===FIXED_RULE.id))errors.push(`${word.id}: -m fija improcedente`);
    // Criterio PAU confirmado: -um > -o exige abertura u > o Y pérdida fija -m.
    // Se valida como dos transformaciones independientes para evitar omisiones en lotes futuros.
    if(letters.length>=2 && letters.at(-2)?.toLowerCase()==='u' && letters.at(-1)?.toLowerCase()==='m') {
      const pos=letters.length-2;
      if(!word.changes.some(t=>t.rule==='ABER' && t.output==='o' && t.spans?.some(([start,end])=>start===pos&&end===pos+1)))
        errors.push(`${word.id}: falta abertura final -u- > -o en -um`);
    }
  }
  return errors;
}
export function coverage(words) {
 const counts=Object.fromEntries(RULES.map(r=>[r.id,0]));
 for(const word of words)for(const id of requiredRules(word)) counts[id]++;
 return counts;
}
export function newCardState(word, focusRule = null) {
 if(focusRule !== null && !isSelectableRule(focusRule))throw new Error('Norma focal no válida.');
 if(focusRule !== null && !availableFocusedWords([word],focusRule).length)throw new Error('La palabra no contiene la norma focal.');
 return {word,focusRule,phase:1,solved:new Set(),attempts:0,analysisAttempts:0,mistakes:0,
  revealed:false,revealPhase:null,revealReason:null};
}
// Una respuesta revelada nunca se marca como acertada ni añade normas a solved.
export function revealCard(state,reason='manual') {
 if(![1,2].includes(state.phase))return false;
 if(!['manual','limit'].includes(reason))throw new Error('Motivo de revelación inválido.');
 state.revealed=true;
 state.revealPhase=state.phase;
 state.revealReason=reason;
 state.phase=3;
 return true;
}
export function checkResult(state, answer) {
  if(state.phase!==1) return false;
  state.attempts++;
  if(resultMatches(state.word,answer)){state.phase=2;return true;}
  state.mistakes++;return false;
}
export function applyChange(state,guess) {
 if(state.phase!==2) return {correct:false,note:'Primero debes acertar el resultado castellano.'};
 const targets=assessedChanges(state.word,state.focusRule);
 const outcome=gradeChange({...state.word,changes:targets},guess,state.solved);
 if(outcome.correct){state.solved.add(outcome.id);if(targets.every(t=>state.solved.has(t.id)))state.phase=3;}
 else state.mistakes++;
 return outcome;
}

// Evaluación conjunta: se guardan todas las respuestas antes de corregir.
// En el modo guiado targetId vincula cada selector a SU fragmento; esto evita
// asignar accidentalmente el acierto a otro cambio solapado con el mismo tramo.
// En modo a ciegas no se proporcionan targetId: se buscan coincidencias únicas.
export function checkAllChanges(state, guesses) {
 const targets=assessedChanges(state.word,state.focusRule);
 if (state.phase !== 2) return {complete:false,correct:0,remaining:targets.length,results:[],message:'Primero debes acertar el resultado castellano.'};
 if (!Array.isArray(guesses)) return {complete:false,correct:0,remaining:targets.length,results:[],message:'Lista de respuestas inválida.'};
 if (!targets.length) return {complete:false,correct:0,remaining:0,results:[],message:'La palabra no contiene la norma elegida.'};
 // Una comprobación sin norma elegida no consume uno de los tres intentos.
 // La interfaz decide si mostrar la solución tras tres comprobaciones fallidas.
 if(guesses.some(guess=>guess.rule))state.analysisAttempts++;
 const found=new Set(), used=new Set();
 const results=guesses.map((guess,index)=>{
  const id=guess.id??String(index);
  if(used.has(id))return {id,status:'incorrect',message:'Respuesta repetida.'};
  used.add(id);
  if (!guess.rule) return {id,status:'missing',message:'Elige una norma.'};
  const candidates=guess.targetId
    ? targets.filter(t=>t.id===guess.targetId)
    : targets;
  const target=candidates.find(t=>!found.has(t.id)&&changeMatches(guess,t));
  if (target){found.add(target.id);return {id,status:'correct',message:'Identificación correcta.'};}
  return {id,status:'incorrect',message:'Revisa la norma y el fragmento seleccionado.'};
 });
 const correct=found.size,remaining=targets.length-correct;
 const complete=remaining===0 && results.length===targets.length && results.every(x=>x.status==='correct');
 state.solved=found;
 state.mistakes+=results.filter(x=>x.status==='incorrect').length;
 if (complete)state.phase=3;
 return {complete,correct,remaining,results,message:complete?'Todos los cambios son correctos.':'Revisa las tarjetas señaladas; tus elecciones se conservan.'};
}
