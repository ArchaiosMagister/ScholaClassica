import {validateBank,makeQuestions,evaluate,COURSE_LABELS,availableRecords} from './engine.mjs';
import {makeWrittenQuestions,makeTableExercises,correctWritten,evaluateTable} from './written.mjs';
import {makePhraseQuestions,makePhraseTables} from './sintagmas.mjs';
import {makeGreekNounPhraseQuestions,makeGreekNounPhraseTables} from './greek-noun-phrases.mjs';
import {mountGreekKeyboard} from './greek-keyboard.mjs';
import {readReview,writeReview,emptyReview,applyReview,reviewCounts,reviewKey} from './review.mjs';

const $=id=>document.getElementById(id);
const input={subject:$('subject'),unit:$('unit'),activity:$('activity'),
  kind:$('kind'),review:$('review-mode')};
const session=$('session'),summary=$('summary'),answer=$('answer-input');
const storage=(()=>{try{return window.localStorage}catch{return null}})();
let reviewState=readReview(storage),bank=null,questions=[],position=0,score=0,answered=false;
let focusInput=null;
const grammaticalName=kind=>({sustantivo:'Sustantivos',verbo:'Verbos',
  desinencia:'Desinencias',artículo:'Artículo',adjetivo:'Adjetivos',pronombre:'Pronombres'})[kind]||kind;
