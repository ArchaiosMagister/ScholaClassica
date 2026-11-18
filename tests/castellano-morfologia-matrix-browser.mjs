// Comprobación de interfaz: cada combinación de curso/UD/modalidad que
// produce preguntas con el motor debe generar una sesión visible en Chromium.
// La auditoría Node previa calcula los casos válidos y el alcance curricular.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,stat,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join,extname,sep} from 'node:path';
import {chromium} from 'playwright';

const root=resolve(import.meta.dirname,'..'),dist=join(root,'dist');
const prefix='/ScholaClassica/';
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8',
 '.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost'),pathname=url.pathname;
  if(!pathname.startsWith(prefix))throw Error('Ruta fuera de Pages');
  const file=resolve(dist,decodeURIComponent(pathname.slice(prefix.length))+
   (pathname.endsWith('/')?'index.html':''));
  if(!file.startsWith(dist+sep)||!(await stat(file)).isFile())throw Error('Archivo fuera de dist');
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream'});
  res.end(await readFile(file));
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const base='http://127.0.0.1:'+server.address().port+prefix+'apps/morfologia/';
const matrixFile=join(root,'build/academic-audits/castellano/morfologia-matriz-funcional.json');
const matrix=JSON.parse(await readFile(matrixFile,'utf8'));
assert.equal(matrix.schema,'schola-morphology-spanish-functional-matrix/v1');
const positions=new Map(matrix.matrix.map(x=>[[x.language,x.unit,x.activity,x.kind].join('|'),x]));
const courses=[['latin4','lat4'],['latin','lat1'],['griego','gr1'],['latin2','lat2']];
const output=[],errors=[];
let browser;
try{
 browser=await chromium.launch({headless:true});
 const page=await browser.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 for(const [language,query]of courses){
  const r=await page.goto(base+'index.html?subject='+query,{waitUntil:'load'});
  assert.equal(r.status(),200);
  await page.waitForFunction(()=>!document.querySelector('#start').disabled,null,{timeout:15000});
  assert.equal(await page.locator('#subject').inputValue(),language);
  const units=await page.locator('#unit option').evaluateAll(opts=>opts.map(x=>Number(x.value)));
  const configured=matrix.perCourse[language];
  assert.equal(units.length,configured.units,language+': número de UD distinto de matriz');
  assert.equal(await page.locator('#unit-label').isVisible(),language!=='latin2');
  for(const unit of units){
   await page.locator('#unit').selectOption(String(unit));
   // Las modalidades deshabilitadas son una barrera curricular:
   // no seleccionar por script una opción escondida en pantalla.
   const activeModes=await page.locator('#activity option').evaluateAll(nodes=>
    nodes.filter(x=>!x.disabled&&!x.hidden).map(x=>x.value));
   const expectedModes=[...new Set(matrix.matrix.filter(x=>
    x.language===language&&x.unit===unit).map(x=>x.activity))];
   assert.deepEqual(activeModes,expectedModes,
    language+'/UD'+unit+': UI muestra una modalidad ausente o adelantada');
   for(const activity of activeModes){
    await page.locator('#activity').selectOption(activity);
    const kind=activity==='agreement'?'adjetivo':
      activity.startsWith('phrase-')||activity.startsWith('noun-phrase-')?'sintagma':'todos';
    const enabled=await page.locator('#kind option').evaluateAll(nodes=>nodes.map(n=>n.value));
    assert.ok(enabled.includes(kind),language+'/UD'+unit+'/'+activity+': no permite '+kind);
    await page.locator('#kind').selectOption(kind);
    const expected=positions.get([language,unit,activity,kind].join('|'));
    assert.ok(expected,'No hay referencia del motor para '+[language,unit,activity,kind].join('/'));
    if(await page.locator('#session').isVisible())await page.locator('#new').click();
    await page.locator('#start').click();
    const visible=await page.locator('#session').isVisible();
    if(expected.questions>0){
     assert.equal(visible,true,[language,unit,activity,kind].join('/')+
       ': el motor devuelve preguntas pero la UI no genera ninguna');
     const question=(await page.locator('#question-title').textContent()).trim();
     assert.ok(question.length>8,'Título de pregunta vacío '+language+'/'+unit+'/'+activity);
     const needs=activity==='form'||activity==='analysis'||activity==='agreement'?'answers':
       activity==='written'||activity.endsWith('-written')?'written-response':'table-response';
     if(needs==='answers')assert.ok(await page.locator('#answers button').count()>=3,
       'Sin opciones '+language+'/'+unit+'/'+activity);
     else assert.equal(await page.locator('#'+needs).isVisible(),true,
       'Control de respuesta invisible '+language+'/'+unit+'/'+activity);
     output.push({language,unit,activity,kind,generated:true,title:question.slice(0,100)});
    }else{
     assert.equal(visible,false,'La UI genera una pregunta no documentada '+language+'/'+unit+'/'+activity);
     output.push({language,unit,activity,kind,generated:false,reason:'modalidad visible sin preguntas'});
    }
   }
  }
 }
 assert.deepEqual(errors,[],'Errores JS de Morfología: '+errors.join(' | '));
 const dir=join(root,'build/academic-audits/castellano');
 await mkdir(dir,{recursive:true});
 await writeFile(join(dir,'morfologia-navegacion-browser.json'),JSON.stringify({
  schema:'schola-morphology-spanish-browser-matrix/v1',
  total:output.length,valid:output.filter(x=>x.generated).length,
  visibleButEmpty:output.filter(x=>!x.generated).length,
  javascriptErrors:errors,
  selectedCourses:courses.map(x=>x[0]),
  cases:output
 },null,2)+'\n');
 console.log('Morfología castellano: interfaz navegada, '+output.filter(x=>x.generated).length+
  '/'+output.length+' combinaciones de curso/UD/modalidad generan preguntas.');
}finally{
 if(browser)await browser.close();
 await new Promise(done=>server.close(done));
}
