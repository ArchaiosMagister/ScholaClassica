// Diagnóstico extremo a extremo de los cinco tipos de ejercicios de Vocabula
// en las cuatro materias y los tres corpus, incluyendo navegación móvil.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright';

const root=resolve(import.meta.dirname,'../dist');
const prefix='/ScholaClassica/';
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.css':'text/css','.json':'application/json','.ico':'image/x-icon',
 '.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
const server=createServer(async(req,res)=>{
 try{
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(!pathname.startsWith(prefix))throw Error('Ruta fuera del sitio');
  const rel=decodeURIComponent(pathname.slice(prefix.length));
  const file=resolve(root,rel+(pathname.endsWith('/')?'index.html':''));
  if(!file.startsWith(root+sep))throw Error('Fuera de dist');
  if(!(await stat(file)).isFile())throw Error('Archivo no encontrado');
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream'});
  res.end(await readFile(file));
 }catch{res.writeHead(404);res.end('Not found')}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
let browser;
try{
 browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844}});
 const errors=[],api=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('console',msg=>{if(msg.type()==='error')errors.push('console: '+msg.text())});
 await page.route('**/functions/v1/vocabulary',async route=>{
  const request=JSON.parse(route.request().postData()||'{}');
  api.push(request.action);
  await route.fulfill({status:200,contentType:'application/json',
   body:JSON.stringify(request.action==='public_words'?{words:[]}:{ok:true})});
 });
 const base='http://127.0.0.1:'+server.address().port+prefix;
 const response=await page.goto(base+'apps/vocabulario/index.html?subject=lat1',{waitUntil:'load'});
 assert.equal(response.status(),200);
 await page.waitForFunction(()=>document.querySelector('#cloud-status')?.textContent.includes('Vocabulario actualizado'));
 let checked=0;
 for(const subject of ['lat1','lat2','lat4','gr1']){
  await page.locator('#subject').selectOption(subject);
  for(const corpus of ['general','examen','all']){
   await page.locator('#corpus').selectOption(corpus);
   await page.locator('#errors').uncheck();
   await page.locator('#all').click();
   const available=Number((await page.locator('#available').textContent()).match(/^\d+/)?.[0]||0);
   assert.ok(available>0,subject+'/'+corpus+' no tiene banco elegible');
   assert.equal(await page.locator('#start').isEnabled(),true,subject+'/'+corpus+' ha desactivado Iniciar');
   await page.locator('#length').selectOption('10');
   for(const activity of ['cards','choice','write','inverse','random']){
    await page.locator('#activity').selectOption(activity);
    await page.locator('#start').click();
    const title=await page.locator('#practice .topline').textContent();
    assert.match(title,/Tarjetas|Opción múltiple|Traducción escrita|Traducción inversa/,
     subject+'/'+corpus+'/'+activity+' no genera');
    assert.equal(await page.locator('#practice .word').count(),1);
    assert.match(await page.locator('#practice .topline').textContent(),/1 \/ 10/);
    assert.ok(await page.locator('#practice .word').textContent());
    const kind=await page.evaluate(()=>session.kind);
    if(kind==='cards')await page.locator('#reveal').click();
    else if(kind==='choice')assert.ok(await page.locator('#answerarea button').count()>0);
    else assert.equal(await page.locator('#answer').count(),1);
    checked++;
   }
  }
 }
 // La falta de selección no debe fingir una sesión ni bloquear futuros intentos.
 await page.locator('#none').click();
 assert.equal(await page.locator('#start').isDisabled(),true);
 await page.locator('#all').click();
 assert.equal(await page.locator('#start').isEnabled(),true);
 await page.locator('#activity').selectOption('cards');
 await page.locator('#start').click();
 assert.equal(await page.locator('#practice .word').count(),1);
 assert.deepEqual(errors,[],'Errores JavaScript durante generación');
 assert.equal(checked,60);
 console.log('OK: 60 combinaciones de asignatura, corpus y actividad generan ejercicios en pantalla móvil, y la selección se recupera.');
}finally{
 if(browser)await browser.close();
 await new Promise(done=>server.close(done));
}
