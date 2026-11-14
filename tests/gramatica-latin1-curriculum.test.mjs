import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {makeLatin1Curriculum,latin1ActivePerfects}
 from '../scripts/adapt-appendix-latin1.mjs';
import {adaptLatin1App}
 from '../scripts/adapt-appendix-latin1-ui.mjs';
import {adaptLatin4App}
 from '../scripts/adapt-appendix-latin4-ui.mjs';
import {GRAMMAR_CORE}
 from '../scripts/build-gramatica-pwa.mjs';

const root=resolve(import.meta.dirname,'..');
const from=join(root,'.sources/appendix'),out=join(root,'dist/apps/gramatica');
const read=(dir,name)=>readFileSync(join(dir,name),'utf8');
const tests=[
 {locale:'es',source:'',original:'assets/curriculum.json',
  generated:'assets/curriculum-latin1.json',app:'assets/app.js'},
 {locale:'val',source:'val',original:'curriculum.json',
  generated:'curriculum-latin1.json',app:'app.js'}
];
const find=(bank,u,i)=>bank.latin.units[u-1].topics[i];
const count=(s,re)=>(s.match(re)||[]).length;

test('Latín I: cuatro lecciones completas con equivalencia ES/VAL y sin dependencias externas',()=>{
 const targets=[];
 for(const {locale,source,original,generated} of tests){
  const originalBank=JSON.parse(read(join(from,source),original));
  const built=JSON.parse(read(join(out,source),generated));
  const adapt=makeLatin1Curriculum({curriculum:originalBank,locale,
   nouns:read(join(from,source),'sustantivos.html'),
   adjectives:read(join(from,source),'adjetivos.html'),
   indicative:read(join(from,source),'indicativo.html')});
  assert.deepEqual(built,adapt,'Derivación no reproducible '+locale);
  assert.equal(built.latin.units.length,10);
  assert.equal(built.griego.units.length,14);
  assert.deepEqual(built.griego,originalBank.griego);
  assert.equal(JSON.stringify(built.latin.units.map(x=>x.topics.map(t=>t.title))),
    JSON.stringify(originalBank.latin.units.map(x=>x.topics.map(t=>t.title))),
    'No cambiar ni adelantar los epígrafes de las diez unidades');
  const updates=new Set(['3:1','4:0','4:1','5:0']);
  for(let u=1;u<=10;u++)
   for(let i=0;i<originalBank.latin.units[u-1].topics.length;i++)
    if(!updates.has(u+':'+i))
     assert.deepEqual(find(built,u,i),find(originalBank,u,i),
      'Se modificó una unidad no afectada: '+locale+' UD'+u);
  for(const [u,t,n] of [[3,1,0],[4,0,1],[4,1,4],[5,0,5]]){
   const topic=find(built,u,t);
   assert.equal(count(topic.html,/<table\b/gu),n);
   assert.ok(topic.html.length>600,'Contenido sin desarrollar '+locale+' UD'+u);
   assert.ok(!topic.html.includes('Contenido actualizado en'));
   assert.equal('source' in topic,false,'No descargar un capítulo externo');
   assert.doesNotMatch(topic.html,/<(?:script|button|input|form)\b/iu);
  }
  assert.match(find(built,3,1).html,/<h3>Por elisión<\/h3>|<h3>Per elisió<\/h3>/);
  assert.match(find(built,4,0).html,/ducis/);
  assert.match(find(built,5,0).html,/vetus/);
  const perfect=find(built,4,1).html;
  assert.match(perfect,/<i lang="la">amavi<\/i>/);
  assert.match(perfect,/<i lang="la">amaveram<\/i>/);
  assert.match(perfect,/fueram/);
  assert.equal(count(perfect,/<section class="time-paradigms">/gu),2);
  assert.equal(count(perfect,/<\/section>/gu),2);
  assert.equal(count(perfect,/<table\b/gu),4);
  assert.doesNotMatch(perfect,/amatus sum|amatus eram|voz pasiva|veu passiva|voz passiva/iu);
  // El material sobre pasiva de perfectum sigue disponible en UD9.
  assert.deepEqual(built.latin.units[8],originalBank.latin.units[8]);
  assert.equal(read(join(out,source),original),
    read(join(from,source),original),'Fuente curricular Appendix alterada');
  targets.push(built);
 }
 assert.deepEqual(
  [3,4,5].map(u=>targets[0].latin.units[u-1].topics.length),
  [3,4,5].map(u=>targets[1].latin.units[u-1].topics.length));
});
test('La corrección de UD4 solo retira las dos tablas y explicaciones pasivas, conserva activas y sum',()=>{
 for(const {locale,source} of tests){
  const text=read(join(from,source),'indicativo.html');
  const corrected=latin1ActivePerfects(text,locale);
  assert.equal(count(corrected,/<table\b/gu),4);
  assert.equal(count(corrected,/<h3>Paradigma · (?:voz|veu) activa<\/h3>/gu),2);
  assert.equal(count(corrected,/<h3>(?:Verbo|Verb) <i lang="la">sum<\/i><\/h3>/gu),2);
  assert.doesNotMatch(corrected,/<h3>Paradigma · (?:voz pasiva|veu passiva)<\/h3>/u);
  assert.throws(()=>latin1ActivePerfects(
    text.replace(locale==='es'?' La voz pasiva se forma':' La veu passiva es forma',
      ' Texto sin referencia'),
    locale),/dos referencias/);
 }
});
test('El selector de Latín I carga la nueva copia sin alterar Griego I, 4.º ni el currículo original',()=>{
 for(const {locale,source,app} of tests){
  const original=read(join(from,source),app);
  const after4=adaptLatin4App(original,locale);
  const expected=adaptLatin1App(after4,locale);
  const integrated=read(join(out,source),app);
  assert.equal(integrated,expected,'Adaptador bilingüe no reproducible');
  const asset=locale==='es'?'assets/curriculum-latin1.json':'curriculum-latin1.json';
  assert.match(integrated,/selection\.year==='1'&&selection\.language==='latin'/);
  assert.ok(integrated.includes("loadJSON('"+asset+"')"));
  assert.ok(integrated.includes('curriculumLatin4.latin.units'));
  assert.ok(integrated.includes('curriculum[selection.language].units'));
  assert.equal(read(join(from,source),app),original);
 }
});
test('La PWA precarga ambas lecciones sin red, sin ampliar su ámbito de caché',()=>{
 const sw=read(out,'sw.js');
 assert.equal(GRAMMAR_CORE.filter(x=>x.includes('curriculum-latin1.json')).length,2);
 for(const name of ['./assets/curriculum-latin1.json',
                    './val/curriculum-latin1.json']){
  assert.ok(GRAMMAR_CORE.includes(name));
  assert.ok(sw.includes(name),'PWA no precarga '+name);
 }
 assert.match(sw,/new Request\(new URL\(path,SCOPE\),\{cache:'reload'\}\)/);
 assert.match(sw,/startsWith\(SCOPE.pathname\)/);
 assert.ok(!GRAMMAR_CORE.some(x=>x.includes('vocabulario')));
});
