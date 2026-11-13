import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,join,extname,sep} from 'node:path';
import {chromium} from 'playwright';
const root=resolve(import.meta.dirname,'../dist');
const prefix='/ScholaClassica/';
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
  '.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8',
  '.json':'application/json','.png':'image/png'};
const server=createServer(async(req,res)=>{
 try{
   const url=new URL(req.url,'http://localhost'),pathname=url.pathname;
   if(!pathname.startsWith(prefix))throw Error('No es el proyecto Pages');
   const file=resolve(root,decodeURIComponent(pathname.slice(prefix.length))+
     (pathname.endsWith('/')?'index.html':''));
   if(!file.startsWith(root+sep)||(await stat(file)).isFile()===false)throw Error('Fuera de sitio');
   res.setHeader('content-type',mime[extname(file)]||'application/octet-stream');
   res.writeHead(200);res.end(await readFile(file));
 }catch{res.writeHead(404);res.end('Not found')}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const base='http://127.0.0.1:'+server.address().port;
const app=base+prefix+'apps/morfologia/';
let browser;
try{
 browser=await chromium.launch({headless:true});
 const page=await browser.newPage();
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 const result=await page.goto(app+'index.html?subject=gr1',{waitUntil:'networkidle'});
 assert.equal(result.status(),200);
 assert.equal(await page.locator('#subject').inputValue(),'griego');
 assert.deepEqual(await page.locator('#unit option').allTextContents(),['UD1','UD2','UD3']);
 await page.locator('#unit').selectOption('3');
 await page.locator('#kind').selectOption('artículo');
 await page.locator('#activity').selectOption('analysis');
 await page.locator('#start').click();
 assert.equal(await page.locator('#answers button').count(),4);
 assert.ok(await page.locator('#session').isVisible());
 assert.ok(await page.locator('#expression').isVisible());
 await page.locator('#answers button').first().click();
 assert.ok(await page.locator('#feedback').isVisible());
 assert.ok((await page.locator('#feedback').textContent()).includes('Solución:'));
 assert.ok((await page.locator('#source').getAttribute('href')).includes('unidad=3'));
 assert.equal(await page.locator('#answers button:disabled').count(),4);
 await page.locator('#next').click();
 assert.ok(await page.locator('#session').isVisible());
 await page.locator('#new').click();
 assert.equal(await page.locator('#session').isVisible(),false);
 await page.waitForFunction(async()=>{
   const registrations=await navigator.serviceWorker.getRegistrations();
   return registrations.some(r=>r.active&&r.scope.endsWith('/ScholaClassica/apps/morfologia/'));
 },null,{timeout:15000});
 const keys=await page.evaluate(async()=>await caches.keys());
 assert.ok(keys.some(x=>x.startsWith('schola-morphology-')));
 await page.context().setOffline(true);
 const offline=await page.goto(app+'index.html?subject=lat1',{waitUntil:'load'});
 assert.equal(offline.status(),200);
 await page.waitForFunction(()=>!document.querySelector('#start').disabled,{timeout:10000});
 assert.equal(await page.locator('#subject').inputValue(),'latin');
 assert.deepEqual(await page.locator('#unit option').allTextContents(),['UD1','UD2']);
 await page.locator('#unit').selectOption('2');
 await page.locator('#kind').selectOption('verbo');
 await page.locator('#activity').selectOption('form');
 await page.locator('#start').click();
 assert.equal(await page.locator('#answers button').count(),4);
 const found=await page.evaluate(async()=>{
   const data=await fetch('./data/paradigmas.json').then(r=>r.json());
   return {paradigms:data.records.length,latin:data.coverage.latin,greek:data.coverage.griego};
 });
 assert.equal(found.paradigms,20);
 assert.deepEqual(found.latin,[1,2]);assert.deepEqual(found.greek,[1,2,3]);
 await page.context().setOffline(false);
 assert.deepEqual(errors,[]);
 console.log('OK: morfología por curso/UD, sincretismo y caché offline propia en GitHub Pages');
}finally{
 if(browser)await browser.close();
 await new Promise(done=>server.close(done));
}
