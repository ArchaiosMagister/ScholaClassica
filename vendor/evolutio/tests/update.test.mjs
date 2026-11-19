import test from 'node:test';
import assert from 'node:assert/strict';
import {checkForWebappUpdates} from '../src/update.mjs';

test('Actualización sin service worker disponible deja recargar la webapp',async()=>{
 assert.equal(await checkForWebappUpdates(null),false);
 assert.equal(await checkForWebappUpdates({getRegistration:async()=>null}),false);
});
test('Actualización solicita comprobar el service worker existente',async()=>{
 let updates=0;
 const sw={getRegistration:async()=>({installing:null,update:async()=>{updates++;}})};
 assert.equal(await checkForWebappUpdates(sw),true);
 assert.equal(updates,1);
});
test('Actualización espera la activación de la nueva versión antes de permitir la recarga',async()=>{
 const listeners=new Set();
 let state='installing',updates=0;
 const installing={
  get state(){return state;},
  addEventListener(name,listener){assert.equal(name,'statechange');listeners.add(listener);},
  removeEventListener(name,listener){assert.equal(name,'statechange');listeners.delete(listener);}
 };
 const sw={getRegistration:async()=>({installing,update:async()=>{updates++;}})};
 const operation=checkForWebappUpdates(sw);
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(updates,1);
 assert.equal(listeners.size,1);
 state='activated';for(const listener of [...listeners])listener();
 assert.equal(await operation,true);
 assert.equal(listeners.size,0);
});
test('Los errores de instalación y de red se comunican en vez de fingir éxito',async()=>{
 const failure={getRegistration:async()=>({update:async()=>{throw new Error('sin red');}})};
 await assert.rejects(checkForWebappUpdates(failure),/sin red/);
 const redundant={getRegistration:async()=>({
  update:async()=>{},
  installing:{state:'redundant'}
 })};
 await assert.rejects(checkForWebappUpdates(redundant),/no ha podido instalarse/);
});
