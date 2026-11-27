import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,statSync} from 'node:fs';
import {resolve,join,sep} from 'node:path';
const root=resolve(import.meta.dirname,'..'),out=join(root,'dist');
const portal=readFileSync(join(out,'index.html'),'utf8');
const app=readFileSync(join(out,'app.js'),'utf8');
test('el portal presenta selección contextual para los cursos disponibles',()=>{
  for(const id of ['lat4','lat1','lat2','gr1','gr2']){
    assert.match(portal,new RegExp('<option value="'+id+'">'));
    assert.match(app,new RegExp('\\b'+id+':\\['));
  }
  assert.match(portal,/id="study-course"/);
  assert.match(portal,/href="apps\/etymologicon\/estudio\.html">Etymologicon · derivados/);
  assert.match(portal,/href="apps\/etymologicon\/practicar\.html">Practicar etimología griega/);
  assert.match(app,/id:'etymologicon'[^\n]+href:'apps\/etymologicon\/index\.html'/);
  assert.match(portal,/id="study-resume"/);
  assert.match(app,/PATH_STORAGE_KEY='scholaclassica-itinerario-v1'/);
  assert.match(app,/localStorage/);
  assert.ok(!app.includes('innerHTML'));
});
test('los accesos contextuales apuntan exclusivamente a recursos integrados que existen',()=>{
  const links=[...app.matchAll(/href:'(apps\/[^']+)'/g)].map(([,url])=>url);
  assert.equal(links.length,22);
  assert.equal(links.filter(x=>x==='apps/latinismos/index.html').length,2);
  assert.ok(links.includes('apps/modificacion-preverbial/index.html'));
  assert.ok(links.includes('apps/modificacion-preverbial/index.html?subject=lat1'));
  for(const href of links){
    assert.ok(!/GeneradorExamenes|apps\/examenes/i.test(href));
    const parsed=new URL(href,'https://local.test/');
    const target=resolve(out,decodeURIComponent(parsed.pathname.slice(1)));
    assert.ok(target.startsWith(out+sep),href);
    assert.ok(existsSync(target)&&statSync(target).isFile(),href);
  }
  const catalog=app.slice(app.indexOf('const STUDY_CATALOG='),app.indexOf('const PATH_STORAGE_KEY='));
  assert.match(catalog,/gr2:\[\s*\{id:'gramatica'/);
  assert.ok(!/gr2:[\s\S]*etymologicon/.test(catalog.split(/gr2:\[/)[1]||''));
});

test('La portada conserva accesos reversibles a las webs históricas sin mezclar módulos',()=>{
 assert.match(portal,/id="enlaces-historicos"/);
 for(const [oldPath,newPath] of [
  ['/Appendix-grammaticae/','apps/gramatica/index.html'],
  ['/EvolucionFonetica/','apps/evolucion-fonetica/index.html'],
  ['/VocabulaLatinaGraecaque/','apps/vocabulario/index.html?subject=lat1'],
  ['/VocabulaLatinaGraecaque/gramatica.html','apps/repaso-gramatica/index.html?subject=lat1']
 ]){
  assert.ok(portal.includes('https://archaiosmagister.github.io'+oldPath),
   'Falta ruta legada '+oldPath);
  assert.ok(portal.includes('href="'+newPath.replaceAll('&','&amp;')+'"'),
   'Falta la ruta integrada '+newPath);
 }
 assert.match(portal,/no se redirigen automáticamente/);
 assert.match(portal,/práctica de morfología/);
 assert.match(portal,/Etymologicon/);
 assert.match(portal,/Conservar mi progreso/);
});

test('Latinismos solo está en los itinerarios de Bachillerato latino',()=>{
 const catalog=app.slice(app.indexOf('const STUDY_CATALOG='),app.indexOf('const PATH_STORAGE_KEY='));
 for(const id of ['lat4','lat1','lat2','gr1','gr2']){
  const block=catalog.split(id+':[')[1].split(']')[0];
  assert.equal(block.includes("id:'latinismos'"),['lat1','lat2'].includes(id),id);
 }
});
