import {createStudyBank} from './study.mjs';
import {recordCardReview,recordMatchingRound} from './progress.mjs';

/**
 * Presentación independiente de las dos actividades de repaso.
 * No genera relaciones nuevas y no modifica el corrector de escritura.
 */
export function createStudyController({catalog,etymons,commitProgress,onRevealMeaning=()=>{}}){
  const bank=createStudyBank(catalog);
  const $=id=>document.getElementById(id);
  const el={
    cards:$('flashcard-section'),reveal:$('flashcard-reveal'),
    back:$('flashcard-back'),meaning:$('flashcard-meaning'),
    derivatives:$('flashcard-derivatives'),actions:$('flashcard-actions'),
    remembered:$('flashcard-remembered'),forgotten:$('flashcard-forgotten'),
    feedback:$('flashcard-feedback'),matching:$('matching-section'),
    game:$('matching-game'),empty:$('matching-empty'),
    greek:$('matching-greek'),spanish:$('matching-spanish'),
    matchingFeedback:$('matching-feedback'),score:$('matching-score')
  };
  let currentCard=null,cardRecorded=false,round=null,matched=new Set(),
    mistaken=new Set(),selectedGreek=null,roundRecorded=false,previousIds=[];

  function showCard(item){
    currentCard=bank.getCard(item.id);
    cardRecorded=false;
    el.reveal.hidden=false;
    el.back.hidden=true;
    el.actions.hidden=false;
    el.remembered.disabled=false;
    el.forgotten.disabled=false;
    el.feedback.textContent='';
    el.derivatives.replaceChildren();
    if(!currentCard)return;
    el.meaning.textContent=currentCard.meaning;
    for(const derivative of currentCard.derivatives){
      const li=document.createElement('li');
      li.textContent=derivative.form;
      el.derivatives.append(li);
    }
  }
  el.reveal.addEventListener('click',()=>{
    if(!currentCard)return;
    el.reveal.hidden=true;
    el.back.hidden=false;
    onRevealMeaning();
    el.remembered.focus();
  });
  function rateCard(remembered){
    if(!currentCard||cardRecorded||el.back.hidden)return;
    cardRecorded=true;
    commitProgress(state=>recordCardReview(state,etymons,currentCard.id,remembered));
    el.actions.hidden=true;
    el.feedback.textContent=remembered?
      'Tarjeta recordada. Puedes continuar con otro étimo.':
      'Se ha marcado para repaso. Volverá a aparecer con mayor frecuencia.';
  }
  el.remembered.addEventListener('click',()=>rateCard(true));
  el.forgotten.addEventListener('click',()=>rateCard(false));

  function makeButton(label,kind,id){
    const button=document.createElement('button');
    button.type='button';
    button.className='match-option';
    if(kind==='greek')button.lang='grc';
    button.textContent=label;
    button.dataset.id=id;
    button.setAttribute('aria-pressed','false');
    return button;
  }
  function renderMatchButtons(){
    el.greek.replaceChildren();
    el.spanish.replaceChildren();
    for(const pair of round.pairs){
      const button=makeButton(pair.lemma,'greek',pair.etymonId);
      button.addEventListener('click',()=>selectGreek(pair.etymonId));
      el.greek.append(button);
    }
    for(const item of round.spanishOptions){
      const button=makeButton(item.form,'spanish',item.derivativeId);
      button.addEventListener('click',()=>selectSpanish(item.derivativeId));
      el.spanish.append(button);
    }
  }
  function selectGreek(id){
    if(roundRecorded||matched.has(id))return;
    selectedGreek=id;
    for(const button of el.greek.querySelectorAll('button'))
      button.setAttribute('aria-pressed',String(button.dataset.id===id));
    el.matchingFeedback.textContent='Étimo elegido. Selecciona ahora un derivado castellano.';
  }
  function selectSpanish(derivativeId){
    if(roundRecorded)return;
    if(!selectedGreek){
      el.matchingFeedback.textContent='Selecciona primero un étimo griego.';
      return;
    }
    const pair=round.pairs.find(x=>x.etymonId===selectedGreek);
    if(!pair||matched.has(selectedGreek))return;
    if(pair.derivativeId!==derivativeId){
      mistaken.add(selectedGreek);
      el.matchingFeedback.textContent='No corresponde a ese étimo en esta ronda. Inténtalo de nuevo.';
      return;
    }
    const id=selectedGreek;
    matched.add(id);
    const greek=el.greek.querySelectorAll('button');
    const spanish=el.spanish.querySelectorAll('button');
    for(const button of greek){
      if(button.dataset.id===id){
        button.disabled=true;button.classList.add('matched');
        button.setAttribute('aria-pressed','false');
        const entry=etymons.find(e=>e.id===id);
        if(entry?.meaning){
          const meaning=document.createElement('small');
          meaning.className='matched-meaning';
          meaning.textContent='«'+entry.meaning+'»';
          button.append(meaning);
        }
      }
    }
    for(const button of spanish){
      if(button.dataset.id===derivativeId){
        button.disabled=true;button.classList.add('matched');
      }
    }
    selectedGreek=null;
    el.matchingFeedback.textContent=matched.size+' de '+round.maximum+
      ' parejas encontradas.';
    if(matched.size===round.maximum){
      finishRound();
    }
  }
  function finishRound(){
    if(roundRecorded||!round)return;
    roundRecorded=true;
    const results=round.pairs.map(p=>({
      etymonId:p.etymonId,firstTry:!mistaken.has(p.etymonId)
    }));
    commitProgress(state=>recordMatchingRound(state,etymons,results));
    const correct=results.filter(x=>x.firstTry).length;
    el.score.hidden=false;
    el.score.textContent='Ronda completada: '+correct+' de '+round.maximum+
      ' parejas al primer intento. Las que necesitaron reintentos se repasarán.';
    el.score.focus();
    el.matchingFeedback.textContent='Puedes practicar otra ronda.';
  }
  function showMatching(pool){
    currentCard=null;
    const next=bank.createRound(pool,{previousIds});
    round=next;matched=new Set();mistaken=new Set();selectedGreek=null;roundRecorded=false;
    el.score.hidden=true;el.score.textContent='';
    el.matchingFeedback.textContent='';
    el.game.hidden=!round;
    el.empty.hidden=Boolean(round);
    if(!round){
      el.greek.replaceChildren();
      el.spanish.replaceChildren();
      return;
    }
    previousIds=round.pairs.map(x=>x.etymonId);
    renderMatchButtons();
  }
  function render({kind,item,pool}){
    el.cards.hidden=kind!=='cards'||!item;
    el.matching.hidden=kind!=='matching';
    if(kind==='cards'&&item)showCard(item);
    else currentCard=null;
    if(kind==='matching')showMatching(pool);
    else{
      round=null;selectedGreek=null;roundRecorded=false;
      el.score.hidden=true;
    }
  }
  return Object.freeze({render});
}
