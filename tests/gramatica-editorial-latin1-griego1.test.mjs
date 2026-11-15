import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fixLatin1Typography,makeGreek1TypographyCurriculum}
 from '../scripts/grammar-bilingual-editorial.mjs';
import {makeLatin1Curriculum}
 from '../scripts/adapt-appendix-latin1.mjs';
import {adaptLatin4App} from '../scripts/adapt-appendix-latin4-ui.mjs';
import {adaptLatin1App} from '../scripts/adapt-appendix-latin1-ui.mjs';
import {adaptGreek1App} from '../scripts/adapt-appendix-griego1-ui.mjs';
import {GRAMMAR_CORE} from '../scripts/build-gramatica-pwa.mjs';

const root=resolve(import.meta.dirname,'..');
const input=join(root,'.sources/appendix');
const output=join(root,'dist/apps/gramatica');
const cfg=[
 {locale:'es',folder:'',curriculum:'assets/curriculum.json',
  lat:'assets/curriculum-latin1.json',greek:'assets/curriculum-griego1.json',
  app:'assets/app.js'},
 {locale:'val',folder:'val',curriculum:'curriculum.json',
  lat:'curriculum-latin1.json',greek:'curriculum-griego1.json',
  app:'app.js'}
];
const read=(base,file)=>readFileSync(join(base,file),'utf8');
const unit=(bank,lang,u,t)=>bank[lang].units[u-1].topics[t];
const afterLatin=(bank,base,locale)=>makeLatin1Curriculum({
 curriculum:bank,locale,
 nouns:read(base,'sustantivos.html'),adjectives:read(base,'adjetivos.html'),
 indicative:read(base,'indicativo.html')
});
test('Las cinco intervenciones A3–A7 se derivan de las dos fuentes inmutables',()=>{
 for(const {locale,folder,curriculum,lat,greek} of cfg){
  const base=join(input,folder),out=join(output,folder);
  const original=JSON.parse(read(base,curriculum));
  const originalSnapshot=JSON.stringify(original);
  const latin=JSON.parse(read(out,lat));
  const graecum=JSON.parse(read(out,greek));
  const reconstructed=afterLatin(original,base,locale);
  assert.deepEqual(latin,reconstructed);
  assert.deepEqual(graecum,makeGreek1TypographyCurriculum(original,locale));
  assert.equal(JSON.stringify(original),originalSnapshot,
   'El adaptador no debe mutar el objeto de la fuente');
  assert.equal(read(out,curriculum),read(base,curriculum),
   'No modificar el currículo bloqueado de Appendix');
  assert.deepEqual(latin.griego,original.griego,
   'Las enmiendas de Latín I no afectan Griego I');
  assert.deepEqual(graecum.latin,original.latin,
   'Las enmiendas griegas no afectan Latín I');
  const editedSet=new Set(['1:0','3:0','6:0','7:2']);
  const beforeLatin=structuredClone(latin);
  for(let u=1;u<=10;u++)for(let t=0;t<latin.latin.units[u-1].topics.length;t++){
   const old=unit(original,'latin',u,t),now=unit(latin,'latin',u,t);
   if(editedSet.has(u+':'+t))assert.notEqual(now.html,old.html,
     'No se aplicó la enmienda tipográfica '+locale+' UD'+u);
   else if(!new Set(['3:1','4:0','4:1','5:0']).has(u+':'+t))
    assert.deepEqual(now,old,'Modificación no autorizada '+locale+' UD'+u);
  }
  const noun=unit(latin,'latin',1,0).html;
  assert.match(noun,/<i lang="la">puer<\/i>/);
  assert.match(noun,/<i lang="la">ager<\/i>/);
  for(const name of ['puer','ager'])for(const number of ['singular','plural'])
   assert.ok(noun.includes('<th scope="col"><i lang="la">'+name+'</i> · '+number+'</th>'));
  assert.equal((noun.match(/<table\b/gu)||[]).length,
   (unit(original,'latin',1,0).html.match(/<table\b/gu)||[]).length);
  const people=unit(latin,'latin',3,0).html;
  for(const name of ['ego','tu','nos','vos']){
   assert.match(people,new RegExp('<th scope="col">[^<]*<i lang="la">'+name+'</i> \\([^<]*\\)<\\/th>','u'));
  }
  for(const person of (locale==='es'?['1.ª sing.','2.ª sing.','1.ª pl.','2.ª pl.']:
   ['1a sing.','2a sing.','1a pl.','2a pl.']))assert.ok(people.includes(person));
  assert.ok(people.includes('(nosotros/as)')=== (locale==='es'));
  assert.ok(people.includes('(nosaltres)')=== (locale==='val'));
  const relative=unit(latin,'latin',6,0).html;
  assert.ok(relative.includes('<caption>'+(locale==='es'?'Relativo':'Relatiu')+
   ' · <i lang="la">qui</i>, <i lang="la">quæ</i>, <i lang="la">quod</i></caption>'));
  const future=unit(latin,'latin',7,2).html;
  const futureName=locale==='es'?'futuro imperfecto':'futur imperfet';
  assert.ok(future.includes('<caption><i lang="la">sum, esse</i> · '+
   futureName+'</caption>'));
  assert.ok(!future.includes('<i lang="la">'+futureName+'</i>'));
  const greekOld=unit(original,'griego',5,0);
  const greekNew=unit(graecum,'griego',5,0);
  assert.ok(greekOld.html.includes('ἀγαθός, αγαθή, ἀγαθόν'));
  assert.ok(greekNew.html.includes('ἀγαθός, ἀγαθή, ἀγαθόν'));
  assert.ok(!greekNew.html.includes('ἀγαθός, αγαθή, ἀγαθόν'));
  assert.equal((greekNew.html.match(/<table\b/gu)||[]).length,
   (greekOld.html.match(/<table\b/gu)||[]).length);
  assert.equal(graecum.griego.units.length,14);
  const adjective=unit(graecum,'griego',5,1).html;
  assert.match(adjective,/μεγάλ–<strong>ε<\/strong>/);
  assert.match(adjective,/μεγάλε/);
  assert.match(adjective,locale==='es'?/variante poco frecuente/:/variant poc freqüent/);
  assert.equal((adjective.match(/<table\b/gu)||[]).length,
    (unit(original,'griego',5,1).html.match(/<table\b/gu)||[]).length);
  const third=unit(graecum,'griego',8,2).html;
  assert.match(third,/ἡγεμών<\/td>/);
  assert.ok(!third.includes('<td>ἡγεμόν</td>'));
  assert.ok(third.includes('πατήρ, πατρός'));
  assert.ok(third.includes('πατ<strong>ή</strong>ρ'));
  assert.ok(!third.includes('πάτηρ'));
  assert.ok(!third.includes('πάτ<strong>η</strong>ρ'));
  for(let u=1;u<=14;u++)for(let t=0;t<graecum.griego.units[u-1].topics.length;t++)
   if(!new Set(['5:0','5:1','8:2']).has(u+':'+t))assert.deepEqual(unit(graecum,'griego',u,t),
    unit(original,'griego',u,t),'Alteración griega fuera de UD5 '+locale);
  assert.deepEqual(beforeLatin.griego,original.griego);
 }
});
test('Enmiendas fallan ante un origen que ha cambiado, sin realizar sustituciones silenciosas',()=>{
 for(const {locale,folder,curriculum} of cfg){
  const original=JSON.parse(read(join(input,folder),curriculum));
  const bad=structuredClone(original);
  bad.latin.units[0].topics[0].html=bad.latin.units[0].topics[0].html
   .replace('puer · singular','puer · sing.');
  assert.throws(()=>fixLatin1Typography(bad,locale),
   /No hay una coincidencia única/);
  const moved=structuredClone(original);
  moved.griego.units[4].topics[0].html=moved.griego.units[4].topics[0].html
   .replace('αγαθή','ἀγαθή');
  assert.throws(()=>makeGreek1TypographyCurriculum(moved,locale),
   /No hay una coincidencia única/);
  const movingVoc=structuredClone(original);
  movingVoc.griego.units[4].topics[1].html=
    movingVoc.griego.units[4].topics[1].html.replace('μέγα–<strong>ς</strong>','μέγα–<strong>ν</strong>');
  assert.throws(()=>makeGreek1TypographyCurriculum(movingVoc,locale),
    /No hay una coincidencia única/);
  const movingNasal=structuredClone(original);
  movingNasal.griego.units[7].topics[2].html=
    movingNasal.griego.units[7].topics[2].html.replace('<td>ἡγεμόν</td>','<td>ἡγεμών</td>');
  assert.throws(()=>makeGreek1TypographyCurriculum(movingNasal,locale),
    /No hay una coincidencia única/);
 }
});
test('El cargador sirve currículo correcto a cada curso y la PWA precarga los cuatro',()=>{
 for(const {locale,folder,app} of cfg){
  const source=read(join(input,folder),app);
  const integrated=read(join(output,folder),app);
  const expected=adaptGreek1App(adaptLatin1App(adaptLatin4App(source,locale),locale),locale);
  assert.equal(integrated,expected);
  assert.ok(integrated.includes("selection.year==='1'&&selection.language==='griego'"));
  assert.ok(integrated.includes("curriculumGreek1.griego.units"));
  assert.ok(integrated.includes("curriculumLatin1.latin.units"));
  assert.ok(integrated.includes("curriculumLatin4.latin.units"));
  assert.ok(integrated.includes("curriculum[selection.language].units"));
 }
 const sw=read(output,'sw.js');
 for(const file of [
  './assets/curriculum-latin1.json','./val/curriculum-latin1.json',
  './assets/curriculum-griego1.json','./val/curriculum-griego1.json'
 ]){
  assert.ok(GRAMMAR_CORE.includes(file),'No se precarga '+file);
  assert.ok(sw.includes(file),'El service worker no contiene '+file);
 }
 assert.ok(!GRAMMAR_CORE.some(f=>f.includes('vocabulario')));
});
