// Comprueba el traspaso reversible entre DOS instalaciones aisladas de gramática.
// La web antigua incorporó gramatica-progreso.js tras fijar vendor/vocabula;
// el script vigente en esa web coincide byte a byte con grammar-progress-client.js
// (Git blob cc6e010ac002aa69f7e3ca2dc8a1657926368ebb). La inyección aquí
// reproduce el script real SIN editar el snapshot ni depender de la red.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,join,sep,extname} from 'node:path';
import {chromium} from 'playwright';

const root=resolve(import.meta.dirname,'..');
const routes=[
 {prefix:'/VocabulaLatinaGraecaque/',folder:join(root,'vendor/vocabula')},
 {prefix:'/ScholaClassica/apps/repaso-gramatica/',folder:join(root,'dist/apps/repaso-gramatica')}
];
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.json':'application/json','.css':'text/css','.svg':'image/svg+xml',
 '.webmanifest':'application/manifest+json','.png':'image/png'};
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost'),route=routes.find(r=>url.pathname.startsWith(r.prefix));
  if(!route)throw Error('Ruta fuera de los módulos');
  const tail=decodeURIComponent(url.pathname.slice(route.prefix.length))||'index.html';
  let file=resolve(route.folder,tail);
  if(file!==route.folder&&!file.startsWith(route.folder+sep))throw Error('Ruta fuera del directorio');
  let content;
  if(route.prefix==='/VocabulaLatinaGraecaque/'&&tail==='gramatica-progreso.js'){
   content=await readFile(join(root,'scripts/grammar-progress-client.js'));
  }else{
   if(!(await stat(file)).isFile())throw Error('Archivo ausente');
   content=await readFile(file);
   if(route.prefix==='/VocabulaLatinaGraecaque/'&&tail==='gramatica.html'){
    const original=content.toString('utf8');
    assert.ok(!original.includes('gramatica-progreso.js'),'Snapshot legado no debe mutarse');
    content=Buffer.from(original.replace('</head>','<script src="gramatica-progreso.js" defer></script></head>'));
   }
  }
  res.writeHead(200,{'content-type':mime[extname(tail)]||'application/octet-stream'});
  res.end(content);
 }catch(error){res.writeHead(404);res.end('Not found');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port;
const legacyUrl=origin+'/VocabulaLatinaGraecaque/gramatica.html';
const integratedUrl=origin+'/ScholaClassica/apps/repaso-gramatica/index.html?subject=lat1';
const KEY='classics-grammar-v1',VOCAB='classics-progress-v1';
let browser;
try{
 browser=await chromium.launch({headless:true});
 const oldContext=await browser.newContext({acceptDownloads:true});
 const newContext=await browser.newContext({acceptDownloads:true});
 const old=await oldContext.newPage(),next=await newContext.newPage();
 const errors=[];
 for(const page of [old,next])page.on('pageerror',e=>errors.push(e.message));
 assert.equal((await old.goto(legacyUrl,{waitUntil:'load'})).status(),200);
 await old.waitForFunction(()=>window.GrammarPracticeDebug&&window.GrammarProgressTransfer);
 assert.equal(await old.locator('#subject').inputValue(),'lat1');
 assert.equal(await old.locator('#grammar-progress-export').count(),1);
 // Una sesión real antigua: la ficha concept-i debe mantener el mismo ID al migrar.
 await old.locator('#category').selectOption('Sintaxis');
 await old.locator('#none').click();
 await old.locator('#units input[value="UD 2"]').check();
 await old.waitForFunction(()=>!document.querySelector('#start').disabled);
 await old.locator('#start').click();
 const legacyQ=await old.evaluate(()=>GrammarPracticeDebug.currentQuestion());
 assert.equal(legacyQ.category,'Sintaxis');
 assert.equal(legacyQ.unit,'UD 2');
 assert.match(legacyQ.id,/^lat1\|UD 2\|concept-\d+$/);
 await old.locator('#grammar-answer button').filter({hasText:legacyQ.answer}).first().click();
 const before=await old.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);
 assert.deepEqual(before[legacyQ.id],{total:1,right:1,failed:false});
 // Vocabulario tiene otra clave y no debe tocarse ni siquiera al transferir.
 await old.evaluate(key=>localStorage.setItem(key,JSON.stringify({preservar:true})),VOCAB);
 await old.locator('#grammar-progress-tools summary').click();
 const exportOld=old.waitForEvent('download');
 await old.locator('#grammar-progress-export').click();
 const oldDownload=await exportOld;
 const oldPayload=JSON.parse((await readFile(await oldDownload.path())).toString('utf8'));
 assert.equal(oldPayload.schema,'schola-grammar-progress/v1');
 assert.equal(oldPayload.kind,'grammar');
 assert.equal(oldPayload.storageKey,KEY);
 assert.deepEqual(oldPayload.progress,before);

 // La nueva instalación se inicia vacía; el historial no se comparte por URL.
 assert.equal((await next.goto(integratedUrl,{waitUntil:'load'})).status(),200);
 await next.waitForFunction(()=>window.GrammarPracticeDebug&&window.GrammarProgressTransfer);
 assert.equal(await next.evaluate(key=>localStorage.getItem(key),KEY),null);
 await next.locator('#grammar-progress-tools summary').click();
 const firstReload=next.waitForEvent('load',{timeout:15000});
 await next.locator('#grammar-progress-import').setInputFiles({
  name:'progreso-gramatica.json',mimeType:'application/json',
  buffer:Buffer.from(JSON.stringify(oldPayload))
 });
 await firstReload;
 await next.waitForFunction(id=>{
  const raw=localStorage.getItem('classics-grammar-v1');
  return raw&&JSON.parse(raw)[id]?.right===1;
 },legacyQ.id);
 assert.deepEqual(await next.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY),before);
 assert.equal(await next.evaluate(key=>localStorage.getItem(key),VOCAB),null);
 // El lote nuevo se reconoce por un ID posterior a 119, sin desplazar el antiguo.
 await next.locator('#subject').selectOption('lat1');
 await next.locator('#category').selectOption('Sintaxis');
 await next.locator('#none').click();
 await next.locator('#units input[value="UD 4"]').check();
 await next.locator('#length').selectOption('all');
 await next.waitForFunction(()=>!document.querySelector('#start').disabled);
 await next.locator('#start').click();
 const newIDs=[];
 for(let i=0;i<4;i++){
  const q=await next.evaluate(()=>GrammarPracticeDebug.currentQuestion());
  newIDs.push(q.id);
  await next.locator('#grammar-answer button').filter({hasText:q.answer}).first().click();
  if(i<3)await next.locator('#grammar-next-btn').click();
 }
 assert.ok(newIDs.includes('lat1|UD 4|concept-122'));
 assert.ok(newIDs.includes('lat1|UD 4|concept-123'));
 const both=await next.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);
 assert.deepEqual(both[legacyQ.id],before[legacyQ.id]);
 const exportNew=next.waitForEvent('download');
 await next.locator('#grammar-progress-export').click();
 const nextDownload=await exportNew;
 const payload=JSON.parse((await readFile(await nextDownload.path())).toString('utf8'));
 assert.deepEqual(payload.progress,both);
 // La antigua acepta IDs nuevos al importar sin inventar preguntas ni perder historial.
 const oldReload=old.waitForEvent('load',{timeout:15000});
 await old.locator('#grammar-progress-import').setInputFiles({
  name:'progreso-gramatica.json',mimeType:'application/json',
  buffer:Buffer.from(JSON.stringify(payload))
 });
 await oldReload;
 await old.waitForFunction(()=>JSON.parse(localStorage.getItem('classics-grammar-v1')||'{}')['lat1|UD 4|concept-122']?.right===1);
 assert.deepEqual(await old.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY),both);
 assert.deepEqual(await old.evaluate(key=>JSON.parse(localStorage.getItem(key)),VOCAB),{preservar:true});
 // Reimportar no duplica y un archivo de vocabulario no altera la gramática.
 const repeatReload=next.waitForEvent('load',{timeout:15000});
 await next.locator('#grammar-progress-import').setInputFiles({
  name:'progreso-gramatica.json',mimeType:'application/json',
  buffer:Buffer.from(JSON.stringify(payload))
 });
 await repeatReload;
 await next.waitForFunction(()=>document.querySelector('#grammar-progress-status')?.textContent.includes('Historial importado'));
 assert.deepEqual(await next.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY),both);
 await next.locator('#grammar-progress-import').setInputFiles({
  name:'progreso-vocabulario.json',mimeType:'application/json',
  buffer:Buffer.from(JSON.stringify({version:1,progress:{}}))
 });
 await next.waitForFunction(()=>document.querySelector('#grammar-progress-status')?.textContent.includes('No se ha importado nada'));
 assert.deepEqual(await next.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY),both);
 assert.deepEqual(errors,[],'Errores del navegador en la migración');
 console.log('Repaso: dos instalaciones aisladas, práctica real, JSON antiguo->nuevo->antiguo, IDs 0…143 e historial preservados.');
 await oldContext.close();await newContext.close();
}finally{
 await browser?.close();
 await new Promise(ok=>server.close(ok));
}
