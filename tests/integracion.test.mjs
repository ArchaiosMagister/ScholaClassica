import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,readdirSync,statSync} from 'node:fs';
import {resolve,join,sep} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'..'),source=join(root,'.sources/appendix'),out=join(root,'dist');
const hash=file=>createHash('sha256').update(readFileSync(file)).digest('hex');
const locks=JSON.parse(readFileSync(join(root,'config/sources.lock.json'),'utf8'));
test('las otras aplicaciones siguen excluidas de la publicación inicial',()=>{
  assert.deepEqual(Object.entries(locks.sources).filter(([,item])=>item.integrated).map(([key])=>key),['appendix']);
  for(const path of ['apps/examenes','apps/vocabulario','apps/evolucion-fonetica'])assert.equal(existsSync(join(out,path)),false);
});
test('Appendix en castellano y valenciano conserva ficheros esenciales y bytes originales',()=>{
  for(const file of ['index.html','curso.html','morfologia.html','sintaxis.html','griego-morfologia.html','griego-sintaxis.html','assets/app.js','assets/style.css','assets/curriculum.json','val/index.html','val/curso.html','val/app.js','val/curriculum.json','assets/icon.svg','apple-touch-icon.png']){
    const a=join(source,file),b=join(out,'apps/gramatica',file);
    assert.ok(existsSync(a),'Falta fuente '+file);
    assert.ok(existsSync(b),'Falta copia '+file);
    assert.equal(hash(b),hash(a),'Archivo modificado: '+file);
  }
});
function crawl(dir,prefix=''){
  return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.name==='.git'||e.name==='.github'?[]:
    e.isDirectory()?crawl(join(dir,e.name),prefix+e.name+'/'):[prefix+e.name]);
}
test('la copia incluye todos los archivos de la fuente sin alterarlos',()=>{
  const expected=crawl(source).sort();
  const actual=crawl(join(out,'apps/gramatica')).sort();
  assert.deepEqual(actual,expected);
  for(const relative of expected)assert.equal(hash(join(source,relative)),hash(join(out,'apps/gramatica',relative)),relative);
});
test('el portal contiene navegación dual y no expone el generador de exámenes',()=>{
  const html=readFileSync(join(out,'index.html'),'utf8');
  for(const name of ['Por lengua','Por herramienta','Latín I','Latín II','Griego I','Griego II','Profesorado'])assert.ok(html.includes(name),name);
  assert.ok(!/href=["'][^"']*(GeneradorExamenes|apps\/examenes)/i.test(html));
  assert.ok(!html.includes('serviceWorker.register('));
});
test('todos los enlaces y recursos internos del portal apuntan a rutas existentes',()=>{
  const html=readFileSync(join(out,'index.html'),'utf8');
  const matches=[...html.matchAll(/\b(?:href|src)="([^"]+)"/g)];
  for(const [,value] of matches){
    if(value.startsWith('#')||/^[a-z]+:\/\//i.test(value))continue;
    const url=new URL(value,'http://localhost/');
    const target=resolve(out,decodeURIComponent(url.pathname.slice(1)));
    assert.ok(target.startsWith(out+sep)||target===out,'Ruta fuera del directorio: '+value);
    const final=existsSync(target)&&statSync(target).isDirectory()?join(target,'index.html'):target;
    assert.ok(existsSync(final),'No existe recurso '+value);
  }
});
