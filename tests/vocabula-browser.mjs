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
  const errors=[],requests=[],reports=[];
  page.on('pageerror',err=>errors.push(err.message));
  await page.route('**/functions/v1/vocabulary',async route=>{
    const payload=JSON.parse(route.request().postData()||'{}');
    requests.push(payload.action);
    if(payload.action==='report')reports.push(payload);
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
  const grComplement=page.locator('#units input[value="Sin unidad acreditada"]');
  assert.equal(await grComplement.count(),1);
  assert.match(await grComplement.locator('xpath=..').textContent(),
    /Complementario · sin unidad asignada/);
  assert.match(await page.locator('#scope').textContent(),
    /no se convierte en exigible/);
  assert.equal(await page.locator('#units input:checked').count(),0);
  assert.equal(await page.locator('#start').isDisabled(),true);
  await page.locator('#units input').first().check();
  assert.equal(await page.locator('#start').isEnabled(),true);
  await page.locator('#activity').selectOption('choice');
  await page.locator('#start').click();
  assert.ok((await page.locator('#practice').textContent()).length>20);
  await page.locator('#subject').selectOption('lat1');
  const latinComplement=page.locator('#units input[value="UD 11–12"]');
  assert.equal(await latinComplement.count(),1);
  assert.match(await latinComplement.locator('xpath=..').textContent(),
    /Ampliación · fuera de las unidades habituales/);
  assert.match(await page.locator('#scope').textContent(),
    /General no equivale a exigible/);
  assert.equal(await page.locator('#units input:checked').count(),0);
  await page.locator('#units input').first().check();
  assert.equal(await page.locator('#start').isEnabled(),true);
  await page.locator('#activity').selectOption('cards');
  await page.locator('#start').click();
  assert.ok((await page.locator('#practice').textContent()).length>20);
  assert.equal(await page.locator('#corpus option').count(),3,
    'Debe haber una tercera modalidad solo en ScholaClassica');
  await page.locator('#corpus').selectOption('all');
  assert.equal(await page.locator('#corpus').inputValue(),'all');
  assert.equal(await page.locator('#units input:checked').count(),1,
    'El cambio de corpus debe conservar la unidad compartida');
  assert.ok((await page.locator('#scope').textContent()).includes('General y Examen'));
  assert.match(await page.locator('#scope').textContent(),/no exigibles automáticamente/);
  assert.equal(await page.locator('#units input[value="UD 11–12"]').count(),1);
  await page.locator('#none').click();
  await page.locator('#units input[value="UD 4"]').check();
  const result=await page.evaluate(()=>{
    const combined=scholaVocabularyAll(VOCAB,'lat1',['UD 4']);
    const ac=combined.find(e=>e.form==='ac (conj.)');
    const flumen=combined.find(e=>e.form==='flumen, fluminis (n.)');
    return {ac:ac?{mode:ac.mode,source:scholaVocabularyProvenance(ac),
      selected:ac.scholaSelectedIds}:null,flumen:flumen?{
      sources:flumen.scholaSources.map(s=>s.mode),
      source:scholaVocabularyProvenance(flumen)}:null,
      idCount:new Set(combined.map(e=>e.id)).size,total:combined.length};
  });
  assert.ok(result.ac&&result.flumen);
  assert.equal(result.ac.mode,'examen');
  assert.match(result.ac.source,/General: UD 7/);
  assert.match(result.ac.source,/Examen: UD 4/);
  assert.deepEqual(result.flumen.sources,['general','examen']);
  assert.match(result.flumen.source,/General: UD 5 · UD 8/);
  assert.match(result.flumen.source,/Examen: UD 4/);
  assert.equal(result.idCount,result.total);
  await page.locator('details.help').last().locator('summary').first().click();
  await page.locator('#search').fill('flumen');
  assert.equal(await page.locator('#dictionary .dictrow').count(),1,
    'Una ficha idéntica de General y Examen no puede duplicarse');
  assert.match(await page.locator('#dictionary .dictrow').first().textContent(),/General:.*Examen:/);
  await page.locator('#corpus').selectOption('general');
  await page.locator('#search').fill('flumen');
  assert.equal(await page.locator('#dictionary .dictrow').count(),0,
    'UD4 General no contiene flumen');
  await page.locator('#corpus').selectOption('examen');
  assert.equal(await page.locator('#dictionary .dictrow').count(),1,
    'UD4 Examen sí contiene flumen');
  await page.locator('#corpus').selectOption('all');
  await page.locator('#search').fill('');
  await page.locator('#corpus').selectOption('general');
  await page.locator('#none').click();
  await page.locator('#units input[value="UD 11–12"]').check();
  assert.equal(await page.locator('#start').isEnabled(),true);
  assert.match(await page.locator('#dictionary .dictrow').first().textContent(),
    /Ampliación · fuera de las unidades habituales/);
  await page.locator('#corpus').selectOption('examen');
  assert.equal(await page.locator('#units input[value="UD 11–12"]').count(),0,
    'La lista de Examen no hereda los bloques de ampliación');
  assert.match(await page.locator('#scope').textContent(),/lista docente/);
  await page.locator('#corpus').selectOption('all');
  assert.equal(await page.locator('#units input[value="UD 11–12"]').count(),1);
  // Latín 4.º: la ampliación existe en el banco pero nunca aparece
  // por defecto, ni siquiera al pulsar «Todas».
  await page.locator('#subject').selectOption('lat4');
  await page.locator('#corpus').selectOption('general');
  assert.equal(await page.locator('#schola-lat4-extra').isVisible(),true);
  assert.equal(await page.locator('#schola-lat4-extra-enabled').isChecked(),false);
  assert.equal(await page.locator('#units input[value="UD 9"]').count(),0);
  assert.equal(await page.locator('#units input[value="UD 10"]').count(),0);
  assert.equal(await page.locator('#units input').count(),8);
  assert.match(await page.locator('#scope').textContent(),/Mostrar ampliación/);
  await page.locator('#all').click();
  assert.equal(await page.locator('#units input:checked').count(),8);
  assert.equal(await page.locator('#start').isEnabled(),true);
  await page.locator('#schola-lat4-extra-enabled').check();
  assert.equal(await page.locator('#units input').count(),10);
  assert.equal(await page.locator('#units input:checked').count(),8,
    'Activar ampliación no marca automáticamente nuevos bloques');
  assert.match(await page.locator('#units input[value="UD 9"]')
    .locator('xpath=..').textContent(),/Ampliación/);
  await page.locator('#none').click();
  await page.locator('#units input[value="UD 10"]').check();
  await page.locator('#search').fill('lavor');
  assert.equal(await page.locator('#dictionary .dictrow').count(),1);
  assert.match(await page.locator('#dictionary .dictrow').first().textContent(),
    /uso medio-pasivo\/reflexivo de lavo/i);
  const historyBefore=await page.evaluate(()=>{
    const id=VOCAB.find(e=>e.subject==='lat4'&&e.mode==='general'&&
      e.form.startsWith('lavor,')).id;
    const state=JSON.parse(localStorage.getItem('classics-progress-v1')||'{}');
    state[id]={total:4,right:3,failed:true};
    localStorage.setItem('classics-progress-v1',JSON.stringify(state));
    return localStorage.getItem('classics-progress-v1');
  });
  await page.locator('#corpus').selectOption('examen');
  assert.equal(await page.locator('#units input[value="UD 9"]').count(),0);
  assert.equal(await page.locator('#units input[value="UD 10"]').count(),1);
  assert.match(await page.locator('#dictionary .dictrow').first().textContent(),
    /no es un verbo deponente puro/i);
  await page.locator('#corpus').selectOption('all');
  const combined=await page.evaluate(()=>{
    const card=scholaVocabularyAll(VOCAB,'lat4',['UD 10']).find(e=>
      e.form.startsWith('lavor,'));
    return card.scholaSources.map(s=>s.id);
  });
  assert.deepEqual(combined.sort(),['e9f4ac2d73fdd5c0','f17ac10e4e2d3b55'].sort());
  assert.match(await page.locator('#dictionary .dictrow').first().textContent(),
    /uso medio-pasivo\/reflexivo de lavo/i);
  await page.evaluate(()=>{
    const e=scholaVocabularyAll(VOCAB,'lat4',['UD 10']).find(x=>
      x.form.startsWith('lavor,'));
    start([e]);
  });
  await page.locator('#reveal').click();
  assert.match(await page.locator('#answerarea').textContent(),/medio-pasivo\/reflexivo/);
  await page.locator('#schola-lat4-extra-enabled').uncheck();
  assert.equal(await page.locator('#units input[value="UD 9"]').count(),0);
  assert.equal(await page.locator('#units input[value="UD 10"]').count(),0);
  assert.equal(await page.locator('#units input:checked').count(),0);
  assert.equal(await page.locator('#start').isDisabled(),true);
  assert.equal(await page.evaluate(()=>localStorage.getItem('classics-progress-v1')),historyBefore,
    'Ocultar ampliación no altera el progreso conservado');
  await page.locator('#schola-lat4-extra-enabled').check();
  await page.locator('#units input[value="UD 10"]').check();
  assert.equal(await page.locator('#start').isEnabled(),true);
  await page.setViewportSize({width:390,height:844});
  const extraBox=await page.locator('#schola-lat4-extra').boundingBox();
  assert.ok(extraBox&&extraBox.width<=390);
  await page.setViewportSize({width:1280,height:800});
  await page.locator('#search').fill('');
  await page.locator('#subject').selectOption('gr1');
  await page.locator('#corpus').selectOption('general');
  assert.equal(await page.locator('#units input[value="Sin unidad acreditada"]').count(),1);
  await page.locator('#units input[value="Sin unidad acreditada"]').check();
  assert.equal(await page.locator('#start').isEnabled(),true);
  assert.match(await page.locator('#dictionary .dictrow').first().textContent(),
    /Complementario · sin unidad asignada/);
  await page.setViewportSize({width:390,height:844});
  const compBox=await page.locator('#units input[value="Sin unidad acreditada"]')
    .locator('xpath=..').boundingBox();
  assert.ok(compBox&&compBox.width<=390,'El grupo debe caber en una pantalla móvil');
  await page.setViewportSize({width:1280,height:800});
  assert.equal(await page.locator('#open-teacher').count(),0,
    'La administración antigua no debe aparecer en la copia del alumnado');
  assert.equal(await page.locator('#teacher-dialog').count(),0);
  // La retirada autorizada del formulario impide nuevos avisos huérfanos.
  await page.locator('#corpus').selectOption('all');
  assert.equal(await page.locator('#open-report').count(),0);
  assert.equal(await page.locator('#report-dialog').count(),0);
  assert.equal(await page.locator('[data-report-id],[data-report-current]').count(),0);
  assert.equal(reports.length,0,'La interfaz ya no envía incidencias');
  assert.deepEqual(requests,[],'El vocabulario estático no debe llamar al backend');
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
  console.log('Vocabula integrado: vocabulario local, cursos y filtros; sin avisos ni backend público');
}finally{
  if(browser)await browser.close();
  await new Promise(done=>server.close(done));
}
