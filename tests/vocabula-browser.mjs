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
  // Aviso genérico desde Todo: la API recibe modo válido, pero el mensaje
  // conserva de forma explícita el corpus conjunto y la unidad elegida.
  await page.locator('#corpus').selectOption('all');
  await page.getByRole('button',{name:'Avisar de un error'}).click();
  assert.match(await page.locator('#report-dialog').textContent(),/Todo el vocabulario/);
  await page.locator('#report-message').fill('Una acepción alternativa debe revisarse.');
  await page.locator('#send-report').click();
  await page.getByText('Aviso enviado. Gracias por ayudar a mejorar el vocabulario.').waitFor();
  assert.equal(reports.length,1);
  assert.equal(reports[0].mode,'general');
  assert.equal(reports[0].entry_id,'');
  assert.match(reports[0].message,/Selección: Todo el vocabulario \(General y Examen\)/);
  assert.match(reports[0].message,/Unidades marcadas: Sin unidad acreditada/);
  assert.equal('scholaNote' in reports[0],false,'No ampliar el contrato del backend');
  await page.locator('#report-dialog [data-close="report-dialog"]').click();
  // El diccionario de Todo debe enviar la ficha combinada real, no la forma
  // recuperada por un único ID original.
  await page.locator('#subject').selectOption('lat1');
  await page.locator('#units input[value="UD 4"]').check();
  await page.locator('#search').fill('flumen');
  assert.equal(await page.locator('#dictionary .dictrow').count(),1);
  const origins=await page.evaluate(()=>{
    const card=scholaVocabularyAll(VOCAB,'lat1',['UD 4']).find(x=>
      x.form==='flumen, fluminis (n.)');
    return card.scholaSources.map(x=>({id:x.id,mode:x.mode,units:x.units}));
  });
  await page.locator('#dictionary .dictrow button[data-report-id]').first().click();
  assert.match(await page.locator('#report-dialog').textContent(),/Todo el vocabulario/);
  await page.locator('#report-message').fill('Revisar la acepción de flumen.');
  await page.locator('#send-report').click();
  await page.getByText('Aviso enviado. Gracias por ayudar a mejorar el vocabulario.').waitFor();
  assert.equal(reports.length,2);
  assert.equal(reports[1].mode,'examen','En UD4 la ficha representativa procede de Examen');
  assert.match(reports[1].message,/General \(UD 5 · UD 8\)/);
  assert.match(reports[1].message,/Examen \(UD 4\)/);
  for(const source of origins)assert.ok(reports[1].message.includes(source.id));
  assert.equal('scholaNote' in reports[1],false);
  await page.locator('#report-dialog [data-close="report-dialog"]').click();
  // En General y Examen el contenido del aviso del alumno sigue intacto.
  await page.locator('#corpus').selectOption('general');
  await page.getByRole('button',{name:'Avisar de un error'}).click();
  await page.locator('#report-message').fill('Aviso de General sin contexto añadido.');
  await page.locator('#send-report').click();
  await page.getByText('Aviso enviado. Gracias por ayudar a mejorar el vocabulario.').waitFor();
  assert.equal(reports[2].message,'Aviso de General sin contexto añadido.');
  assert.equal(reports[2].mode,'general');
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
