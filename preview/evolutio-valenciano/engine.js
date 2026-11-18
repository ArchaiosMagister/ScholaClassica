// Núcleo puro y autocontenido del piloto local: no escribe ni lee progreso.
const EvolutioVaPilotEngine=(()=>{
 'use strict';
 const normalize=value=>String(value??'').normalize('NFC').trim()
  .replace(/\s+/gu,' ').toLocaleLowerCase('ca-ES');
 const unique=arr=>new Set(arr).size===arr.length;
 function validate(data){
  if(data?.schema!=='schola-evolutio-va-offline-local-pilot/v1'
   ||!Array.isArray(data.words)||data.words.length!==7||!Array.isArray(data.rules)
   ||data.rules.length!==5)throw Error('Estructura del pilot no vàlida.');
  if(data.limitations.dnvEntriesIndividuallyChecked!==0
   ||data.limitations.teacherAuthorizedNormativeAlternativeOnlyForLocalPreview!==true
   ||data.limitations.studentReleaseApproved!==false
   ||data.limitations.noPersistentProgress!==true)throw Error('Pilot no aïllat.');
  if(!unique(data.words.map(w=>w.id))||!unique(data.words.map(w=>w.latin))
   ||!unique(data.rules.map(r=>r.id)))throw Error('Duplicats al pilot.');
  const known=new Set(data.rules.map(r=>r.id));
  const safeIds=new Set(['ge-EVF-0338','xl-354','xl-52','xl-26','xl-587','xl-82','xl-567']);
  for(const word of data.words){
   const chars=[...word.latin];
   if(!safeIds.has(word.id)||!chars.length||!word.answer||!word.changes?.length)
    throw Error('Paraula fora del repertori revisat.');
   for(const change of word.changes){
    const [a,b]=change.span??[];
    if(!known.has(change.rule)||!Number.isInteger(a)||!Number.isInteger(b)
      ||a<0||b>chars.length||a>=b||chars.slice(a,b).join('')!==change.fragment)
     throw Error('Segment o norma no vàlids: '+word.id);
   }
  }
  if(data.words.reduce((n,w)=>n+w.changes.length,0)!==9)
   throw Error('El lot no presenta les nou normes previstes.');
  return true;
 }
 function shuffle(words,count=words.length,random=Math.random){
  const list=[...words],size=Math.max(1,Math.min(list.length,Math.floor(count)||1));
  for(let i=list.length-1;i>0;i--){
   const j=Math.min(i,Math.max(0,Math.floor(random()*(i+1))));
   [list[i],list[j]]=[list[j],list[i]];
  }
  return list.slice(0,size);
 }
 const card=word=>({word,phase:'result',resultAttempts:0,ruleAttempts:0,correct:false,revealed:false,ruleStatus:[]});
 function reveal(state,reason='manual'){
  if(!['result','rules'].includes(state.phase))return false;
  state.phase='revealed';state.revealed=true;state.correct=false;state.revealReason=reason;return true;
 }
 function answer(state,input){
  if(state.phase!=='result')return {status:'invalid'};
  if(!normalize(input))return {status:'empty'};
  state.resultAttempts++;
  if(normalize(input)===normalize(state.word.answer)){
   state.phase='rules';return {status:'correct',remaining:3};
  }
  if(state.resultAttempts>=3){reveal(state,'limit');return {status:'revealed',remaining:0};}
  return {status:'incorrect',remaining:3-state.resultAttempts};
 }
 function checkRules(state,selections){
  if(state.phase!=='rules')return {status:'invalid',results:[]};
  if(!Array.isArray(selections)||selections.length!==state.word.changes.length)
   throw Error('Nombre de normes incompatible.');
  if(selections.some(v=>!v))return {status:'empty',results:[]};
  state.ruleAttempts++;
  const results=state.word.changes.map((change,i)=>selections[i]===change.rule);
  state.ruleStatus=results;
  if(results.every(Boolean)){
   state.phase='solved';state.correct=true;return {status:'correct',results,remaining:3-state.ruleAttempts};
  }
  if(state.ruleAttempts>=3){reveal(state,'limit');return {status:'revealed',results,remaining:0};}
  return {status:'incorrect',results,remaining:3-state.ruleAttempts};
 }
 const fragments=(latin,span)=>{
  const letters=[...latin],[a,b]=span;
  return [letters.slice(0,a).join(''),letters.slice(a,b).join(''),letters.slice(b).join('')];
 };
 return Object.freeze({normalize,validate,shuffle,card,answer,checkRules,reveal,fragments});
})();
