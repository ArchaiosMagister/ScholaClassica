/* Enunciados completos tomados del vocabulario docente, sin reconstruir formas no atestiguadas. */
'use strict';
window.GrammarEnunciation=(()=>{
 const head=s=>String(s||'').split(',')[0].split('(')[0].trim()
  .toLowerCase().replace(/æ/g,'ae').replace(/œ/g,'oe')
  .normalize('NFD').replace(/\p{M}/gu,'').replace(/ς/g,'σ');
 const latinFull=s=>{
  const parts=String(s).split(',').map(x=>x.trim());
  return parts.length>=3&&parts.slice(0,3).every(x=>x&&x!=='-')
   &&/\((?:1ª|2ª|3ª|4ª|mx\.|irr\.)\)/i.test(s);
 };
 // Los deponentes y semideponentes no tienen las mismas tres formas
 // principales que los verbos activos ordinarios.
 const exceptional=s=>/^\s*(?:conor|audeo|soleo),/i.test(head(s)+','+s.split(',').slice(1).join(','))&&String(s).split(',').length>=2;
 function entry(subject,lemma,verb=false){
  const target=head(lemma);
  const vocabulary=window.VOCAB||[];
  const candidates=vocabulary.filter(e=>(subject==='gr1'?e.subject==='gr1':e.subject!=='gr1')
   &&head(e.form)===target);
  if(!candidates.length)return null;
  const own=candidates.filter(e=>e.subject===subject);
  if(subject==='gr1'||!verb)return (own[0]||candidates[0]).form;
  const exact=candidates.filter(e=>latinFull(e.form));
  const same=exact.find(e=>e.subject===subject);
  if(same)return same.form;
  const latinOne=exact.find(e=>e.subject==='lat1');
  if(latinOne)return latinOne.form;
  if(exact.length)return exact[0].form;
  const exceptions=candidates.filter(e=>/\b(?:conor|audeo|soleo)\b/i.test(head(e.form))&&e.form.split(',').length>=2);
  if(exceptions.length)return (exceptions.find(e=>e.subject===subject)||exceptions[0]).form;
  return null;
 }
 function display(subject,lemma,verb=false){
  return entry(subject,lemma,verb)||(!verb||subject==='gr1'?lemma:null);
 }
 return {display,entry,latinFull};
})();
