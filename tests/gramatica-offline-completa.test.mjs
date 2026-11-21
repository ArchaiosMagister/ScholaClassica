import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {listGrammarCore} from '../scripts/build-gramatica-pwa.mjs';

const target=resolve(import.meta.dirname,'../dist/apps/gramatica');
const read=path=>readFileSync(join(target,path),'utf8');

test('Appendix precarga sus páginas y recursos de consulta ES/VAL, no solo las portadas',async()=>{
 const declared=await listGrammarCore(target);
 const sw=read('sw.js');
 const match=sw.match(/^const CORE=(\[[^\n]*\]);$/m);
 assert.ok(match,'El service worker debe declarar su inventario de recursos');
 const cached=JSON.parse(match[1]);
 assert.deepEqual(cached,declared,'El inventario publicado no coincide con los archivos reales');
 assert.equal(new Set(cached).size,cached.length,'No repetir recursos de precarga');
 assert.ok(cached.length>=105,'La PWA debe precargar todos los capítulos de Appendix');
 for(const path of [
  './','./index.html','./curso.html','./casos.html','./morfologia.html',
  './griego-morfologia.html','./griego-sintaxis.html','./griego-sustantivos.html',
  './griego-participios.html','./subordinadas.html','./val/index.html',
  './val/curso.html','./val/casos.html','./val/griego-sintaxis.html',
  './val/griego-sustantivos.html','./assets/search-data.json',
  './val/search-data.json','./assets/curriculum.json','./val/curriculum.json',
  './assets/gramatica-offline.js'
 ])assert.ok(cached.includes(path),'Falta en el caché: '+path);
 for(const path of cached.filter(file=>file!=='./'))
  assert.ok(existsSync(join(target,path.slice(2))),'No existe el recurso '+path);
 assert.match(sw,/const PREFIX="schola-gramatica-"/);
 assert.match(sw,/key\.startsWith\(PREFIX\)&&key!==VERSION/);
 assert.match(sw,/url\.pathname\.startsWith\(SCOPE\.pathname\)/);
 assert.match(sw,/cache\.match\(req,\{ignoreSearch:true\}\)/);
});
test('Todos los capítulos registran la PWA sin cambiar el alcance a otros módulos',async()=>{
 const core=await listGrammarCore(target);
 const pages=core.filter(path=>path.endsWith('.html'));
 assert.ok(pages.length>=80,'Faltan páginas de consulta');
 for(const page of pages){
  const html=read(page.slice(2));
  const expected=page.startsWith('./val/')
    ?'../assets/gramatica-offline.js':'assets/gramatica-offline.js';
  assert.ok(html.includes('<script src="'+expected+'" defer></script>'),
    'Sin registro offline en '+page);
  assert.equal(html.split('gramatica-offline.js').length,2,
    'El registro no puede duplicarse en '+page);
 }
 assert.match(read('assets/gramatica-offline.js'),
  /new URL\('\.\.\/sw\.js',scope\)/);
});
