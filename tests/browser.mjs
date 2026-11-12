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
  await page.locator('#unit-select').selectOption('UD1');
  assert.ok(await page.locator('#etymon-select option').count()>0,'Filtro por unidad vacío');
  await page.locator('#unit-select').selectOption('all');
  assert.equal(await page.locator('#etymon-select option').count(),108);
  await page.getByRole('button',{name:'Otro étimo'}).click();
  assert.equal(await page.locator('#results').isHidden(),true,'El siguiente étimo debe limpiar el resultado anterior');
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
      './data/gr1.json','./corrector/write-two.mjs'];
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
  await page.locator('#unit-select').selectOption('UD1');
  assert.ok(await page.locator('#etymon-select option').count()>0,
    'El selector de unidades también debe funcionar offline');
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
