// Navegador real con SDK empacado: comprueba que aparece el acceso inicial.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,join,extname,sep} from 'node:path';
import {chromium} from 'playwright';
const root=resolve(import.meta.dirname,'../dist');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json','.css':'text/css'};
const server=createServer(async(req,res)=>{
  try{
    const path=new URL(req.url,'http://localhost').pathname;
    const file=resolve(root,decodeURIComponent(path.slice(1))+(path.endsWith('/')?'index.html':''));
    if(!file.startsWith(root+sep)||!(await stat(file)).isFile())throw Error('Fuera de directorio');
    res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream'});
    res.end(await readFile(file));
  }catch{res.writeHead(404);res.end('No encontrado')}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port;
let browser;
try{
  const actual=JSON.parse(await readFile(join(root,'docente/auth-config.json'),'utf8'));
  assert.equal(actual.setupOnly,process.env.SCHOLA_DOCENTE_INBOX!=='confirmed');
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.route('**/docente/auth-config.json',route=>route.fulfill({
    status:200,contentType:'application/json',
    body:JSON.stringify({...actual,origin:base})
  }));
  const response=await page.goto(base+'/docente/index.html',{waitUntil:'networkidle'});
  assert.equal(response.status(),200);
  await page.locator('#login').waitFor({state:'visible'});
  assert.equal(await page.locator('#username').inputValue(),'');
  assert.equal(await page.locator('#teacher').isVisible(),false);
  assert.equal(await page.locator('#ready').isVisible(),false);
  assert.equal(await page.evaluate(()=>typeof window.supabase?.createClient),'function');
  assert.equal(errors.length,0,errors.join(';'));
  console.log('Alta inicial TOTP: SDK real y formulario listo en navegador');
}finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
