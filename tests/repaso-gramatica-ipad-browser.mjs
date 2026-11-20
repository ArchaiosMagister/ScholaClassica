// Ensayos de interfaz táctil a dimensiones iPad con motores Chromium/WebKit.
// WebKit Linux simula parte de Safari: no equivale a Safari real en iPadOS.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium,webkit} from 'playwright';

const root=resolve(import.meta.dirname,'../dist');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.css':'text/css; charset=utf-8','.json':'application/json',
 '.webmanifest':'application/manifest+json','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
 try{
  const path=new URL(req.url,'http://localhost').pathname;
  const file=resolve(root,decodeURIComponent(path.slice(1))+(path.endsWith('/')?'index.html':''));
  if(!file.startsWith(root+sep))throw Error('Ruta no permitida');
  if(!(await stat(file)).isFile())throw Error('Ruta no disponible');
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream'});
  res.end(await readFile(file));
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url='http://127.0.0.1:'+server.address().port+'/apps/repaso-gramatica/index.html';

const devices=[
 {label:'iPad mini vertical',width:744,height:1133,subject:'lat4',unit:'UD 1',theme:'light'},
 {label:'iPad Air vertical',width:820,height:1180,subject:'gr1',unit:'UD 9',theme:'dark'},
 {label:'iPad Air horizontal',width:1180,height:820,subject:'lat1',unit:'UD 8',theme:'light'},
 {label:'iPad Pro vertical',width:1024,height:1366,subject:'gr1',unit:'UD 10',theme:'light'},
 {label:'iPad Pro horizontal',width:1366,height:1024,subject:'lat4',unit:'UD 8',theme:'dark'}
];
const getLayout=()=>({
 viewport:document.documentElement.clientWidth,
 width:document.documentElement.scrollWidth,
 innerWidth:window.innerWidth,
 objects:Object.fromEntries(['header','main','.layout','.panel','.practice','.grammar-choices','.grammar-question']
  .map(sel=>{
   const e=document.querySelector(sel),r=e?.getBoundingClientRect();
   return [sel,r?{x:Math.round(r.x),right:Math.round(r.right),w:Math.round(r.width)}:null];
  })),
 touches:Object.fromEntries(['#none','#all','#start','#units label','.grammar-choices button','.grammar-help summary']
  .map(sel=>{
   const e=document.querySelector(sel),r=e?.getBoundingClientRect();
   return [sel,r?{width:Math.round(r.width),height:Math.round(r.height)}:null];
  }))
});
let browsers=[];
try{
 for(const [engine,type] of [['Chromium',chromium],['WebKit',webkit]]){
  const browser=await type.launch({headless:true});
  browsers.push(browser);
  const cases=engine==='WebKit'?devices.slice(0,3):devices;
  for(const d of cases){
   const context=await browser.newContext({
    viewport:{width:d.width,height:d.height},
    deviceScaleFactor:2,
    isMobile:true,
    hasTouch:true,
    locale:'es-ES',
    acceptDownloads:true
   });
   const page=await context.newPage(),errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   const response=await page.goto(url+'?subject='+d.subject,{waitUntil:'load'});
   assert.equal(response.status(),200,engine+' '+d.label);
   await page.waitForFunction(()=>window.GrammarPracticeDebug&&window.GrammarProgressTransfer);
   assert.equal(await page.locator('#subject').inputValue(),d.subject);
   assert.equal(await page.locator('#category').inputValue(),'Sintaxis');
   const tallies=await page.evaluate(()=>({
    syntax:GrammarPracticeDebug.exercises.filter(q=>q.category==='Sintaxis').length,
    key:GrammarProgressTransfer.KEY
   }));
   assert.deepEqual(tallies,{syntax:87,key:'classics-grammar-v1'});
   await page.locator('#theme-select').selectOption(d.theme);
   await page.locator('#none').tap();
   await page.locator('#units label').filter({hasText:d.unit}).tap();
   assert.deepEqual(await page.locator('#units input:checked').evaluateAll(nodes=>nodes.map(x=>x.value)),[d.unit]);
   const before=await page.evaluate(getLayout);
   assert.ok(before.width<=d.width+1,engine+' '+d.label+' pantalla de configuración: '+JSON.stringify(before));
   await page.locator('#start').tap();
   const q=await page.evaluate(()=>GrammarPracticeDebug.currentQuestion());
   assert.ok(q&&q.subject===d.subject&&q.unit===d.unit&&q.category==='Sintaxis',engine+' '+d.label);
   const after=await page.evaluate(getLayout);
   assert.ok(after.width<=d.width+1,engine+' '+d.label+' tarjeta de preguntas: '+JSON.stringify(after));
   for(const sel of ['#none','#all','#units label','.grammar-choices button','.grammar-help summary']){
    const hit=after.touches[sel];
    assert.ok(hit&&hit.height>=44,engine+' '+d.label+' control táctil pequeño '+sel+' '+JSON.stringify(after));
   }
   await page.locator('#grammar-answer button').filter({hasText:q.answer}).first().tap();
   assert.match(await page.locator('#grammar-feedback').textContent(),/Correcto/,engine+' '+d.label);
   const result=await page.evaluate(id=>JSON.parse(localStorage.getItem('classics-grammar-v1'))?.[id],q.id);
   assert.equal(result?.right,1,engine+' '+d.label+' progreso no guardado');
   assert.equal(await page.evaluate(()=>localStorage.getItem('classics-progress-v1')),null,
    'Vocabulario no debe compartir almacenamiento');
   if(engine==='Chromium'&&d.width===744){
    await page.waitForFunction(async()=>{
     const r=await navigator.serviceWorker.getRegistration();
     return Boolean(r?.active);
    },null,{timeout:20000});
    await page.reload({waitUntil:'load'});
    await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller),null,{timeout:12000});
    const caches=await page.evaluate(async()=>caches.keys());
    assert.ok(caches.some(x=>x.startsWith('schola-repaso-gramatica-')));
    await context.setOffline(true);
    const offline=await page.reload({waitUntil:'load',timeout:20000});
    assert.equal(offline.status(),200,'La PWA de repaso debe funcionar sin conexión');
    await page.waitForFunction(()=>Boolean(window.GrammarPracticeDebug));
    assert.equal(await page.evaluate(id=>JSON.parse(localStorage.getItem('classics-grammar-v1'))?.[id]?.right,q.id),1,
     'No se debe perder el progreso al reabrir la PWA offline');
    assert.equal(await page.locator('#category').inputValue(),'Sintaxis');
    await context.setOffline(false);
   }
   assert.deepEqual(errors,[],engine+' '+d.label+' errores de navegador');
   console.log('iPad '+engine+' '+d.label+': sin desbordamiento, pulsación táctil, autocorrección y progreso; PWA offline cuando procede.');
   await context.close();
  }
 }
}finally{
 await Promise.allSettled(browsers.map(x=>x.close()));
 await new Promise(resolve=>server.close(resolve));
}
