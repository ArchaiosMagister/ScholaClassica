import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,join,extname,sep} from 'node:path';
import {chromium} from 'playwright';
const root=resolve(import.meta.dirname,'../dist');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon'};
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
  for(const route of ['/','/apps/gramatica/index.html','/apps/gramatica/val/index.html','/apps/gramatica/curso.html?lengua=latin&curso=1&unidad=1','/apps/gramatica/curso.html?lengua=griego&curso=1&unidad=1','/apps/gramatica/val/curso.html?lengua=griego&curso=1&unidad=1']){
    const r=await page.goto(base+route,{waitUntil:'networkidle'});
    assert.equal(r.status(),200,route);
    assert.ok(await page.locator('header').count(),'Falta encabezado en '+route);
    assert.equal(errors.length,0,'Error JavaScript en '+route+': '+errors.join(' | '));
  }
  await page.goto(base+'/');
  await page.getByRole('tab',{name:'Por herramienta'}).click();
  assert.equal(await page.locator('#panel-herramientas').isVisible(),true);
  assert.equal(await page.locator('#panel-lenguas').isVisible(),false);
  await page.getByRole('tab',{name:'Por lengua'}).click();
  await page.getByRole('link',{name:'Griego I',exact:true}).click();
  assert.match(page.url(),/\/apps\/gramatica\/curso\.html\?lengua=griego/);
  console.log('OK: navegación ScholaClassica y Appendix ES/VAL en Chromium');
}finally{if(browser)await browser.close();await new Promise(ok=>server.close(ok))}
