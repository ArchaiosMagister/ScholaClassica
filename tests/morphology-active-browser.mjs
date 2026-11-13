import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright';
const root=resolve(import.meta.dirname,'../dist');
const prefix='/ScholaClassica/';
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
  '.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8',
  '.json':'application/json','.png':'image/png'};
const server=createServer(async(req,res)=>{
  try{
    const path=new URL(req.url,'http://localhost/').pathname;
    if(!path.startsWith(prefix))throw Error('Fuera de Pages');
    const file=resolve(root,decodeURIComponent(path.slice(prefix.length))+
      (path.endsWith('/')?'index.html':''));
    if(!file.startsWith(root+sep)||!(await stat(file)).isFile())throw Error('Ruta no admitida');
    res.setHeader('content-type',mime[extname(file)]||'application/octet-stream');
    res.writeHead(200);res.end(await readFile(file));
  }catch{res.writeHead(404);res.end('Not found')}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const base='http://127.0.0.1:'+server.address().port+prefix+'apps/morfologia/';
let browser;
try{
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const errors=[];page.on('pageerror',err=>errors.push(err.message));
  const response=await page.goto(base+'index.html?subject=gr1',{waitUntil:'networkidle'});
  assert.equal(response.status(),200);
  await page.locator('#unit').selectOption('5');
  await page.locator('#activity').selectOption('written');
  await page.locator('#kind').selectOption('adjetivo');
  await page.locator('#start').click();
  assert.ok(await page.locator('#written-response').isVisible());
  assert.ok(await page.locator('#greek-keyboard').isVisible());
  assert.equal(await page.locator('#answers button').count(),0);
  const field=page.locator('#answer-input');
  await page.getByRole('button',{name:'Insertar α'}).click();
  await page.getByRole('button',{name:'Acento agudo'}).click();
  assert.equal((await field.inputValue()).normalize('NFC'),'ά');
  await page.getByRole('button',{name:'Espíritu suave'}).click();
  assert.equal((await field.inputValue()).normalize('NFC'),'ἄ');
  await page.getByRole('button',{name:'Retroceso'}).click();
  assert.equal(await field.inputValue(),'');
  // La respuesta correcta se deduce del mismo banco cerrado, nunca de un lema generado.
  const correct=await page.evaluate(async()=>{
    const data=await fetch('./data/paradigmas.json').then(r=>r.json());
    const paradigm=document.querySelector('#paradigm').textContent;
    const prompt=document.querySelector('#question-title').textContent;
    const record=data.records.find(r=>r.paradigm===paradigm);
    const analysis=prompt.replace(/^Escribe la forma de /,'').replace(/\.$/,'');
    return record?.forms.find(f=>f.analysis===analysis)?.form||null;
  });
  assert.ok(correct,'La pregunta debe proceder de una forma documentada');
  await field.fill(correct);
  await page.locator('#check-written').click();
  assert.ok((await page.locator('#feedback').textContent()).includes('Correcto'));
  assert.ok((await page.locator('#review-status').textContent()).includes('1 ejercicios practicados'));
  const stored=await page.evaluate(()=>localStorage.getItem('schola-morphology-review-v1'));
  assert.ok(stored?.includes('"seen":1'));
  await page.locator('#next').click();
  await field.fill('xx-una-forma-inexistente');
  await page.locator('#check-written').click();
  assert.ok((await page.locator('#feedback').textContent()).includes('Forma incorrecta'));
  await page.locator('#new').click();
  await page.locator('#review-mode').selectOption('errors');
  await page.locator('#start').click();
  assert.ok(await page.locator('#written-response').isVisible());
  assert.equal(await page.locator('#counter').textContent(),'Ejercicio 1 de 1');
  await page.locator('#new').click();
  await page.reload({waitUntil:'networkidle'});
  assert.ok((await page.locator('#review-status').textContent()).includes('2 ejercicios practicados'));
  // El sintagma griego es artículo + adjetivo sustantivado, sin sustantivo inventado.
  await page.locator('#unit').selectOption('5');
  await page.locator('#review-mode').selectOption('all');
  await page.locator('#activity').selectOption('phrase-written');
  assert.equal(await page.locator('#kind').inputValue(),'sintagma');
  await page.locator('#start').click();
  assert.ok(await page.locator('#written-response').isVisible());
  assert.ok(await page.locator('#greek-keyboard').isVisible());
  assert.match(await page.locator('#question-title').textContent(),/adjetivo sustantivado/);
  await page.locator('#answer-input').fill('forma inventada');
  await page.locator('#check-written').click();
  assert.ok(await page.locator('#source-secondary').isVisible(),
    'Deben enlazarse por separado las dos unidades de origen');
  assert.match(await page.locator('#source-secondary').textContent(),/UD3/);
  await page.locator('#new').click();
  await page.locator('#activity').selectOption('phrase-table');
  await page.locator('#start').click();
  assert.equal(await page.locator('#table-cells input').count(),8,
    'No existe vocativo griego del artículo');
  await page.locator('#table-cells input').evaluateAll(fields=>{
    for(const field of fields){field.value='x';field.dispatchEvent(new Event('input',{bubbles:true}))}
  });
  await page.locator('#check-table').click();
  assert.match(await page.locator('#feedback').textContent(),/8 casillas/);
  await page.locator('#new').click();
  // Triple concordancia: sustantivo individual, artículo y adjetivo del banco.
  await page.locator('#unit').selectOption('5');
  await page.locator('#activity').selectOption('noun-phrase-written');
  assert.equal(await page.locator('#kind').inputValue(),'sintagma');
  await page.locator('#start').click();
  assert.ok(await page.locator('#written-response').isVisible());
  assert.ok(await page.locator('#greek-keyboard').isVisible());
  assert.match(await page.locator('#question-title').textContent(),/posición atributiva/);
  const nominal=await page.evaluate(async()=>{
    const {makeGreekNounPhraseQuestions}=await import('./greek-noun-phrases.mjs');
    const data=await fetch('./data/paradigmas.json').then(r=>r.json());
    const title=document.querySelector('#paradigm').textContent;
    const prompt=document.querySelector('#question-title').textContent;
    const q=makeGreekNounPhraseQuestions(data,{language:'griego',unit:5,limit:30,
      rng:()=>.45}).find(item=>item.paradigm===title&&item.prompt===prompt);
    if(!q)return null;
    return q.acceptedForms;
  });
  assert.equal(nominal?.length,2,'Las dos posiciones deben proceder del banco');
  await page.locator('#answer-input').fill(nominal[1]);
  await page.locator('#check-written').click();
  assert.match(await page.locator('#feedback').textContent(),/Correcto/);
  assert.ok(await page.locator('#source').isVisible());
  assert.ok(await page.locator('#source-secondary').isVisible());
  assert.ok(await page.locator('#source-tertiary').isVisible());
  assert.match(await page.locator('#source-tertiary').textContent(),/Vocabula\/UniMorph/);
  await page.locator('#new').click();
  await page.locator('#activity').selectOption('noun-phrase-table');
  await page.locator('#start').click();
  assert.equal(await page.locator('#table-cells input').count(),8);
  assert.ok(await page.locator('#greek-keyboard').isVisible());
  await page.locator('#new').click();

  // Reapertura offline en móvil: corrección, banco, estilos y teclado están precargados.
  await page.waitForFunction(async()=>{
    const regs=await navigator.serviceWorker.getRegistrations();
    return regs.some(r=>r.active&&r.scope.endsWith('/ScholaClassica/apps/morfologia/'));
  },null,{timeout:15000});
  const caches=await page.evaluate(()=>caches.keys());
  assert.ok(caches.some(key=>key.startsWith('schola-morphology-')));
  await page.context().setOffline(true);
  const offline=await page.goto(base+'index.html?subject=lat1',{waitUntil:'load'});
  assert.equal(offline.status(),200);
  await page.waitForFunction(()=>!document.querySelector('#start').disabled);
  assert.equal(await page.locator('#subject').inputValue(),'latin');
  await page.locator('#unit').selectOption('4');
  await page.locator('#activity').selectOption('table');
  await page.locator('#kind').selectOption('sustantivo');
  await page.locator('#review-mode').selectOption('all');
  await page.locator('#start').click();
  assert.ok(await page.locator('#table-response').isVisible());
  assert.equal(await page.locator('#answers button').count(),0);
  const inputs=page.locator('#table-cells input');
  assert.equal(await inputs.count(),12);
  // Rellenar usando exclusivamente las formas fuente del paradigma presentado.
  await page.evaluate(async()=>{
    const data=await fetch('./data/paradigmas.json').then(r=>r.json());
    const record=data.records.find(r=>r.paradigm===document.querySelector('#paradigm').textContent);
    if(!record)throw Error('Tabla ajena al banco');
    for(const input of document.querySelectorAll('#table-cells input')){
      const [cas,number]=input.dataset.cellId.split(':');
      const form=record.forms.find(f=>f.case===cas&&f.number===number)?.form;
      if(!form)throw Error('Casilla sin forma');
      input.value=form;input.dispatchEvent(new Event('input',{bubbles:true}));
    }
  });
  await page.locator('#check-table').click();
  assert.ok((await page.locator('#feedback').textContent()).includes('Tabla completa correcta'));
  assert.equal(await page.locator('#table-cells input:disabled').count(),12);
  await page.locator('#new').click();
  await page.locator('#unit').selectOption('7');
  await page.locator('#activity').selectOption('phrase-table');
  assert.equal(await page.locator('#kind').inputValue(),'sintagma');
  await page.locator('#start').click();
  assert.equal(await page.locator('#table-cells input').count(),12);
  await page.locator('#table-cells input').evaluateAll(fields=>{
    for(const field of fields){field.value='x';field.dispatchEvent(new Event('input',{bubbles:true}))}
  });
  await page.locator('#check-table').click();
  assert.match(await page.locator('#feedback').textContent(),/12 casillas/);
  assert.ok(await page.locator('#source-secondary').isVisible());
  await page.locator('#new').click();
  const offlineGreek=await page.goto(base+'index.html?subject=gr1',{waitUntil:'load'});
  assert.equal(offlineGreek.status(),200);
  await page.waitForFunction(()=>!document.querySelector('#start').disabled);
  await page.locator('#unit').selectOption('7');
  await page.locator('#activity').selectOption('noun-phrase-table');
  await page.locator('#start').click();
  assert.equal(await page.locator('#table-cells input').count(),8);
  const present=await page.evaluate(async()=>{
    const data=await fetch('./data/paradigmas.json').then(r=>r.json());
    return data.records.filter(r=>r.id.startsWith('griego-sustantivo-')).length;
  });
  assert.equal(present,8);
  await page.locator('#table-cells input').evaluateAll(fields=>{
    for(const field of fields){field.value='x';field.dispatchEvent(new Event('input',{bubbles:true}))}
  });
  await page.locator('#check-table').click();
  assert.match(await page.locator('#feedback').textContent(),/8 casillas/);
  assert.ok(await page.locator('#source-tertiary').isVisible());
  await page.context().setOffline(false);
  assert.deepEqual(errors,[]);
  console.log('OK: ocho sustantivos y sintagmas triples griegos offline, sin regresiones latinas');
}finally{
  if(browser)await browser.close();
  await new Promise(done=>server.close(done));
}