function theme(){
  let preference='system';
  try{preference=storage?.getItem('scholaclassica-aspecto-v1')||'system'}catch{}
  if(!['light','dark','oled'].includes(preference))
    preference=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
  document.documentElement.dataset.theme=preference;
}
theme();
function option(select,value,label){
  const item=document.createElement('option');item.value=value;item.textContent=label;select.append(item);
}
function updateFilters(){
  if(!bank)return;
  const language=input.subject.value,coverage=bank.coverage[language];
  const old=Number(input.unit.value);
  input.unit.replaceChildren();
  coverage.forEach(unit=>option(input.unit,String(unit),'UD'+unit));
  input.unit.value=coverage.includes(old)?String(old):String(coverage[0]);
  updateActivities();
}
function updateActivities(){
  if(!bank)return;
  const canAgree=input.subject.value==='griego'&&Number(input.unit.value)>=5;
  const opt=input.activity.querySelector('option[value="agreement"]');
  if(opt){opt.hidden=!canAgree;opt.disabled=!canAgree}
  if(!canAgree&&input.activity.value==='agreement')input.activity.value='form';
  const canPhrases=Number(input.unit.value)>=(input.subject.value==='latin4'?3:5);
  for(const mode of ['phrase-written','phrase-table']){
    const item=input.activity.querySelector('option[value="'+mode+'"]');
    if(item){item.hidden=!canPhrases;item.disabled=!canPhrases}
  }
  if(!canPhrases&&input.activity.value.startsWith('phrase-'))input.activity.value='written';
  const canNominal=input.subject.value==='griego'&&Number(input.unit.value)>=5;
  for(const mode of ['noun-phrase-written','noun-phrase-table']){
    const item=input.activity.querySelector('option[value="'+mode+'"]');
    if(item){item.hidden=!canNominal;item.disabled=!canNominal}
  }
  if(!canNominal&&input.activity.value.startsWith('noun-phrase-'))
    input.activity.value='written';
  updateKinds();
}
function updateKinds(){
  if(!bank)return;
  const language=input.subject.value,unit=Number(input.unit.value);
  const records=availableRecords(bank,{language,unit});
  const agreement=input.activity.value==='agreement';
  const table=input.activity.value==='table';
  const phrase=input.activity.value.startsWith('phrase-')||
    input.activity.value.startsWith('noun-phrase-');
  const tableKinds=['sustantivo','adjetivo','desinencia','artículo'];
  const kinds=phrase?['sintagma']:agreement?['adjetivo']:
    [...new Set(records.filter(r=>!table||tableKinds.includes(r.kind)).map(r=>r.kind))];
  const selected=input.kind.value;
  input.kind.replaceChildren();
  if(!agreement&&!phrase)option(input.kind,'todos','Todas las categorías disponibles');
  kinds.forEach(kind=>option(input.kind,kind,grammaticalName(kind)));
  input.kind.value=phrase?'sintagma':agreement?'adjetivo':(kinds.includes(selected)?selected:'todos');
  $('coverage').textContent=COURSE_LABELS[language]+': puedes practicar los contenidos de UD1 a UD'+unit+'.'+
    (language==='griego'&&unit===4?' UD4 no incorpora nuevas formas a estos ejercicios.':'');
}
function updateReviewStatus(){
  const info=reviewCounts(reviewState);
  $('review-status').textContent='Progreso local: '+info.practiced+' ejercicios practicados; '+
    info.errors+' con algún error; '+info.due+' pendientes de repaso.';
}
function saveReview(key,correct){
  reviewState=applyReview(reviewState,key,correct);
  if(!writeReview(storage,reviewState))
    $('network-status').textContent='El navegador no permite guardar el progreso. La práctica sigue disponible.';
  updateReviewStatus();
}
function setFeedback(text,type=''){
  const feedback=$('feedback');
  feedback.hidden=false;feedback.className='feedback '+type;
  feedback.textContent=text;
}
function completeQuestion(q){
  answered=true;
  $('score').textContent='Aciertos: '+score;
  $('next').hidden=false;
  $('next').textContent=position===questions.length-1?'Ver resultado':'Siguiente pregunta';
  $('greek-keyboard').hidden=true;
  $('next').focus();
}
function createTable(q){
  const target=$('table-cells');
  target.replaceChildren();
  const names=[...new Set(q.cells.map(c=>c.case))];
  for(const cas of names){
    const row=document.createElement('tr');
    const th=document.createElement('th');th.scope='row';th.textContent=cas;row.append(th);
    for(const number of ['singular','plural']){
      const cell=q.cells.find(c=>c.case===cas&&c.number===number);
      const td=document.createElement('td');
      if(cell){
        const field=document.createElement('input');
        field.type='text';field.autocomplete='off';field.autocapitalize='off';
        field.spellcheck=false;field.dataset.cellId=cell.id;
        field.setAttribute('aria-label',cas+' '+number+
          (q.gender?' '+q.gender:''));
        field.lang=q.language==='griego'?'grc':'la';
        field.inputMode='text';
        td.append(field);
      }
      row.append(td);
    }
    target.append(row);
  }
}
function showQuestion(){
  const q=questions[position];
  if(!q){
    session.hidden=true;summary.hidden=false;
    $('final-score').textContent='Has completado '+questions.length+
      ' ejercicios y acertado '+score+' completamente.';
    updateReviewStatus();$('repeat').focus();return;
  }
  answered=false;focusInput=null;
  $('counter').textContent='Ejercicio '+(position+1)+' de '+questions.length;
  $('score').textContent='Aciertos: '+score;
  $('paradigm').textContent=q.paradigm;
  $('paradigm').lang=q.language==='griego'?'grc':'la';
  $('question-title').textContent=q.prompt;
  $('expression').hidden=q.activity!=='analysis';
  $('expression').textContent=q.activity==='analysis'?q.form:'';
  $('expression').lang=q.language==='griego'?'grc':'la';
  $('answers').hidden=!['form','analysis','agreement'].includes(q.activity);
  $('written-response').hidden=q.activity!=='written';
  $('table-response').hidden=q.activity!=='table';
  $('greek-keyboard').hidden=!(q.language==='griego'&&['written','table'].includes(q.activity));
  $('greek-key-notice').textContent='';
  $('answers').replaceChildren();
  $('feedback').hidden=true;$('next').hidden=true;
  if(q.activity==='written'){
    answer.disabled=false;answer.value='';answer.lang=q.language==='griego'?'grc':'la';
    $('check-written').disabled=false;
    answer.setAttribute('aria-label',q.prompt);
    focusInput=answer;answer.focus();
  }else if(q.activity==='table'){
    createTable(q);
    $('check-table').disabled=false;
    focusInput=$('table-cells').querySelector('input');
    focusInput?.focus();
  }else{
    for(const choice of q.options){
      const button=document.createElement('button');
      button.type='button';button.textContent=choice;
      button.lang=['form','agreement'].includes(q.activity)?
        (q.language==='griego'?'grc':'la'):'es';
      button.addEventListener('click',()=>reply(q,choice));
      $('answers').append(button);
    }
    $('question-title').focus();
  }
}
function reply(q,choice){
  if(answered)return;
  const result=evaluate(q,choice);
  if(result.correct)score++;
  saveReview(reviewKey(q),result.correct);
  for(const button of $('answers').querySelectorAll('button')){
    button.disabled=true;
    if(button.textContent===q.correct)button.classList.add('correct');
    else if(button.textContent===choice)button.classList.add('incorrect');
  }
  setFeedback((result.correct?'Correcto. ':'Revisa la respuesta. ')+
    'Solución: '+result.expected+'. '+result.note,
    result.correct?'correct':'incorrect');
  completeQuestion(q);
}
function checkWritten(){
  const q=questions[position];
  if(answered||q?.activity!=='written')return;
  const result=correctWritten(q,answer.value);
  if(result.status==='empty'){
    setFeedback(result.note);answer.focus();return;
  }
  if(result.correct)score++;
  saveReview(reviewKey(q),result.correct);
  const label=result.status==='correct'?'Correcto. ':
    result.status==='orthography'?'Revisa la ortografía. ':'Forma incorrecta. ';
  setFeedback(label+'Solución: '+result.expected+'. '+result.note,
    result.status==='correct'?'correct':
      result.status==='orthography'?'orthography':'incorrect');
  answer.disabled=true;$('check-written').disabled=true;
  completeQuestion(q);
}
function checkTable(){
  const q=questions[position];
  if(answered||q?.activity!=='table')return;
  const fields=[...$('table-cells').querySelectorAll('input')];
  const incomplete=fields.find(field=>!field.value.trim());
  if(incomplete){
    setFeedback('Completa todas las casillas antes de corregir.');
    incomplete.focus();return;
  }
  const answers=Object.fromEntries(fields.map(field=>[field.dataset.cellId,field.value]));
  const outcome=evaluateTable(q,answers);
  if(outcome.complete)score++;
  saveReview(reviewKey(q),outcome.complete);
  for(const r of outcome.results){
    const field=fields.find(input=>input.dataset.cellId===r.id);
    field.disabled=true;field.classList.add('cell-'+r.status);
    saveReview(reviewKey(q)+':'+r.id,r.correct);
    if(!r.correct){
      const solution=document.createElement('p');
      solution.className='cell-solution';
      solution.textContent='Solución: '+r.expected;
      field.parentNode.append(solution);
    }
  }
  setFeedback('Has acertado '+outcome.correct+' de '+outcome.total+
    ' casillas. '+(outcome.complete?'Tabla completa correcta.':
      'Las formas a revisar aparecen junto a cada casilla.'),
    outcome.complete?'correct':'incorrect');
  $('check-table').disabled=true;
  completeQuestion(q);
}
function start(){
  if(!bank)return;
  const options={language:input.subject.value,unit:Number(input.unit.value),
    kind:input.kind.value,activity:input.activity.value,limit:10,
    reviewMode:input.review.value,reviewState};
  try{
    questions=input.activity.value==='noun-phrase-written'?
      makeGreekNounPhraseQuestions(bank,options):
      input.activity.value==='noun-phrase-table'?
      makeGreekNounPhraseTables(bank,options):
      input.activity.value==='phrase-written'?makePhraseQuestions(bank,options):
      input.activity.value==='phrase-table'?makePhraseTables(bank,options):
      input.activity.value==='written'?makeWrittenQuestions(bank,options):
      input.activity.value==='table'?makeTableExercises(bank,options):makeQuestions(bank,options);
  }catch(error){
    $('coverage').textContent='No se puede preparar esta tanda: '+error.message;
    return;
  }
  if(!questions.length){
    $('coverage').textContent='No hay ejercicios para ese filtro de repaso. '+
      'Prueba «Práctica libre» o selecciona otras unidades.';
    return;
  }
  position=0;score=0;answered=false;summary.hidden=true;session.hidden=false;
  showQuestion();
}
$('start').addEventListener('click',start);
$('repeat').addEventListener('click',start);
$('new').addEventListener('click',()=>{
  session.hidden=true;summary.hidden=true;$('start').focus();
});
$('next').addEventListener('click',()=>{if(answered){position++;showQuestion()}});
$('check-written').addEventListener('click',checkWritten);
$('check-table').addEventListener('click',checkTable);
answer.addEventListener('keydown',event=>{
  if(event.key==='Enter'){event.preventDefault();checkWritten()}
});
$('table-cells').addEventListener('keydown',event=>{
  if(event.key==='Enter'){event.preventDefault();if(!answered)checkTable()}
});
document.addEventListener('focusin',event=>{
  if(event.target===answer||$('table-cells').contains(event.target))
    focusInput=event.target;
});
mountGreekKeyboard($('greek-key-buttons'),()=>!answered&&focusInput?.isConnected&&!focusInput.disabled?
  focusInput:null,message=>{$('greek-key-notice').textContent=message});
