// Tipografía de los enunciados: solo las formas latinas en cursiva.
// Los rasgos gramaticales y las marcas (conjugación, género, declinación)
// permanecen en redonda. No reescribir las respuestas del motor.
import {displayLatin2QuestionText} from './engine.mjs';

const latinCourses=new Set(['latin','latin2','latin4']);
const headings=/^(?:desinencias?|artículos?|declinación|conjugación|sintagmas?|concordancia|formas?|terminaciones?|primera|segunda|tercera|cuarta|quinta)\b/iu;
const letter=/[\p{L}\p{M}]/u;
function latinEnunciation(question){
  if(!latinCourses.has(question?.language))return [];
  const raw=String(question.headword||question.paradigm?.split(' · ')[0]||'').trim();
  if(!raw||/^\d/u.test(raw)||headings.test(raw))return [];
  // En Latín II se aplica primero el enunciado abreviado acordado.
  const normalized=displayLatin2QuestionText(question,raw);
  // El paréntesis final indica conjugación, declinación, género o irregularidad.
  // No es parte de las palabras latinas (p. ej. «(3.ª deponente)»).
  const core=normalized.replace(/\s+\([^()]*\)$/u,'');
  return core.split(/\s+\+\s+/u).map(x=>x.trim())
    .filter(x=>x&&!headings.test(x)&&
      /^[\p{L}\p{M}][\p{L}\p{M}\s,'’.\-–()]*$/u.test(x));
}
export function latinEnunciationSegments(question,value){
  const text=String(displayLatin2QuestionText(question,value??''));
  const candidates=latinEnunciation(question);
  if(!candidates.length)return [{text,italic:false}];
  const pieces=[];
  let cursor=0;
  while(cursor<text.length){
    let next=null;
    for(const candidate of candidates){
      let at=text.indexOf(candidate,cursor);
      while(at>=0){
        const before=at>0?text[at-1]:'';
        const after=at+candidate.length<text.length?text[at+candidate.length]:'';
        if((!before||!letter.test(before))&&(!after||!letter.test(after)))break;
        at=text.indexOf(candidate,at+candidate.length);
      }
      if(at>=0&&(!next||at<next.at||
        (at===next.at&&candidate.length>next.word.length)))
        next={at,word:candidate};
    }
    if(!next){
      pieces.push({text:text.slice(cursor),italic:false});
      break;
    }
    if(next.at>cursor)pieces.push({text:text.slice(cursor,next.at),italic:false});
    pieces.push({text:next.word,italic:true});
    cursor=next.at+next.word.length;
  }
  return pieces.length?pieces:[{text,italic:false}];
}
export function renderLatinEnunciation(target,question,value){
  const nodes=latinEnunciationSegments(question,value).map(part=>{
    if(!part.italic)return document.createTextNode(part.text);
    const element=document.createElement('em');
    element.className='latin-enunciation';
    element.lang='la';
    element.textContent=part.text;
    return element;
  });
  target.replaceChildren(...nodes);
}
