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
 await page.route('**/functions/v1/vocabulary',async route=>{
  const payload=JSON.parse(route.request().postData()||'{}');
  requests.push(payload);
  assert.ok(['public_words','report'].includes(payload.action));
  await route.fulfill({status:200,contentType:'application/json',
   body:JSON.stringify(payload.action==='public_words'?{words:[entry]}:{ok:true})});
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
 assert.ok(info.controller?.endsWith(modulePath+'sw.js'));
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
  'La palabra añadida por el profesor debe ser visible tras sincronizar');
 assert.equal(await page.evaluate(()=>scholaVocabulaOffline.loadWords()?.length),1);
 const beforeOffline=requests.length;
 await context.setOffline(true);
 const response=await page.goto(base+modulePath+'index.html?subject=lat1',{waitUntil:'load'});
 assert.equal(response.status(),200,'El vocabulario no se abre sin Internet');
 assert.match(await page.locator('#cloud-status').textContent(),/Sin conexión/);
 assert.equal(await page.locator('#corpus option').count(),3);
 await page.locator('#units input[value="UD 10"]').check();
 await page.locator('details.help').last().locator('summary').click();
 await page.locator('#search').fill('Ephesius');
 assert.equal(await page.locator('#dictionary .dictrow').count(),1,
  'La palabra docente descargada se pierde sin conexión');
 await page.locator('#activity').selectOption('cards');
 await page.locator('#start').click();
 await page.locator('#reveal').click();
 await page.locator('#yes').click();
 const progress=await page.evaluate(()=>localStorage.getItem('classics-progress-v1'));
 assert.ok(JSON.parse(progress)&&Object.keys(JSON.parse(progress)).length>0);
 const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#export').click()]);
 assert.equal(download.suggestedFilename(),'progreso-vocabulario.json');
 await page.getByRole('button',{name:'Avisar de un error'}).click();
 await page.locator('#report-message').fill('Revisar esta traducción cuando vuelva Internet.');
 await page.locator('#send-report').click();
 await page.getByText('Aviso guardado en este dispositivo.',{exact:false}).waitFor();
 assert.equal(await page.evaluate(()=>scholaVocabulaOffline.pendingCount()),1);
 assert.equal(requests.length,beforeOffline,'No debe haber envíos al backend sin red');
 await page.reload({waitUntil:'load'});
 assert.equal(await page.evaluate(()=>localStorage.getItem('classics-progress-v1')),progress,
  'El progreso debe sobrevivir a la recarga offline');
 assert.equal(await page.evaluate(()=>scholaVocabulaOffline.pendingCount()),1);
 // Progreso exportable/importable incluso sin conexión.
 await page.evaluate(()=>localStorage.setItem('classics-progress-v1','{}'));
 await page.reload({waitUntil:'load'});
 await page.locator('#import').setInputFiles({name:'progreso-vocabulario.json',
  mimeType:'application/json',buffer:Buffer.from(JSON.stringify({version:1,progress:JSON.parse(progress)}))});
 await page.getByText('Progreso importado.').waitFor();
 assert.equal(await page.evaluate(()=>localStorage.getItem('classics-progress-v1')),progress);
 await context.setOffline(false);
 await page.waitForFunction(()=>scholaVocabulaOffline.pendingCount()===0,null,{timeout:15000});
 assert.ok(requests.some(r=>r.action==='report'&&r.message==='Revisar esta traducción cuando vuelva Internet.'),
  'Debe enviarse el aviso pendiente al recuperar Internet');
 assert.ok(requests.filter(r=>r.action==='public_words').length>=2,
  'Debe reanudarse la sincronización docente');
 const remaining=await page.evaluate(async()=>await caches.keys());
 assert.ok(remaining.some(x=>x.startsWith('schola-portal-')));
 assert.ok(remaining.some(x=>x.startsWith('schola-vocabula-')));
 assert.deepEqual(errors,[],'Excepciones JavaScript durante la desconexión');
 console.log('OK: Vocabula offline real, altas docentes, progreso, exportación, avisos, SW de ámbito aislado y reconexión');
}finally{
 if(browser)await browser.close();
 await new Promise(done=>server.close(done));
}
