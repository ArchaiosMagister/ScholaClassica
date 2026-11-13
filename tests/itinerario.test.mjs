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
  assert.match(portal,/id="study-resume"/);
  assert.match(app,/PATH_STORAGE_KEY='scholaclassica-itinerario-v1'/);
  assert.match(app,/localStorage/);
  assert.ok(!app.includes('innerHTML'));
});
test('los accesos contextuales apuntan exclusivamente a recursos integrados que existen',()=>{
  const links=[...app.matchAll(/href:'(apps\/[^']+)'/g)].map(([,url])=>url);
  assert.equal(links.length,10);
  for(const href of links){
    assert.ok(!/GeneradorExamenes|apps\/examenes|morfologia/i.test(href));
    const parsed=new URL(href,'https://local.test/');
    const target=resolve(out,decodeURIComponent(parsed.pathname.slice(1)));
    assert.ok(target.startsWith(out+sep),href);
    assert.ok(existsSync(target)&&statSync(target).isFile(),href);
  }
  const catalog=app.slice(app.indexOf('const STUDY_CATALOG='),app.indexOf('const PATH_STORAGE_KEY='));
  assert.match(catalog,/gr2:\[\s*\{id:'gramatica'/);
  assert.ok(!/gr2:[\s\S]*etymologicon/.test(catalog.split(/gr2:\[/)[1]||''));
});
