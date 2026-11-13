import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {analyzeSources,sourceReport} from '../scripts/check-source-updates.mjs';
const root=resolve(import.meta.dirname,'..'),out=join(root,'dist');
const read=path=>readFileSync(join(out,path),'utf8');
test('la portada incluye 4 aspectos con persistencia segura y recursos offline',()=>{
 const html=read('index.html'),js=read('theme.js'),css=read('style.css'),sw=read('sw.js');
 for(const opt of ['system','light','dark','oled']){
   assert.match(html,new RegExp('<option value="'+opt+'">'));
 }
 assert.match(html,/id="portal-theme"/);
 assert.match(html,/src="\.\/theme\.js"/);
 assert.match(js,/scholaclassica-aspecto-v1/);
 assert.match(js,/localStorage\.setItem/);
 assert.match(js,/prefers-color-scheme: dark/);
 assert.match(js,/meta\[name="theme-color"\]/);
 assert.match(css,/html\[data-theme="dark"\]/);
 assert.match(css,/html\[data-theme="oled"\]/);
 assert.match(css,/html\[data-theme="oled"\]\{background:#000/);
 assert.doesNotMatch(css,/@media\(prefers-color-scheme:dark\)/);
 assert.match(sw,/'\.\/theme\.js'/);
 assert.ok(!sw.includes('__SCHOLA_PORTAL_CACHE_VERSION__'));
});
test('Palabra del día solo se enlaza, con origen y destino independientes',()=>{
 const html=read('index.html'),js=read('app.js');
 assert.match(html,/Palabra del día/);
 for(const url of [
  'https://archaiosmagister.github.io/Palabra-del-dia/',
  'https://archaiosmagister.github.io/Palabra-del-dia/4eso/'
 ]){
  assert.ok(html.includes(url));
  assert.ok(js.includes(url));
 }
 assert.match(html,/target="_blank" rel="noopener noreferrer"/);
 assert.match(js,/if\(item\.external\)\{link\.target='_blank';link\.rel='noopener noreferrer';\}/);
 assert.ok(!js.includes('palabra-del-dia.supabase.co'));
 assert.ok(!js.includes('service_role'));
});
test('el monitor distingue revisiones sin tocar originales o GeneradorExamenes',()=>{
 const pinned='a'.repeat(40),newer='b'.repeat(40);
 const lock={sources:{
   appendix:{integrated:true,repository:'ArchaiosMagister/Appendix-grammaticae',sha:pinned},
   evolutio:{integrated:true,repository:'ArchaiosMagister/EvolucionFonetica',sha:newer},
   examenes:{integrated:false,repository:'ArchaiosMagister/GeneradorExamenes',sha:pinned}
 }};
 const rows=analyzeSources(lock,{
  'ArchaiosMagister/Appendix-grammaticae':newer,
  'ArchaiosMagister/EvolucionFonetica':newer
 });
 assert.equal(rows.length,2);
 assert.equal(rows.filter(row=>row.outdated).length,1);
 assert.match(sourceReport(rows),/Revisión pendiente de 1 fuente/);
 assert.ok(!sourceReport(rows).includes('ArchaiosMagister/GeneradorExamenes |'));
 assert.throws(()=>analyzeSources(lock,{}),/Falta commit remoto/);
});
