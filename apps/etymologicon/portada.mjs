// Portada ligera: preferencias y caché propias de Etymologicon, sin tocar progreso.
const key='scholaclassica-etymologicon-theme-v1';
const themes=new Set(['auto','light','dark','oled']);
const selector=document.getElementById('home-theme-select');
const status=document.getElementById('home-offline-status');
const check=document.getElementById('home-check-update');
const apply=document.getElementById('home-apply-update');
let registration=null;
let checking=false, activationRequested=false;

function setTheme(value){
  const theme=themes.has(value)?value:'auto';
  selector.value=theme;
  if(theme==='auto')document.documentElement.removeAttribute('data-theme');
  else document.documentElement.dataset.theme=theme;
}
try{setTheme(localStorage.getItem(key)||'auto');}
catch{setTheme('auto');}
selector.addEventListener('change',()=>{
  setTheme(selector.value);
  try{localStorage.setItem(key,selector.value);}catch{/* Almacenamiento privado */}
});
function report(){
  if(!navigator.onLine){
    status.textContent=navigator.serviceWorker?.controller
      ?'Sin conexión: usa las modalidades que ya estén guardadas.'
      :'Sin conexión: abre primero la aplicación con internet.';
  }else if(registration?.waiting){
    status.textContent='Nueva versión preparada. Puedes aplicarla cuando quieras.';
  }else if(registration?.active){
    status.textContent='Contenido guardado para estudiar y practicar sin conexión.';
  }else{
    status.textContent='El uso sin conexión requiere HTTPS o localhost.';
  }
  apply.hidden=!registration?.waiting;
}
function observe(worker){
  if(!worker)return;
  worker.addEventListener('statechange',()=>{
    if(worker.state==='installed'||worker.state==='activated')report();
  });
}
if(!('serviceWorker' in navigator)){
  check.disabled=true;
  status.textContent='Este navegador no permite el funcionamiento sin conexión.';
}else{
  navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'})
    .then(reg=>{
      registration=reg;
      observe(reg.installing);
      reg.addEventListener('updatefound',()=>observe(reg.installing));
      report();
    }).catch(()=>{
      check.disabled=true;
      status.textContent='El modo sin conexión no está disponible. Puedes seguir navegando online.';
    });
}
check.addEventListener('click',async()=>{
  if(!registration||checking)return;
  checking=true;check.disabled=true;
  status.textContent='Comprobando actualizaciones…';
  try{await registration.update();report();}
  catch{status.textContent='No se ha podido comprobar la actualización.';}
  finally{checking=false;check.disabled=false;}
});
apply.addEventListener('click',()=>{
  const waiting=registration?.waiting;
  if(!waiting)return;
  activationRequested=true;
  apply.disabled=true;
  status.textContent='Aplicando actualización…';
  waiting.postMessage({type:'ETYM_ACTIVATE_UPDATE'});
});
navigator.serviceWorker?.addEventListener('controllerchange',()=>{
  if(activationRequested){activationRequested=false;location.reload();}
  else report();
});
window.addEventListener('online',report);
window.addEventListener('offline',report);
