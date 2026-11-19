// Recorre las unidades de Appendix SOLO en castellano y verifica navegación real.
// Appendix es material de consulta: nunca exige generar ni corregir ejercicios.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,stat,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join,extname,sep} from 'node:path';
import {chromium} from 'playwright';

const repoRoot=resolve(import.meta.dirname,'..'),dist=join(repoRoot,'dist');
const routePrefix='/ScholaClassica/';
const contentType={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8',
 '.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};
const server=createServer(async(req,res)=>{
 try{
  const p=new URL(req.url,'http://localhost').pathname;
  if(!p.startsWith(routePrefix))throw Error('Ruta fuera de Pages');
  const file=resolve(dist,decodeURIComponent(p.slice(routePrefix.length))+
   (p.endsWith('/')?'index.html':''));
  if(!file.startsWith(dist+sep)||!(await stat(file)).isFile())throw Error('Fuera del artefacto');
  res.writeHead(200,{'content-type':contentType[extname(file)]||'application/octet-stream'});
  res.end(await readFile(file));
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const base='http://127.0.0.1:'+server.address().port+routePrefix+'apps/gramatica/';
const courses=[
 {name:'Latín de 4.º ESO',lang:'latin',year:'4',minimum:8,maximum:8},
 {name:'Latín I',lang:'latin',year:'1',minimum:8},
 {name:'Griego I',lang:'griego',year:'1',minimum:10}
];
const checks=[];
let browser;
try{
 browser=await chromium.launch({headless:true});
 const page=await browser.newPage();
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 for(const course of courses){
  const url=new URL('curso.html',base);
  url.searchParams.set('lengua',course.lang);
  url.searchParams.set('curso',course.year);
  url.searchParams.set('unidad','1');
  const res=await page.goto(url.href,{waitUntil:'networkidle'});
  assert.equal(res.status(),200,course.name);
  await page.waitForFunction(()=>document.querySelectorAll('#unit-buttons button').length>0,null,{timeout:12000});
  assert.equal(await page.locator('#site-language').inputValue(),'curso.html',
   course.name+': debe mantenerse en castellano');
  const units=await page.locator('#unit-buttons button').count();
  assert.ok(units>=course.minimum,course.name+': faltan unidades. Observadas: '+units);
  if(course.maximum)assert.equal(units,course.maximum,course.name+': unidades fuera del currículo');
  assert.equal(new Set(await page.locator('#unit-buttons button').evaluateAll(nodes=>
   nodes.map(x=>x.dataset.unit))).size,units,course.name+': botones duplicados');
  for(let unit=1;unit<=units;unit++){
   const button=page.locator('#unit-buttons button[data-unit="'+unit+'"]');
   assert.equal(await button.count(),1,course.name+' UD'+unit+': sin acceso');
   await button.click();
   await page.waitForFunction(n=>document.querySelectorAll('.unit-section').length===n,
    unit,{timeout:8000});
   const text=(await page.locator('.unit-section').last().textContent()).trim();
   assert.ok(text.length>30,course.name+' UD'+unit+': contenido vacío');
   assert.equal(await page.locator('#answer-input').count(),0,
    course.name+' UD'+unit+': Appendix no debe generar ejercicios');
   checks.push({course:course.name,unit,loaded:true,characters:text.length});
  }
 }
 for(const route of ['sintaxis.html','subordinadas.html','conjunciones.html']){
  const response=await page.goto(base+route,{waitUntil:'networkidle'});
  assert.equal(response.status(),200,'Latín II: '+route);
  assert.equal(await page.locator('h1').count()>0,true,route+': falta título');
  assert.ok((await page.locator('main').textContent()).trim().length>150,
   'Latín II: faltan contenidos de '+route);
  assert.equal(await page.locator('#answer-input').count(),0,
   'Latín II consulta, no generador de ejercicios');
 }
 assert.equal(checks.filter(x=>x.course==='Latín de 4.º ESO').length,8);
 assert.deepEqual(errors,[],'Errores JS en Appendix: '+errors.join(' | '));
 const out=join(repoRoot,'build/academic-audits/castellano');
 await mkdir(out,{recursive:true});
 await writeFile(join(out,'appendix-unidades-es.json'),JSON.stringify({
  schema:'schola-appendix-spanish-navigation/v1',courses,
  unitsVisited:checks.length,latin2SyntaxPages:3,errors,
  detail:checks
 },null,2)+'\n');
 console.log('Appendix castellano:',checks.length,'unidades de 3 cursos y 3 páginas de sintaxis navegadas.');
}finally{
 if(browser)await browser.close();
 await new Promise(done=>server.close(done));
}
