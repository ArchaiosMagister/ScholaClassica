import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright';
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
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const base='http://127.0.0.1:'+server.address().port;
const url=base+'/apps/repaso-gramatica/index.html';
let browser;
try{
 browser=await chromium.launch({headless:true});
 const ctxA=await browser.newContext({acceptDownloads:true});
 const page=await ctxA.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 let response=await page.goto(url+'?subject=gr1',{waitUntil:'load'});
 assert.equal(response.status(),200);
 await page.waitForFunction(()=>window.GrammarPracticeDebug&&window.GrammarProgressTransfer);
 assert.equal(await page.locator('#subject').inputValue(),'gr1');
 assert.equal(await page.locator('#category').inputValue(),'Sintaxis');
 assert.equal(await page.locator('#grammar-progress-export').count(),1);
 const counts=await page.evaluate(()=>({
  syntax:GrammarPracticeDebug.exercises.filter(q=>q.category==='Sintaxis').length,
  concepts:GrammarPracticeDebug.exercises.filter(q=>q.category==='Conceptos').length,
  key:GrammarProgressTransfer.KEY,
  courses:Object.keys(GrammarPracticeDebug.syllabi)
 }));
 assert.equal(counts.syntax,87,'Las 36+24 preguntas aprobadas deben aparecer en el módulo');
 assert.equal(counts.concepts,1,'El motor original excluye de la práctica las 6 preguntas de introducción UD0');
 assert.equal(counts.key,'classics-grammar-v1');
 assert.ok(counts.courses.includes('gr1')&&counts.courses.includes('lat1'));
 await page.locator('#all').click();
 await page.waitForFunction(()=>!document.querySelector('#start').disabled);
 await page.locator('#start').click();
 const q=await page.evaluate(()=>GrammarPracticeDebug.currentQuestion());
 assert.equal(q.category,'Sintaxis');
 assert.equal(q.subject,'gr1');
 assert.equal(q.mode,'choice');
 await page.locator('#grammar-answer button').filter({hasText:q.answer}).first().click();
 assert.match(await page.locator('#grammar-feedback').textContent(),/Correcto/);
 const original=await page.evaluate(()=>JSON.parse(localStorage.getItem('classics-grammar-v1')));
 assert.ok(original[q.id]&&original[q.id].right===1);
 assert.equal(await page.evaluate(()=>localStorage.getItem('classics-progress-v1')),null,
  'Repaso gramatical no escribe el progreso del vocabulario');
 await page.locator('#grammar-progress-tools summary').click();
 const pending=page.waitForEvent('download',{timeout:7000}).catch(()=>null);
 await page.locator('#grammar-progress-export').click();
 await page.waitForFunction(()=>Boolean(document.querySelector('#grammar-progress-status')?.textContent));
 const exportStatus=await page.locator('#grammar-progress-status').textContent();
 assert.match(exportStatus,/Historial exportado/,`El exportador de gramática ha fallado: ${exportStatus}; ID: ${q.id}; progreso: ${JSON.stringify(original)}`);
 const download=await pending;
 assert.ok(download,`El navegador no ha descargado el JSON pese al estado: ${exportStatus}`);
 assert.equal(download.suggestedFilename(),'progreso-gramatica.json');
 const exported=JSON.parse((await readFile(await download.path())).toString());
 assert.equal(exported.kind,'grammar');
 assert.equal(exported.storageKey,'classics-grammar-v1');
 assert.ok(exported.progress[q.id]);
 const ctxB=await browser.newContext();
 const second=await ctxB.newPage();
 const secondErrors=[];second.on('pageerror',e=>secondErrors.push(e.message));
 await second.goto(url+'?subject=lat4',{waitUntil:'load'});
 await second.waitForFunction(()=>window.GrammarPracticeDebug&&window.GrammarProgressTransfer);
 assert.equal(await second.locator('#subject').inputValue(),'lat4');
 assert.equal(await second.locator('#category').inputValue(),'Sintaxis');
 await second.locator('#grammar-progress-tools summary').click();
 await second.locator('#grammar-progress-import').setInputFiles({
  name:'vocabulario.json',mimeType:'application/json',
  buffer:Buffer.from(JSON.stringify({version:1,progress:exported.progress}))
 });
 await second.locator('#grammar-progress-status').waitFor();
 await second.waitForFunction(()=>document.querySelector('#grammar-progress-status').textContent.includes('No se ha importado nada'));
 assert.equal(await second.evaluate(()=>localStorage.getItem('classics-grammar-v1')),null);
 await second.locator('#grammar-progress-import').setInputFiles({
  name:'progreso-gramatica.json',mimeType:'application/json',
  buffer:Buffer.from(JSON.stringify(exported))
 });
 await second.waitForFunction(id=>{
  const raw=localStorage.getItem('classics-grammar-v1');
  return raw&&JSON.parse(raw)[id]?.total===1;
 },q.id);
 await second.waitForFunction(()=>document.querySelector('#grammar-progress-status')?.textContent.includes('Historial importado'));
 assert.equal(await second.evaluate(()=>localStorage.getItem('classics-progress-v1')),null);
 const stored=await second.evaluate(()=>JSON.parse(localStorage.getItem('classics-grammar-v1')));
 assert.deepEqual(stored,original);
 await second.locator('#grammar-progress-import').setInputFiles({
  name:'progreso-gramatica.json',mimeType:'application/json',
  buffer:Buffer.from(JSON.stringify(exported))
 });
 await second.waitForTimeout(350);
 const importedAgain=await second.evaluate(()=>JSON.parse(localStorage.getItem('classics-grammar-v1')));
 assert.deepEqual(importedAgain,original,'La reimportación no debe duplicar el progreso');
 const approvedCoverage=await second.evaluate(()=>{
  const syntax=GrammarPracticeDebug.exercises.filter(q=>q.category==='Sintaxis');
  const count=subject=>syntax.filter(q=>q.subject===subject).length;
  const lat4Units=Array.from({length:8},(_,i)=>syntax.filter(q=>q.subject==='lat4'&&q.unit==='UD '+(i+1)).length);
  const lat1Topics=GrammarPracticeDebug.syllabi.lat1;
  return {bySubject:{lat4:count('lat4'),lat1:count('lat1'),gr1:count('gr1')},lat4Units,
   apposition:lat1Topics.find(([u])=>u==='UD 4')[1].includes('Aposición y dativo de aproximación'),
   possessive:lat1Topics.find(([u])=>u==='UD 7')[1].includes('Dativo posesivo'),
   questionCount:syntax.filter(q=>q.id.includes('|concept-')).length,
   hasOriginal:GrammarPracticeDebug.exercises.some(q=>q.id==='gr1|UD 1|concept-5'),
   idA:syntax.find(q=>q.prompt.startsWith('En «Cicero, orator Romanus'))?.id,
   idB:syntax.find(q=>q.prompt.startsWith('En «Mihi liber est»'))?.id};
 });
 assert.deepEqual(approvedCoverage.bySubject,{lat4:22,lat1:32,gr1:33});
 assert.deepEqual(approvedCoverage.lat4Units,[3,2,5,2,2,3,2,3]);
 assert.equal(approvedCoverage.apposition,true);
 assert.equal(approvedCoverage.possessive,true);
 assert.equal(approvedCoverage.questionCount,87);
 assert.equal(approvedCoverage.hasOriginal,true);
 assert.equal(approvedCoverage.idA,'lat1|UD 4|concept-103');
 assert.equal(approvedCoverage.idB,'lat1|UD 7|concept-106');
 const canonicalDative='Dativo complemento adjetival (también dativo de aproximación)';
 for(const [unit,oldId] of [['UD 4','lat1|UD 4|concept-103'],['UD 7','lat1|UD 7|concept-106']]){
  await second.locator('#subject').selectOption('lat1');
  await second.locator('#category').selectOption('Sintaxis');
  await second.locator('#none').click();
  await second.locator('#units input[value="'+unit+'"]').check();
  await second.locator('#length').selectOption('all');
  await second.waitForFunction(()=>!document.querySelector('#start').disabled);
  await second.locator('#start').click();
  const played=[];
  for(let i=0;i<4;i++){
   const question=await second.evaluate(()=>GrammarPracticeDebug.currentQuestion());
   assert.equal(question.subject,'lat1');
   assert.equal(question.unit,unit);
   assert.equal(question.category,'Sintaxis');
   played.push(question.id);
   if(unit==='UD 4'&&['lat1|UD 4|concept-122','lat1|UD 4|concept-123'].includes(question.id)){
    assert.equal(question.answer,canonicalDative);
    assert.match(question.explanation,/dativo complemento adjetival/i);
    assert.match(question.explanation,/dativo de aproximación/i);
    assert.ok(question.options.includes(canonicalDative));
   }
   await second.locator('#grammar-answer button').filter({hasText:question.answer}).first().click();
   const recorded=await second.evaluate(id=>JSON.parse(localStorage.getItem('classics-grammar-v1'))[id],question.id);
   assert.equal(recorded.right,1,'El progreso de la pregunta aprobada debe guardarse por su ID');
   if(i<3)await second.locator('#grammar-next-btn').click();
  }
  assert.equal(new Set(played).size,4,'La unidad debe ofrecer cuatro preguntas distintas');
  assert.ok(played.includes(oldId),'La pregunta previa debe conservar su ID '+oldId);
  if(unit==='UD 4'){
   assert.ok(played.includes('lat1|UD 4|concept-122'));
   assert.ok(played.includes('lat1|UD 4|concept-123'));
  }
 }
 assert.deepEqual(await second.evaluate(id=>JSON.parse(localStorage.getItem('classics-grammar-v1'))[id],q.id),
  original[q.id],'El historial previamente importado debe conservarse');
 await second.locator('#subject').selectOption('lat4');
 await second.locator('#category').selectOption('Conceptos');
 await second.locator('#all').click();
 await second.waitForFunction(()=>!document.querySelector('#start').disabled);
 await second.locator('#start').click();
 const l=await second.evaluate(()=>GrammarPracticeDebug.currentQuestion());
 assert.equal(l.category,'Conceptos');
 assert.equal(l.subject,'lat4');
 assert.deepEqual(errors,[]);
 assert.deepEqual(secondErrors,[]);
 await ctxB.close();await ctxA.close();
 console.log('Repaso gramatical: sintaxis y conceptos, tres cursos, transferencia bidireccional aislada e importación no destructiva correctos.');
}finally{await browser?.close();await new Promise(ok=>server.close(ok));}
