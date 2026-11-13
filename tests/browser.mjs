import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,join,extname,sep} from 'node:path';
import {chromium} from 'playwright';
const root=resolve(import.meta.dirname,'../dist');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.webmanifest':'application/manifest+json'};
const server=createServer(async(req,res)=>{
  try{
    const path=new URL(req.url,'http://localhost/').pathname;
    const file=resolve(root,decodeURIComponent(path.slice(1))+(path.endsWith('/')?'index.html':''));
    if(!file.startsWith(root+sep))throw Error('Ruta fuera de directorio');
    const s=await stat(file);if(!s.isFile())throw Error('No es archivo');
    res.setHeader('content-type',mime[extname(file)]||'application/octet-stream');
    res.writeHead(200);res.end(await readFile(file));
  }catch{res.writeHead(404);res.end('Not found')}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const base='http://127.0.0.1:'+server.address().port;
let browser;
try{
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));

  // Itinerario por curso: no genera contenidos ni modifica aplicaciones originales.
  const home=await page.goto(base+'/',{waitUntil:'networkidle'});
  assert.equal(home.status(),200);
  // Aspecto persistente y control independiente del tema del dispositivo.
  const picker=page.locator('#portal-theme');
  assert.equal(await picker.inputValue(),'system');
  await picker.selectOption('dark');
  assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
  await picker.selectOption('oled');
  assert.equal(await page.locator('html').getAttribute('data-theme'),'oled');
  assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).backgroundColor),
    'rgb(0, 0, 0)','OLED debe usar negro puro');
  await page.reload({waitUntil:'networkidle'});
  assert.equal(await picker.inputValue(),'oled','El aspecto debe persistir tras recargar');
  await page.emulateMedia({colorScheme:'dark'});
  await picker.selectOption('light');
  assert.equal(await page.locator('html').getAttribute('data-theme'),'light',
    'La opción claro debe prevalecer aunque el sistema esté oscuro');
  assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).backgroundColor),
    'rgb(248, 250, 252)');
  await picker.selectOption('system');
  assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
  await page.emulateMedia({colorScheme:'light'});
  await page.waitForFunction(()=>document.documentElement.dataset.theme==='light',null,{timeout:7000});
  assert.equal(await page.locator('html').getAttribute('data-theme'),'light');
  assert.equal(await page.evaluate(()=>localStorage.getItem('scholaclassica-aspecto-v1')),'system');
  // Palabra del día: enlace externo seguro, sin compartir cuentas ni cachés.
  const palabra=page.locator('#panel-herramientas a[href="https://archaiosmagister.github.io/Palabra-del-dia/4eso/"]');
  assert.equal(await palabra.getAttribute('target'),'_blank');
  assert.equal(await palabra.getAttribute('rel'),'noopener noreferrer');
  const coursePicker=page.locator('#study-course');
  assert.equal(await coursePicker.inputValue(),'','No debe haber asignatura por defecto la primera vez');
  assert.equal(await page.locator('.path-links a').count(),0);
  await coursePicker.selectOption('gr1');
  assert.equal(await page.locator('.path-links a').count(),5);
  assert.ok((await page.locator('.path-links').textContent()).includes('Etymologicon · Griego I'));
  assert.ok((await page.locator('.path-links').textContent()).includes('Palabra del día'));
  await coursePicker.selectOption('gr2');
  assert.equal(await page.locator('.path-links a').count(),1);
  assert.ok((await page.locator('.path-links').textContent()).includes('Gramática · Griego II'));
  await coursePicker.selectOption('lat4');
  assert.equal(await page.locator('.path-links a').count(),3);
  assert.ok((await page.locator('.path-links').textContent()).includes('Práctica de morfología · Latín de 4.º de ESO'));
  assert.ok((await page.locator('.path-links').textContent()).includes('Vocabulario · Latín de 4.º de ESO'));
  await coursePicker.selectOption('lat1');
  assert.equal(await page.locator('.path-links a').count(),5);
  await page.locator('.path-links a[data-study-tool="gramatica"]').click();
  await page.waitForURL(/\/apps\/gramatica\/curso\.html\?lengua=latin/);
  await page.goto(base+'/',{waitUntil:'networkidle'});
  assert.equal(await page.locator('#study-course').inputValue(),'lat1');
  assert.equal(await page.locator('#study-resume-area').isVisible(),true);
  assert.ok((await page.locator('#study-resume').getAttribute('href')).includes('curso.html?lengua=latin'));
  await coursePicker.selectOption('');
  assert.equal(await page.locator('#study-resume-area').isVisible(),false);
  assert.equal(await page.locator('.path-links a').count(),0);
  assert.equal(errors.length,0,'Itinerario por curso: '+errors.join(' | '));

  // El SW del portal solo guarda su núcleo y funciona sin red.
  await page.goto(base+'/',{waitUntil:'networkidle'});
  await page.waitForFunction(async()=>{
    const reg=await navigator.serviceWorker.getRegistration();
    return reg?.active&&reg.scope.endsWith('/')?true:false;
  },null,{timeout:16000});
  await page.reload({waitUntil:'networkidle'});
  assert.equal(await page.locator('#portal-update').count(),1);
  const rootCache=await page.evaluate(async()=>await caches.keys());
  assert.ok(rootCache.some(x=>x.startsWith('schola-portal-')),'No se generó la caché offline del portal');
  await page.context().setOffline(true);
  const rootOffline=await page.goto(base+'/',{waitUntil:'load'});
  assert.equal(rootOffline.status(),200,'La portada debe funcionar sin conexión');
  assert.equal(await page.locator('#study-course').count(),1);
  const shellAvailable=await page.evaluate(async()=>{
    const resources=['./app.js','./style.css','./manifest.webmanifest','./icons/apple-touch-icon.png'];
    const responses=await Promise.all(resources.map(p=>fetch(p)));
    return responses.every(r=>r.ok);
  });
  assert.equal(shellAvailable,true,'Falta un recurso del portal sin conexión');
  await page.context().setOffline(false);


  for(const route of ['/','/apps/gramatica/index.html','/apps/gramatica/val/index.html','/apps/gramatica/curso.html?lengua=latin&curso=1&unidad=1','/apps/gramatica/curso.html?lengua=griego&curso=1&unidad=1','/apps/gramatica/val/curso.html?lengua=griego&curso=1&unidad=1','/apps/etymologicon/index.html']){
    const r=await page.goto(base+route,{waitUntil:'networkidle'});
    assert.equal(r.status(),200,route);
    assert.ok(await page.locator('header').count(),'Falta encabezado en '+route);
    assert.equal(errors.length,0,'Error JavaScript en '+route+': '+errors.join(' | '));
  }
  // Portada: dos accesos grandes, ambos funcionales e independientes.
  const etymHome=await page.goto(base+'/apps/etymologicon/',{waitUntil:'networkidle'});
  assert.equal(etymHome.status(),200);
  assert.equal(await page.locator('.home-choice').count(),2);
  assert.equal(await page.locator('.header-nav .header-link').count(),3,
    'La portada debe usar botones para la navegación');
  assert.equal(await page.locator('.header-nav #home-check-update').count(),1);
  assert.ok(await page.locator('.header-nav #home-check-update').isVisible());
  assert.equal(await page.locator('.home-choice--practice').getAttribute('href'),'./practicar.html');
  assert.equal(await page.locator('.home-choice--study').getAttribute('href'),'./estudio.html');
  await page.locator('#home-theme-select').selectOption('dark');
  assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
  assert.equal(errors.length,0,'Errores en portada de Etymologicon');

  // Glosario académico de Griego I: 487 fichas, componentes y búsqueda de doble étimo.
  const studyPage=await page.goto(base+'/apps/etymologicon/estudio.html',{waitUntil:'networkidle'});
  assert.equal(studyPage.status(),200);
  await page.locator('#study-loading').waitFor({state:'hidden',timeout:12000});
  assert.ok((await page.locator('#study-count').textContent()).includes('derivados mostrados'));
  assert.equal(await page.locator('.lexicon-group').count(),111);
  assert.equal(await page.locator('.header-nav .header-link').count(),3);
  assert.equal(await page.locator('.header-nav #study-check-update').count(),1);
  await page.locator('#study-search').fill('filología');
  await page.locator('.lexicon-group').first().locator('summary').click();
  assert.ok(await page.locator('.lexical-word').count()>0);
  assert.ok((await page.locator('.lexical-components').first().textContent()).includes('φίλος'));
  assert.ok((await page.locator('.lexical-components').first().textContent()).includes('λόγος'));
  await page.locator('#study-search').fill('antropomorfismo');
  assert.ok((await page.locator('.lexical-components').first().textContent()).includes('μορφή'),
    'Debe mostrarse también μορφή, no solo ἄνθρωπος');
  await page.locator('#study-search').fill('telegrama');
  const telegramParts=await page.locator('.lexical-components').first().textContent();
  assert.ok(telegramParts.includes('τῆλε')&&telegramParts.includes('γράμμα'),
    'Telegrama debe presentar τῆλε y γράμμα');
  const greekTypeface=await page.locator('.component-greek').first()
    .evaluate(el=>getComputedStyle(el).fontFamily);
  assert.ok(greekTypeface.includes('Times New Roman'),'Fuente politónica coherente: '+greekTypeface);
  // Las distinciones lingüísticas se conservan; los metadatos docentes no se exhiben.
  await page.locator('#study-search').fill('autarquía');
  assert.ok((await page.locator('.lexical-alert').first().textContent()).includes('autarquía²'));
  assert.ok((await page.locator('.lexical-definition').first().textContent()).includes('autosuficiencia'));
  await page.locator('#study-search').fill('plastilina');
  assert.ok((await page.locator('.lexical-alert').first().textContent()).includes('marca registrada'));
  await page.locator('#study-search').fill('seudociencia');
  assert.ok((await page.locator('.lexical-alert').first().textContent())
    .includes('No figura como entrada independiente en el DLE'));
  await page.locator('#study-search').fill('biología');
  assert.equal(await page.locator('.lexical-evidence, .lexical-source').count(),0);
  await page.locator('#study-search').fill('filosofía');
  assert.ok((await page.locator('.lexical-components').first().textContent()).includes('σοφία'));
  await page.locator('#study-search').fill('misoginia');
  assert.ok((await page.locator('.lexical-components').first().textContent()).includes('γυνή'));
  await page.locator('#study-search').fill('');
  await page.locator('#study-unit').selectOption('UD1');
  assert.ok((await page.locator('.lexicon-group').count())<111);
  await page.locator('#study-unit').selectOption('all');
  await page.locator('#study-theme').selectOption('oled');
  assert.equal(await page.locator('html').getAttribute('data-theme'),'oled');
  assert.equal(errors.length,0,'Error JavaScript del glosario: '+errors.join(' | '));

  // Etymologicon: integración funcional del motor con la pantalla y el banco filtrado.
  const etymologicon=await page.goto(base+'/apps/etymologicon/practicar.html',{waitUntil:'networkidle'});
  assert.equal(etymologicon.status(),200);
  await page.locator('#exercise-content').waitFor({state:'visible',timeout:12000});
  assert.equal(await page.locator('#etymon-select option').count(),108);
  assert.equal(await page.locator('#unit-select').isDisabled(),false,'La unidad no debe estar en gris tras cargar');
  assert.equal(await page.locator('#unit-select').inputValue(),'all');
  await page.locator('#unit-select').selectOption('UD4');
  assert.equal(await page.locator('#practice-mode').inputValue(),'unit',
    'Elegir una UD activa automáticamente el modo de unidad');
  assert.ok(await page.locator('#etymon-select option').count()<108);
  await page.locator('#unit-select').selectOption('all');
  assert.equal(await page.locator('#practice-mode').inputValue(),'general',
    'Todas las unidades devuelve al repaso general');
  assert.equal(await page.locator('#etymon-select option').count(),108);
  assert.equal(await page.locator('#course-select option[value="gr2"]').isDisabled(),true);
  await page.locator('#etymon-select').selectOption('grc:προσ');
  assert.ok((await page.locator('#exercise-title').textContent()).includes('πρός'));
  assert.equal(await page.locator('.header-nav .header-link').count(),3);
  assert.ok(await page.locator('.header-nav #check-update').isVisible());
  const wordFont=await page.locator('#exercise-title')
    .evaluate(el=>getComputedStyle(el).fontFamily);
  assert.ok(wordFont.includes('Times New Roman'),'Fuente sin fallback Georgia: '+wordFont);
  assert.equal(await page.locator('#meaning-card').isHidden(),true,
    'No revelar el significado del étimo antes del intento');
  await page.getByLabel('Primer derivado').fill('proselito');
  await page.getByLabel('Segundo derivado').fill('prosodia');
  await page.getByRole('button',{name:'Corregir respuestas'}).click();
  assert.equal((await page.locator('#result-total').textContent()).trim(),'1,5 / 2 puntos');
  assert.equal(await page.locator('#meaning-card').isVisible(),true,
    'Revelar el significado al reconocer el derivado incluso con falta ortográfica');
  assert.ok((await page.locator('#meaning').textContent()).trim().length>0);
  assert.ok((await page.locator('#result-items').textContent()).includes('prosélito'));
  assert.ok(await page.locator('#result-items mark').count()>=2,'Las erratas deben resaltarse visualmente');
  await page.getByLabel('Primer derivado').fill('prosélito');
  assert.equal(await page.locator('#results').isHidden(),true,'Al editar no debe quedar una nota desactualizada');
  assert.equal(await page.locator('#meaning-card').isHidden(),true,
    'Volver a ocultar el significado si se modifica la respuesta');
  await page.getByLabel('Segundo derivado').fill('prosélito');
  await page.getByRole('button',{name:'Corregir respuestas'}).click();
  assert.equal((await page.locator('#result-total').textContent()).trim(),'1 / 2 puntos');
  assert.ok((await page.locator('#result-items').textContent()).includes('Derivado repetido'));
  assert.equal((await page.locator('#stats-exercises').textContent()).trim(),'2');
  assert.equal((await page.locator('#stats-pending').textContent()).trim(),'1');
  // Modo errores: sólo vuelve el étimo que requiere repetición.
  await page.locator('#practice-mode').selectOption('errors');
  assert.equal(await page.locator('#etymon-select option').count(),1);
  assert.equal(await page.locator('#etymon-select').inputValue(),'grc:προσ');
  await page.getByLabel('Primer derivado').fill('prosélito');
  await page.getByLabel('Segundo derivado').fill('prosodia');
  await page.getByRole('button',{name:'Corregir respuestas'}).click();
  assert.equal((await page.locator('#stats-exercises').textContent()).trim(),'3');
  assert.equal((await page.locator('#stats-pending').textContent()).trim(),'1',
    'Una repetición correcta no debe borrar inmediatamente el error anterior');
  await page.getByRole('button',{name:'Borrar respuestas'}).click();
  await page.getByLabel('Primer derivado').fill('prosélito');
  await page.getByLabel('Segundo derivado').fill('prosodia');
  await page.getByRole('button',{name:'Corregir respuestas'}).click();
  assert.equal((await page.locator('#stats-pending').textContent()).trim(),'0',
    'Dos repeticiones perfectas deben cerrar el error');
  assert.equal((await page.locator('#stats-exercises').textContent()).trim(),'4');
  await page.getByRole('button',{name:'Practicar otro étimo'}).click();
  assert.equal(await page.locator('#practice-empty').isVisible(),true);
  assert.equal(await page.locator('#answer-form').isHidden(),true);
  await page.locator('#practice-mode').selectOption('general');
  assert.equal(await page.locator('#etymon-select option').count(),108);
  // Exportación sin datos personales ni respuestas, borrado voluntario e importación.
  const pendingDownload=page.waitForEvent('download');
  await page.getByRole('button',{name:'Exportar progreso'}).click();
  const download=await pendingDownload;
  assert.match(download.suggestedFilename(),/etymologicon-progreso-.*\.json$/);
  const exported=await readFile(await download.path(),'utf8');
  const parsed=JSON.parse(exported);
  assert.equal(parsed.schema,'etymologicon-progress/v1');
  assert.equal(parsed.courses.gr1.records['grc:προσ'].attempts,4);
  assert.deepEqual(parsed.courses.gr2.records,{});
  assert.ok(!exported.includes('"submitted"'));
  page.once('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'Borrar mis estadísticas'}).click();
  assert.equal((await page.locator('#stats-exercises').textContent()).trim(),'0');
  await page.locator('#import-file').setInputFiles({
    name:'invalido.json',mimeType:'application/json',buffer:Buffer.from('{datos corruptos')
  });
  await page.waitForFunction(()=>document.querySelector('#progress-status')?.textContent.includes('Importación rechazada'),
    null,{timeout:10000});
  assert.equal((await page.locator('#stats-exercises').textContent()).trim(),'0');
  await page.locator('#import-file').setInputFiles({
    name:'progreso.json',mimeType:'application/json',buffer:Buffer.from(exported)
  });
  await page.locator('#import-preview').waitFor({state:'visible',timeout:10000});
  assert.ok((await page.locator('#import-description').textContent()).includes('4 ejercicios'));
  await page.getByRole('button',{name:'Confirmar importación'}).click();
  assert.equal((await page.locator('#stats-exercises').textContent()).trim(),'4');
  assert.equal((await page.locator('#stats-pending').textContent()).trim(),'0');
  await page.reload({waitUntil:'networkidle'});
  await page.locator('#exercise-content').waitFor({state:'visible',timeout:10000});
  assert.equal((await page.locator('#stats-exercises').textContent()).trim(),'4',
    'Las estadísticas deben sobrevivir a una recarga de la PWA');
  await page.locator('#practice-mode').selectOption('unit');
  await page.locator('#unit-select').selectOption('UD1');
  assert.ok(await page.locator('#etymon-select option').count()>0,'Filtro por unidad vacío');
  await page.locator('#practice-mode').selectOption('general');
  assert.equal(await page.locator('#etymon-select option').count(),108);
  await page.getByRole('button',{name:'Otro étimo'}).click();
  assert.equal(await page.locator('#results').isHidden(),true,'El siguiente étimo debe limpiar el resultado anterior');
  // Las tarjetas se mantienen ocultas hasta revelar la solución y su
  // autoevaluación NO altera las notas objetivas del corrector.
  await page.locator('#activity-type').selectOption('cards');
  await page.locator('#etymon-select').selectOption('grc:προσ');
  assert.equal(await page.locator('#flashcard-section').isVisible(),true);
  assert.equal(await page.locator('#flashcard-back').isHidden(),true);
  assert.equal(await page.locator('#answer-form').isHidden(),true);
  assert.equal(await page.locator('#meaning').isHidden(),true);
  await page.getByRole('button',{name:'Mostrar significado y derivados'}).click();
  assert.equal(await page.locator('#flashcard-back').isVisible(),true);
  assert.equal(await page.locator('#meaning-card').isVisible(),true,
    'Al revelar la tarjeta aparece el significado destacado bajo el lema');
  assert.ok((await page.locator('#flashcard-derivatives').textContent()).includes('prosélito'));
  await page.getByRole('button',{name:'Necesito repasarlo'}).click();
  assert.equal((await page.locator('#stats-cards').textContent()).trim(),'1');
  assert.equal((await page.locator('#stats-cards-forgotten').textContent()).trim(),'1');
  await page.locator('#practice-mode').selectOption('errors');
  assert.equal(await page.locator('#etymon-select option').count(),1);
  await page.locator('#practice-mode').selectOption('general');
  // La relación usa derivados unívocos para los étimos mostrados.
  await page.locator('#activity-type').selectOption('matching');
  assert.equal(await page.locator('#matching-section').isVisible(),true);
  assert.equal(await page.locator('#etymon-field').isHidden(),true);
  const pairs=await page.evaluate(async()=>{
    const catalog=await fetch('./data/gr1.json').then(r=>r.json());
    const {createStudyBank}=await import('./study.mjs');
    const bank=createStudyBank(catalog);
    const spanish=[...document.querySelectorAll('#matching-spanish button')].map(x=>x.dataset.id);
    return [...document.querySelectorAll('#matching-greek button')].map(x=>({
      id:x.dataset.id,
      derivativeId:spanish.find(id=>bank.getCard(x.dataset.id).derivatives.some(d=>d.id===id))
    }));
  });
  assert.equal(pairs.length,4);
  assert.ok(pairs.every(p=>p.derivativeId));
  const greekButton=id=>page.locator('#matching-greek button[data-id="'+id+'"]');
  const spanishButton=id=>page.locator('#matching-spanish button[data-id="'+id+'"]');
  await greekButton(pairs[0].id).click();
  await spanishButton(pairs[1].derivativeId).click();
  assert.ok((await page.locator('#matching-feedback').textContent()).includes('No corresponde'));
  for(const pair of pairs){
    await greekButton(pair.id).click();
    await spanishButton(pair.derivativeId).click();
  }
  assert.ok((await page.locator('#matching-score').textContent()).includes('3 de 4 parejas'));
  assert.equal(await page.locator('.matched-meaning').count(),4,
    'Mostrar el significado de cada étimo emparejado correctamente');
  assert.equal((await page.locator('#stats-pairs').textContent()).trim(),'4');
  assert.equal((await page.locator('#stats-pairs-correct').textContent()).trim(),'3');
  await page.getByRole('button',{name:'Otra ronda'}).click();
  assert.equal(await page.locator('#matching-score').isHidden(),true);
  await page.locator('#activity-type').selectOption('writing');
  assert.equal(await page.locator('#answer-form').isVisible(),true);
  assert.equal(await page.locator('#matching-section').isHidden(),true);

  // Respuesta múltiple: solo un derivado aprobado; nota independiente.
  await page.locator('#activity-type').selectOption('mcq');
  await page.locator('#etymon-select').selectOption('grc:προσ');
  assert.equal(await page.locator('#mcq-section').isVisible(),true);
  assert.equal(await page.locator('#mcq-options button').count(),4);
  const multipleIds=await page.evaluate(async()=>{
    const catalog=await fetch('./data/gr1.json').then(r=>r.json());
    const own=new Set(catalog.etymons.find(e=>e.id==='grc:προσ').teacherApprovedDerivatives);
    const options=[...document.querySelectorAll('#mcq-options button')].map(x=>x.dataset.derivativeId);
    return {correct:options.find(id=>own.has(id)),wrong:options.find(id=>!own.has(id))};
  });
  assert.ok(multipleIds.correct&&multipleIds.wrong);
  await page.locator('#mcq-options button[data-derivative-id="'+multipleIds.wrong+'"]').click();
  assert.ok((await page.locator('#mcq-feedback').textContent()).includes('0 / 1 punto'));
  assert.equal(await page.locator('#meaning-card').isHidden(),true,
    'La elección incorrecta no desvela el significado hasta corregir');
  assert.equal((await page.locator('#stats-mcq').textContent()).trim(),'1');
  assert.equal((await page.locator('#stats-mcq-correct').textContent()).trim(),'0');
  await page.locator('#mcq-options button[data-derivative-id="'+multipleIds.correct+'"]').evaluate(el=>el.click());
  assert.equal((await page.locator('#stats-mcq').textContent()).trim(),'1',
    'La pregunta se debe calificar solamente una vez');
  await page.getByRole('button',{name:'Otra pregunta'}).click();
  const currentCorrectId=await page.evaluate(async()=>{
    const catalog=await fetch('./data/gr1.json').then(r=>r.json());
    const selected=document.querySelector('#etymon-select').value;
    const owned=new Set(catalog.etymons.find(e=>e.id===selected).teacherApprovedDerivatives);
    return [...document.querySelectorAll('#mcq-options button')]
      .map(x=>x.dataset.derivativeId).find(id=>owned.has(id));
  });
  await page.locator('#mcq-options button[data-derivative-id="'+currentCorrectId+'"]').click();
  assert.equal((await page.locator('#stats-mcq').textContent()).trim(),'2');
  assert.equal((await page.locator('#stats-mcq-correct').textContent()).trim(),'1');
  assert.equal(await page.locator('#meaning-card').isVisible(),true,
    'Se muestra el significado tras la respuesta múltiple acertada');

  // Inversa: transliteración sin instalar teclado griego, vista previa,
  // respuesta griega sin tildes/espíritus y teclado virtual.
  await page.locator('#activity-type').selectOption('inverse');
  assert.equal(await page.locator('#inverse-section').isVisible(),true);
  assert.ok(await page.locator('#inverse-word').textContent());
  assert.equal(await page.locator('#inverse-meaning-card').isHidden(),true);
  await page.locator('#inverse-answer').fill('philos');
  assert.ok((await page.locator('#inverse-preview').textContent()).includes('φίλος'));
  const currentHeadword=await page.evaluate(async()=>{
    const catalog=await fetch('./data/gr1.json').then(r=>r.json());
    const id=document.querySelector('#etymon-select').value;
    return catalog.etymons.find(e=>e.id===id).lemma.split(/[|,]/)[0]
      .replace(/\s*\(.*/,'').trim().normalize('NFD').replace(/\p{M}/gu,'').replace(/ς/g,'σ');
  });
  await page.locator('#inverse-answer').fill(currentHeadword);
  await page.getByRole('button',{name:'Comprobar étimo'}).click();
  assert.ok((await page.locator('#inverse-feedback').textContent()).includes('1 / 1 punto'));
  assert.equal(await page.locator('#inverse-meaning-card').isVisible(),true);
  assert.ok((await page.locator('#inverse-meaning').textContent()).length>10);
  assert.equal((await page.locator('#stats-inverse').textContent()).trim(),'1');
  assert.equal((await page.locator('#stats-inverse-correct').textContent()).trim(),'1');
  await page.getByRole('button',{name:'Otra palabra'}).click();
  await page.locator('#inverse-section details.virtual-keyboard summary').click();
  await page.getByRole('button',{name:'Insertar λ'}).click();
  assert.ok((await page.locator('#inverse-answer').inputValue()).includes('λ'));
  await page.locator('#inverse-answer').fill('loogs');
  await page.getByRole('button',{name:'Comprobar étimo'}).click();
  assert.ok((await page.locator('#inverse-feedback').textContent()).includes('0 / 1 punto'));
  assert.equal(await page.locator('#inverse-meaning-card').isHidden(),true);
  assert.equal((await page.locator('#stats-inverse').textContent()).trim(),'2');
  await page.locator('#activity-type').selectOption('writing');
  assert.equal(await page.locator('#answer-form').isVisible(),true);

  // Piloto de composición con evidencias DLE, no todos los 201 derivados.
  await page.locator('#activity-type').selectOption('decomposition');
  assert.equal(await page.locator('#decomposition-section').isVisible(),true);
  assert.equal(await page.locator('#answer-form').isHidden(),true);
  assert.equal(await page.locator('#etymon-field').isHidden(),true);
  assert.ok((await page.locator('#pool-size').textContent()).includes('16 palabras'));
  const firstCompound=await page.evaluate(async()=>{
    const audit=await fetch('./data/gr1-decomposition.json').then(r=>r.json());
    const selected=document.querySelector('#decomposition-word').textContent;
    return audit.entries.find(e=>e.form===selected);
  });
  assert.ok(firstCompound&&firstCompound.parts.length===2);
  await page.locator('#decomposition-first').fill(firstCompound.parts[0].latinAccepted[0]);
  await page.locator('#decomposition-second').fill(firstCompound.parts[1].latinAccepted[0]);
  await page.getByRole('button',{name:'Corregir descomposición'}).click();
  assert.ok((await page.locator('#decomposition-score').textContent()).includes('2 / 2 puntos'));
  assert.equal(await page.locator('#decomposition-meaning-card').isVisible(),true);
  assert.ok((await page.locator('#decomposition-meaning').textContent()).trim().length>10);
  assert.equal((await page.locator('#stats-decomposition').textContent()).trim(),'1');
  assert.equal((await page.locator('#stats-decomposition-perfect').textContent()).trim(),'1');
  assert.ok((await page.locator('#decomposition-route').textContent()).length>20);
  assert.ok((await page.locator('#decomposition-source').getAttribute('href')).startsWith('https://dle.rae.es/'));
  await page.getByRole('button',{name:'Otra palabra'}).click();
  assert.notEqual((await page.locator('#decomposition-word').textContent()),firstCompound.form);
  const secondCompound=await page.evaluate(async()=>{
    const audit=await fetch('./data/gr1-decomposition.json').then(r=>r.json());
    return audit.entries.find(e=>e.form===document.querySelector('#decomposition-word').textContent);
  });
  await page.locator('#decomposition-first').fill('sohpia');
  await page.locator('#decomposition-second').fill(secondCompound.parts[1].greek
    .normalize('NFD').replace(/\p{M}/gu,''));
  await page.getByRole('button',{name:'Corregir descomposición'}).click();
  assert.ok((await page.locator('#decomposition-score').textContent()).includes('1 / 2 puntos'));
  assert.equal(await page.locator('#decomposition-meaning-card').isHidden(),true);
  assert.equal((await page.locator('#stats-decomposition').textContent()).trim(),'2');
  assert.equal((await page.locator('#stats-decomposition-perfect').textContent()).trim(),'1');
  await page.locator('#practice-mode').selectOption('unit');
  await page.locator('#unit-select').selectOption('UD12');
  assert.ok((await page.locator('#pool-size').textContent()).includes('16 palabras'));
  await page.locator('#practice-mode').selectOption('general');
  await page.locator('details.virtual-keyboard').last().locator('summary').click();
  await page.locator('#decomposition-first').focus();
  await page.getByRole('button',{name:'Insertar λ'}).last().click();
  assert.ok((await page.locator('#decomposition-first').inputValue()).includes('λ'));
  await page.locator('#activity-type').selectOption('writing');
  assert.equal(await page.locator('#answer-form').isVisible(),true);

  await page.locator('#theme-select').selectOption('oled');
  assert.equal(await page.locator('html').getAttribute('data-theme'),'oled');
  await page.reload({waitUntil:'networkidle'});
  await page.locator('#exercise-content').waitFor({state:'visible',timeout:10000});
  assert.equal(await page.locator('html').getAttribute('data-theme'),'oled');
  await page.setViewportSize({width:390,height:844});
  const layoutFits=await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2);
  assert.equal(layoutFits,true,'La interfaz debe adaptarse a un móvil de 390 px');
  await page.setViewportSize({width:1280,height:900});
  assert.equal(errors.length,0,'Error JavaScript de Etymologicon: '+errors.join(' | '));

  // Móvil táctil: al abrir el teclado integrado no debe abrirse a la vez
  // el teclado del dispositivo ni perderse la entrada en los campos.
  const phone=await browser.newPage({viewport:{width:390,height:844},
    isMobile:true,hasTouch:true,deviceScaleFactor:2});
  const phoneErrors=[];
  phone.on('pageerror',e=>phoneErrors.push(e.message));
  await phone.goto(base+'/apps/etymologicon/practicar.html',{waitUntil:'networkidle'});
  await phone.locator('#exercise-content').waitFor({state:'visible',timeout:12000});
  await phone.locator('#activity-type').selectOption('inverse');
  await phone.locator('#inverse-answer').focus();
  await phone.locator('#inverse-section details.virtual-keyboard summary').click();
  await phone.waitForFunction(()=>document.querySelector('#inverse-answer').readOnly);
  assert.equal(await phone.locator('#inverse-answer').getAttribute('readonly'),'',
    'En móvil el teclado virtual impide levantar el nativo');
  await phone.getByRole('button',{name:'Insertar λ'}).click();
  assert.ok((await phone.locator('#inverse-answer').inputValue()).includes('λ'));
  const inverseVisibility=await phone.evaluate(()=>{
    const input=document.querySelector('#inverse-answer').getBoundingClientRect();
    const keys=document.querySelector('#greek-keyboard').getBoundingClientRect();
    const h=window.visualViewport?.height||innerHeight;
    return {inputTop:input.top,inputBottom:input.bottom,keyTop:keys.top,keyBottom:keys.bottom,height:h};
  });
  assert.ok(inverseVisibility.inputTop>=0&&inverseVisibility.keyBottom<=inverseVisibility.height+8,
    'Campo y teclado griego deben poder verse juntos a 390 × 844: '+JSON.stringify(inverseVisibility));
  await phone.locator('#inverse-section .native-keyboard-button').click();
  await phone.waitForFunction(()=>!document.querySelector('#inverse-answer').readOnly);
  await phone.locator('#inverse-answer').fill('logos');
  await phone.locator('#activity-type').selectOption('decomposition');
  await phone.locator('#decomposition-first').focus();
  await phone.locator('#decomposition-section details.virtual-keyboard summary').click();
  await phone.waitForFunction(()=>['decomposition-first','decomposition-second']
    .every(id=>document.getElementById(id).readOnly));
  await phone.getByRole('button',{name:'Insertar μ'}).last().click();
  assert.ok((await phone.locator('#decomposition-first').inputValue()).includes('μ'));
  await phone.locator('#decomposition-section .native-keyboard-button').click();
  await phone.waitForFunction(()=>!document.getElementById('decomposition-first').readOnly);
  assert.equal(phoneErrors.length,0,'El teclado móvil no debe producir errores JS');
  await phone.close();

  // Instalación PWA: manifiesto independiente, caché delimitada y recursos
  // disponibles tras desconectar la red (incluidos banco y motor corrector).
  const manifest=await page.evaluate(async()=>{
    const link=document.querySelector('link[rel="manifest"]');
    const response=await fetch(link.href);
    return response.json();
  });
  assert.equal(manifest.scope,'./');
  assert.equal(manifest.start_url,'./index.html');
  assert.equal(manifest.display,'standalone');
  assert.ok(manifest.icons.some(x=>x.purpose==='maskable'&&x.sizes==='512x512'));
  assert.equal(await page.locator('link[rel="apple-touch-icon"]').count(),1);
  const scopeHandle=await page.waitForFunction(async()=>{
    const reg=await navigator.serviceWorker.getRegistration();
    return reg?.active&&navigator.serviceWorker.controller?reg.scope:false;
  },null,{timeout:15000});
  const etymScope=await scopeHandle.jsonValue();
  assert.ok(etymScope.endsWith('/apps/etymologicon/'),'SW debe limitarse al módulo: '+etymScope);
  const etymCaches=await page.evaluate(async()=>await caches.keys());
  assert.ok(etymCaches.some(x=>x.startsWith('schola-etymologicon-')),
    'No existe caché offline de Etymologicon');
  await page.context().setOffline(true);
  const offlinePage=await page.goto(base+'/apps/etymologicon/',{waitUntil:'load'});
  assert.equal(offlinePage.status(),200,'La portada debe abrir sin conexión tras la precarga');
  assert.equal(await page.locator('.home-choice').count(),2);
  const offlinePractice=await page.goto(base+'/apps/etymologicon/practicar.html',{waitUntil:'load'});
  assert.equal(offlinePractice.status(),200,'La práctica debe seguir accesible sin conexión');
  await page.locator('#exercise-content').waitFor({state:'visible',timeout:12000});
  const offlineResources=await page.evaluate(async()=>{
    const urls=['./manifest.webmanifest','./icons/icon-192.png',
      './data/gr1.json','./corrector/write-two.mjs','./progress.mjs',
      './study.mjs','./activities-ui.mjs','./quiz.mjs','./quiz-ui.mjs',
      './decomposition.mjs','./decomposition-ui.mjs',
      './greek-keyboard.mjs','./data/gr1-decomposition.json'];
    return Promise.all(urls.map(async path=>{
      const response=await fetch(path);
      return response.ok;
    }));
  });
  assert.ok(offlineResources.every(Boolean),'Un recurso esencial de Etymologicon no está disponible offline');
  await page.locator('#etymon-select').selectOption('grc:προσ');
  await page.getByLabel('Primer derivado').fill('proselito');
  await page.getByLabel('Segundo derivado').fill('prosodia');
  await page.getByRole('button',{name:'Corregir respuestas'}).click();
  assert.equal((await page.locator('#result-total').textContent()).trim(),'1,5 / 2 puntos',
    'El corrector debe funcionar íntegramente offline');
  assert.equal((await page.locator('#stats-exercises').textContent()).trim(),'5',
    'El progreso se debe registrar incluso sin conexión');
  await page.locator('#practice-mode').selectOption('unit');
  await page.locator('#unit-select').selectOption('UD1');
  assert.ok(await page.locator('#etymon-select option').count()>0,
    'El selector de unidades también debe funcionar offline');
  await page.locator('#practice-mode').selectOption('general');
  await page.locator('#activity-type').selectOption('cards');
  await page.locator('#etymon-select').selectOption('grc:προσ');
  await page.getByRole('button',{name:'Mostrar significado y derivados'}).click();
  await page.getByRole('button',{name:'Lo recordaba'}).click();
  assert.equal((await page.locator('#stats-cards').textContent()).trim(),'2');
  await page.locator('#activity-type').selectOption('matching');
  assert.equal(await page.locator('#matching-section').isVisible(),true);
  assert.equal(await page.locator('#matching-greek button').count(),4);
  // Todas las correspondencias se resuelven a partir del banco cacheado.
  const offlinePairs=await page.evaluate(async()=>{
    const catalog=await fetch('./data/gr1.json').then(r=>r.json());
    const {createStudyBank}=await import('./study.mjs');
    const bank=createStudyBank(catalog);
    const spanish=[...document.querySelectorAll('#matching-spanish button')].map(x=>x.dataset.id);
    return [...document.querySelectorAll('#matching-greek button')].map(x=>({
      id:x.dataset.id,
      derivativeId:spanish.find(id=>bank.getCard(x.dataset.id).derivatives.some(d=>d.id===id))
    }));
  });
  for(const pair of offlinePairs){
    await page.locator('#matching-greek button[data-id="'+pair.id+'"]').click();
    await page.locator('#matching-spanish button[data-id="'+pair.derivativeId+'"]').click();
  }
  assert.ok((await page.locator('#matching-score').textContent()).includes('4 de 4 parejas'));
  assert.equal((await page.locator('#stats-pairs').textContent()).trim(),'8');
  await page.locator('#activity-type').selectOption('mcq');
  assert.equal(await page.locator('#mcq-options button').count(),4);
  const mcqCorrectId=await page.evaluate(async()=>{
    const catalog=await fetch('./data/gr1.json').then(r=>r.json());
    const id=document.querySelector('#etymon-select').value;
    const approved=new Set(catalog.etymons.find(x=>x.id===id).teacherApprovedDerivatives);
    return [...document.querySelectorAll('#mcq-options button')]
      .map(x=>x.dataset.derivativeId).find(x=>approved.has(x));
  });
  await page.locator('#mcq-options button[data-derivative-id="'+mcqCorrectId+'"]').click();
  assert.equal((await page.locator('#stats-mcq').textContent()).trim(),'3');
  await page.locator('#activity-type').selectOption('inverse');
  const greekWord=await page.evaluate(async()=>{
    const catalog=await fetch('./data/gr1.json').then(r=>r.json());
    const id=document.querySelector('#etymon-select').value;
    return catalog.etymons.find(x=>x.id===id).lemma.split(/[|,]/)[0]
      .replace(/\s*\(.*/,'').trim().normalize('NFD').replace(/\p{M}/gu,'').replace(/ς/g,'σ');
  });
  await page.locator('#inverse-answer').fill(greekWord);
  await page.getByRole('button',{name:'Comprobar étimo'}).click();
  assert.ok((await page.locator('#inverse-feedback').textContent()).includes('1 / 1 punto'));
  assert.equal((await page.locator('#stats-inverse').textContent()).trim(),'3');
  await page.locator('#activity-type').selectOption('decomposition');
  assert.equal(await page.locator('#decomposition-section').isVisible(),true);
  const offlineCompound=await page.evaluate(async()=>{
    const data=await fetch('./data/gr1-decomposition.json').then(r=>r.json());
    return data.entries.find(x=>x.form===document.querySelector('#decomposition-word').textContent);
  });
  await page.locator('#decomposition-first').fill(offlineCompound.parts[0].greek
    .normalize('NFD').replace(/\p{M}/gu,''));
  await page.locator('#decomposition-second').fill(offlineCompound.parts[1].latinAccepted[0]);
  await page.getByRole('button',{name:'Corregir descomposición'}).click();
  assert.ok((await page.locator('#decomposition-score').textContent()).includes('2 / 2 puntos'));
  assert.equal((await page.locator('#stats-decomposition').textContent()).trim(),'3');
  assert.equal((await page.locator('#stats-decomposition-perfect').textContent()).trim(),'2');
  await page.locator('#activity-type').selectOption('writing');
  await page.context().setOffline(false);
  await page.locator('#check-update').click();
  await page.waitForFunction(()=>!document.querySelector('#check-update').disabled,
    null,{timeout:12000});
  assert.equal(errors.length,0,'PWA Etymologicon sin errores JS: '+errors.join(' | '));

  await page.goto(base+'/');
  await page.evaluate(async()=>{await caches.open('otra-aplicacion-no-borrar')});
  const evolutio=await page.goto(base+'/apps/evolucion-fonetica/index.html',{waitUntil:'networkidle'});
  assert.equal(evolutio.status(),200);
  await page.waitForFunction(async()=>Boolean((await navigator.serviceWorker.getRegistration())?.active),null,{timeout:12000});
  const names=await page.evaluate(async()=>await caches.keys());
  assert.ok(names.includes('otra-aplicacion-no-borrar'),'Evolutio no debe borrar las cachés de otras aplicaciones');
  assert.ok(names.some(x=>x.startsWith('schola-evolutio-')),'Falta la caché integrada de Evolutio');
  assert.ok(names.some(x=>x.startsWith('schola-etymologicon-')),
    'Evolutio no debe eliminar la caché de Etymologicon');
  assert.equal(await page.locator('#app .fatal').count(),0,'Evolutio muestra error inicial');
  assert.equal(await page.locator('#refresh-app').count(),1,'El nuevo botón Actualizar debe existir');
  assert.equal(await page.evaluate(async()=>(await fetch('./data/pilot.json').then(r=>r.json())).words.length),522,
    'Evolutio debe mostrar las 522 fichas de la versión nueva');
  await page.context().setOffline(true);
  await page.reload({waitUntil:'load'});
  await page.waitForFunction(()=>!document.querySelector('#app .loading'),null,{timeout:10000});
  assert.equal(await page.locator('#app .fatal').count(),0,'Evolutio falla sin conexión');
  const newOfflineResources=await page.evaluate(async()=>{
    const paths=['./src/difficulty.mjs','./src/result-difficulty.mjs','./src/latin.mjs','./src/update.mjs','./data/difficulty.json'];
    const results=await Promise.all(paths.map(p=>fetch(p).then(r=>r.ok).catch(()=>false)));
    return results.every(Boolean);
  });
  assert.equal(newOfflineResources,true,'Faltan los nuevos recursos de Evolutio sin conexión');
  const postEvolutioCaches=await page.evaluate(async()=>await caches.keys());
  assert.ok(postEvolutioCaches.some(k=>k.startsWith('schola-portal-')),
    'Evolutio borró la caché de la portada');
  await page.context().setOffline(false);
  assert.equal(errors.length,0,'Error JavaScript de Evolutio: '+errors.join(' | '));
  await page.goto(base+'/');
  await page.getByRole('tab',{name:'Por herramienta'}).click();
  assert.equal(await page.locator('#panel-herramientas').isVisible(),true);
  assert.equal(await page.locator('#panel-lenguas').isVisible(),false);
  await page.getByRole('tab',{name:'Por lengua'}).click();
  await page.getByRole('link',{name:'Griego I',exact:true}).click();
  assert.match(page.url(),/\/apps\/gramatica\/curso\.html\?lengua=griego/);
  console.log('OK: navegación ScholaClassica y Appendix ES/VAL en Chromium');
}finally{if(browser)await browser.close();await new Promise(ok=>server.close(ok))}
