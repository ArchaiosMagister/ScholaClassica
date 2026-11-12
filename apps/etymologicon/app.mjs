import {createWriteTwoCorrector} from './corrector/write-two.mjs';
import {emptyProgress,loadProgress,saveProgress,removeProgress,exportProgress,
  importProgress,recordExercise,progressSummary,filteredEtyma,chooseAdaptive}
  from './progress.mjs';

const $=id=>document.getElementById(id);
const ui={
  course:$('course-select'),mode:$('practice-mode'),unit:$('unit-select'),etymon:$('etymon-select'),
  random:$('random-button'),theme:$('theme-select'),poolSize:$('pool-size'),
  loadState:$('load-state'),error:$('load-error'),retry:$('retry-button'),
  content:$('exercise-content'),lemma:$('exercise-title'),meaning:$('meaning'),
  unitSummary:$('unit-summary'),form:$('answer-form'),first:$('answer-1'),
  second:$('answer-2'),clear:$('clear-button'),results:$('results'),
  instruction:$('exercise-instruction'),head:$('etymon-head'),empty:$('practice-empty'),
  total:$('result-total'),items:$('result-items'),next:$('next-button'),
  exercises:$('stats-exercises'),average:$('stats-average'),exact:$('stats-exact'),
  typo:$('stats-typos'),wrong:$('stats-wrong'),pending:$('stats-pending'),
  unitStats:$('stats-units'),progressStatus:$('progress-status'),
  exportProgress:$('export-progress'),importFile:$('import-file'),
  resetProgress:$('reset-progress'),importPreview:$('import-preview'),
  importDescription:$('import-description'),confirmImport:$('confirm-import'),
  cancelImport:$('cancel-import')
};
const themeKey='scholaclassica-etymologicon-theme-v1';
const themes=new Set(['auto','light','dark','oled']);
const fmt=new Intl.NumberFormat('es-ES',{maximumFractionDigits:1});
let catalog=null,engine=null,eligible=[],pool=[],progress=emptyProgress();
let graded=false,pendingImport=null,storageLocked=false;
const storage=(()=>{
  try{return window.localStorage;}
  catch{return {getItem(){throw new Error('No storage');},
    setItem(){throw new Error('No storage');},
    removeItem(){throw new Error('No storage');}};}
})();

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
  graded=false;
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
  ui.empty.hidden=Boolean(item);
  ui.head.hidden=!item;
  ui.form.hidden=!item;
  ui.instruction.hidden=!item;
  if(!item){
    ui.lemma.textContent='';
    ui.meaning.textContent='';
    ui.unitSummary.textContent='';
    const noMistakes=ui.mode.value==='errors';
    ui.empty.textContent=noMistakes
      ?'Todavía no tienes étimos pendientes de repaso. Practica primero en «Repaso general», o vuelve cuando hayas cometido alguna falta.'
      :'No hay étimos disponibles para esta selección.';
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
  const mode=ui.mode.value;
  ui.unit.disabled=mode!=='unit';
  if(mode==='unit'&&ui.unit.value==='all'){
    const first=ui.unit.querySelector('option[value^="UD"]');
    if(first)ui.unit.value=first.value;
  }
  pool=filteredEtyma(eligible,progress,{
    mode,unit:mode==='unit'?ui.unit.value:'all'
  });
  ui.etymon.replaceChildren(...pool.map(e=>option(e.id,e.lemma)));
  ui.etymon.disabled=pool.length===0;
  ui.random.disabled=pool.length===0;
  if(selected&&pool.some(e=>e.id===selected))ui.etymon.value=selected;
  ui.poolSize.textContent=pool.length+' étimos disponibles en esta selección';
  renderEtymon();
}
function nextRandom(){
  const previous=ui.etymon.value;
  updateEtymonChoices({preserve:false});
  if(!pool.length)return;
  const chosen=chooseAdaptive(pool,progress,{excludeId:previous});
  if(!chosen)return;
  ui.etymon.value=chosen.id;
  renderEtymon();
  ui.first.focus();
}
function showProgressStatus(message){
  ui.progressStatus.textContent=message;
}
function renderStatistics(){
  if(!eligible.length)return;
  const stats=progressSummary(progress,eligible);
  ui.exercises.textContent=String(stats.exercises);
  ui.average.textContent=stats.exercises?fmt.format(stats.average):'—';
  ui.exact.textContent=String(stats.exact);
  ui.typo.textContent=String(stats.typo);
  ui.wrong.textContent=String(stats.incorrect);
  ui.pending.textContent=String(stats.needingReview);
  ui.unitStats.replaceChildren(...stats.byUnit.map(({unit,exercises,average})=>{
    const tr=document.createElement('tr');
    for(const value of [unit,String(exercises),exercises?fmt.format(average):'—']){
      const cell=document.createElement('td');
      cell.textContent=value;
      tr.append(cell);
    }
    return tr;
  }));
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
  if(!engine||!item||graded)return;
  const result=engine.grade(item.id,[ui.first.value,ui.second.value]);
  progress=recordExercise(progress,eligible,result);
  const saved=storageLocked
    ?{saved:false,warning:'Los datos antiguos no se han sobrescrito porque no pudieron leerse. Exporta tu sesión y usa la importación o el borrado voluntario para resolverlo.'}
    :saveProgress(storage,progress,eligible);
  showProgressStatus(saved.saved?'Progreso guardado en este dispositivo.':saved.warning);
  graded=true;
  displayResult(result);
  renderStatistics();
});
ui.form.addEventListener('input',hideResults);
ui.clear.addEventListener('click',()=>clearAnswers({focus:true}));
ui.next.addEventListener('click',nextRandom);
ui.random.addEventListener('click',nextRandom);
ui.etymon.addEventListener('change',renderEtymon);
ui.mode.addEventListener('change',()=>updateEtymonChoices({preserve:false}));
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
    const loaded=loadProgress(storage,eligible);
    progress=loaded.state;
    storageLocked=!loaded.persisted;
    showProgressStatus(loaded.warning||'El progreso se guarda solo en este dispositivo, sin cuentas ni servidor.');
    renderStatistics();
    const units=[...new Set(eligible.flatMap(e=>e.units))].sort((a,b)=>
      Number(a.slice(2))-Number(b.slice(2)));
    ui.unit.replaceChildren(option('all','Todas las unidades'),...units.map(u=>option(u,u)));
    ui.unit.value='all';
    ui.mode.value='general';
    ui.unit.disabled=true;
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

