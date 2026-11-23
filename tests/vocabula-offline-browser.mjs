// Prueba de funcionamiento real sin conexión bajo la subruta de GitHub Pages.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright';
const root=resolve(import.meta.dirname,'../dist');
const prefix='/ScholaClassica/';
const mime={
 '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.css':'text/css','.json':'application/json','.svg':'image/svg+xml',
 '.png':'image/png','.ico':'image/x-icon','.webmanifest':'application/manifest+json'
};
const server=createServer(async(req,res)=>{
 try{
  const path=new URL(req.url,'http://localhost').pathname;
  if(!path.startsWith(prefix))throw Error('Fuera de Pages');
  const relative=decodeURIComponent(path.slice(prefix.length));
  const file=resolve(root,relative+(path.endsWith('/')?'index.html':''));
  if(!file.startsWith(root+sep))throw Error('Fuera del sitio');
  if(!(await stat(file)).isFile())throw Error('No es archivo');
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream'});
  res.end(await readFile(file));
 }catch{res.writeHead(404);res.end('Not found')}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const base='http://127.0.0.1:'+server.address().port;
const modulePath=prefix+'apps/vocabulario/';
const entry={
 id:'9b8233af-453e-4aca-bf71-64368fe1310e',subject:'lat1',form:'Ephesius, –a, –um',
 meaning:'de Éfeso, efesio',answers:['efesio'],units:['UD 10'],active:true,in_exam:true
};
let browser;
try{
 browser=await chromium.launch({headless:true});
 const context=await browser.newContext({acceptDownloads:true});
 const page=await context.newPage(),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/functions/v1/vocabulary',route=>{
  requests.push(route.request().url());
  throw Error('No debe solicitarse el endpoint de vocabulario');
 });
 const portal=await page.goto(base+prefix,{waitUntil:'load'});
 assert.equal(portal.status(),200);
 await page.waitForFunction(async()=>Boolean((await navigator.serviceWorker.getRegistration())?.active));
 const initial=await page.goto(base+modulePath+'index.html?subject=lat1',{waitUntil:'load'});
 assert.equal(initial.status(),200);
 await page.waitForFunction(()=>document.querySelector('#cloud-status')?.textContent.includes('Vocabulario actualizado'));
 await page.waitForFunction(async()=>{
  const registrations=await navigator.serviceWorker.getRegistrations();
  return registrations.some(r=>r.active&&r.scope.endsWith('/ScholaClassica/apps/vocabulario/'));
 });
 await page.waitForFunction(()=>navigator.serviceWorker.controller?.scriptURL.endsWith('/ScholaClassica/apps/vocabulario/sw.js'),null,{timeout:18000});
 await page.reload({waitUntil:'load'});
 const info=await page.evaluate(async()=>{
  const regs=await navigator.serviceWorker.getRegistrations();
  const cachesFound=await caches.keys();
  const vocab=cachesFound.find(x=>x.startsWith('schola-vocabula-'));
  const keys=await (await caches.open(vocab)).keys();
  const manifest=await fetch('./manifest.webmanifest').then(r=>r.json());
  return {regs:regs.map(r=>r.scope),cachesFound,
   ownPaths:keys.map(k=>new URL(k.url).pathname),
   controller:navigator.serviceWorker.controller?.scriptURL,
   manifest};
 });
 assert.ok(info.regs.some(x=>x.endsWith(modulePath)));
 assert.ok(info.controller?.endsWith(modulePath+'sw.js'),'Controlador real: '+info.controller);
 assert.equal(info.manifest.scope,'./');
 assert.ok(info.cachesFound.some(x=>x.startsWith('schola-portal-')));
 assert.ok(info.cachesFound.some(x=>x.startsWith('schola-vocabula-')));
 assert.ok(info.ownPaths.length>=19);
 assert.ok(info.ownPaths.every(x=>x.startsWith(modulePath)),'SW sin aislamiento de archivos');
 assert.equal(await page.locator('#subject').inputValue(),'lat1');
 await page.locator('#units input[value="UD 10"]').check();
 await page.locator('details.help').last().locator('summary').click();
 await page.locator('#search').fill('Ephesius');
 assert.equal(await page.locator('#dictionary .dictrow').count(),1,
  'La ficha migrada debe existir sin consultar Supabase');
 assert.equal(requests.length,0,'No consultar palabras remotas');
 const beforeOffline=requests.length;
 await context.setOffline(true);
 const response=await page.goto(base+modulePath+'index.html?subject=lat1',{waitUntil:'load'});
 assert.equal(response.status(),200,'El vocabulario no se abre sin Internet');
 assert.match(await page.locator('#cloud-status').textContent(),/Banco integrado/);
 assert.equal(await page.locator('#corpus option').count(),3);
 await page.locator('#units input[value="UD 10"]').check();
 await page.locator('details.help').last().locator('summary').click();
 await page.locator('#search').fill('Ephesius');
 assert.equal(await page.locator('#dictionary .dictrow').count(),1,
  'La palabra fijada en el banco debe funcionar sin conexión');
 await page.locator('#activity').selectOption('cards');
 await page.locator('#start').click();
 await page.locator('#reveal').click();
 await page.locator('#yes').click();
 const progress=await page.evaluate(()=>localStorage.getItem('classics-progress-v1'));
 assert.ok(JSON.parse(progress)&&Object.keys(JSON.parse(progress)).length>0);
 await page.locator('details.help').first().locator('summary').click();
 // En Chromium, la descarga Blob puede no emitir evento con red forzadamente
 // desactivada: inspeccionamos el JSON que genera el botón sin depender del SO.
 await page.evaluate(()=>{
   const original=URL.createObjectURL.bind(URL);
   URL.createObjectURL=blob=>{window.__vocabExportBlob=blob;return original(blob)};
 });
 await page.locator('#export').click();
 const exported=await page.evaluate(async()=>JSON.parse(await window.__vocabExportBlob.text()));
 assert.equal(exported.version,1);
 assert.deepEqual(exported.progress,JSON.parse(progress));
 assert.equal(await page.locator('#open-report').count(),0);
 assert.equal(await page.locator('#report-dialog').count(),0);
 assert.equal(await page.locator('[data-report-current],[data-report-id]').count(),0);
 assert.equal(requests.length,beforeOffline,'No llamar al backend sin conexión');
 await page.reload({waitUntil:'load'});
 assert.equal(await page.evaluate(()=>localStorage.getItem('classics-progress-v1')),progress,
  'El progreso debe sobrevivir a la recarga offline');
 // Progreso exportable/importable incluso sin conexión.
 await page.evaluate(()=>localStorage.setItem('classics-progress-v1','{}'));
 await page.reload({waitUntil:'load'});
 await page.locator('details.help').first().locator('summary').click();
 await page.locator('#import').setInputFiles({name:'progreso-vocabulario.json',
  mimeType:'application/json',buffer:Buffer.from(JSON.stringify({version:1,progress:JSON.parse(progress)}))});
 await page.waitForFunction(()=>document.querySelector('#storage')?.textContent==='Progreso importado.');
 assert.equal(await page.evaluate(()=>localStorage.getItem('classics-progress-v1')),progress);
 await context.setOffline(false);
 assert.equal(requests.length,0,'La versión estática no transmite datos a Supabase');
 await page.locator('#subject').selectOption('lat2');
 await page.locator('#units input[value="Adjetivos"]').check();
 await page.locator('details.help').last().locator('summary').click();
 await page.locator('#search').fill('Ephesius');
 assert.equal(await page.locator('#dictionary .dictrow').count(),1,
  'Debe conservar Ephesius de Latín II como ficha distinta de la de Latín I');
 const remaining=await page.evaluate(async()=>await caches.keys());
 assert.ok(remaining.some(x=>x.startsWith('schola-portal-')));
 assert.ok(remaining.some(x=>x.startsWith('schola-vocabula-')));
 assert.deepEqual(errors,[],'Excepciones JavaScript durante la desconexión');
 console.log('OK: Vocabula estático offline, dos Ephesius, progreso y cachés aisladas sin API');
}finally{
 if(browser)await browser.close();
 await new Promise(done=>server.close(done));
}
