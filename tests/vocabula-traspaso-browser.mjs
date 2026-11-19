// Prueba de migración con DOS contextos independientes: Vocabula clásico -> ScholaClassica.
// Simula instalaciones PWA/iOS separadas: el progreso solo viaja en JSON exportado.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,join,sep,extname} from 'node:path';
import {chromium} from 'playwright';

const root=resolve(import.meta.dirname,'..');
const routes=[
 {prefix:'/VocabulaLatinaGraecaque/',directory:join(root,'vendor/vocabula')},
 {prefix:'/ScholaClassica/apps/vocabulario/',directory:join(root,'dist/apps/vocabulario')}
];
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.css':'text/css','.png':'image/png','.ico':'image/x-icon','.svg':'image/svg+xml',
 '.json':'application/json','.webmanifest':'application/manifest+json'};
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  const mapping=routes.find(x=>url.pathname.startsWith(x.prefix));
  if(!mapping)throw Error('Ruta desconocida');
  const tail=decodeURIComponent(url.pathname.slice(mapping.prefix.length))||'index.html';
  const file=resolve(mapping.directory,tail);
  if(!file.startsWith(mapping.directory+sep)&&file!==join(mapping.directory,'index.html'))
   throw Error('Ruta fuera de la aplicación');
  if(!(await stat(file)).isFile())throw Error('No existe');
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream'});
  res.end(await readFile(file));
 }catch{res.writeHead(404);res.end('Not found')}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const base='http://127.0.0.1:'+server.address().port;
let browser;
const errors=[];
try{
 browser=await chromium.launch({headless:true});
 const legacyContext=await browser.newContext({acceptDownloads:true});
 const scholaContext=await browser.newContext({acceptDownloads:true});
 const legacy=await legacyContext.newPage(),integrated=await scholaContext.newPage();
 for(const page of [legacy,integrated]){
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/functions/v1/vocabulary',async route=>{
   const request=JSON.parse(route.request().postData()||'{}');
   assert.ok(['public_words','report'].includes(request.action));
   await route.fulfill({status:200,contentType:'application/json',
     body:JSON.stringify(request.action==='public_words'?{words:[]}:{ok:true})});
  });
 }
 const old=await legacy.goto(base+'/VocabulaLatinaGraecaque/index.html',{waitUntil:'load'});
 assert.equal(old.status(),200);
 await legacy.waitForFunction(()=>document.querySelector('#cloud-status')?.textContent.includes('Vocabulario actualizado'));
 await legacy.locator('#subject').selectOption('lat1');
 await legacy.locator('#corpus').selectOption('general');
 await legacy.locator('#units input').first().check();
 await legacy.locator('#activity').selectOption('cards');
 await legacy.locator('#start').click();
 await legacy.locator('#reveal').click();
 await legacy.locator('#yes').click();
 const oldProgress=await legacy.evaluate(()=>JSON.parse(localStorage.getItem('classics-progress-v1')||'{}'));
 assert.equal(Object.keys(oldProgress).length,1,'La práctica antigua no guardó una respuesta');
 const [id,values]=Object.entries(oldProgress)[0];
 assert.deepEqual(values,{total:1,right:1,failed:false});
 const oldForm=await legacy.evaluate(id=>VOCAB.find(e=>e.id===id)?.form,id);
 assert.ok(oldForm);
 // El archivo debe salir del propio botón antiguo, no fabricarse artificialmente.
 await legacy.locator('details.help').first().locator('summary').click();
 await legacy.evaluate(()=>{
  const create=URL.createObjectURL.bind(URL);
  URL.createObjectURL=blob=>{window.__legacyProgressBlob=blob;return create(blob)};
 });
 await legacy.locator('#export').click();
 const exported=await legacy.evaluate(async()=>JSON.parse(await window.__legacyProgressBlob.text()));
 assert.deepEqual(exported,{version:1,progress:oldProgress});
 const payload=Buffer.from(JSON.stringify(exported));

 const newer=await integrated.goto(base+'/ScholaClassica/apps/vocabulario/index.html?subject=lat1',{waitUntil:'load'});
 assert.equal(newer.status(),200);
 await integrated.waitForFunction(()=>document.querySelector('#cloud-status')?.textContent.includes('Vocabulario actualizado'));
 assert.equal(await integrated.evaluate(()=>localStorage.getItem('classics-progress-v1')),null,
  'Contextos distintos deben comenzar sin traspaso automático');
 assert.equal(await integrated.evaluate(id=>VOCAB.find(e=>e.id===id)?.form,id),oldForm,
  'La ficha del origen debe conservar su ID y enunciado tras integrarse');
 await integrated.locator('details.help').first().locator('summary').click();
 await integrated.locator('#import').setInputFiles({
  name:'progreso-vocabulario.json',mimeType:'application/json',buffer:payload
 });
 await integrated.waitForFunction(()=>document.querySelector('#storage')?.textContent==='Progreso importado.');
 assert.deepEqual(await integrated.evaluate(()=>JSON.parse(localStorage.getItem('classics-progress-v1'))),
  oldProgress,'No se trasladó exactamente el historial mediante el archivo antiguo');
 assert.equal(await integrated.locator('#learned').textContent(),'1',
  'La estadística de la materia debe reconocer el intento anterior');
 await integrated.locator('#corpus').selectOption('all');
 assert.equal(await integrated.locator('#learned').textContent(),'1',
  'La vista Todo debe reconocer el historial importado sin duplicarlo');

 // Los archivos corruptos se rechazan SIN alterar el progreso ya importado.
 await integrated.locator('#import').setInputFiles({
  name:'progreso-invalido.json',mimeType:'application/json',
  buffer:Buffer.from(JSON.stringify({version:1,progress:{
    'id-inexistente':{total:9,right:9,failed:false}
  }}))
 });
 await integrated.waitForFunction(()=>document.querySelector('#storage')?.textContent.includes('Archivo no válido'));
 assert.deepEqual(await integrated.evaluate(()=>JSON.parse(localStorage.getItem('classics-progress-v1'))),
  oldProgress,'Importación inválida borró historial');

 // Exportación nueva puede abrirse en otra instalación del programa antiguo.
 await integrated.evaluate(()=>{
  const create=URL.createObjectURL.bind(URL);
  URL.createObjectURL=blob=>{window.__scholaProgressBlob=blob;return create(blob)};
 });
 await integrated.locator('#export').click();
 const reverse=await integrated.evaluate(async()=>JSON.parse(await window.__scholaProgressBlob.text()));
 assert.deepEqual(reverse,exported,'La exportación integrada ya no respeta el contrato original');
 await legacy.evaluate(()=>localStorage.setItem('classics-progress-v1','{}'));
 await legacy.reload({waitUntil:'load'});
 await legacy.locator('details.help').first().locator('summary').click();
 await legacy.locator('#import').setInputFiles({
  name:'progreso-vocabulario.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(reverse))
 });
 await legacy.waitForFunction(()=>document.querySelector('#storage')?.textContent==='Progreso importado.');
 assert.deepEqual(await legacy.evaluate(()=>JSON.parse(localStorage.getItem('classics-progress-v1'))),
  oldProgress,'La instalación antigua no puede recuperar la exportación de ScholaClassica');
 assert.deepEqual(errors,[],'Errores JS durante el traspaso');
 console.log('Vocabula: 2 instalaciones aisladas, práctica real, JSON antiguo/nuevo, importación reversible, IDs y progreso sin regresiones.');
}finally{
 if(browser)await browser.close();
 await new Promise(done=>server.close(done));
}
