// Regresión end-to-end del Etymologicon REAL servido en la subruta GitHub Pages.
// Sin tocar el catálogo filológico, ni datos de alumnado, ni Supabase.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright';

const root=resolve(import.meta.dirname,'../dist');
const prefix='/ScholaClassica/';
const modulePath=prefix+'apps/etymologicon/';
const mime={
 '.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8',
 '.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8',
 '.json':'application/json','.webmanifest':'application/manifest+json',
 '.svg':'image/svg+xml','.png':'image/png'
};
const server=createServer(async(req,res)=>{
 try{
  const pathname=new URL(req.url,'http://localhost/').pathname;
  if(!pathname.startsWith(prefix))throw Error('Ruta externa');
  const relative=decodeURIComponent(pathname.slice(prefix.length));
  const file=resolve(root,relative+(pathname.endsWith('/')?'index.html':''));
  if(!file.startsWith(root+sep)||!(await stat(file)).isFile())
    throw Error('Archivo inexistente');
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream'});
  res.end(await readFile(file));
 }catch{
  res.writeHead(404,{'content-type':'text/plain; charset=utf-8'});
  res.end('Not found');
 }
});
await new Promise(resolveReady=>server.listen(0,'127.0.0.1',resolveReady));
const base='http://127.0.0.1:'+server.address().port;
let browser;
try{
 browser=await chromium.launch({headless:true});
 const ctx=await browser.newContext({serviceWorkers:'allow'});
 const page=await ctx.newPage();
 const pageErrors=[];
 page.on('pageerror',error=>pageErrors.push(error.message));

 let response=await page.goto(base+modulePath+'index.html',{waitUntil:'load'});
 assert.equal(response.status(),200,'Portada Etymologicon');
 assert.match(await page.title(),/Etymologicon/);
 assert.equal(await page.locator('a.home-choice--practice').getAttribute('href'),'./practicar.html');
 assert.equal(await page.locator('a.home-choice--study').getAttribute('href'),'./estudio.html');

 await page.locator('a.home-choice--study').click();
 assert.match(page.url(),/\/apps\/etymologicon\/estudio\.html$/);
 await page.waitForFunction(()=>document.querySelector('#study-loading')?.hidden===true);
 assert.equal(await page.locator('#study-error').isHidden(),true,'El glosario debe cargar');
 assert.equal(await page.locator('#study-entries details.lexicon-group').count(),111,
  'Los 111 étimos del glosario deben poder consultarse');
 assert.match(await page.locator('#study-count').textContent(),/^111 étimos · /);

 // Filtros y búsqueda normalizada, sin escrituras en el historial.
 const sampleWord=(await page.locator('#study-entries .lexical-word-title').first().textContent()).trim();
 assert.ok(sampleWord.length>1,'Debe existir un derivado consultable');
 await page.locator('#study-search').fill(sampleWord);
 assert.ok(await page.locator('#study-entries .lexical-word-title').count()>0,
  'La búsqueda debe encontrar un derivado realmente presente en el glosario');
 assert.ok((await page.locator('#study-entries').textContent()).includes(sampleWord),
  'El resultado de búsqueda debe conservar la forma del derivado');
 await page.locator('#study-search').fill('');
 // Navegación transversal por los componentes explícitos de los derivados.
 await page.locator('#study-search').fill('filología');
 const filologia=page.locator('.lexical-word').filter({
   has:page.locator('.lexical-word-title',{hasText:'filología'})
 }).first();
 const initialStudyUrl=page.url();
 await filologia.locator('.component-greek-link',{hasText:'λόγος'}).click();
 const logos=page.locator('details[data-etymon-id="grc:λογοσ"]');
 assert.equal(page.url(),initialStudyUrl,'Navegar por étimos no debe salir del glosario');
 assert.equal(await page.locator('#study-search').inputValue(),'');
 assert.equal(await page.locator('#study-unit').inputValue(),'all');
 assert.equal(await logos.getAttribute('open'),'');
 assert.ok(await logos.locator('.lexical-word-title').count()>0,
   'Al pulsar un componente se muestran los derivados de ese étimo');
 assert.ok(await logos.evaluate(el=>el.contains(document.activeElement)),
   'El foco accesible se sitúa en la familia etimológica de destino');

 // El componente complementario sin ficha conserva la página y muestra un aviso local.
 await page.locator('#study-search').fill('antropocentrismo');
 const antropocentrismo=page.locator('.lexical-word').filter({
   has:page.locator('.lexical-word-title',{hasText:'antropocentrismo'})
 }).first();
 await antropocentrismo.locator('.component-greek-link',{hasText:'κέντρον'}).click();
 assert.equal(page.url(),initialStudyUrl);
 assert.equal(await page.locator('#study-search').inputValue(),'antropocentrismo');
 assert.match(await antropocentrismo.locator('.lexical-component-feedback').textContent(),
   /no tiene ficha de étimo disponible/);
 assert.equal(await antropocentrismo.locator('.lexical-component-feedback').isVisible(),true);
 await page.locator('#study-search').fill('');
 await page.locator('#study-unit').selectOption({index:1});
 assert.ok((await page.locator('#study-entries details.lexicon-group').count())>0,
  'La primera unidad debe ofrecer entradas');
 await page.locator('#study-unit').selectOption('all');
 await page.locator('#study-expand').click();
 assert.equal(await page.locator('#study-entries details[open]').count(),111);
 await page.locator('#study-collapse').click();
 assert.equal(await page.locator('#study-entries details[open]').count(),0);
 await page.locator('#study-theme').selectOption('oled');
 assert.equal(await page.evaluate(()=>document.documentElement.dataset.theme),'oled');
 assert.equal(await page.evaluate(()=>localStorage.getItem('scholaclassica-etymologicon-progress-v1')),null,
  'Estudio no debe escribir en el progreso');

 // Tarjetas inversas: el étimo permanece oculto hasta descubrirlo; no se repiten en una ronda.
 await page.locator('#study-inverse-toggle').click();
 assert.equal(await page.locator('#study-inverse').isVisible(),true);
 assert.equal(await page.locator('#lista-etimos').isHidden(),true);
 assert.match(await page.locator('#inverse-count').textContent(),/^1 de 484 palabras$/);
 const firstInverse=await page.locator('#inverse-word').textContent();
 assert.ok(firstInverse&&await page.locator('#inverse-definition').textContent());
 assert.equal(await page.locator('#inverse-answer').isHidden(),true);
 assert.equal(await page.locator('#inverse-answer').textContent(),'');
 assert.equal(await page.locator('#inverse-next').isDisabled(),true);
 await page.locator('#inverse-reveal').click();
 assert.equal(await page.locator('#inverse-answer').isVisible(),true);
 assert.ok(await page.locator('#inverse-answer [lang="grc"]').count()>0);
 await page.locator('#inverse-next').click();
 assert.notEqual(await page.locator('#inverse-word').textContent(),firstInverse);
 assert.equal(await page.locator('#inverse-answer').textContent(),'');
 assert.equal(await page.locator('#inverse-answer').isHidden(),true);
 await page.locator('#study-unit').selectOption({index:1});
 assert.match(await page.locator('#inverse-count').textContent(),/^1 de /);
 await page.locator('#study-inverse-toggle').click();
 assert.equal(await page.locator('#study-inverse').isHidden(),true);
 assert.equal(await page.locator('#lista-etimos').isVisible(),true);
 await page.locator('#study-unit').selectOption('all');
 assert.equal(await page.evaluate(()=>localStorage.getItem('scholaclassica-etymologicon-progress-v1')),null);
 
 // Anteriormente el acceso «Ir a practicar» conducía a la portada por error.
 assert.equal(await page.locator('a.lexicon-practice-link').getAttribute('href'),'./practicar.html');
 await page.locator('a.lexicon-practice-link').click();
 assert.match(page.url(),/\/apps\/etymologicon\/practicar\.html$/);
 await page.waitForFunction(()=>document.querySelector('#exercise-content')?.hidden===false);
 assert.equal(await page.locator('#load-error').isHidden(),true);
 assert.equal(await page.locator('#theme-select').inputValue(),'oled',
  'El tema común debe persistir entre Estudio y Práctica');
 assert.equal(await page.locator('#etymon-select option').count(),107,
  'Escritura debe ofrecer solo étimos con dos respuestas aptas');

 // Correspondencia docente fijada: proselito (falta) + prosodia (correcta) = 1,5.
 await page.locator('#etymon-select').selectOption('grc:προσ');
 await page.locator('#answer-1').fill('proselito');
 await page.locator('#answer-2').fill('prosodia');
 await page.locator('#grade-button').click();
 assert.equal(await page.locator('#results').isHidden(),false);
 assert.match(await page.locator('#result-total').textContent(),/1,5\s*\/\s*2/);
 assert.equal(await page.locator('#result-items li').count(),2);
 assert.equal(await page.locator('#stats-exercises').textContent(),'1');
 const saved=await page.evaluate(()=>{
  const value=localStorage.getItem('scholaclassica-etymologicon-progress-v1');
  return value?JSON.parse(value):null;
 });
 assert.equal(saved.schema,'etymologicon-progress/v1');
 assert.equal(saved.courses.gr1.records['grc:προσ'].attempts,1);
 assert.equal(saved.courses.gr1.records['grc:προσ'].exact,1);
 assert.equal(saved.courses.gr1.records['grc:προσ'].typo,1);
 assert.equal(saved.courses.gr1.records['grc:προσ'].lastScore,1.5);

 // Modalidades independientes: no deben desaparecer al cambiar de actividad.
 for(const [activity,section] of [
  ['cards','#flashcard-section'],['matching','#matching-section'],
  ['mcq','#mcq-section'],['inverse','#inverse-section'],
  ['decomposition','#decomposition-section']
 ]){
  await page.locator('#activity-type').selectOption(activity);
  assert.equal(await page.locator(section).isHidden(),false,
   'La actividad '+activity+' debe mostrar su área de trabajo');
 }
 await page.locator('#activity-type').selectOption('writing');
 await page.locator('#unit-select').selectOption({index:1});
 assert.equal(await page.locator('#practice-mode').inputValue(),'unit');
 await page.locator('#unit-select').selectOption('all');
 assert.equal(await page.locator('#practice-mode').inputValue(),'general');

 // Progreso local recuperable tras navegación, sin depender de la nube.
 await page.goto(base+modulePath+'estudio.html');
 await page.waitForFunction(()=>document.querySelector('#study-loading')?.hidden===true);
 const afterStudy=await page.evaluate(()=>
  JSON.parse(localStorage.getItem('scholaclassica-etymologicon-progress-v1')));
 assert.deepEqual(afterStudy,saved,'El glosario no debe modificar el progreso');
 await page.goto(base+modulePath+'practicar.html');
 await page.waitForFunction(()=>document.querySelector('#exercise-content')?.hidden===false);
 assert.equal(await page.locator('#stats-exercises').textContent(),'1');

 // PWA aislada: todos los recursos precargados deben funcionar sin red.
 await page.evaluate(()=>navigator.serviceWorker.ready);
 await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller),null,{timeout:15000});
 const cacheNames=await page.evaluate(()=>caches.keys());
 assert.ok(cacheNames.some(name=>name.startsWith('schola-etymologicon-')),
  'Etymologicon debe conservar su caché propia');
 await ctx.setOffline(true);
 response=await page.goto(base+modulePath+'estudio.html',{waitUntil:'domcontentloaded'});
 assert.equal(response.status(),200,'El glosario debe abrir sin conexión');
 await page.waitForFunction(()=>document.querySelector('#study-loading')?.hidden===true);
 assert.equal(await page.locator('#study-error').isHidden(),true);
 assert.equal(await page.locator('#study-entries details').count(),111);
 response=await page.goto(base+modulePath+'practicar.html',{waitUntil:'domcontentloaded'});
 assert.equal(response.status(),200,'La práctica debe abrir sin conexión');
 await page.waitForFunction(()=>document.querySelector('#exercise-content')?.hidden===false);
 assert.equal(await page.locator('#etymon-select option').count(),107);
 assert.equal(await page.locator('#stats-exercises').textContent(),'1');
 assert.deepEqual(pageErrors,[],'No debe haber excepciones JavaScript');

 await ctx.close();
 console.log('Etymologicon: portada, glosario, 111 étimos, corrección 1,5/2, 6 actividades, progreso y PWA offline: OK');
}finally{
 if(browser)await browser.close();
 await new Promise(ok=>server.close(ok));
}
