/** Actualización autónoma de la PWA desde «Estudio del léxico». No escribe progreso. */
const check=document.getElementById('study-check-update');
const apply=document.getElementById('study-apply-update');
const status=document.getElementById('study-update-status');
let registration=null;
let checking=false;
let activationRequested=false;
function announce(message){status.hidden=false;status.textContent=message;}
function refresh(){
  if(!registration)return;
  apply.hidden=!registration.waiting;
  if(registration.waiting)announce('Hay una versión nueva preparada. Puedes aplicarla desde la cabecera.');
}
function observe(worker){
  if(!worker)return;
  worker.addEventListener('statechange',refresh);
}
if(!('serviceWorker' in navigator)){
  check.disabled=true;
  announce('Este navegador no admite la actualización sin conexión.');
}else{
  navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'})
    .then(reg=>{
      registration=reg;
      observe(reg.installing);
      reg.addEventListener('updatefound',()=>observe(reg.installing));
      refresh();
    }).catch(()=>{
      check.disabled=true;
      announce('No se ha podido registrar la actualización. Puedes seguir estudiando.');
    });
}
check.addEventListener('click',async()=>{
  if(checking)return;
  checking=true;check.disabled=true;
  announce('Comprobando actualizaciones…');
  try{
    if(!registration)throw Error('Servicio todavía no disponible');
    await registration.update();
    refresh();
    if(!registration.waiting)announce('No hay actualizaciones pendientes de activar.');
  }catch{announce('No se ha podido comprobar la actualización.');}
  finally{checking=false;check.disabled=false;}
});
apply.addEventListener('click',()=>{
  if(!registration?.waiting)return;
  activationRequested=true;
  apply.disabled=true;
  announce('Aplicando actualización…');
  registration.waiting.postMessage({type:'ETYM_ACTIVATE_UPDATE'});
});
navigator.serviceWorker?.addEventListener('controllerchange',()=>{
  if(activationRequested){activationRequested=false;location.reload();}
});
