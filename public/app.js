'use strict';
const tabs=[...document.querySelectorAll('[role="tab"]')];
const panels=new Map([['tab-lenguas','panel-lenguas'],['tab-herramientas','panel-herramientas']]);
function selectTab(active,focus=false){
  for(const tab of tabs){
    const selected=tab===active;
    tab.setAttribute('aria-selected',String(selected));
    tab.tabIndex=selected?0:-1;
    document.getElementById(panels.get(tab.id)).hidden=!selected;
  }
  if(focus)active.focus();
}
for(const [index,tab] of tabs.entries()){
  tab.addEventListener('click',()=>selectTab(tab));
  tab.addEventListener('keydown',event=>{
    if(!['ArrowRight','ArrowLeft','Home','End'].includes(event.key))return;
    event.preventDefault();
    const position=event.key==='Home'?0:event.key==='End'?tabs.length-1:
      (index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
    selectTab(tabs[position],true);
  });
}


// Selector contextual aislado del código de cada aplicación original.
// Solo enlaza a rutas existentes; no crea contenidos ni modifica sus configuraciones.
const STUDY_CATALOG=Object.freeze({
  lat4:[
    {id:'vocabulario',label:'Vocabulario · Latín de 4.º de ESO',href:'apps/vocabulario/index.html?subject=lat4'},
    {id:'morfologia',label:'Práctica de morfología · Latín de 4.º de ESO',href:'apps/morfologia/index.html?subject=lat4'},
    {id:'palabra-dia',label:'Palabra del día · 4.º ESO (sitio externo)',href:'https://archaiosmagister.github.io/Palabra-del-dia/4eso/',external:true}
  ],
  lat1:[
    {id:'gramatica',label:'Gramática · Latín I',href:'apps/gramatica/curso.html?lengua=latin&curso=1&unidad=1'},
    {id:'vocabulario',label:'Vocabulario · Latín I',href:'apps/vocabulario/index.html?subject=lat1'},
    {id:'evolutio',label:'Evolución fonética',href:'apps/evolucion-fonetica/index.html'},
    {id:'morfologia',label:'Práctica de morfología · Latín I',href:'apps/morfologia/index.html?subject=lat1'},
    {id:'palabra-dia',label:'Palabra del día · 1.º Bachillerato (sitio externo)',href:'https://archaiosmagister.github.io/Palabra-del-dia/',external:true}
  ],
  lat2:[
    {id:'gramatica',label:'Gramática · Latín II',href:'apps/gramatica/curso.html?lengua=latin&curso=2'},
    {id:'vocabulario',label:'Vocabulario · Latín II',href:'apps/vocabulario/index.html?subject=lat2'},
    {id:'morfologia',label:'Práctica de morfología · Latín II',href:'apps/morfologia/index.html?subject=lat2'}
  ],
  gr1:[
    {id:'gramatica',label:'Gramática · Griego I',href:'apps/gramatica/curso.html?lengua=griego&curso=1&unidad=1'},
    {id:'vocabulario',label:'Vocabulario · Griego I (ático)',href:'apps/vocabulario/index.html?subject=gr1'},
    {id:'etymologicon',label:'Etymologicon · Griego I',href:'apps/etymologicon/index.html'},
    {id:'morfologia',label:'Práctica de morfología · Griego I',href:'apps/morfologia/index.html?subject=gr1'},
    {id:'palabra-dia',label:'Palabra del día · 1.º Bachillerato (sitio externo)',href:'https://archaiosmagister.github.io/Palabra-del-dia/',external:true}
  ],
  gr2:[
    {id:'gramatica',label:'Gramática · Griego II',href:'apps/gramatica/curso.html?lengua=griego&curso=2'}
  ]
});
const PATH_STORAGE_KEY='scholaclassica-itinerario-v1';
const subjectChoice=document.getElementById('study-course');
const pathResults=document.getElementById('study-path-results');
const resumeArea=document.getElementById('study-resume-area');
const resumeLink=document.getElementById('study-resume');
function readStudyState(){
  try{
    const item=JSON.parse(localStorage.getItem(PATH_STORAGE_KEY)||'{}');
    if(!item||typeof item!=='object'||Array.isArray(item))return {course:'',last:{}};
    const course=Object.hasOwn(STUDY_CATALOG,item.course)?item.course:'';
    const last={};
    for(const key of Object.keys(STUDY_CATALOG)){
      const id=item.last?.[key];
      if(STUDY_CATALOG[key].some(entry=>entry.id===id))last[key]=id;
    }
    return {course,last};
  }catch{return {course:'',last:{}}}
}
const studyState=readStudyState();
function storeStudyState(){
  try{localStorage.setItem(PATH_STORAGE_KEY,JSON.stringify(studyState))}
  catch{/* Navegadores en modo privado: el selector sigue funcionando sin almacenamiento. */}
}
function rememberStudyAccess(course,id){
  if(!STUDY_CATALOG[course]?.some(item=>item.id===id))return;
  studyState.course=course;
  studyState.last[course]=id;
  storeStudyState();
}
function renderStudyPath(){
  const course=subjectChoice.value;
  studyState.course=course;
  storeStudyState();
  pathResults.replaceChildren();
  resumeArea.hidden=true;
  if(!Object.hasOwn(STUDY_CATALOG,course)){
    const text=document.createElement('p');
    text.className='path-empty';
    text.textContent='Selecciona primero una asignatura.';
    pathResults.append(text);
    return;
  }
  const list=document.createElement('nav');
  list.className='path-links';
  list.setAttribute('aria-label','Herramientas disponibles para '+subjectChoice.selectedOptions[0].textContent);
  for(const item of STUDY_CATALOG[course]){
    const link=document.createElement('a');
    link.href=item.href;
    link.textContent=item.label;
    link.dataset.studyTool=item.id;
    if(item.external){link.target='_blank';link.rel='noopener noreferrer';}
    link.addEventListener('click',()=>rememberStudyAccess(course,item.id));
    list.append(link);
  }
  pathResults.append(list);
  const previous=STUDY_CATALOG[course].find(item=>item.id===studyState.last[course]);
  if(previous){
    resumeLink.href=previous.href;
    resumeLink.textContent='Continuar en '+previous.label;
    resumeLink.target=previous.external?'_blank':'_self';
    resumeLink.rel=previous.external?'noopener noreferrer':'';
    resumeLink.onclick=()=>rememberStudyAccess(course,previous.id);
    resumeArea.hidden=false;
  }
}
if(subjectChoice&&pathResults&&resumeArea&&resumeLink){
  subjectChoice.value=studyState.course;
  subjectChoice.addEventListener('change',renderStudyPath);
  renderStudyPath();
}

  
// Service worker SOLO de la portada. Al interceptar únicamente las URLs del
// núcleo, los recursos y SW de Evolutio y Etymologicon siguen independientes.
const portalUpdateButton=document.getElementById('portal-update');
const portalPwaStatus=document.getElementById('portal-pwa-status');
let portalRegistration=null;
const setPortalStatus=value=>{if(portalPwaStatus)portalPwaStatus.textContent=value};
function portalConnectivity(){
  if(!navigator.onLine)setPortalStatus('Sin conexión: la portada permanece disponible; los módulos conservan su caché propia.');
  else if(portalRegistration)setPortalStatus('Portada disponible sin conexión tras esta primera carga.');
  else setPortalStatus('Conexión disponible. La instalación requiere HTTPS o localhost.');
}
window.addEventListener('online',portalConnectivity);
window.addEventListener('offline',portalConnectivity);
function waitForPortalWorker(worker,timeout=15000){
  if(worker.state==='installed'||worker.state==='activated')return Promise.resolve();
  if(worker.state==='redundant')return Promise.reject(Error('La actualización no se ha instalado.'));
  return new Promise((resolve,reject)=>{
    let timer;
    const finish=error=>{
      clearTimeout(timer);worker.removeEventListener('statechange',onChange);
      if(error)reject(error);else resolve();
    };
    const onChange=()=>{
      if(worker.state==='installed'||worker.state==='activated')finish();
      else if(worker.state==='redundant')finish(Error('La actualización ha fallado.'));
    };
    worker.addEventListener('statechange',onChange);
    timer=setTimeout(()=>finish(Error('La actualización no ha terminado.')),timeout);
    onChange();
  });
}
async function checkPortalUpdate(){
  if(!portalRegistration)throw Error('La portada no está instalada todavía.');
  if(!navigator.onLine)throw Error('Necesitas conexión para comprobar actualizaciones.');
  await portalRegistration.update();
  if(portalRegistration.installing)await waitForPortalWorker(portalRegistration.installing);
  const waiting=portalRegistration.waiting;
  if(!waiting){setPortalStatus('La portada ya tiene la última versión disponible.');return}
  setPortalStatus('Hay una actualización preparada para la portada.');
  if(!window.confirm('Hay una nueva versión de la portada. ¿Activarla y recargar ahora?'))return;
  await new Promise((resolve,reject)=>{
    let completed=false;
    const timer=setTimeout(()=>finish(Error('No se ha activado la nueva versión.')),15000);
    const finish=error=>{
      if(completed)return;completed=true;clearTimeout(timer);
      navigator.serviceWorker.removeEventListener('controllerchange',onController);
      if(error)reject(error);else resolve();
    };
    const onController=()=>finish();
    navigator.serviceWorker.addEventListener('controllerchange',onController);
    waiting.postMessage({type:'SCHOLA_ACTIVATE_PORTAL_UPDATE'});
  });
  window.location.reload();
}
if(portalUpdateButton){
  portalUpdateButton.addEventListener('click',async()=>{
    portalUpdateButton.disabled=true;
    setPortalStatus('Buscando una actualización de la portada…');
    try{await checkPortalUpdate()}
    catch(error){setPortalStatus(error?.message||'No se pudo comprobar la actualización.')}
    finally{portalUpdateButton.disabled=false}
  });
}
async function registerPortalPwa(){
  if(!('serviceWorker' in navigator)||!window.isSecureContext){
    if(portalUpdateButton)portalUpdateButton.hidden=true;
    setPortalStatus('Para instalar la portada se necesita HTTPS o un navegador compatible.');
    return;
  }
  try{
    portalRegistration=await navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'});
    if(portalRegistration.waiting)setPortalStatus('Hay una actualización de la portada lista para instalar.');
    else portalConnectivity();
    portalRegistration.addEventListener('updatefound',()=>{
      const worker=portalRegistration.installing;
      worker?.addEventListener('statechange',()=>{
        if(worker.state==='installed'&&navigator.serviceWorker.controller){
          setPortalStatus('Hay una actualización de la portada. Pulsa «Actualizar» para instalarla.');
        }
      });
    });
  }catch{
    if(portalUpdateButton)portalUpdateButton.hidden=true;
    setPortalStatus('No ha sido posible preparar el acceso sin conexión de la portada.');
  }
}
void registerPortalPwa();