$('clear-progress').addEventListener('click',()=>{
  if(!window.confirm('¿Borrar los resultados de repaso guardados en este navegador?'))return;
  reviewState=emptyReview();writeReview(storage,reviewState);
  updateReviewStatus();
});
input.subject.addEventListener('change',updateFilters);
input.unit.addEventListener('change',updateActivities);
input.activity.addEventListener('change',updateKinds);
async function initialize(){
  try{
    const response=await fetch('./data/paradigmas.json');
    if(!response.ok)throw Error('No se pudo descargar el banco');
    bank=validateBank(await response.json());
    const url=new URL(location.href),subject=url.searchParams.get('subject');
    if(subject==='lat4')input.subject.value='latin4';
    else if(subject==='lat1')input.subject.value='latin';
    else if(subject==='gr1')input.subject.value='griego';
    updateFilters();
    updateReviewStatus();
    $('start').disabled=false;
    $('network-status').textContent='Todo preparado. Puedes practicar sin conexión después de la primera visita.';
  }catch{
    $('start').disabled=true;
    $('coverage').textContent='No se han podido cargar los ejercicios. Revisa tu conexión y actualiza la página.';
  }
}
$('start').disabled=true;
void initialize();
if('serviceWorker' in navigator&&window.isSecureContext){
  navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).catch(()=>{
    $('network-status').textContent='No se ha podido instalar la caché de este módulo.';
  });
}
