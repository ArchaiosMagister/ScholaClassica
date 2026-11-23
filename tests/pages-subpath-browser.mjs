// Simula exactamente la ruta de proyecto en GitHub Pages: /ScholaClassica/.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,join,extname,sep} from 'node:path';
import {chromium} from 'playwright';
const root=resolve(import.meta.dirname,'../dist');
const prefix='/ScholaClassica/';
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
  '.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8',
  '.json':'application/json','.svg':'image/svg+xml','.png':'image/png',
  '.webp':'image/webp','.ico':'image/x-icon','.webmanifest':'application/manifest+json'};
const server=createServer(async(req,res)=>{
 try{
  const path=new URL(req.url,'http://localhost/').pathname;
  if(!path.startsWith(prefix))throw Error('Fuera del proyecto Pages');
  const relative=decodeURIComponent(path.slice(prefix.length));
  const file=resolve(root,relative+(path.endsWith('/')?'index.html':''));
  if(!file.startsWith(root+sep))throw Error('Fuera de directorio');
  if(!(await stat(file)).isFile())throw Error('No es archivo');
  res.setHeader('content-type',mime[extname(file)]||'application/octet-stream');
  res.writeHead(200);res.end(await readFile(file));
 }catch{res.writeHead(404);res.end('Not found')}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const base='http://127.0.0.1:'+server.address().port;
let browser;
try{
 browser=await chromium.launch({headless:true});
 const page=await browser.newPage();
 const errors=[];
 page.on('pageerror',err=>errors.push(err.message));
 const home=await page.goto(base+prefix,{waitUntil:'networkidle'});
 assert.equal(home.status(),200);
 assert.match(await page.title(),/ScholaClassica/);
 assert.equal(await page.locator('#panel-herramientas .card').count(),6);
 await page.locator('.hero-image').evaluate(image=>image.decode());
 for(const width of [320,390,768]){
   await page.setViewportSize({width,height:900});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),
     'La portada desborda horizontalmente a '+width+' px');
   assert.ok(await page.locator('#study-course').isVisible());
 }
 await page.setViewportSize({width:1280,height:900});
 const manifest=await page.evaluate(async()=>{
   const tag=document.querySelector('link[rel="manifest"]');
   return {href:tag?.href,data:await fetch(tag.href).then(r=>r.json())};
 });
 assert.ok(manifest.href.startsWith(base+prefix));
 assert.equal(manifest.data.scope,'./');
 const registration=await page.waitForFunction(async()=>{
   const r=await navigator.serviceWorker.getRegistration();
   return r?.active?r.scope:null;
 },null,{timeout:18000});
 assert.equal(await registration.jsonValue(),base+prefix,
   'El SW del portal no debe controlarse desde la raíz de github.io');
 await page.reload({waitUntil:'networkidle'});
 const cached=await page.evaluate(async()=>await caches.keys());
 assert.ok(cached.some(name=>name.startsWith('schola-portal-')));
 const teacher=await page.evaluate(async()=>await fetch('docente/auth-config.json').then(r=>r.json()));
 assert.deepEqual(teacher,{enabled:false});
 await page.context().setOffline(true);
 const offline=await page.goto(base+prefix,{waitUntil:'load'});
 assert.equal(offline.status(),200,'Portada inaccesible sin red en subruta Pages');
 assert.equal(await page.locator('#study-course').count(),1);
 const modes=page.locator('#portal-theme');
 await modes.selectOption('oled');
 assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).backgroundColor),
   'rgb(0, 0, 0)','El OLED debe estar disponible sin conexión en GitHub Pages');
 await page.context().setOffline(false);
 // El enlace por lengua conduce al glosario, con la misma subruta Pages.
 await page.locator('#tab-herramientas').press('ArrowRight');
 assert.equal(await page.locator('#tab-lenguas').getAttribute('aria-selected'),'true');
 await page.locator('#panel-lenguas a[href="apps/etymologicon/estudio.html"]').click();
 await page.waitForURL(/\/ScholaClassica\/apps\/etymologicon\/estudio\.html$/);
 await page.waitForFunction(()=>document.querySelector('#study-loading')?.hidden===true);
 await page.goto(base+prefix,{waitUntil:'networkidle'});
 // La tarjeta de herramientas abre la práctica, conservando el itinerario.
 await page.locator('#tab-herramientas').click();
 await page.locator('#panel-herramientas a[href="apps/etymologicon/practicar.html"]').click();
 await page.waitForURL(/\/ScholaClassica\/apps\/etymologicon\/practicar\.html$/);
 await page.waitForFunction(()=>document.querySelector('#exercise-content')?.hidden===false);
 await page.goto(base+prefix,{waitUntil:'networkidle'});
 assert.equal(await page.locator('#study-course').inputValue(),'gr1');
 assert.match(await page.locator('#study-resume').innerText(),/Etymologicon/);
 assert.equal(await page.locator('#study-resume').getAttribute('href'),
   'apps/etymologicon/index.html');
 await page.locator('#study-course').selectOption('gr1');
 assert.equal(await page.locator('.path-links a').count(),6);
  assert.ok((await page.locator('.path-links').textContent()).includes('Repaso de sintaxis y conceptos · Griego I'));
 await page.locator('.path-links a[data-study-tool="etymologicon"]').click();
 await page.waitForURL(/\/ScholaClassica\/apps\/etymologicon\/index\.html$/);
 await page.waitForFunction(async()=>{
   const registrations=await navigator.serviceWorker.getRegistrations();
   return registrations.some(r=>r.active&&
     r.scope.endsWith('/ScholaClassica/apps/etymologicon/'));
 },null,{timeout:18000});
 await page.goto(base+prefix+'apps/evolucion-fonetica/index.html',{waitUntil:'networkidle'});
 await page.waitForFunction(async()=>{
   const registrations=await navigator.serviceWorker.getRegistrations();
   return registrations.some(r=>r.active&&
     r.scope.endsWith('/ScholaClassica/apps/evolucion-fonetica/'));
 },null,{timeout:18000});
 assert.equal(await page.locator('#refresh-app').count(),1);
 const entries=await page.evaluate(async()=>await fetch('./data/pilot.json').then(r=>r.json()));
 assert.equal(entries.words.length,622);
 assert.equal(new Set(entries.words.map(w=>w.id)).size,622);
 assert.ok(entries.words.some(w=>w.id==='xl-230'&&w.answers.includes('padre')),
   'El lote nuevo debe estar disponible también en la subruta real de Pages');
 const keys=await page.evaluate(async()=>await caches.keys());
 for(const cache of ['schola-portal-','schola-etymologicon-','schola-evolutio-'])
   assert.ok(keys.some(k=>k.startsWith(cache)),cache+' no está aislada');

 // Acceso directo desde el portal a un capítulo griego: debe registrar por sí
 // mismo la PWA de Appendix, sin exigir haber visitado su portada antes.
 let grammar=await page.goto(base+prefix+'apps/gramatica/griego-sintaxis.html',
   {waitUntil:'networkidle'});
 assert.equal(grammar.status(),200,'La sintaxis griega debe abrir directamente');
 await page.waitForFunction(async()=>(
   await navigator.serviceWorker.getRegistrations()).some(reg=>
     reg.active&&reg.scope.endsWith('/ScholaClassica/apps/gramatica/')),
   null,{timeout:35000});
 await page.reload({waitUntil:'networkidle'});
 await page.context().setOffline(true);
 for(const relative of [
  'griego-morfologia.html','griego-sustantivos.html',
  'val/griego-sintaxis.html','morfologia.html',
  'curso.html?lengua=latin&curso=4&unidad=1'
 ]){
  grammar=await page.goto(base+prefix+'apps/gramatica/'+relative,{waitUntil:'load'});
  assert.equal(grammar.status(),200,'Consulta offline de Appendix: '+relative);
  assert.ok((await page.locator('main').textContent()).trim().length>50,
    'Contenido de consulta vacío sin red: '+relative);
 }
 const grammarKeys=await page.evaluate(()=>caches.keys());
 for(const cache of ['schola-portal-','schola-etymologicon-',
   'schola-evolutio-','schola-gramatica-'])
  assert.ok(grammarKeys.some(key=>key.startsWith(cache)),
    'No se debe borrar la caché de '+cache);
 await page.context().setOffline(false);
 assert.deepEqual(errors,[],'Errores de navegador en la subruta Pages');
 console.log('OK: subruta /ScholaClassica/, PWA raíz y Etymologicon/Evolutio aislados');
}finally{
 if(browser)await browser.close();
 await new Promise(ok=>server.close(ok));
}
