import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,readdirSync,statSync} from 'node:fs';
import {resolve,join,sep} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'..'),out=join(root,'dist');
const hash=file=>createHash('sha256').update(readFileSync(file)).digest('hex');
const locks=JSON.parse(readFileSync(join(root,'config/sources.lock.json'),'utf8'));
test('solo se copian los dos repositorios originales; Etymologicon es nativo',()=>{
  assert.deepEqual(Object.entries(locks.sources).filter(([,item])=>item.integrated).map(([key])=>key).sort(),['appendix','evolutio']);
  for(const path of ['apps/examenes','apps/vocabulario'])assert.equal(existsSync(join(out,path)),false);
});
function crawl(dir,prefix=''){
  return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.name==='.git'||e.name==='.github'?[]:
    e.isDirectory()?crawl(join(dir,e.name),prefix+e.name+'/'):[prefix+e.name]);
}
function compareApp(source,target,exceptions=[]){
  const expected=crawl(source).sort(),actual=crawl(target).sort();
  assert.deepEqual(actual,expected);
  for(const file of expected){
    if(exceptions.includes(file))continue;
    assert.equal(hash(join(source,file)),hash(join(target,file)),'Copia alterada: '+file);
  }
}
test('Appendix completo, en castellano y valenciano, conserva los bytes originales',()=>{
  compareApp(join(root,'.sources/appendix'),join(out,'apps/gramatica'));
  for(const file of ['index.html','curso.html','val/index.html','val/curso.html','assets/curriculum.json','val/curriculum.json'])
    assert.ok(existsSync(join(out,'apps/gramatica',file)),file);
});
test('Evolutio conserva todo el motor y banco, salvo la adaptación aislada del service worker',()=>{
  const source=join(root,'.sources/evolutio'),target=join(out,'apps/evolucion-fonetica');
  compareApp(source,target,['sw.js']);
  assert.notEqual(hash(join(source,'sw.js')),hash(join(target,'sw.js')));
  for(const file of ['index.html','src/app.mjs','src/engine.mjs','src/rules.mjs','data/pilot.json','manifest.webmanifest'])
    assert.equal(hash(join(source,file)),hash(join(target,file)),file);
  const sw=readFileSync(join(target,'sw.js'),'utf8');
  assert.match(sw,/const CACHE_PREFIX='schola-evolutio-';/);
  assert.match(sw,/keys\.filter\(key=>key\.startsWith\(CACHE_PREFIX\)&&key!==VERSION\)/);
});
test('Etymologicon se construye con su pantalla, corrector y banco reducido, sin publicar material docente interno',()=>{
  const dir=join(out,'apps/etymologicon');
  for(const file of ['index.html','style.css','app.mjs','corrector/write-two.mjs','data/gr1.json'])
    assert.ok(existsSync(join(dir,file)),'Archivo faltante: '+file);
  const learner=JSON.parse(readFileSync(join(dir,'data/gr1.json'),'utf8'));
  assert.equal(learner.schema,'etymologicon-audited-catalog/v1');
  assert.equal(learner.course,'gr1');
  assert.equal(learner.etymons.length,111);
  assert.equal(learner.derivatives.length,201);
  assert.equal(learner.relations.length,217);
  assert.equal(learner.etymons.filter(x=>x.editorialStatus==='approved_for_documented_derivatives').length,108);
  assert.ok(!('editorialDecisions' in learner));
  assert.ok(!('definitions' in learner.derivatives[0]));
  assert.ok(!('source' in learner.etymons[0]));
  assert.ok(!JSON.stringify(learner).includes('originalWorkbook'));
  const html=readFileSync(join(dir,'index.html'),'utf8');
  assert.ok(html.includes('id="answer-1"'));
  assert.ok(html.includes('id="answer-2"'));
  assert.ok(html.includes('id="result-total"'));
});
test('el portal ofrece dos tipos de navegación y no expone el generador',()=>{
  const html=readFileSync(join(out,'index.html'),'utf8');
  for(const name of ['Por lengua','Por herramienta','Latín I','Latín II','Griego I','Griego II','Evolución fonética','Abrir Evolutio','Etymologicon','Profesorado'])
    assert.ok(html.includes(name),name);
  assert.ok(!/href=["'][^"']*(GeneradorExamenes|apps\/examenes)/i.test(html));
  assert.ok(!html.includes('serviceWorker.register('));
});
test('enlaces y recursos del portal apuntan a ficheros presentes en el artefacto',()=>{
  const html=readFileSync(join(out,'index.html'),'utf8');
  const matches=[...html.matchAll(/\b(?:href|src)="([^"]+)"/g)];
  for(const [,value] of matches){
    if(value.startsWith('#')||/^[a-z]+:\/\//i.test(value))continue;
    const url=new URL(value,'http://localhost/');
    const target=resolve(out,decodeURIComponent(url.pathname.slice(1)));
    assert.ok(target.startsWith(out+sep)||target===out,'Fuera de directorio: '+value);
    const final=existsSync(target)&&statSync(target).isDirectory()?join(target,'index.html'):target;
    assert.ok(existsSync(final),'No existe recurso '+value);
  }
});
