import {createWriteTwoCorrector} from './corrector/write-two.mjs';

const $=id=>document.getElementById(id);
const ui={
  course:$('course-select'),unit:$('unit-select'),etymon:$('etymon-select'),
  random:$('random-button'),theme:$('theme-select'),poolSize:$('pool-size'),
  loadState:$('load-state'),error:$('load-error'),retry:$('retry-button'),
  content:$('exercise-content'),lemma:$('exercise-title'),meaning:$('meaning'),
  unitSummary:$('unit-summary'),form:$('answer-form'),first:$('answer-1'),
  second:$('answer-2'),clear:$('clear-button'),results:$('results'),
  total:$('result-total'),items:$('result-items'),next:$('next-button')
};
const themeKey='scholaclassica-etymologicon-theme-v1';
const themes=new Set(['auto','light','dark','oled']);
const fmt=new Intl.NumberFormat('es-ES',{maximumFractionDigits:1});
let catalog=null,engine=null,eligible=[],pool=[];

function option(value,label){
  const item=document.createElement('option');
  item.value=value;
  item.textContent=label;
  return item;
}
function themeMode(mode){
  const safe=themes.has(mode)?mode:'auto';
  ui.theme.value=safe;
  if(safe==='auto')document.documentElement.removeAttribute('data-theme');
  else document.documentElement.dataset.theme=safe;
}
try{
  const saved=localStorage.getItem(themeKey);
  themeMode(saved||'auto');
}catch{themeMode('auto');}
ui.theme.addEventListener('change',()=>{
  themeMode(ui.theme.value);
  try{localStorage.setItem(themeKey,ui.theme.value);}catch{/* Modo privado: continuar sin persistencia */ }
});

