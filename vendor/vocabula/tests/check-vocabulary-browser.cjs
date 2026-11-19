'use strict';
// Prueba de integración de la práctica real de vocabulario en Chromium.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.ico':'image/x-icon','.png':'image/png'};
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');
 let pathname;try{pathname=decodeURIComponent(url.pathname)}catch{res.writeHead(400);res.end();return}
 const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 fs.readFile(file,(err,buffer)=>{
  if(err){res.writeHead(404);res.end();return}
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});
  res.end(buffer);
 });
});
async function main(){
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1180,height:850}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const actions=[];
  await page.route('**/functions/v1/vocabulary',route=>{
   const body=route.request().postDataJSON();actions.push(body);
   assert.ok(['public_words','report'].includes(body.action),
     'No se debe recurrir a acciones docentes heredadas');
   const response=body.action==='public_words'?{words:[]}:{ok:true};
   return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(response)});
  });
  await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'load'});
  await page.waitForFunction(()=>document.querySelector('#available')?.textContent.includes('Selecciona'));
  await page.waitForFunction(()=>document.querySelector('#cloud-status')?.textContent.includes('Vocabulario actualizado'));
  assert.equal(await page.locator('#units input:checked').count(),0,'No deben activarse todas las unidades al entrar');
  assert.equal(await page.locator('#start').isDisabled(),true,'No comenzar sin unidades');
  await page.locator('#units input[value="UD 1"]').check();
  await page.selectOption('#activity','choice');
  await page.locator('#start').click();
  let first=await page.evaluate(()=>({
   pool:session.pool.map(e=>({id:e.id,subject:e.subject,mode:e.mode,units:e.units})),
   queue:session.queue.map(e=>({id:e.id,subject:e.subject,mode:e.mode,units:e.units})),
   options:session.options.map(e=>e.id),
   units:session.units
  }));
  assert.deepEqual(first.units,['UD 1']);
  assert.ok(first.queue.length>0);
  assert.ok(first.queue.every(e=>e.subject==='lat1'&&e.mode==='general'&&e.units.includes('UD 1')));
  assert.ok(first.options.every(id=>first.pool.some(e=>e.id===id)),'Opciones fuera del vocabulario elegido');
  const shown=await page.locator('#practice .small').first().textContent();
  assert.ok(shown.includes('UD 1')&&!shown.includes('UD 9–10'),'No deben mostrarse unidades ajenas a la selección');
  await page.locator('#units input[value="UD 2"]').check();
  assert.ok((await page.locator('#practice').textContent()).includes('SELECCIÓN ACTUALIZADA'),
   'Cambiar unidades debe interrumpir inmediatamente la sesión antigua');
  assert.ok(await page.evaluate(()=>session===null));
  await page.selectOption('#corpus','examen');
  assert.deepEqual(await page.locator('#units input:checked').evaluateAll(nodes=>nodes.map(n=>n.value)),['UD 1','UD 2'],
   'Cambiar entre General y Examen debe conservar sólo unidades coincidentes');
  await page.selectOption('#subject','gr1');
  assert.equal(await page.locator('#units input:checked').count(),0,'Cambiar de asignatura debe limpiar unidades');
  assert.equal(await page.locator('#start').isDisabled(),true);
  await page.locator('#units input[value="UD 1–4"]').check();
  await page.selectOption('#corpus','general');
  assert.deepEqual(await page.locator('#units input:checked').evaluateAll(nodes=>nodes.map(n=>n.value)),['UD 1–4']);
  assert.equal(await page.locator('#units input[value="Sin unidad acreditada"]').isChecked(),false);

  let cases=0;
  for(const subject of ['lat1','lat4','gr1','lat2']){
   await page.selectOption('#subject',subject);
   for(const mode of ['general','examen']){
    await page.selectOption('#corpus',mode);
    const units=await page.locator('#units input').evaluateAll(nodes=>nodes.map(n=>n.value));
    for(let i=0;i<units.length;i++){
     await page.locator('#none').click();
     await page.locator('#units input').nth(i).check();
     assert.equal(await page.locator('#start').isEnabled(),true,subject+' '+mode+' '+units[i]);
     await page.locator('#start').click();
     const state=await page.evaluate(()=>({
      subject:document.querySelector('#subject').value,
      mode:document.querySelector('#corpus').value,
      unit:session.units[0],
      pool:session.pool.map(e=>({id:e.id,subject:e.subject,mode:e.mode,units:e.units})),
      queue:session.queue.map(e=>({id:e.id,subject:e.subject,mode:e.mode,units:e.units})),
      options:session.options.map(e=>e.id)
     }));
     assert.equal(state.subject,subject);assert.equal(state.mode,mode);
     assert.equal(state.unit,units[i]);
     assert.ok(state.queue.length>0);
     assert.ok(state.pool.every(e=>e.subject===subject&&e.mode===mode&&e.units.includes(units[i])),
      'Pool ajeno a la selección: '+subject+' '+mode+' '+units[i]);
     assert.ok(state.queue.every(e=>state.pool.some(p=>p.id===e.id)),'Pregunta fuera del pool');
     assert.ok(state.options.every(id=>state.pool.some(p=>p.id===id)),'Distractor fuera del pool');
     cases++;
    }
   }
  }
  const greekSynonyms=await page.evaluate(()=>{
   const tests=[
    ['general','ἀρχή, –ῆς','origen'],
    ['general','οἰκέω','habitar'],
    ['examen','οἰκέω','vivir'],
    ['general','ἄρχων, –οντος (ὁ)','arconte'],
    ['examen','ἄρχων, −οντος (ὁ)','líder'],
    ['general','ἡγεμών, –ονος (M)','líder'],
    ['general','λαμβάνω','tomar']
   ];
   return tests.map(([mode,form,answer])=>{
    const word=VOCAB.find(e=>e.subject==='gr1'&&e.mode===mode&&e.form===form);
    return {mode,form,answer,found:!!word,accepted:word?correct(word,answer,false):false,
     rejectsWrong:word?!correct(word,'tractor',false):false};
   });
  });
  assert.ok(greekSynonyms.every(x=>x.found&&x.accepted&&x.rejectsWrong),
   'No se admiten todas las equivalencias griegas validadas: '+JSON.stringify(greekSynonyms));
  const prepositionCases=await page.evaluate(()=>{
   const specs=[
    ['examen','διά + acusativo','a causa de',true],
    ['examen','διά + acusativo','a través de',false],
    ['general','διά + genitivo / acusativo','a través de',true],
    ['general','διά + genitivo / acusativo','por medio de',true],
    ['examen','περί + genitivo','acerca de',true],
    ['examen','ὑπό + genitivo','por',true],
    ['general','παρά + genitivo / acusativo / dativo','al lado de',true],
    ['general','παρά + genitivo / acusativo / dativo','a lado de',false]
   ];
   return specs.map(([mode,form,answer,expected])=>{
    const entry=VOCAB.find(x=>x.subject==='gr1'&&x.mode===mode&&x.form===form);
    return {mode,form,answer,expected,found:!!entry,actual:entry?correct(entry,answer,false):null};
   });
  });
  assert.ok(prepositionCases.every(x=>x.found&&x.actual===x.expected),
   'Fallo de régimen o traducción griega en Chromium: '+JSON.stringify(prepositionCases));
  const atticSamples=await page.evaluate(()=>{
   const cases=[
    ['general','αἰτέω','pedir',true],
    ['general','αἰτέω','buscar',false],
    ['general','αἰτέω','solicitar',true],
    ['general','ἀκρόαμα, –ματος (τὸ)','audición',true],
    ['general','ἀκρόαμα, –ματος (τὸ)','placentero al oído',false],
    ['general','ἀμφί + genitivo / acusativo','acerca de',true]
   ];
   return cases.map(([mode,form,answer,expected])=>{
    const e=VOCAB.find(x=>x.subject==='gr1'&&x.mode===mode&&x.form===form);
    return {form,answer,expected,found:!!e,actual:e?correct(e,answer,false):null};
   });
  });
  assert.ok(atticSamples.every(x=>x.found&&x.expected===x.actual),
   'La corrección escrita no respeta el vocabulario ático: '+JSON.stringify(atticSamples));
  assert.equal(await page.locator('#open-teacher').count(),0);
  assert.equal(await page.locator('#teacher-dialog').count(),0);
  await page.locator('#open-report').click();
  await page.locator('#report-message').fill('La traducción debería aceptar otra acepción.');
  await page.locator('#send-report').click();
  await page.locator('#report-dialog .feedback').waitFor();
  assert.ok(actions.some(x=>x.action==='report'),'El alumnado debe seguir enviando avisos');
  assert.ok(actions.some(x=>x.action==='public_words'),'Debe continuar la sincronización');
  assert.deepEqual(errors,[],'Errores de ejecución en navegador');
  console.log('OK navegador: '+cases+' selecciones de unidad, reinicios, cambio de corpus y distractores.');
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve))}
}
main().catch(e=>{console.error(e);process.exitCode=1});
