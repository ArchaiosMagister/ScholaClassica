'use strict';
const tabs=[...document.querySelectorAll('[role="tab"]')];
function selectTab(active,focus=false){
  for(const tab of tabs){
    const selected=tab===active;
    tab.setAttribute('aria-selected',String(selected));
    tab.tabIndex=selected?0:-1;
    document.getElementById(tab.getAttribute('aria-controls')).hidden=!selected;
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
    {id:'gramatica',label:'Gramática · Latín de 4.º de ESO',href:'apps/gramatica/curso.html?lengua=latin&curso=4&unidad=1'},
    {id:'vocabulario',label:'Vocabulario · Latín de 4.º de ESO',href:'apps/vocabulario/index.html?subject=lat4'},
    {id:'repaso-gramatica',label:'Repaso de sintaxis y conceptos · Latín 4.º',href:'apps/repaso-gramatica/index.html?subject=lat4'},
    {id:'morfologia',label:'Práctica de morfología · Latín de 4.º de ESO',href:'apps/morfologia/index.html?subject=lat4'},
    {id:'palabra-dia',label:'Palabra del día · 4.º ESO (sitio externo)',href:'https://archaiosmagister.github.io/Palabra-del-dia/4eso/',external:true}
  ],
  lat1:[
    {id:'gramatica',label:'Gramática · Latín I',href:'apps/gramatica/curso.html?lengua=latin&curso=1&unidad=1'},
    {id:'vocabulario',label:'Vocabulario · Latín I',href:'apps/vocabulario/index.html?subject=lat1'},
    {id:'evolutio',label:'Evolución fonética',href:'apps/evolucion-fonetica/index.html'},
    {id:'repaso-gramatica',label:'Repaso de sintaxis y conceptos · Latín I',href:'apps/repaso-gramatica/index.html?subject=lat1'},
    {id:'morfologia',label:'Práctica de morfología · Latín I',href:'apps/morfologia/index.html?subject=lat1'},
    {id:'modificacion-preverbial',label:'Modificación preverbial · Latín I',href:'apps/modificacion-preverbial/index.html?subject=lat1'},
    {id:'latinismos',label:'Latinismos · Latín I',href:'apps/latinismos/index.html'},
    {id:'palabra-dia',label:'Palabra del día · 1.º Bachillerato (sitio externo)',href:'https://archaiosmagister.github.io/Palabra-del-dia/',external:true}
  ],
  lat2:[
    {id:'gramatica',label:'Gramática · Latín II',href:'apps/gramatica/curso.html?lengua=latin&curso=2'},
    {id:'vocabulario',label:'Vocabulario · Latín II',href:'apps/vocabulario/index.html?subject=lat2'},
    {id:'morfologia',label:'Práctica de morfología · Latín II',href:'apps/morfologia/index.html?subject=lat2'},
    {id:'modificacion-preverbial',label:'Modificación preverbial · PAU',href:'apps/modificacion-preverbial/index.html'},
    {id:'latinismos',label:'Latinismos · PAU',href:'apps/latinismos/index.html'}
  ],
  gr1:[
    {id:'gramatica',label:'Gramática · Griego I',href:'apps/gramatica/curso.html?lengua=griego&curso=1&unidad=1'},
    {id:'vocabulario',label:'Vocabulario · Griego I (ático)',href:'apps/vocabulario/index.html?subject=gr1'},
    {id:'etymologicon',label:'Etymologicon · Griego I',href:'apps/etymologicon/index.html'},
    {id:'repaso-gramatica',label:'Repaso de sintaxis y conceptos · Griego I',href:'apps/repaso-gramatica/index.html?subject=gr1'},
    {id:'morfologia',label:'Práctica de morfología · Griego I',href:'apps/morfologia/index.html?subject=gr1'},
    {id:'palabra-dia',label:'Palabra del día · 1.º Bachillerato (sitio externo)',href:'https://archaiosmagister.github.io/Palabra-del-dia/',external:true}
  ],
  gr2:[
    {id:'gramatica',label:'Gramática · Griego II',href:'apps/gramatica/curso.html?lengua=griego&curso=2'}
  ]
});
const PATH_STORAGE_KEY='scholaclassica-itinerario-v1';
const subjectChoice=document.getElementById('study-course');
const quickLinks=[...document.querySelectorAll('[data-quick-tool]')].map(link=>({
  link, defaultHref:link.getAttribute('href')
}));
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
// Compartir la memoria local entre enlaces de tarjetas y del itinerario.
// Registrar solo el curso y el identificador de la herramienta, nunca respuestas.
document.addEventListener('click',event=>{
  const anchor=event.target?.closest?.('#accesos a[href], #panel-lenguas a[href], #panel-herramientas a[href]');
  if(!anchor||anchor.origin!==window.location.origin)return;
  const matches=[];
  for(const [course,modules] of Object.entries(STUDY_CATALOG)){
    for(const module of modules){
      if(module.external)continue;
      const moduleUrl=new URL(module.href,window.location.href);
      // Tanto el acceso al glosario como a practicar pertenecen al itinerario.
      const withinEtymologicon=module.id==='etymologicon'&&
        anchor.pathname.startsWith(moduleUrl.pathname.replace(/index\.html$/,''));
      if(moduleUrl.href===anchor.href||withinEtymologicon)
        matches.push({course,id:module.id});
    }
  }
  // Los destinos compartidos se resuelven usando el curso elegido.
  const selected=matches.length===1?matches[0]:
    matches.find(x=>x.course===subjectChoice?.value);
  if(selected)rememberStudyAccess(selected.course,selected.id);
});
function renderStudyPath(){
  const course=subjectChoice.value;
  studyState.course=course;
  storeStudyState();
  pathResults.replaceChildren();
  resumeArea.hidden=true;
  const entries=Object.hasOwn(STUDY_CATALOG,course)?STUDY_CATALOG[course]:[];
  for(const {link,defaultHref} of quickLinks){
    const entry=entries.find(item=>item.id===link.dataset.quickTool);
    link.href=entry?.href??defaultHref;
  }
  if(!entries.length)return;
  const list=document.createElement('nav');
  list.className='path-links';
  list.setAttribute('aria-label','Herramientas disponibles para '+subjectChoice.selectedOptions[0].textContent);
  for(const item of entries){
    const link=document.createElement('a');
    link.href=item.href;
    link.textContent=item.label;
    link.dataset.studyTool=item.id;
    if(item.external){link.target='_blank';link.rel='noopener noreferrer';}
    link.addEventListener('click',()=>rememberStudyAccess(course,item.id));
    list.append(link);
  }
  pathResults.append(list);
  const previous=entries.find(item=>item.id===studyState.last[course]);
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
  if(globalUpdating)return;
  if(!navigator.onLine)setPortalStatus('Sin conexión. La portada sigue disponible.');
  else if(portalRegistration)setPortalStatus('Portada disponible sin conexión.');
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
// Los registros hijos se actualizan sin tocar los almacenes de progreso ni
// utilizar controllerchange de la portada (que solo describe su propio SW).
function globalDeadline(promise,ms=60000){
  let timer;
  return Promise.race([promise,new Promise((_,reject)=>{
    timer=setTimeout(()=>reject(Error('Tiempo de espera agotado.')),ms);
  })]).finally(()=>clearTimeout(timer));
}
function askGlobalWorker(worker,type){
  const channel=new MessageChannel();
  return globalDeadline(new Promise((resolve,reject)=>{
    channel.port1.onmessage=event=>resolve(event.data);
    try{worker.postMessage({type},[channel.port2]);}catch(error){reject(error);}
  }),8000).finally(()=>channel.port1.close());
}
async function updateGlobalModule(module,base){
  const scope=new URL('apps/'+module.id+'/',base);
  const reg=await globalDeadline(navigator.serviceWorker.register(new URL('sw.js',scope),{
    scope:scope.href,updateViaCache:'none'
  }));
  if(reg.scope!==scope.href)throw Error('Ámbito de actualización incorrecto.');
  if(reg.active||reg.waiting)await globalDeadline(reg.update());
  const deadline=Date.now()+90000;
  let requested=null;
  while(Date.now()<deadline){
    if(reg.installing?.state==='redundant')throw Error('No se ha instalado.');
    if(reg.waiting&&reg.waiting!==requested){
      requested=reg.waiting;
      const status=await askGlobalWorker(requested,'SCHOLA_GLOBAL_ACTIVATE');
      if(status==='busy')throw Error('Cierra las otras pestañas de este módulo.');
      if(status!=='ok')throw Error('No se ha podido activar.');
    }
    if(!reg.installing&&!reg.waiting&&reg.active?.state==='activated'){
      const revision=await askGlobalWorker(reg.active,'SCHOLA_GLOBAL_VERSION');
      if(revision!==module.revision)throw Error('La versión activa no coincide con la publicación.');
      return;
    }
    await new Promise(resolve=>setTimeout(resolve,100));
  }
  throw Error('No se ha completado la instalación.');
}
let globalUpdating=false;
async function checkPortalUpdate(){
  if(!portalRegistration)throw Error('La portada no está instalada todavía.');
  if(!navigator.onLine)throw Error('Necesitas conexión para comprobar actualizaciones.');
  const base=new URL('./',location.href);
  const response=await globalDeadline(fetch(new URL('global-updates.json',base),{cache:'no-store'}));
  if(!response.ok)throw Error('No se ha podido consultar la versión publicada.');
  const inventory=await response.json();
  if(inventory.schema!==1||!Array.isArray(inventory.modules)||!inventory.modules.length||
     inventory.modules.some(m=>!/^[a-z0-9-]+$/.test(m.id)||!/^[a-f0-9]{20}$/.test(m.revision))||
     new Set(inventory.modules.map(m=>m.id)).size!==inventory.modules.length)
    throw Error('Inventario de actualización no válido.');
  const failures=[];
  let completed=0;
  // Limitar la concurrencia: cada instalación puede descargar un banco grande.
  const queue=inventory.modules.slice();
  await Promise.all(Array.from({length:Math.min(3,queue.length)},async()=>{
    while(queue.length){
      const module=queue.shift();
      try{await updateGlobalModule(module,base);}
      catch(error){failures.push(module.id+': '+(error?.message||'error de actualización'));}
      finally{
        completed++;
        setPortalStatus('Comprobando módulos: '+completed+'/'+inventory.modules.length+'…');
      }
    }
  }));
  if(failures.length)throw Error('Actualización incompleta. '+failures.join(' · ')+' Vuelve a intentarlo.');
  await globalDeadline(portalRegistration.update());
  if(portalRegistration.installing)await waitForPortalWorker(portalRegistration.installing,90000);
  const waiting=portalRegistration.waiting;
  const success='ScholaClassica y sus '+inventory.modules.length+' módulos tienen la última versión disponible.';
  if(!waiting){setPortalStatus(success);return;}
  if(!window.confirm('Los módulos están actualizados. Hay una nueva versión de la portada. ¿Activarla y recargar ahora?')){
    setPortalStatus('Módulos actualizados. La actualización de la portada está pendiente.');
    return;
  }
  await new Promise((resolve,reject)=>{
    let completed=false;
    const timer=setTimeout(()=>finish(Error('No se ha activado la nueva versión de la portada.')),30000);
    const finish=error=>{
      if(completed)return;completed=true;clearTimeout(timer);
      waiting.removeEventListener('statechange',onState);
      if(error)reject(error);else resolve();
    };
    const onState=()=>{
      if(waiting.state==='activated')finish();
      else if(waiting.state==='redundant')finish(Error('No se ha activado la portada.'));
    };
    waiting.addEventListener('statechange',onState);
    waiting.postMessage({type:'SCHOLA_ACTIVATE_PORTAL_UPDATE'});
    onState();
  });
  // Solo estado visual de la operación, nunca datos académicos.
  try{sessionStorage.setItem('schola-global-update-status',success);}catch{}
  window.location.reload();
}
if(portalUpdateButton){
  portalUpdateButton.addEventListener('click',async()=>{
    portalUpdateButton.disabled=true;
    globalUpdating=true;
    setPortalStatus('Buscando actualizaciones de ScholaClassica…');
    try{await checkPortalUpdate()}
    catch(error){setPortalStatus(error?.message||'No se pudo comprobar la actualización.')}
    finally{globalUpdating=false;portalUpdateButton.disabled=false}
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
    else {
      portalConnectivity();
      try{const status=sessionStorage.getItem('schola-global-update-status');if(status){sessionStorage.removeItem('schola-global-update-status');setPortalStatus(status);}}catch{}
    }
    portalRegistration.addEventListener('updatefound',()=>{
      const worker=portalRegistration.installing;
      worker?.addEventListener('statechange',()=>{
        if(!globalUpdating&&worker.state==='installed'&&navigator.serviceWorker.controller){
          setPortalStatus('Hay una actualización de la portada lista para instalar.');
        }
      });
    });
  }catch{
    if(portalUpdateButton)portalUpdateButton.hidden=true;
    setPortalStatus('No ha sido posible preparar el acceso sin conexión de la portada.');
  }
}
void registerPortalPwa();