function hideResults(){
  ui.results.hidden=true;
  ui.items.replaceChildren();
  ui.total.textContent='';
}
function clearAnswers({focus=false}={}){
  ui.first.value='';
  ui.second.value='';
  hideResults();
  if(focus)ui.first.focus();
}
function currentEtymon(){
  return pool.find(e=>e.id===ui.etymon.value)||null;
}
function renderEtymon(){
  const item=currentEtymon();
  if(!item){
    ui.lemma.textContent='';
    ui.meaning.textContent='';
    ui.unitSummary.textContent='';
    clearAnswers();
    return;
  }
  ui.lemma.textContent=item.lemma;
  ui.meaning.textContent=item.meaning;
  ui.unitSummary.textContent=item.units.join(' · ');
  clearAnswers();
}
function updateEtymonChoices({preserve=true}={}){
  const selected=preserve?ui.etymon.value:null;
  const unit=ui.unit.value;
  pool=eligible.filter(e=>unit==='all'||e.units.includes(unit));
  ui.etymon.replaceChildren(...pool.map(e=>option(e.id,e.lemma)));
  ui.etymon.disabled=pool.length===0;
  ui.random.disabled=pool.length===0;
  if(selected&&pool.some(e=>e.id===selected))ui.etymon.value=selected;
  ui.poolSize.textContent=pool.length+' étimos disponibles en esta selección';
  renderEtymon();
}
function nextRandom(){
  if(!pool.length)return;
  const current=ui.etymon.value;
  const choices=pool.length===1?pool:pool.filter(e=>e.id!==current);
  const chosen=choices[Math.floor(Math.random()*choices.length)];
  ui.etymon.value=chosen.id;
  renderEtymon();
  ui.first.focus();
}
function text(parent,value){
  parent.append(document.createTextNode(value));
}
function tag(parent,name,content,className){
  const el=document.createElement(name);
  if(className)el.className=className;
  el.textContent=content;
  parent.append(el);
  return el;
}
const titles={
  exact:'Respuesta correcta',
  orthographic_error:'Falta ortográfica',
  duplicate:'Derivado repetido',
  other_etymon:'Derivado de otro étimo',
  excluded:'Derivado excluido',
  unlisted:'Respuesta fuera del repertorio',
  ambiguous:'Corrección no inequívoca',
  blank:'Sin respuesta',
  not_eligible:'Ejercicio no disponible'
};
function comparison(parent,answer){
  if(!answer.highlight||!answer.correctForm)return;
  const h=answer.highlight;
  const submitted=tag(parent,'p','','comparison-line');
  text(submitted,'Has escrito: ');
  text(submitted,h.before);
  if(h.submittedError)tag(submitted,'mark',h.submittedError);
  text(submitted,h.after);
  const corrected=tag(parent,'p','','corrected');
  text(corrected,'Grafía correcta: ');
  text(corrected,h.before);
  if(h.correctSpelling)tag(corrected,'mark',h.correctSpelling);
  text(corrected,h.after);
  // La representación completa evita perder espacios, mayúsculas y variantes.
  tag(parent,'p','Forma autorizada: '+answer.correctForm,'canonical');
}
function drawAnswer(answer,index){
  const li=document.createElement('li');
  li.className='feedback feedback--'+(answer.points===1?'exact':
    answer.points===0.5?'orthographic_error':'zero');
  tag(li,'h4',(index===0?'Primer derivado':'Segundo derivado')+
    ' · '+(titles[answer.status]||'Resultado')+' · '+fmt.format(answer.points)+' punto'+(answer.points===1?'':'s'));
  tag(li,'p','Tu respuesta: '+(answer.submitted.trim()||'—'),'written');
  tag(li,'p',answer.message,'explanation');
  if(answer.status==='orthographic_error')comparison(li,answer);
  return li;
}
function displayResult(result){
  ui.items.replaceChildren(...result.answers.map(drawAnswer));
  ui.total.textContent=fmt.format(result.total)+' / '+fmt.format(result.maximum)+' puntos';
  ui.results.hidden=false;
  ui.total.focus();
}
ui.form.addEventListener('submit',event=>{
  event.preventDefault();
  const item=currentEtymon();
  if(!engine||!item)return;
  const result=engine.grade(item.id,[ui.first.value,ui.second.value]);
  displayResult(result);
});
ui.form.addEventListener('input',hideResults);
ui.clear.addEventListener('click',()=>clearAnswers({focus:true}));
ui.next.addEventListener('click',nextRandom);
ui.random.addEventListener('click',nextRandom);
ui.etymon.addEventListener('change',renderEtymon);
ui.unit.addEventListener('change',()=>updateEtymonChoices({preserve:false}));

async function loadCatalog(){
  ui.loadState.hidden=false;
  ui.loadState.textContent='Preparando el banco académico de Griego I…';
  ui.error.hidden=true;
  ui.content.hidden=true;
  ui.unit.disabled=true;
  ui.etymon.disabled=true;
  ui.random.disabled=true;
  try{
    const response=await fetch('./data/gr1.json');
    if(!response.ok)throw new Error('HTTP '+response.status);
    const data=await response.json();
    const corrector=createWriteTwoCorrector(data);
    const accepted=data.etymons.filter(e=>corrector.isEligible(e.id));
    if(accepted.length!==108)throw new Error('Se esperaba el banco auditado de 108 étimos elegibles');
    catalog=data;
    engine=corrector;
    eligible=accepted;
    const units=[...new Set(eligible.flatMap(e=>e.units))].sort((a,b)=>
      Number(a.slice(2))-Number(b.slice(2)));
    ui.unit.replaceChildren(option('all','Todas las unidades'),...units.map(u=>option(u,u)));
    ui.unit.value='all';
    ui.unit.disabled=false;
    ui.loadState.hidden=true;
    ui.content.hidden=false;
    updateEtymonChoices({preserve:false});
  }catch(error){
    catalog=null;engine=null;eligible=[];pool=[];
    ui.loadState.hidden=true;
    ui.error.hidden=false;
    console.error('Etymologicon: no se pudo preparar la actividad',error);
  }
}
ui.retry.addEventListener('click',loadCatalog);
loadCatalog();

