import {validateBank,makeQuestions,evaluate,COURSE_LABELS,availableRecords} from './engine.mjs';
const $=id=>document.getElementById(id);
const input={subject:$('subject'),unit:$('unit'),activity:$('activity'),kind:$('kind')};
const session=$('session'),summary=$('summary');
let bank=null,questions=[],position=0,score=0,answered=false;
const grammaticalName=kind=>({sustantivo:'Sustantivos',verbo:'Verbos',
  desinencia:'Desinencias',artículo:'Artículo',adjetivo:'Adjetivos'})[kind]||kind;
function theme(){
  let preference='system';
  try{preference=localStorage.getItem('scholaclassica-aspecto-v1')||'system'}catch{}
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
  const option=input.activity.querySelector('option[value="agreement"]');
  if(option){option.hidden=!canAgree;option.disabled=!canAgree}
  if(!canAgree&&input.activity.value==='agreement')input.activity.value='form';
  updateKinds();
}
function updateKinds(){
  if(!bank)return;
  const language=input.subject.value,unit=Number(input.unit.value);
  const records=availableRecords(bank,{language,unit});
  const isAgreement=input.activity.value==='agreement';
  const kinds=isAgreement?['adjetivo']:[...new Set(records.map(record=>record.kind))];
  const selected=input.kind.value;
  input.kind.replaceChildren();
  if(!isAgreement)option(input.kind,'todos','Todas las categorías disponibles');
  kinds.forEach(kind=>option(input.kind,kind,grammaticalName(kind)));
  input.kind.value=isAgreement?'adjetivo':(kinds.includes(selected)?selected:'todos');
  $('coverage').textContent=COURSE_LABELS[language]+': se incluyen únicamente los paradigmas de UD1 a UD'+unit+
    ' presentes en las tablas curriculares ('+records.length+' paradigmas). '+
    'Las unidades posteriores a '+bank.coverage[language].at(-1)+' siguen en revisión.'+
    (language==='griego'&&unit===4?' UD4 no añade nuevos paradigmas a este módulo.':'');
}
function showQuestion(){
  const q=questions[position];
  if(!q){session.hidden=true;summary.hidden=false;
    $('final-score').textContent='Has acertado '+score+' de '+questions.length+' preguntas.';
    $('repeat').focus();return;
  }
  $('counter').textContent='Pregunta '+(position+1)+' de '+questions.length;
  $('score').textContent='Aciertos: '+score;
  $('paradigm').textContent=q.paradigm;
  $('paradigm').lang=q.language==='griego'?'grc':'la';
  $('question-title').textContent=q.prompt;
  $('expression').hidden=q.activity!=='analysis';
  $('expression').textContent=q.activity==='analysis'?q.form:'';
  $('expression').lang=q.language==='griego'?'grc':'la';
  $('answers').replaceChildren();
  for(const choice of q.options){
    const button=document.createElement('button');
    button.type='button';button.textContent=choice;
    button.lang=q.activity==='form'?(q.language==='griego'?'grc':'la'):'es';
    button.addEventListener('click',()=>reply(q,choice));
    $('answers').append(button);
  }
  answered=false;$('feedback').hidden=true;$('next').hidden=true;$('source').hidden=true;
  $('question-title').focus();
}
function reply(q,choice){
  if(answered)return;
  answered=true;const result=evaluate(q,choice);
  if(result.correct)score++;
  for(const button of $('answers').querySelectorAll('button')){
    button.disabled=true;
    if(button.textContent===q.correct)button.classList.add('correct');
    else if(button.textContent===choice)button.classList.add('incorrect');
  }
  const feedback=$('feedback');
  feedback.hidden=false;feedback.className='feedback '+(result.correct?'correct':'incorrect');
  feedback.textContent=(result.correct?'Correcto. ':'Revisa la respuesta. ')+
    'Solución: '+result.expected+'. '+result.note;
  $('score').textContent='Aciertos: '+score;
  const source=$('source');source.hidden=false;
  const e=q.evidence;source.textContent='Consultar Appendix · '+COURSE_LABELS[q.language]+
    ' · UD'+e.unit+' · '+e.topic;
  const language=q.language==='latin'?'latin':'griego';
  source.href='../gramatica/curso.html?lengua='+language+'&curso=1&unidad='+e.unit;
  $('next').hidden=false;
  $('next').textContent=position===questions.length-1?'Ver resultado':'Siguiente pregunta';
  $('next').focus();
}
function start(){
  if(!bank)return;
  const options={language:input.subject.value,unit:Number(input.unit.value),
    kind:input.kind.value,activity:input.activity.value,limit:10};
  questions=makeQuestions(bank,options);
  if(questions.length===0){
    $('coverage').textContent='No hay suficientes formas documentadas para este filtro.';
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
input.subject.addEventListener('change',updateFilters);
input.unit.addEventListener('change',updateActivities);
input.activity.addEventListener('change',updateKinds);
async function initialize(){
  try{
    const response=await fetch('./data/paradigmas.json');
    if(!response.ok)throw Error('No se pudo descargar el banco');
    bank=validateBank(await response.json());
    const url=new URL(location.href),subject=url.searchParams.get('subject');
    if(subject==='lat1')input.subject.value='latin';
    else if(subject==='gr1')input.subject.value='griego';
    updateFilters();
    $('start').disabled=false;
    $('network-status').textContent='Banco curricular cargado. Compatible con el uso sin conexión tras la primera visita.';
  }catch{
    $('start').disabled=true;
    $('coverage').textContent='No se pudo leer el banco curricular. Revisa tu conexión y actualiza la página.';
  }
}
$('start').disabled=true;
void initialize();
if('serviceWorker' in navigator&&window.isSecureContext){
  navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).catch(()=>{
    $('network-status').textContent='No se ha podido instalar la caché de este módulo.';
  });
}
