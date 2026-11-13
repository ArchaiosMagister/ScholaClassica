import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright';
const root=resolve(import.meta.dirname,'../dist');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon'};
const server=createServer(async(req,res)=>{
  try{
    const path=new URL(req.url,'http://localhost').pathname;
    const file=resolve(root,decodeURIComponent(path.slice(1))+(path.endsWith('/')?'index.html':''));
    if(!file.startsWith(root+sep))throw Error('Fuera de ruta');
    const info=await stat(file);if(!info.isFile())throw Error('No existe');
    res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream'});
    res.end(await readFile(file));
  }catch{res.writeHead(404);res.end('Not found')}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
let browser;
try{
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage();
  const errors=[],requests=[];
  page.on('pageerror',err=>errors.push(err.message));
  await page.route('**/functions/v1/vocabulary',async route=>{
    const payload=JSON.parse(route.request().postData()||'{}');
    requests.push(payload.action);
    assert.ok(['public_words','report'].includes(payload.action),
      'Solo se permiten vocabulario y avisos estudiantiles');
    await route.fulfill({status:200,contentType:'application/json',
      body:JSON.stringify(payload.action==='public_words'?{words:[]}:{ok:true})});
  });
  const base='http://127.0.0.1:'+server.address().port;
  let response=await page.goto(base+'/apps/vocabulario/index.html?subject=gr1',{waitUntil:'load'});
  assert.equal(response.status(),200);
  await page.waitForFunction(()=>document.querySelector('#cloud-status')?.textContent.includes('Vocabulario actualizado'));
  assert.equal(await page.locator('#subject').inputValue(),'gr1');
  assert.equal(await page.locator('#units input:checked').count(),0);
  assert.equal(await page.locator('#start').isDisabled(),true);
  await page.locator('#units input').first().check();
  assert.equal(await page.locator('#start').isEnabled(),true);
  await page.locator('#activity').selectOption('choice');
  await page.locator('#start').click();
  assert.ok((await page.locator('#practice').textContent()).length>20);
  await page.locator('#subject').selectOption('lat1');
  assert.equal(await page.locator('#units input:checked').count(),0);
  await page.locator('#units input').first().check();
  assert.equal(await page.locator('#start').isEnabled(),true);
  await page.locator('#activity').selectOption('cards');
  await page.locator('#start').click();
  assert.ok((await page.locator('#practice').textContent()).length>20);
  assert.equal(await page.locator('#open-teacher').count(),0,
    'La administración antigua no debe aparecer en la copia del alumnado');
  assert.equal(await page.locator('#teacher-dialog').count(),0);
  await page.getByRole('button',{name:'Avisar de un error'}).click();
  await page.locator('#report-message').fill('Una acepción alternativa debe revisarse.');
  await page.locator('#send-report').click();
  await page.getByText('Aviso enviado. Gracias por ayudar a mejorar el vocabulario.').waitFor();
  assert.ok(requests.includes('public_words'));
  assert.ok(requests.includes('report'),'El alumnado debe poder seguir enviando avisos');
  assert.deepEqual(errors,[]);
  response=await page.goto(base+'/apps/vocabulario/gramatica.html');
  assert.equal(response.status(),404);
  response=await page.goto(base+'/apps/vocabulario/morfologia.html');
  assert.equal(response.status(),404);
  response=await page.goto(base+'/apps/vocabulario/index.html?subject=lat2',{waitUntil:'load'});
  assert.equal(response.status(),200);
  assert.equal(await page.locator('#subject').inputValue(),'lat2');
  response=await page.goto(base+'/apps/gramatica/index.html',{waitUntil:'load'});
  assert.equal(response.status(),200);
  console.log('Vocabula integrado: vocabulario, cursos, filtros, sin panel docente antiguo, con avisos y sin morfología antigua');
}finally{
  if(browser)await browser.close();
  await new Promise(done=>server.close(done));
}
