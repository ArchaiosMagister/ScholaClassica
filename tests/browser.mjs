import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,join,extname,sep} from 'node:path';
import {chromium} from 'playwright';
const root=resolve(import.meta.dirname,'../dist');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.webmanifest':'application/manifest+json'};
const server=createServer(async(req,res)=>{
  try{
    const path=new URL(req.url,'http://localhost/').pathname;
    const file=resolve(root,decodeURIComponent(path.slice(1))+(path.endsWith('/')?'index.html':''));
    if(!file.startsWith(root+sep))throw Error('Ruta fuera de directorio');
    const s=await stat(file);if(!s.isFile())throw Error('No es archivo');
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
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const route of ['/','/apps/gramatica/index.html','/apps/gramatica/val/index.html','/apps/gramatica/curso.html?lengua=latin&curso=1&unidad=1','/apps/gramatica/curso.html?lengua=griego&curso=1&unidad=1','/apps/gramatica/val/curso.html?lengua=griego&curso=1&unidad=1','/apps/etymologicon/index.html']){
    const r=await page.goto(base+route,{waitUntil:'networkidle'});
    assert.equal(r.status(),200,route);
    assert.ok(await page.locator('header').count(),'Falta encabezado en '+route);
    assert.equal(errors.length,0,'Error JavaScript en '+route+': '+errors.join(' | '));
  }
  // Etymologicon: integración funcional del motor con la pantalla y el banco filtrado.
  const etymologicon=await page.goto(base+'/apps/etymologicon/index.html',{waitUntil:'networkidle'});
  assert.equal(etymologicon.status(),200);
  await page.locator('#exercise-content').waitFor({state:'visible',timeout:12000});
  assert.equal(await page.locator('#etymon-select option').count(),108);
  assert.equal(await page.locator('#course-select option[value="gr2"]').isDisabled(),true);
  await page.locator('#etymon-select').selectOption('grc:προσ');
  assert.ok((await page.locator('#exercise-title').textContent()).includes('πρός'));
  await page.getByLabel('Primer derivado').fill('proselito');
  await page.getByLabel('Segundo derivado').fill('prosodia');
  await page.getByRole('button',{name:'Corregir respuestas'}).click();
  assert.equal((await page.locator('#result-total').textContent()).trim(),'1,5 / 2 puntos');
  assert.ok((await page.locator('#result-items').textContent()).includes('prosélito'));
  assert.ok(await page.locator('#result-items mark').count()>=2,'Las erratas deben resaltarse visualmente');
  await page.getByLabel('Primer derivado').fill('prosélito');
  assert.equal(await page.locator('#results').isHidden(),true,'Al editar no debe quedar una nota desactualizada');
  await page.getByLabel('Segundo derivado').fill('prosélito');
  await page.getByRole('button',{name:'Corregir respuestas'}).click();
  assert.equal((await page.locator('#result-total').textContent()).trim(),'1 / 2 puntos');
  assert.ok((await page.locator('#result-items').textContent()).includes('Derivado repetido'));
  assert.equal((await page.locator('#stats-exercises').textContent()).trim(),'2');
  assert.equal((await page.locator('#stats-pending').textContent()).trim(),'1');
  // Modo errores: sólo vuelve el étimo que requiere repetición.
  await page.locator('#practice-mode').selectOption('errors');
  assert.equal(await page.locator('#etymon-select option').count(),1);
  assert.equal(await page.locator('#etymon-select').inputValue(),'grc:προσ');
  await page.getByLabel('Primer derivado').fill('prosélito');
  await page.getByLabel('Segundo derivado').fill('prosodia');
  await page.getByRole('button',{name:'Corregir respuestas'}).click();
  assert.equal((await page.locator('#stats-exercises').textContent()).trim(),'3');
  assert.equal((await page.locator('#stats-pending').textContent()).trim(),'1',
    'Una repetición correcta no debe borrar inmediatamente el error anterior');
  await page.getByRole('button',{name:'Borrar respuestas'}).click();
  await page.getByLabel('Primer derivado').fill('prosélito');
  await page.getByLabel('Segundo derivado').fill('prosodia');
  await page.getByRole('button',{name:'Corregir respuestas'}).click();
  assert.equal((await page.locator('#stats-pending').textContent()).trim(),'0',
    'Dos repeticiones perfectas deben cerrar el error');
  assert.equal((await page.locator('#stats-exercises').textContent()).trim(),'4');
  await page.getByRole('button',{name:'Practicar otro étimo'}).click();
  assert.equal(await page.locator('#practice-empty').isVisible(),true);
  assert.equal(await page.locator('#answer-form').isHidden(),true);
  await page.locator('#practice-mode').selectOption('general');
  assert.equal(await page.locator('#etymon-select option').count(),108);
  // Exportación sin datos personales ni respuestas, borrado voluntario e importación.
  const pendingDownload=page.waitForEvent('download');
  await page.getByRole('button',{name:'Exportar progreso'}).click();
  const download=await pendingDownload;
  assert.match(download.suggestedFilename(),/etymologicon-progreso-.*\.json$/);
  const exported=await readFile(await download.path(),'utf8');
  const parsed=JSON.parse(exported);
  assert.equal(parsed.schema,'etymologicon-progress/v1');
  assert.equal(parsed.courses.gr1.records['grc:προσ'].attempts,4);
  assert.deepEqual(parsed.courses.gr2.records,{});
  assert.ok(!exported.includes('"submitted"'));
  page.once('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'Borrar mis estadísticas'}).click();
  assert.equal((await page.locator('#stats-exercises').textContent()).trim(),'0');
  await page.locator('#import-file').setInputFiles({
    name:'invalido.json',mimeType:'application/json',buffer:Buffer.from('{datos corruptos')
  });
  await page.waitForFunction(()=>document.querySelector('#progress-status')?.textContent.includes('Importación rechazada'),
    null,{timeout:10000});
  assert.equal((await page.locator('#stats-exercises').textContent()).trim(),'0');
  await page.locator('#import-file').setInputFiles({
    name:'progreso.json',mimeType:'application/json',buffer:Buffer.from(exported)
  });
  await page.locator('#import-preview').waitFor({state:'visible',timeout:10000});
  assert.ok((await page.locator('#import-description').textContent()).includes('4 ejercicios'));
  await page.getByRole('button',{name:'Confirmar importación'}).click();
  assert.equal((await page.locator('#stats-exercises').textContent()).trim(),'4');
  assert.equal((await page.locator('#stats-pending').textContent()).trim(),'0');
  await page.reload({waitUntil:'networkidle'});
  await page.locator('#exercise-content').waitFor({state:'visible',timeout:10000});
  assert.equal((await page.locator('#stats-exercises').textContent()).trim(),'4',
    'Las estadísticas deben sobrevivir a una recarga de la PWA');
  await page.locator('#practice-mode').selectOption('unit');
  await page.locator('#unit-select').selectOption('UD1');
  assert.ok(await page.locator('#etymon-select option').count()>0,'Filtro por unidad vacío');
  await page.locator('#practice-mode').selectOption('general');
  assert.equal(await page.locator('#etymon-select option').count(),108);
  await page.getByRole('button',{name:'Otro étimo'}).click();
  assert.equal(await page.locator('#results').isHidden(),true,'El siguiente étimo debe limpiar el resultado anterior');
  // Las tarjetas se mantienen ocultas hasta revelar la solución y su
  // autoevaluación NO altera las notas objetivas del corrector.
  await page.locator('#activity-type').selectOption('cards');
  await page.locator('#etymon-select').selectOption('grc:προσ');
  assert.equal(await page.locator('#flashcard-section').isVisible(),true);
  assert.equal(await page.locator('#flashcard-back').isHidden(),true);
  assert.equal(await page.locator('#answer-form').isHidden(),true);
  assert.equal(await page.locator('#meaning').isHidden(),true);
  await page.getByRole('button',{name:'Mostrar significado y derivados'}).click();
  assert.equal(await page.locator('#flashcard-back').isVisible(),true);
  assert.ok((await page.locator('#flashcard-derivatives').textContent()).includes('prosélito'));
  await page.getByRole('button',{name:'Necesito repasarlo'}).click();
  assert.equal((await page.locator('#stats-cards').textContent()).trim(),'1');
  assert.equal((await page.locator('#stats-cards-forgotten').textContent()).trim(),'1');
  await page.locator('#practice-mode').selectOption('errors');
  assert.equal(await page.locator('#etymon-select option').count(),1);
  await page.locator('#practice-mode').selectOption('general');
  // La relación usa derivados unívocos para los étimos mostrados.
  await page.locator('#activity-type').selectOption('matching');
  assert.equal(await page.locator('#matching-section').isVisible(),true);
  assert.equal(await page.locator('#etymon-field').isHidden(),true);
  const pairs=await page.evaluate(async()=>{
    const catalog=await fetch('./data/gr1.json').then(r=>r.json());
    const {createStudyBank}=await import('./study.mjs');
    const bank=createStudyBank(catalog);
    const spanish=[...document.querySelectorAll('#matching-spanish button')].map(x=>x.dataset.id);
    return [...document.querySelectorAll('#matching-greek button')].map(x=>({
      id:x.dataset.id,
      derivativeId:spanish.find(id=>bank.getCard(x.dataset.id).derivatives.some(d=>d.id===id))
    }));
  });
  assert.equal(pairs.length,4);
  assert.ok(pairs.every(p=>p.derivativeId));
  const greekButton=id=>page.locator('#matching-greek button[data-id="'+id+'"]');
  const spanishButton=id=>page.locator('#matching-spanish button[data-id="'+id+'"]');
  await greekButton(pairs[0].id).click();
  await spanishButton(pairs[1].derivativeId).click();
  assert.ok((await page.locator('#matching-feedback').textContent()).includes('No corresponde'));
  for(const pair of pairs){
    await greekButton(pair.id).click();
    await spanishButton(pair.derivativeId).click();
  }
  assert.ok((await page.locator('#matching-score').textContent()).includes('3 de 4 parejas'));
  assert.equal((await page.locator('#stats-pairs').textContent()).trim(),'4');
  assert.equal((await page.locator('#stats-pairs-correct').textContent()).trim(),'3');
  await page.getByRole('button',{name:'Otra ronda'}).click();
  assert.equal(await page.locator('#matching-score').isHidden(),true);
  await page.locator('#activity-type').selectOption('writing');
  assert.equal(await page.locator('#answer-form').isVisible(),true);
  assert.equal(await page.locator('#matching-section').isHidden(),true);

  await page.locator('#theme-select').selectOption('oled');
  assert.equal(await page.locator('html').getAttribute('data-theme'),'oled');
  await page.reload({waitUntil:'networkidle'});
  await page.locator('#exercise-content').waitFor({state:'visible',timeout:10000});
  assert.equal(await page.locator('html').getAttribute('data-theme'),'oled');
  await page.setViewportSize({width:390,height:844});
  const layoutFits=await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2);
  assert.equal(layoutFits,true,'La interfaz debe adaptarse a un móvil de 390 px');
  await page.setViewportSize({width:1280,height:900});
  assert.equal(errors.length,0,'Error JavaScript de Etymologicon: '+errors.join(' | '));

  // Instalación PWA: manifiesto independiente, caché delimitada y recursos
  // disponibles tras desconectar la red (incluidos banco y motor corrector).
  const manifest=await page.evaluate(async()=>{
    const link=document.querySelector('link[rel="manifest"]');
    const response=await fetch(link.href);
    return response.json();
  });
  assert.equal(manifest.scope,'./');
  assert.equal(manifest.start_url,'./index.html');
  assert.equal(manifest.display,'standalone');
  assert.ok(manifest.icons.some(x=>x.purpose==='maskable'&&x.sizes==='512x512'));
  assert.equal(await page.locator('link[rel="apple-touch-icon"]').count(),1);
  const scopeHandle=await page.waitForFunction(async()=>{
    const reg=await navigator.serviceWorker.getRegistration();
    return reg?.active&&navigator.serviceWorker.controller?reg.scope:false;
  },null,{timeout:15000});
  const etymScope=await scopeHandle.jsonValue();
  assert.ok(etymScope.endsWith('/apps/etymologicon/'),'SW debe limitarse al módulo: '+etymScope);
  const etymCaches=await page.evaluate(async()=>await caches.keys());
  assert.ok(etymCaches.some(x=>x.startsWith('schola-etymologicon-')),
    'No existe caché offline de Etymologicon');
  await page.context().setOffline(true);
  const offlinePage=await page.goto(base+'/apps/etymologicon/',{waitUntil:'load'});
  assert.equal(offlinePage.status(),200,'Etymologicon debe abrir sin conexión tras la precarga');
  await page.locator('#exercise-content').waitFor({state:'visible',timeout:12000});
  const offlineResources=await page.evaluate(async()=>{
    const urls=['./manifest.webmanifest','./icons/icon-192.png',
      './data/gr1.json','./corrector/write-two.mjs','./progress.mjs',
      './study.mjs','./activities-ui.mjs'];
    return Promise.all(urls.map(async path=>{
      const response=await fetch(path);
      return response.ok;
    }));
  });
  assert.ok(offlineResources.every(Boolean),'Un recurso esencial de Etymologicon no está disponible offline');
  await page.locator('#etymon-select').selectOption('grc:προσ');
  await page.getByLabel('Primer derivado').fill('proselito');
  await page.getByLabel('Segundo derivado').fill('prosodia');
  await page.getByRole('button',{name:'Corregir respuestas'}).click();
  assert.equal((await page.locator('#result-total').textContent()).trim(),'1,5 / 2 puntos',
    'El corrector debe funcionar íntegramente offline');
  assert.equal((await page.locator('#stats-exercises').textContent()).trim(),'5',
    'El progreso se debe registrar incluso sin conexión');
  await page.locator('#practice-mode').selectOption('unit');
  await page.locator('#unit-select').selectOption('UD1');
  assert.ok(await page.locator('#etymon-select option').count()>0,
    'El selector de unidades también debe funcionar offline');
  await page.locator('#practice-mode').selectOption('general');
  await page.locator('#activity-type').selectOption('cards');
  await page.locator('#etymon-select').selectOption('grc:προσ');
  await page.getByRole('button',{name:'Mostrar significado y derivados'}).click();
  await page.getByRole('button',{name:'Lo recordaba'}).click();
  assert.equal((await page.locator('#stats-cards').textContent()).trim(),'2');
  await page.locator('#activity-type').selectOption('matching');
  assert.equal(await page.locator('#matching-section').isVisible(),true);
  assert.equal(await page.locator('#matching-greek button').count(),4);
  // Todas las correspondencias se resuelven a partir del banco cacheado.
  const offlinePairs=await page.evaluate(async()=>{
    const catalog=await fetch('./data/gr1.json').then(r=>r.json());
    const {createStudyBank}=await import('./study.mjs');
    const bank=createStudyBank(catalog);
    const spanish=[...document.querySelectorAll('#matching-spanish button')].map(x=>x.dataset.id);
    return [...document.querySelectorAll('#matching-greek button')].map(x=>({
      id:x.dataset.id,
      derivativeId:spanish.find(id=>bank.getCard(x.dataset.id).derivatives.some(d=>d.id===id))
    }));
  });
  for(const pair of offlinePairs){
    await page.locator('#matching-greek button[data-id="'+pair.id+'"]').click();
    await page.locator('#matching-spanish button[data-id="'+pair.derivativeId+'"]').click();
  }
  assert.ok((await page.locator('#matching-score').textContent()).includes('4 de 4 parejas'));
  assert.equal((await page.locator('#stats-pairs').textContent()).trim(),'8');
  await page.locator('#activity-type').selectOption('writing');
  await page.context().setOffline(false);
  await page.getByRole('button',{name:'Buscar actualizaciones'}).click();
  await page.waitForFunction(()=>!document.querySelector('#check-update').disabled,
    null,{timeout:12000});
  assert.equal(errors.length,0,'PWA Etymologicon sin errores JS: '+errors.join(' | '));

  await page.goto(base+'/');
  await page.evaluate(async()=>{await caches.open('otra-aplicacion-no-borrar')});
  const evolutio=await page.goto(base+'/apps/evolucion-fonetica/index.html',{waitUntil:'networkidle'});
  assert.equal(evolutio.status(),200);
  await page.waitForFunction(async()=>Boolean((await navigator.serviceWorker.getRegistration())?.active),null,{timeout:12000});
  const names=await page.evaluate(async()=>await caches.keys());
  assert.ok(names.includes('otra-aplicacion-no-borrar'),'Evolutio no debe borrar las cachés de otras aplicaciones');
  assert.ok(names.some(x=>x.startsWith('schola-evolutio-')),'Falta la caché integrada de Evolutio');
  assert.ok(names.some(x=>x.startsWith('schola-etymologicon-')),
    'Evolutio no debe eliminar la caché de Etymologicon');
  assert.equal(await page.locator('#app .fatal').count(),0,'Evolutio muestra error inicial');
  await page.context().setOffline(true);
  await page.reload({waitUntil:'load'});
  await page.waitForFunction(()=>!document.querySelector('#app .loading'),null,{timeout:10000});
  assert.equal(await page.locator('#app .fatal').count(),0,'Evolutio falla sin conexión');
  await page.context().setOffline(false);
  assert.equal(errors.length,0,'Error JavaScript de Evolutio: '+errors.join(' | '));
  await page.goto(base+'/');
  await page.getByRole('tab',{name:'Por herramienta'}).click();
  assert.equal(await page.locator('#panel-herramientas').isVisible(),true);
  assert.equal(await page.locator('#panel-lenguas').isVisible(),false);
  await page.getByRole('tab',{name:'Por lengua'}).click();
  await page.getByRole('link',{name:'Griego I',exact:true}).click();
  assert.match(page.url(),/\/apps\/gramatica\/curso\.html\?lengua=griego/);
  console.log('OK: navegación ScholaClassica y Appendix ES/VAL en Chromium');
}finally{if(browser)await browser.close();await new Promise(ok=>server.close(ok))}
