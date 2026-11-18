// Cobertura funcional de Vocabula: 4 cursos × 3 corpus × 5 actividades.
// Contrasta el HTML generado con datos de la fuente fijada, no un simulacro de preguntas.
// Ninguna petición de aviso sale al backend real.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,stat,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join,extname,sep} from 'node:path';
import {chromium} from 'playwright';

const repoRoot=resolve(import.meta.dirname,'..');
const root=join(repoRoot,'dist');
const prefix='/ScholaClassica/';
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8',
 '.json':'application/json','.svg':'image/svg+xml','.png':'image/png',
 '.ico':'image/x-icon'};
const server=createServer(async(request,response)=>{
 try{
  const pathname=new URL(request.url,'http://localhost').pathname;
  if(!pathname.startsWith(prefix))throw Error('Fuera de Pages');
  const filename=resolve(root,decodeURIComponent(pathname.slice(prefix.length))+
   (pathname.endsWith('/')?'index.html':''));
  if(!filename.startsWith(root+sep)||(await stat(filename)).isFile()===false)
   throw Error('Fuera del artefacto');
  response.writeHead(200,{'content-type':mime[extname(filename)]||'application/octet-stream'});
  response.end(await readFile(filename));
 }catch{response.writeHead(404);response.end('Not found');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const base='http://127.0.0.1:'+server.address().port+prefix;
const subjects=['lat1','lat2','lat4','gr1'];
const corpora=['general','examen','all'];
const activities=['cards','choice','write','inverse','random'];
const cases=[];
let browser;
try{
 browser=await chromium.launch({headless:true});
 const page=await browser.newPage();
 page.on('pageerror',e=>{throw Error('Error JS en Vocabula: '+e.message)});
 await page.route('**/functions/v1/vocabulary',async route=>{
  const action=JSON.parse(route.request().postData()||'{}').action;
  assert.ok(['public_words','report'].includes(action),'Tráfico del backend no permitido: '+action);
  await route.fulfill({status:200,contentType:'application/json',
   body:JSON.stringify(action==='public_words'?{words:[]}:{ok:true})});
 });
 const response=await page.goto(base+'apps/vocabulario/index.html?subject=lat1',{waitUntil:'load'});
 assert.equal(response.status(),200);
 await page.waitForFunction(()=>document.querySelector('#cloud-status')?.textContent.includes('Vocabulario actualizado'),
  null,{timeout:12000});
 // Se exige marcar una unidad: el caso que se confundió con un fallo.
 assert.equal(await page.locator('#units input:checked').count(),0);
 assert.equal(await page.locator('#start').isDisabled(),true);
 assert.match(await page.locator('#available').textContent(),/Selecciona al menos una unidad/i);
 for(const subject of subjects){
  await page.locator('#subject').selectOption(subject);
  assert.equal(await page.locator('#subject').inputValue(),subject);
  assert.equal(await page.locator('#units input:checked').count(),0,
   subject+': al cambiar asignatura no deben quedar unidades del curso anterior');
  for(const corpus of corpora){
   await page.locator('#corpus').selectOption(corpus);
   assert.equal(await page.locator('#corpus').inputValue(),corpus);
   await page.locator('#none').click();
   assert.equal(await page.locator('#start').isDisabled(),true,subject+'/'+corpus+' sin unidad');
   const visible=await page.locator('#units input').count();
   assert.ok(visible>0,subject+'/'+corpus+': no hay bloques elegibles');
   await page.locator('#all').click();
   const selected=await page.locator('#units input:checked').count();
   assert.equal(selected,visible,subject+'/'+corpus+': «Todas» no marca todos los bloques visibles');
   assert.equal(await page.locator('#start').isEnabled(),true,
    subject+'/'+corpus+': hay unidades pero no se puede iniciar');
   const amount=Number((await page.locator('#available').textContent()).match(/^\d+/)?.[0]);
   assert.ok(Number.isInteger(amount)&&amount>0,subject+'/'+corpus+': sin vocabulario');
   await page.locator('#length').selectOption('10');
   for(const activity of activities){
    await page.locator('#activity').selectOption(activity);
    await page.locator('#start').click();
    const word=page.locator('#practice .word');
    assert.equal(await word.count(),1,subject+'/'+corpus+'/'+activity+': no se generó ejercicio');
    assert.ok((await word.textContent()).trim().length>0,
     subject+'/'+corpus+'/'+activity+': palabra vacía');
    assert.ok((await page.locator('#practice .topline').textContent()).includes('1 /'),
     subject+'/'+corpus+'/'+activity+': sesión incompleta');
    assert.ok((await page.locator('#answerarea').textContent()).trim().length>0||
     await page.locator('#answerarea input').count()>0||
     await page.locator('#answerarea button').count()>0,
     subject+'/'+corpus+'/'+activity+': sin control de respuesta');
    cases.push({subject,corpus,activity,selectedUnits:selected,availableWords:amount,generated:true});
   }
  }
 }
 assert.equal(cases.length,60,'Hay combinaciones sin verificar');
 assert.deepEqual(new Set(cases.map(x=>x.subject)),new Set(subjects));
 assert.deepEqual(new Set(cases.map(x=>x.corpus)),new Set(corpora));
 assert.deepEqual(new Set(cases.map(x=>x.activity)),new Set(activities));
 // El test debe quedar reproducible como evidencia, fuera de Pages.
 const folder=join(repoRoot,'build/academic-audits/castellano');
 await mkdir(folder,{recursive:true});
 await writeFile(join(folder,'vocabula-matriz-funcional.json'),JSON.stringify({
  schema:'schola-castellano-vocabula-matrix/v1',
  source:'dist/apps/vocabulario',
  matrix:'4 materias × 3 corpus × 5 actividades',
  totalCases:cases.length,
  studentBackend:'simulado, sin avisos reales',
  passed:cases.every(x=>x.generated),
  cases
 },null,2)+'\n');
 console.log('Vocabula: 60/60 combinaciones generan ejercicio tras seleccionar unidades.');
}finally{
 if(browser)await browser.close();
 await new Promise(done=>server.close(done));
}
