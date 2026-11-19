// Comprueba el service worker de la PWA antes de recargar.
// El SW existente utiliza skipWaiting()/clients.claim() al instalar.
function waitForWorkerActivation(worker, timeoutMs=12000) {
 if(worker.state==='activated')return Promise.resolve();
 if(worker.state==='redundant')return Promise.reject(new Error('La nueva versión no ha podido instalarse.'));
 return new Promise((resolve,reject)=>{
  let finished=false;
  let timer;
  function finish(error){
   if(finished)return;
   finished=true;
   clearTimeout(timer);
   worker.removeEventListener('statechange',onState);
   if(error)reject(error);else resolve();
  }
  function onState(){
   if(worker.state==='activated')finish();
   else if(worker.state==='redundant')finish(new Error('La instalación de la actualización ha fallado.'));
  }
  worker.addEventListener('statechange',onState);
  timer=setTimeout(()=>finish(new Error('La instalación no se ha completado. Inténtalo de nuevo.')),timeoutMs);
  onState();
 });
}
export async function checkForWebappUpdates(serviceWorker){
 if(!serviceWorker||typeof serviceWorker.getRegistration!=='function')return false;
 const registration=await serviceWorker.getRegistration();
 if(!registration)return false;
 await registration.update();
 if(registration.installing)await waitForWorkerActivation(registration.installing);
 return true;
}
