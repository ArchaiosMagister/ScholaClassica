import {createDecompositionBank} from './decomposition.mjs';
import {attachGreekKeyboard} from './greek-keyboard.mjs';
import {recordQuizAttempt} from './progress.mjs';

/** Presentación separada; solo el banco auditado determina las soluciones. */
export function createDecompositionController({data,etymons,commitProgress}){
  const bank=createDecompositionBank(data);
  const $=id=>document.getElementById(id);
  const els={
    section:$('decomposition-section'),word:$('decomposition-word'),
    form:$('decomposition-form'),first:$('decomposition-first'),
    second:$('decomposition-second'),previewFirst:$('decomposition-preview-first'),
    previewSecond:$('decomposition-preview-second'),
    keyboard:$('decomposition-keyboard'),clear:$('decomposition-clear'),
    results:$('decomposition-results'),score:$('decomposition-score'),
    answers:$('decomposition-answers'),meaning:$('decomposition-meaning'),
    route:$('decomposition-route'),source:$('decomposition-source'),
    empty:$('decomposition-empty')
  };
  let item=null,previousId=null,graded=false,active=false,focused=els.first;
  for(const field of [els.first,els.second]){
    field.addEventListener('focus',()=>{focused=field});
    field.addEventListener('input',()=>{
      graded=false;
      els.results.hidden=true;
      showPreview(field);
    });
  }
  attachGreekKeyboard(els.keyboard,()=>focused,()=>active&&Boolean(item));
  function showPreview(field){
    const target=field===els.first?els.previewFirst:els.previewSecond;
    const value=bank.read(field.value);
    const tail=value.status==='recognized'?' · lema reconocido':
      value.status==='ambiguous'?' · coincidencia ambigua':
        value.status==='not_catalogued'?' · forma orientativa, no validada':'';
    target.textContent='Griego: '+(value.greek||'—')+tail;
  }
  function clear({focus=false}={}){
    els.first.value='';
    els.second.value='';
    els.previewFirst.textContent='Griego: —';
    els.previewSecond.textContent='Griego: —';
    els.results.hidden=true;
    els.answers.replaceChildren();
    graded=false;
    if(focus)els.first.focus();
  }
  els.clear.addEventListener('click',()=>clear({focus:true}));
  els.form.addEventListener('submit',event=>{
    event.preventDefault();
    if(!item||graded)return;
    const response=bank.grade(item.id,[els.first.value,els.second.value]);
    graded=true;
    els.answers.replaceChildren();
    response.answers.forEach((answer,i)=>{
      const li=document.createElement('li');
      li.className='feedback '+(answer.points===1?'feedback--exact':'feedback--zero');
      const title=document.createElement('h4');
      title.textContent=(i===0?'Primer componente':'Segundo componente')+
        ' · '+answer.points+' / 1 punto';
      const detail=document.createElement('p');
      detail.textContent=answer.points===1?'Correcto: '+answer.correctGreek:
        'Tu respuesta: '+(answer.submitted.trim()||'—')+
        '. Componente esperado: '+answer.correctGreek+'.';
      const gloss=document.createElement('p');
      gloss.textContent=answer.correctGreek+' («'+answer.gloss+'») · elemento: '+answer.combiningForm;
      li.append(title,detail,gloss);
      els.answers.append(li);
    });
    els.score.textContent='Descomposición: '+response.total+' / 2 puntos.';
    els.meaning.textContent='Significado de la palabra: '+item.meaning;
    els.route.textContent=item.evidence.editorialNote;
    els.source.href=item.evidence.url;
    els.results.hidden=false;
    els.score.focus();
    // Los dos componentes tienen nota visual, pero el progreso global
    // registra una descomposición perfecta solo cuando ambos son correctos.
    commitProgress(state=>recordQuizAttempt(state,etymons,'decomposition',
      item.parts[0].etymonId,response.total===2));
  });
  function available({mode='general',unit='all',pool=[]}={}){
    return bank.available({mode,unit,pool});
  }
  function render({kind,mode,unit,pool}){
    active=kind==='decomposition';
    els.section.hidden=!active;
    if(!active){item=null;return;}
    const possible=available({mode,unit,pool});
    item=bank.select(possible,{previousId});
    els.empty.hidden=Boolean(item);
    els.form.hidden=!item;
    els.word.hidden=!item;
    if(!item){
      els.word.textContent='';
      previousId=null;
      clear();
      return;
    }
    previousId=item.id;
    els.word.textContent=item.form;
    clear();
  }
  return Object.freeze({render,availableCount:args=>available(args).length});
}
