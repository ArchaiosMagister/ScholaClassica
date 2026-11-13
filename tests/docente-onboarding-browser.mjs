import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,join,extname,sep} from 'node:path';
import {chromium} from 'playwright';
const root=resolve(import.meta.dirname,'../dist');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
  '.mjs':'text/javascript; charset=utf-8','.json':'application/json','.css':'text/css'};
const server=createServer(async(req,res)=>{
  try{
    const pathname=new URL(req.url,'http://127.0.0.1').pathname;
    const file=resolve(root,decodeURIComponent(pathname.slice(1))+(pathname.endsWith('/')?'index.html':''));
    if(!file.startsWith(root+sep)||!(await stat(file)).isFile())throw Error();
    res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream'});
    res.end(await readFile(file));
  }catch{res.writeHead(404);res.end('No encontrado')}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port;
let browser;
try{
  const config=JSON.parse((await readFile(join(root,'docente/auth-config.json'))).toString('utf8'));
  assert.equal(config.enabled,true);
  assert.equal(config.setupOnly,true);
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const protectedCalls=[];
  page.on('request',req=>{
    if(/\/functions\/v1\/(schola-inbox|schola-vocab-admin)/.test(req.url()))protectedCalls.push(req.url());
  });
  await page.route('**/docente/auth-config.json',route=>route.fulfill({
    status:200,contentType:'application/json',body:JSON.stringify({...config,origin:base})
  }));
  await page.goto(base+'/docente/index.html',{waitUntil:'networkidle'});
  await page.locator('#login').waitFor({state:'visible',timeout:20000});
  assert.equal(await page.locator('#username').inputValue(),'');
  assert.equal(await page.locator('#teacher').isVisible(),false);
  assert.equal(await page.locator('#ready').isVisible(),false);
  assert.equal(await page.evaluate(()=>typeof window.supabase?.createClient),'function');
  assert.deepEqual(protectedCalls,[]);
  assert.deepEqual(errors,[]);
  console.log('OK: inicio de sesión renderizado con SDK real, sin exponer bandeja ni usuario');
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve))}
