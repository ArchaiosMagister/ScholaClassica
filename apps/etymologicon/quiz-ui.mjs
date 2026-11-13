import {createQuizBank} from './quiz.mjs';
import {attachGreekKeyboard} from './greek-keyboard.mjs';
import {recordQuizAttempt} from './progress.mjs';


/**
 * Controladores de respuesta múltiple e identificación inversa.
 * La escritura de dos derivados conserva su corrector independiente.
 */
export function createQuizController({catalog,etymons,commitProgress,onRevealMeaning=()=>{},lookupDefinition=()=>''}){
  const bank=createQuizBank(catalog);
  const $=id=>document.getElementById(id);
  const els={
    mcq:$('mcq-section'),options:$('mcq-options'),mcqFeedback:$('mcq-feedback'),
    inverse:$('inverse-section'),word:$('inverse-word'),form:$('inverse-form'),
    meaningCard:$('inverse-meaning-card'),meaning:$('inverse-meaning'),
    answer:$('inverse-answer'),preview:$('inverse-preview'),
    keyboard:$('greek-keyboard'),clear:$('inverse-clear'),
    inverseFeedback:$('inverse-feedback')
  };
  let currentMcq=null,currentInverse=null,completed=false;
  let activeMode=null;
  const el=(tag,label)=>{
    const x=document.createElement(tag);
    x.textContent=label;
    return x;
  };
  attachGreekKeyboard(els.keyboard,()=>els.answer,
    ()=>activeMode==='inverse'&&!completed&&Boolean(currentInverse),[els.answer]);
  function renderMcq(item){
    currentMcq=item?bank.mcq(item.id):null;
    completed=false;
    els.options.replaceChildren();
    els.mcqFeedback.textContent='';
    if(!currentMcq){
      els.mcqFeedback.textContent='No hay suficientes opciones autorizadas para esta selección.';
      return;
    }
    for(const opt of currentMcq.options){
      const button=el('button',opt.form);
      button.type='button';
      button.className='quiz-option';
      button.dataset.derivativeId=opt.id;
      button.addEventListener('click',()=>{
        if(completed||!currentMcq)return;
        const answer=bank.gradeMcq(currentMcq,opt.id);
        if(answer.status==='unanswered')return;
        completed=true;
        for(const other of els.options.querySelectorAll('button')){
          other.disabled=true;
          if(other.dataset.derivativeId===currentMcq.correctId)
            other.classList.add('quiz-correct');
          else if(other===button)other.classList.add('quiz-incorrect');
        }
        if(answer.correct)onRevealMeaning();
        els.mcqFeedback.textContent=answer.correct
          ?'Correcto: '+answer.correctForm+'. 1 / 1 punto.'
          :'No corresponde a este étimo en el banco cerrado. Respuesta admitida: '+
            answer.correctForm+'. 0 / 1 punto.';
        commitProgress(state=>recordQuizAttempt(state,etymons,'mcq',currentMcq.etymonId,answer.correct));
      });
      els.options.append(button);
    }
  }
  function updatePreview(){
    if(!currentInverse||completed)return;
    const input=els.answer.value;
    const result=bank.preview(input);
    const text=result.greek||'—';
    els.preview.textContent='Conversión a griego: '+text+
      (result.status==='recognized'?' · lema reconocido':
       result.status==='ambiguous'?' · transliteración ambigua: escribe el étimo en griego':
       result.status==='not_catalogued'?' · lectura orientativa, no verificada':'');
  }
  function renderInverse(item){
    currentInverse=item?bank.inverse(item.id):null;
    completed=false;
    els.answer.value='';
    els.inverseFeedback.textContent='';
    els.form.hidden=!currentInverse;
    els.word.textContent=currentInverse?.derivative||'';
    els.word.hidden=!currentInverse;
    els.meaning.textContent=currentInverse?lookupDefinition(currentInverse.derivativeId):'';
    els.meaningCard.hidden=true;
    els.preview.textContent='Conversión a griego: —';
    if(!currentInverse){
      els.inverseFeedback.textContent='Este étimo no tiene un derivado de atribución única disponible para la identificación inversa. Prueba otro.';
    }
  }
  els.answer.addEventListener('input',()=>{
    if(completed){
      completed=false;
      els.inverseFeedback.textContent='';
      els.meaningCard.hidden=true;
    }
    updatePreview();
  });
  els.clear.addEventListener('click',()=>{
    if(!currentInverse)return;
    els.answer.value='';
    completed=false;
    els.inverseFeedback.textContent='';
    els.meaningCard.hidden=true;
    updatePreview();
    els.answer.focus();
  });
  els.form.addEventListener('submit',event=>{
    event.preventDefault();
    if(!currentInverse||completed)return;
    const response=bank.gradeInverse(currentInverse,els.answer.value);
    if(response.status==='unanswered'){
      els.inverseFeedback.textContent='Escribe un étimo para comprobarlo.';
      els.answer.focus();
      return;
    }
    // No se admite una transliteración ambigua ni una semejanza aproximada.
    completed=true;
    if(response.correct&&els.meaning.textContent.trim()){
      els.meaningCard.hidden=false;
      els.meaningCard.focus();
    }
    const reasons={
      ambiguous:'La transliteración coincide con varios étimos. Escribe el lema en griego para desambiguar.',
      incorrect:'Has identificado otro étimo del banco cerrado.',
      not_catalogued:'La grafía no identifica de manera exacta ningún étimo del banco. Esto no demuestra que sea filológicamente errónea.'
    };
    els.inverseFeedback.textContent=response.correct?
      'Correcto: '+response.correctLemma+'. 1 / 1 punto.':
      (reasons[response.status]||'Respuesta no admitida.')+
      ' Étimo esperado: '+response.correctLemma+'. 0 / 1 punto.';
    commitProgress(state=>recordQuizAttempt(state,etymons,'inverse',
      currentInverse.etymonId,response.correct));
  });
  function render({kind,item}){
    activeMode=kind;
    els.mcq.hidden=kind!=='mcq'||!item;
    els.inverse.hidden=kind!=='inverse'||!item;
    currentMcq=null;currentInverse=null;completed=false;
    els.meaningCard.hidden=true;
    if(kind==='mcq'&&item)renderMcq(item);
    if(kind==='inverse'&&item)renderInverse(item);
  }
  return Object.freeze({render,inverseEligibleIds:bank.inverseEligibleIds});
}