// La instalación es opcional: la actividad sigue funcionando aunque el
// navegador no admita service workers o bloquee la instalación.
const offlineStatus=$('offline-status');
const installButton=$('install-button');
const checkUpdate=$('check-update');
const applyUpdate=$('apply-update');
let installPrompt=null;
let registration=null;
let activationRequested=false;
let checking=false;
const standalone=()=>window.matchMedia('(display-mode: standalone)').matches||
  window.navigator.standalone===true;

function reportOfflineState(){
  if(!navigator.onLine){
    offlineStatus.textContent=navigator.serviceWorker?.controller
      ?'Sin conexión: puedes estudiar con el banco guardado.'
      :'Sin conexión: el banco debe descargarse primero con internet.';
    return;
  }
  if(registration?.waiting){
    offlineStatus.textContent='Hay una nueva versión preparada. Aplícala cuando termines el ejercicio.';
  }else if(registration?.active){
    offlineStatus.textContent='Recursos guardados: podrás practicar sin conexión.';
  }else{
    offlineStatus.textContent='La instalación requiere HTTPS o localhost.';
  }
}
function showWaitingWorker(){
  const waiting=registration?.waiting;
  applyUpdate.hidden=!waiting;
  reportOfflineState();
}
function observeInstallingWorker(worker){
  if(!worker)return;
  worker.addEventListener('statechange',()=>{
    if(worker.state==='installed')showWaitingWorker();
    if(worker.state==='activated')reportOfflineState();
  });
}
async function setupOffline(){
  if(!('serviceWorker' in navigator)){
    offlineStatus.textContent='Este navegador no admite el funcionamiento sin conexión.';
    checkUpdate.disabled=true;
    return;
  }
  try{
    registration=await navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'});
    observeInstallingWorker(registration.installing);
    registration.addEventListener('updatefound',()=>observeInstallingWorker(registration.installing));
    showWaitingWorker();
    navigator.serviceWorker.ready.then(()=>reportOfflineState()).catch(()=>{});
  }catch(error){
    offlineStatus.textContent='No se ha podido preparar la instalación offline. El ejercicio online sigue disponible.';
    checkUpdate.disabled=true;
    console.warn('Etymologicon: registro de PWA no disponible',error);
  }
}
window.addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();
  installPrompt=event;
  installButton.hidden=standalone();
});
installButton.addEventListener('click',async()=>{
  if(!installPrompt)return;
  const prompt=installPrompt;
  installPrompt=null;
  installButton.hidden=true;
  await prompt.prompt();
  // El navegador decide si el usuario acepta; no afirmar instalación
  // hasta recibir 'appinstalled'.
});
window.addEventListener('appinstalled',()=>{
  installPrompt=null;
  installButton.hidden=true;
  offlineStatus.textContent='Etymologicon se ha instalado correctamente.';
});
checkUpdate.addEventListener('click',async()=>{
  if(!registration||checking)return;
  checking=true;
  checkUpdate.disabled=true;
  offlineStatus.textContent='Buscando una versión nueva…';
  try{
    await registration.update();
    showWaitingWorker();
    if(!registration.waiting)reportOfflineState();
  }catch{
    offlineStatus.textContent=navigator.onLine
      ?'No se ha podido comprobar la actualización.'
      :'Sin conexión: sigues usando la versión guardada.';
  }finally{
    checking=false;
    checkUpdate.disabled=false;
  }
});
applyUpdate.addEventListener('click',()=>{
  const waiting=registration?.waiting;
  if(!waiting)return;
  activationRequested=true;
  applyUpdate.disabled=true;
  offlineStatus.textContent='Aplicando la nueva versión…';
  waiting.postMessage({type:'ETYM_ACTIVATE_UPDATE'});
});
navigator.serviceWorker?.addEventListener('controllerchange',()=>{
  if(activationRequested){
    activationRequested=false;
    location.reload();
  }else{
    reportOfflineState();
  }
});
window.addEventListener('online',reportOfflineState);
window.addEventListener('offline',reportOfflineState);
if(standalone())installButton.hidden=true;
setupOffline();

