'use strict';
// Prueba real en Chromium: navegación, generación, autocorrección y repetición de errores.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8',
 '.svg':'image/svg+xml','.ico':'image/x-icon','.png':'image/png'};

const server=http.createServer((req,res)=>{
 let url;
 try{url=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}
 catch{res.writeHead(400);res.end();return}
 const file=path.resolve(root,'.'+(url==='/'?'/index.html':url));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 fs.readFile(file,(err,data)=>{
  if(err){res.writeHead(404);res.end();return}
  res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
  res.writeHead(200);res.end(data);
 });
});
async function main(){
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port;
 let browser;
 try{
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const calls=[];
  const sampleReport={
   id:'00000000-0000-4000-8000-000000000001',subject:'gr1',mode:'general',
   units:['UD 11'],entry_id:'grammar:example',entry_form:'Gramática · revisión del imperfecto',
   message:'Hay una errata en la respuesta',created_at:'2026-11-09T10:00:00Z',
   status:'pending',teacher_note:''
  };
  await page.route('**/data/morphology-coverage.json',async route=>{
   const items={lat1:{lemmas:664,withExercises:282,withoutExercises:382,importedLemmas:261,curatedLemmas:30},
    lat4:{lemmas:328,withExercises:170,withoutExercises:158,importedLemmas:157,curatedLemmas:19},
    gr1:{lemmas:349,withExercises:55,withoutExercises:294,importedLemmas:51,curatedLemmas:8}};
   await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({schema:1,subjects:items})});
  });
  await page.route('https://latindictionary.co/api/v1/entry/laboro',async route=>{
   const labels=['1st sg.','2nd sg.','3rd sg.','1st pl.','2nd pl.','3rd pl.'];
   const present=['laborō','laborās','laborat','laborāmus','laborātis','laborant'];
   const imperfect=['laborābam','laborābās','laborābat','laborābāmus','laborābātis','laborābant'];
   const rows=labels.map((label,i)=>({label,cells:[[present[i]],[imperfect[i]]]}));
   const body={slug:'laboro',url:'https://latindictionary.co/laboro',attribution:'Latin Dictionary; Perseus; Wiktionary CC BY-SA',
    lemmas:[{headword:'laborō',part_of_speech:'verb',principal_parts:['laborō','laborāre','laborāvī','laborātum'],
     inflection:'conjugation-1',paradigm:{kind:'verb',tables:[{title:'active indicative',columns:['present','imperfect'],rows}]}}]};
   await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
  });
  await page.route('**/functions/v1/vocabulary',async route=>{
   const request=route.request().postDataJSON();calls.push(request);
   const answers={
    public_words:{words:[]},
    login:{token:'a'.repeat(64)},
    session:{teacher:true},
    teacher_words:{words:[]},
    reports:{reports:[sampleReport],more:false},
    report:{ok:true},
    update_report:{ok:true},
    logout:{ok:true}
   };
   await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(answers[request.action]||{ok:true})});
  });
  await page.goto(origin+'/gramatica.html',{waitUntil:'load'});
  await page.waitForFunction(()=>!document.querySelector('#start')?.disabled);
  assert.equal(await page.locator('#category').inputValue(),'Morfología','La modalidad inicial debe centrarse en morfología');

  await page.selectOption('#subject','gr1');
  await page.locator('#none').click();
  await page.locator('#units input[value="UD 11"]').check();
  await page.selectOption('#category','Morfología verbal');
  await page.selectOption('#answer-mode','write');
  assert.equal(await page.locator('#topic').count(),0,'No debe haber subdivisión de unidades por temas');
  assert.equal(await page.locator('#units input[value="UD 0"]').count(),0,'UD 0 no debe aparecer');
  await page.selectOption('#length','10');
  await page.locator('#start').click();

  const questionBeforeReport=await page.locator('.grammar-question').textContent();
  assert.deepEqual(await page.locator('header .study-tab').allTextContents(),['Vocabulario','Gramática']);
  assert.equal(await page.locator('header .study-tab[aria-current="page"]').textContent(),'Gramática');
  await page.locator('#open-report').click();
  await page.locator('#grammar-report-message').fill('Esta respuesta morfológica debería revisarse.');
  await page.locator('#grammar-report-send').click();
  await page.locator('#report-dialog .feedback').waitFor();
  const reportCall=calls.find(q=>q.action==='report');
  assert.ok(reportCall,'El aviso no se ha enviado');
  assert.ok(reportCall.entry_id.startsWith('grammar:gr1|UD 11|'),'El aviso no identifica la pregunta');
  assert.ok(reportCall.entry_form.includes(questionBeforeReport),'El aviso no indica la pregunta');
  await page.locator('#report-dialog [data-close]').first().click();

  assert.equal(await page.locator('#open-teacher').count(),0,
    'El panel docente antiguo ya no debe aparecer');
  assert.equal(await page.locator('#teacher-dialog').count(),0);
  assert.ok(!calls.some(q=>['login','session','reports','update_report'].includes(q.action)),
    'No debe utilizarse el sistema de sesión heredado');
  // Se conserva el aviso contextualizado con el ID original de pregunta.
  for(let i=0;i<10;i++){
   const prompt=await page.locator('.grammar-question').textContent();
   const expected=await page.evaluate(text=>{
    const q=window.GrammarPracticeDebug.exercises.find(q=>
     q.subject==='gr1'&&q.unit==='UD 11'&&q.mode==='write'&&q.prompt===text);
    return q?.answer.split(' / ')[0].replaceAll('(ν)','');
   },prompt);
   assert.ok(expected,'No se encontró respuesta para '+prompt);
   await page.locator('#grammar-input').fill(i===1?'FORMA-INEXISTENTE':expected);
   await page.locator('#grammar-form button[type="submit"]').click();
   const feedback=await page.locator('#grammar-feedback').textContent();
   assert.match(feedback,i===1?/Revisa esta forma/:/Correcto/);
   assert.match(feedback,/Respuesta:/,'Debe mostrarse la solución al corregir');
   await page.locator('#grammar-next-btn').click();
  }
  assert.match(await page.locator('#practice').textContent(),/9 de 10 aciertos/);
  await page.locator('#grammar-retry').click();
  const prompt=await page.locator('.grammar-question').textContent();
  const answer=await page.evaluate(text=>{
   const q=window.GrammarPracticeDebug.exercises.find(q=>
    q.subject==='gr1'&&q.unit==='UD 11'&&q.mode==='write'&&q.prompt===text);
   return q?.answer.split(' / ')[0].replaceAll('(ν)','');
  },prompt);
  assert.ok(answer,'Fallo sin pregunta recuperable');
  await page.locator('#grammar-input').fill(answer);
  await page.locator('#grammar-form button[type="submit"]').click();
  assert.match(await page.locator('#grammar-feedback').textContent(),/Correcto/);
  await page.locator('#grammar-next-btn').click();
  assert.match(await page.locator('#practice').textContent(),/1 de 1 aciertos/);

  // El respaldo remoto se consulta de forma puntual y conserva el formato local.
  await page.selectOption('#subject','lat1');
  await page.locator('#online-lemma').fill('laboro');
  await page.locator('#online-add').click();
  await page.locator('#online-status').filter({hasText:'ejercicios adicionales'}).waitFor();
  await page.locator('#include-imported').uncheck();
  const backup=await page.evaluate(()=>window.GrammarPracticeDebug.available().filter(q=>q.source==='Latin Dictionary API'&&q.lemma==='laboro'));
  assert.equal(backup.filter(q=>q.mode==='write').length,12);
  assert.ok(backup.every(q=>q.subject==='lat1'&&q.category==='Morfología verbal'&&q.language==='lat'));
  assert.match(backup[0].prompt,/laboro, laboravi, laboratum \(1ª\)/);
  assert.ok(backup.every(q=>q.explanation.includes('Latin Dictionary')));
  assert.equal(await page.locator('#include-online').isChecked(),true);
  assert.equal(await page.locator('a[href="https://outils.biblissima.fr/en/eulexis-web/"]').count(),1);

  // Verificar diversidad real de paradigmas, sin UniMorph, en Latín I · UD 2.
  await page.selectOption('#subject','lat1');
  await page.locator('#none').click();
  await page.locator('#units input[value="UD 2"]').check();
  await page.selectOption('#category','Morfología verbal');
  await page.selectOption('#answer-mode','write');
  await page.locator('#include-imported').uncheck();
  await page.locator('#include-online').uncheck();
  await page.locator('#start').click();
  const different=new Set();
  for(let i=0;i<10;i++){
   const q=await page.evaluate(()=>window.GrammarPracticeDebug.currentQuestion());
   assert.ok(q&&q.subject==='lat1'&&q.unit==='UD 2'&&q.topic==='El imperfecto de indicativo','La unidad debe seleccionarse completa');
   different.add(q.lemma);
   assert.match(q.prompt,/, [^,]+, [^,]+ \((?:1ª|2ª|3ª|4ª|mx\.)\)\./);
   await page.locator('#grammar-input').fill(q.answer);
   await page.locator('#grammar-form button[type="submit"]').click();
   assert.match(await page.locator('#grammar-feedback').textContent(),/Correcto/);
   await page.locator('#grammar-next-btn').click();
  }
  assert.equal(different.size,10,'Una sesión de 10 preguntas debe incluir 10 verbos diferentes');
  assert.match(await page.locator('#practice').textContent(),/10 de 10 aciertos/);

    await page.setViewportSize({width:375,height:812});
  await page.reload({waitUntil:'load'});
  await page.waitForFunction(()=>!document.querySelector('#start')?.disabled);
  assert.equal(await page.locator('#category').inputValue(),'Morfología');
  for(const label of ['Vocabulario','Gramática']){
   const tab=page.getByRole('link',{name:label,exact:true});
   assert.equal(await tab.isVisible(),true,'Pestaña no visible: '+label);
   const box=await tab.boundingBox();
   assert.ok(box&&box.x>=0&&box.x+box.width<=375,'Pestaña fuera de pantalla: '+label);
  }
  assert.equal(await page.locator('#open-report').isVisible(),true,'Falta el botón de aviso en móvil');
  assert.equal(await page.locator('#open-teacher').count(),0,'El acceso docente antiguo no debe aparecer en móvil');

  await page.goto(origin+'/',{waitUntil:'load'});
  assert.equal(await page.locator('header .study-tab[aria-current="page"]').textContent(),'Vocabulario');
  assert.deepEqual(await page.locator('header .study-tab').allTextContents(),['Vocabulario','Gramática']);
  assert.equal(await page.locator('#open-report').isVisible(),true);
  assert.equal(await page.locator('#open-teacher').count(),0);
  assert.equal(await page.locator('#teacher-dialog').count(),0);
  assert.deepEqual(errors,[],'Errores JavaScript del navegador');
  console.log('OK navegador: pestañas, avisos sin panel heredado, 10 ejercicios, corrección y carga móvil.');
 }finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
}
main().catch(e=>{console.error(e);process.exitCode=1});
