// Flujo real de Evolutio CASTELLANO en el artefacto integrado: estudio,
// traducción, identificación de cada ley, revelación, filtros y repaso focalizado.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,stat,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join,extname,sep} from 'node:path';
import {chromium} from 'playwright';
const root=resolve(import.meta.dirname,'..');
const dist=join(root,'dist'),prefix='/ScholaClassica/';
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8',
 '.json':'application/json','.png':'image/png','.svg':'image/svg+xml',
 '.webmanifest':'application/manifest+json'};
const server=createServer(async(req,res)=>{
 try{
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(!pathname.startsWith(prefix))throw Error('Fuera de subruta Pages');
  const name=resolve(dist,decodeURIComponent(pathname.slice(prefix.length))+
   (pathname.endsWith('/')?'index.html':''));
  if(!name.startsWith(dist+sep)||!(await stat(name)).isFile())throw Error('Fuera de dist');
  res.writeHead(200,{'content-type':mime[extname(name)]||'application/octet-stream'});
  res.end(await readFile(name));
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const address='http://127.0.0.1:'+server.address().port+prefix+'apps/evolucion-fonetica/';
let browser;
try{
 browser=await chromium.launch({headless:true});
 const page=await browser.newPage();
 const errors=[];
 page.on('pageerror',err=>errors.push(err.message));
 const result=await page.goto(address+'index.html',{waitUntil:'networkidle'});
 assert.equal(result.status(),200);
 await page.locator('[data-action="start"]').waitFor({state:'visible',timeout:20000});
 const data=await page.evaluate(async()=>await fetch('./data/pilot.json').then(r=>r.json()));
 assert.equal(data.words.length,622);
 assert.equal(new Set(data.words.map(x=>x.id)).size,622);
 // Estudio de las formas: consulta libre y significado, sin mezclar valenciano.
 await page.locator('#nav-study').click();
 await page.locator('#study-search').fill('uitam');
 assert.ok(await page.locator('#study-results [data-study-word]').count()>0,
  'La consulta por grafía latina consonántica no devuelve vida');
 await page.locator('#study-results [data-study-word]').first().click();
 const studied=await page.locator('.study-word-pair').textContent();
 assert.match(studied,/vida/i);
 assert.equal(await page.locator('.study-change-detail').count(),1);
 await page.locator('#nav-practice').click();
 assert.equal(await page.locator('input[name="practice-scope"][value="general"]').isChecked(),true);
 assert.equal(await page.locator('[data-action="start"]').isEnabled(),true);
 // El filtro sin ningún nivel debe impedir un sorteo silencioso.
 await page.locator('[data-practice-difficulty-none]').click();
 assert.equal(await page.locator('[data-action="start"]').isDisabled(),true);
 await page.locator('[data-practice-difficulty-all]').click();
 assert.equal(await page.locator('[data-action="start"]').isEnabled(),true);
 await page.locator('#requested').fill('1');
 await page.locator('[data-action="start"]').click();
 const latin=(await page.locator('.latin-word').textContent()).trim();
 const original=data.words.find(x=>x.latin===latin);
 assert.ok(original,latin+': falta en el banco castellano');
 await page.locator('#castellano').fill(original.answers[0]);
 await page.locator('#result-form button[type="submit"]').click();
 assert.match(await page.locator('.practice-card .eyebrow').textContent(),/Fase 2/);
 const drafts=page.locator('[data-draft-rule]');
 assert.ok(await drafts.count()>0,'La segunda fase no muestra selectores de normas');
 let checked=0;
 for(const select of await drafts.all()){
  const draftId=await select.getAttribute('data-draft-rule');
  const item=original.changes.find(x=>'g-'+x.id===draftId);
  assert.ok(item,'La norma del segmento no está en el étimo: '+draftId);
  await select.selectOption(item.rule);
  checked++;
 }
 await page.locator('[data-action="check-all"]').click();
 assert.equal(await page.locator('[data-action="next"]').count(),1,
  'La combinación correcta de cambios no ha resuelto la tarjeta');
 await page.locator('[data-action="next"]').click();
 assert.match(await page.locator('.practice-card').textContent(),/Sesión terminada/);
 assert.match(await page.locator('.summary-line').textContent(),new RegExp(latin,'u'));
 await page.locator('[data-action="home"]').click();
 // Tres respuestas incorrectas muestran la solución SIN atribuir el acierto.
 await page.locator('#requested').fill('1');
 await page.locator('[data-action="start"]').click();
 for(let i=0;i<3;i++){
  await page.locator('#castellano').fill('zzzz-no-es-palabra');
  await page.locator('#result-form button[type="submit"]').click();
 }
 assert.equal(await page.locator('[data-action="next"]').count(),1);
 assert.match(await page.locator('.practice-card').textContent(),/Solución mostrada/i);
 await page.locator('[data-action="next"]').click();
 assert.match(await page.locator('.practice-card').textContent(),/1 con solución consultada/);
 await page.locator('[data-action="home"]').click();
 // Foco por ley y análisis a ciegas: la configuración no pierde el repertorio.
 await page.locator('input[name="practice-scope"][value="focus"]').check();
 await page.locator('#focus-rule').selectOption('SONOR');
 assert.equal(await page.locator('[data-action="start"]').isEnabled(),true,
  'Sonorización no genera palabras para el repaso focalizado');
 await page.locator('input[name="mode"][value="blind"]').check();
 await page.locator('#requested').fill('1');
 await page.locator('[data-action="start"]').click();
 assert.match(await page.locator('.topline').textContent(),/A ciegas/);
 await page.locator('[data-action="reveal"]').click();
 assert.equal(await page.locator('[data-action="next"]').count(),1);
 await page.locator('[data-action="next"]').click();
 assert.match(await page.locator('.practice-card').textContent(),/Sesión terminada/);
 assert.deepEqual(errors,[],'Errores del navegador Evolutio: '+errors.join(' | '));
 const out=join(root,'build/academic-audits/castellano');
 await mkdir(out,{recursive:true});
 await writeFile(join(out,'evolutio-flujo-funcional.json'),JSON.stringify({
  schema:'schola-castellano-evolutio-functional/v1',
  words:622,
  uniqueIds:true,
  studySearch:'uitam → vida',
  completedCard:{latin,changeSelectors:checked,phase1:'correct',phase2:'correct'},
  threeAttempts:{reveal:true,credited:false},
  focusedBlind:{rule:'SONOR',completed:true},
  offlinePwaCoveredBy:'tests/browser.mjs',
  scriptErrors:errors
 },null,2)+'\n');
 console.log('Evolutio castellano: estudio, práctica completa, 3 intentos y foco a ciegas correctos.');
}finally{
 if(browser)await browser.close();
 await new Promise(ok=>server.close(ok));
}