function cancelImport(){
  pendingImport=null;
  ui.importPreview.hidden=true;
  ui.importFile.value='';
}
ui.exportProgress.addEventListener('click',()=>{
  if(!eligible.length)return;
  const json=exportProgress(progress,eligible);
  const blob=new Blob([json],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download='etymologicon-progreso-'+new Date().toISOString().slice(0,10)+'.json';
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),2000);
  showProgressStatus('Archivo de progreso preparado para descargar. Consérvalo en un lugar seguro.');
});
ui.importFile.addEventListener('change',async()=>{
  cancelImportExceptFile();
  if(!eligible.length)return;
  const file=ui.importFile.files?.[0];
  if(!file)return;
  if(file.size>250000){
    showProgressStatus('No se ha importado: el archivo supera el límite de 250 KB.');
    ui.importFile.value='';
    return;
  }
  try{
    pendingImport=importProgress(await file.text(),eligible);
    const summary=progressSummary(pendingImport,eligible);
    ui.importDescription.textContent='Archivo válido: '+summary.exercises+
      ' ejercicios de Griego I, '+summary.needingReview+
      ' étimos pendientes. ¿Quieres reemplazar tus estadísticas actuales?';
    ui.importPreview.hidden=false;
    showProgressStatus('Archivo comprobado. Confirma expresamente para reemplazar el progreso.');
  }catch(error){
    pendingImport=null;
    ui.importFile.value='';
    showProgressStatus('Importación rechazada: '+error.message+' Tus estadísticas no han cambiado.');
  }
});
function cancelImportExceptFile(){
  pendingImport=null;
  ui.importPreview.hidden=true;
}
ui.confirmImport.addEventListener('click',()=>{
  if(!pendingImport||!eligible.length)return;
  const checked=pendingImport;
  const saved=saveProgress(storage,checked,eligible);
  if(!saved.saved){
    showProgressStatus(saved.warning+' No se ha reemplazado el progreso actual.');
    return;
  }
  progress=checked;
  storageLocked=false;
  cancelImport();
  renderStatistics();
  updateEtymonChoices({preserve:false});
  showProgressStatus('Progreso importado y guardado. Las estadísticas anteriores han sido reemplazadas.');
});
ui.cancelImport.addEventListener('click',()=>{
  cancelImport();
  showProgressStatus('Importación cancelada; tus estadísticas no han cambiado.');
});
ui.resetProgress.addEventListener('click',()=>{
  if(!eligible.length)return;
  const accepted=window.confirm('¿Borrar todas las estadísticas de Griego I en este dispositivo? Esta acción no se puede deshacer. Puedes exportarlas antes.');
  if(!accepted)return;
  if(!removeProgress(storage)){
    showProgressStatus('No ha sido posible borrar el progreso almacenado.');
    return;
  }
  progress=emptyProgress();
  storageLocked=false;
  cancelImport();
  renderStatistics();
  updateEtymonChoices({preserve:false});
  showProgressStatus('Estadísticas borradas de este dispositivo. El tema y otras aplicaciones no se han modificado.');
});

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

