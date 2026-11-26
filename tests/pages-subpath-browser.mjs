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
 assert.equal(await page.locator('#panel-herramientas .card').count(),7);
 const quickLinks=page.getByRole('navigation',{name:'Recursos de estudio'});
 const quickPreverbial=quickLinks.getByRole('link',{name:/Modificación preverbial/});
 const portalUpdate=page.getByRole('button',{name:'Actualizar portada',exact:true});
 assert.equal(await quickLinks.getByRole('link').count(),8);
 await page.locator('.hero-image').evaluate(image=>image.decode());
 for(const [width,height] of [[320,760],[390,844],[768,900]]){
   await page.setViewportSize({width,height});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),
     'La portada desborda horizontalmente a '+width+' px');
   assert.ok(await page.locator('#study-course').isVisible());
   const update=await portalUpdate.boundingBox();
   const hero=await page.locator('.hero').boundingBox();
   assert.ok(update&&hero&&update.y+update.height<=hero.y,
     'Actualizar portada debe aparecer antes de la cabecera a '+width+' px');
   const shortcut=await quickPreverbial.boundingBox();
   assert.ok(shortcut&&shortcut.y+shortcut.height<=height,
     'El acceso a modificación preverbial queda fuera de la primera pantalla a '+width+' px');
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
 await portalUpdate.click();
 await page.waitForFunction(()=>document.querySelector('#portal-pwa-status').textContent
   .includes('última versión disponible'));
 const cached=await page.evaluate(async()=>await caches.keys());
 assert.ok(cached.some(name=>name.startsWith('schola-portal-')));
 const teacher=await page.evaluate(async()=>await fetch('docente/auth-config.json').then(r=>r.json()));
 assert.deepEqual(teacher,{enabled:false});
 await page.context().setOffline(true);
 const offline=await page.goto(base+prefix,{waitUntil:'load'});
 assert.equal(offline.status(),200,'Portada inaccesible sin red en subruta Pages');
 assert.equal(await page.locator('#study-course').count(),1);
 assert.equal(await quickLinks.getByRole('link').count(),8);
 const modes=page.locator('#portal-theme');
 await modes.selectOption('oled');
 assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).backgroundColor),
   'rgb(0, 0, 0)','El OLED debe estar disponible sin conexión en GitHub Pages');
 await page.context().setOffline(false);
 // Latín I abre una ronda de práctica y conserva su propio último acceso.
 await page.locator('#study-course').selectOption('lat1');
 assert.match(await quickPreverbial.getAttribute('href'),/modificacion-preverbial\/index\.html\?subject=lat1$/);
 await page.locator('[data-study-tool="modificacion-preverbial"]').click();
 await page.waitForURL(/\/ScholaClassica\/apps\/modificacion-preverbial\/index\.html\?subject=lat1$/);
 assert.match(await page.locator('#module-context').textContent(),/Latín I · Formación de palabras/);
 assert.match(await page.locator('#round option:checked').textContent(),/^Práctica ·/);
 assert.equal(await page.getByRole('link',{name:/Enunciado PAU/}).isVisible(),false);
 await page.getByRole('link',{name:'ScholaClassica',exact:true}).click();
 assert.equal(await page.locator('#study-course').inputValue(),'lat1');
 assert.match(await page.locator('#study-resume').getAttribute('href'),/subject=lat1$/);
 // La práctica de Latín II funciona en la subruta de Pages y queda como último acceso.
 await page.locator('#study-course').selectOption('lat2');
 assert.match(await quickPreverbial.getAttribute('href'),/modificacion-preverbial\/index\.html$/);
 await page.locator('[data-study-tool="modificacion-preverbial"]').click();
 await page.waitForURL(/\/ScholaClassica\/apps\/modificacion-preverbial\/index\.html$/);
 assert.equal(await page.locator('#practice input:visible').count(),2);
 async function checkPreverbialWidths(){
   for(const width of [320,390,768]){
     await page.setViewportSize({width,height:900});
     assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),
       'La práctica preverbial desborda horizontalmente a '+width+' px');
   }
 }
 await checkPreverbialWidths();
 await page.locator('#base-0').fill('profero');
 await page.locator('#base-1').fill('trahere');
 await page.locator('#base-1').press('Enter');
 assert.match(await page.locator('#base-feedback-0').textContent(),/preverbio/);
 assert.match(await page.locator('#base-feedback-1').textContent(),/1.ª persona/);
 assert.equal(await page.locator('#bases-stage').isVisible(),true);
 assert.equal(await page.locator('#compounds-stage').isVisible(),false);
 await page.locator('#base-0').fill('fero');
 await page.locator('#base-1').fill('traho');
 await page.getByRole('button',{name:'Comprobar bases',exact:true}).click();
 assert.equal(await page.locator('#compounds-stage').isVisible(),true);
 assert.equal(await page.locator('#practice input:visible').count(),5);
 await checkPreverbialWidths();
 const compounds=['conferre','differo','praefero','attraho',''];
 for(const [index,answer] of compounds.entries()){
   await page.locator('#compounds input').nth(index).fill(answer);
 }
 await page.getByRole('button',{name:'Ir a derivados',exact:true}).click();
 assert.equal(await page.locator('#words-stage').isVisible(),true);
 assert.match(await page.locator('#word-context').textContent(),/fero · conferre/);
 await checkPreverbialWidths();
 const derivatives=['conferir','diferencia','preferente','atraure','extracció'];
 for(const [index,answer] of derivatives.entries()){
   await page.locator('#derivatives input').nth(index).fill(answer);
 }
 await page.getByRole('button',{name:'Volver',exact:true}).click();
 assert.equal(await page.locator('#compound-0-1').inputValue(),'conferre');
 await page.getByRole('button',{name:'Ir a derivados',exact:true}).click();
 assert.equal(await page.locator('#word-0').inputValue(),'conferir');
 await page.getByRole('button',{name:'Corregir ejercicio',exact:true}).click();
 assert.match(await page.locator('#result').textContent(),/0,8 \/ 1/);
 assert.equal(await page.locator('#compound-score').textContent(),'4 de 5');
 assert.equal(await page.locator('#word-score').textContent(),'4 de 5');
 assert.match(await page.locator('#result-summary').textContent(),/2 de 2/);
 assert.equal(await page.locator('#solution').isVisible(),true);
 assert.equal(await page.getByText('Requiere el compuesto extraho',{exact:true}).isVisible(),true);
 await checkPreverbialWidths();
 await page.getByRole('button',{name:'Editar respuestas',exact:true}).click();
 assert.equal(await page.locator(':focus').getAttribute('id'),'compounds-title');
 assert.equal(await page.locator('#compound-0-1').inputValue(),'conferre');
 await page.locator('#compound-1-2').fill('extraho');
 await page.getByRole('button',{name:'Ir a derivados',exact:true}).click();
 assert.equal(await page.locator('#word-4').inputValue(),'extracció');
 await page.getByRole('button',{name:'Corregir ejercicio',exact:true}).click();
 assert.match(await page.locator('#result').textContent(),/1,0 \/ 1/);
 assert.equal(await page.locator('#compound-score').textContent(),'5 de 5');
 assert.equal(await page.locator('#word-score').textContent(),'5 de 5');
 assert.equal(await page.locator('#solution-content details').first().getAttribute('open'),null);
 await page.getByRole('button',{name:'Reintentar',exact:true}).click();
 assert.equal(await page.locator('#solution').isVisible(),false);
 assert.equal(await page.locator('#base-0').inputValue(),'');
 await page.locator('#round').selectOption({label:'Práctica · profugerunt y acceptis'});
 await page.getByRole('textbox',{name:'Base simple de profugerunt'}).fill('profugio');
 await page.locator('#base-1').fill('capio');
 await page.getByRole('button',{name:'Comprobar bases',exact:true}).click();
 await page.getByRole('button',{name:'Consultar bases y seguir',exact:true}).click();
 assert.match(await page.locator('#compounds').textContent(),/fugio/);
 await page.getByRole('button',{name:'Ir a derivados',exact:true}).click();
 await page.getByRole('button',{name:'Corregir ejercicio',exact:true}).click();
 assert.match(await page.locator('#result-summary').textContent(),/1 de 2/);
 const baseReview=page.locator('#solution-content details').first();
 assert.equal(await baseReview.getByText('profugerunt → profugio → fugio',{exact:true}).isVisible(),true);
 assert.match(await baseReview.textContent(),/Base consultada\. Escribiste profugio\./);
 await page.getByText('Una solución posible',{exact:true}).click();
 assert.equal(await page.locator('#solution-content details').nth(1)
   .getByText('profugerunt → profugio → fugio',{exact:true}).isVisible(),true);
 await page.getByRole('button',{name:'Siguiente ejercicio',exact:true}).click();
 assert.match(await page.locator('#round option:checked').textContent(),/Práctica · UD3 · attulerunt y exclamavit/);
 // El último ejercicio, y solo el último, vuelve al primero.
 const lastRound=await page.locator('#round option').count()-1;
 await page.locator('#round').selectOption({index:lastRound});
 const lastModel=await page.evaluate(async()=> (await import('./banco.mjs')).rounds.at(-1).prompts);
 for(const [index,prompt] of lastModel.entries()) await page.locator('#base-'+index).fill(prompt.base);
 await page.getByRole('button',{name:'Comprobar bases',exact:true}).click();
 await page.getByRole('button',{name:'Ir a derivados',exact:true}).click();
 await page.getByRole('button',{name:'Corregir ejercicio',exact:true}).click();
 await page.getByRole('button',{name:'Siguiente ejercicio',exact:true}).click();
 assert.match(await page.locator('#round option:checked').textContent(),/Junio 2025/);
 await page.setViewportSize({width:1280,height:900});
 await page.getByRole('link',{name:'ScholaClassica',exact:true}).click();
 assert.match(await page.locator('#study-resume').textContent(),/Modificación preverbial/);
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
