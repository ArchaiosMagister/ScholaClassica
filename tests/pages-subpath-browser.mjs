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
  '.ico':'image/x-icon','.webmanifest':'application/manifest+json'};
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
 await page.context().setOffline(false);
 await page.locator('#study-course').selectOption('gr1');
 assert.equal(await page.locator('.path-links a').count(),3);
 await page.locator('.path-links a[data-study-tool="etymologicon"]').click();
 await page.waitForURL(/\/ScholaClassica\/apps\/etymologicon\/index\.html$/);
 const etymRegistration=await page.waitForFunction(async()=>{
   const r=await navigator.serviceWorker.getRegistration();
   return r?.active&&r.scope.includes('/apps/etymologicon/')?r.scope:null;
 },null,{timeout:18000});
 assert.ok((await etymRegistration.jsonValue()).includes('/ScholaClassica/apps/etymologicon/'));
 await page.goto(base+prefix+'apps/evolucion-fonetica/index.html',{waitUntil:'networkidle'});
 await page.waitForFunction(async()=>{
   const r=await navigator.serviceWorker.getRegistration();
   return Boolean(r?.active&&r.scope.includes('/apps/evolucion-fonetica/'));
 },null,{timeout:18000});
 assert.equal(await page.locator('#refresh-app').count(),1);
 const entries=await page.evaluate(async()=>await fetch('./data/pilot.json').then(r=>r.json()));
 assert.equal(entries.words.length,522);
 const keys=await page.evaluate(async()=>await caches.keys());
 for(const cache of ['schola-portal-','schola-etymologicon-','schola-evolutio-'])
   assert.ok(keys.some(k=>k.startsWith(cache)),cache+' no está aislada');
 assert.deepEqual(errors,[],'Errores de navegador en la subruta Pages');
 console.log('OK: subruta /ScholaClassica/, PWA raíz y Etymologicon/Evolutio aislados');
}finally{
 if(browser)await browser.close();
 await new Promise(ok=>server.close(ok));
}
