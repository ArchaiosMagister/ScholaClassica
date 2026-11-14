import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {join,resolve} from 'node:path';
import {makeLatin4Curriculum,adaptAppendixLatin4}
  from '../scripts/adapt-appendix-latin4.mjs';
import {adaptLatin4App} from '../scripts/adapt-appendix-latin4-ui.mjs';
const root=resolve(import.meta.dirname,'..');
const src=join(root,'.sources/appendix'),dest=join(root,'dist/apps/gramatica');
const read=(dir,file)=>readFileSync(join(dir,file),'utf8');
const es=JSON.parse(read(dest,'assets/curriculum-latin4.json'));
const va=JSON.parse(read(dest,'val/curriculum-latin4.json'));
const topic=(bank,u,i)=>bank.latin.units[u-1].topics[i];
const flattened=bank=>bank.latin.units.flatMap(u=>u.topics);

test('Solo ocho unidades de gramática de 4.º: ambas lenguas con distribución idéntica',()=>{
 for(const [bank,lang] of [[es,'es'],[va,'val']]){
  assert.equal(bank.schema,1);
  assert.deepEqual(bank.latin.units.map(u=>u.number),[1,2,3,4,5,6,7,8]);
  assert.deepEqual(bank.latin.units.map(u=>u.topics.length),[3,2,2,1,1,2,2,2]);
  assert.equal(flattened(bank).length,15);
  assert.equal(new Set(flattened(bank).map(t=>t.title)).size,15);
  assert.ok(flattened(bank).every(t=>t.html.length>140&&t.sourceUnit<=10&&
    t.sourceUnit>=1&&Number.isInteger(t.sourceTopic)));
  assert.ok(flattened(bank).every(t=>!/<(?:input|form|button|script)\b/iu.test(t.html)),
    'No hay ejercicios, formularios ni correctores en una gramática de consulta');
  assert.equal(bank.latin.units.at(-1).number,8);
  assert.ok(!JSON.stringify(bank).includes('UD 9')&&!JSON.stringify(bank).includes('UD 10'));
  assert.ok(lang==='val'?bank.latin.name.includes('4t'):bank.latin.name.includes('4.º'));
 }
});

test('Los contenidos nuevos se derivan reproduciblemente de los originales sin alterar fuentes',()=>{
 for(const [bank,lang,folder] of [[es,'es',''],[va,'val','val']]){
  const base=join(src,folder);
  const original=JSON.parse(read(base,lang==='es'?'assets/curriculum.json':'curriculum.json'));
  const built=makeLatin4Curriculum({curriculum:original,locale:lang,
    indicative:read(base,'indicativo.html'),nouns:read(base,'sustantivos.html'),
    adjectives:read(base,'adjetivos.html')});
  assert.deepEqual(bank,built);
  assert.equal(read(base,lang==='es'?'assets/curriculum.json':'curriculum.json'),
    read(join(dest,folder),lang==='es'?'assets/curriculum.json':'curriculum.json'));
  assert.equal(original.latin.units.length,10,'Latín I original conserva diez unidades');
  assert.equal(original.griego.units.length,14);
 }
});

test('No se adelantan declinaciones, tiempos, pronombres ni voz pasiva',()=>{
 for(const bank of [es,va]){
  const str=(u)=>bank.latin.units[u-1].topics.map(t=>t.html).join(' ');
  assert.ok(str(1).includes('rosa')&&!str(1).includes('dominus / bellum'));
  assert.ok(str(2).includes('dominus')&&str(2).includes('sum'));
  assert.ok(!str(2).includes('Imperfecto de indicativo · voz activa'));
  assert.ok(str(3).includes('bonus')&&str(3).includes('ad'));
  assert.ok(!str(3).includes('brevis, -e'));
  assert.ok(str(4).includes('amabam'));
  assert.ok(!str(4).includes('amavi'));
  assert.ok(str(5).includes('civ')&&str(5).includes('flum'));
  assert.ok(str(6).includes('amavi')&&str(6).includes('amatur'));
  assert.ok(!str(6).includes('amaveram')&&!str(6).includes('duxeram'));
  assert.ok(!topic(bank,6,0).html.includes('gender-form'),
    'El perfecto activo no anticipa el pasivo compuesto');
  assert.ok(str(7).includes('vetus')&&str(7).includes('amaveram'));
  assert.ok(!topic(bank,7,1).html.includes('gender-form'));
  assert.ok(str(8).includes('exercitus')&&str(8).includes('ego'));
  assert.ok(!str(8).includes('Participio de perfecto'));
 }
});

test('Castellano y valenciano: terminología, paradigmas y procedencia paralelos',()=>{
 const a=es.latin.units,b=va.latin.units;
 assert.deepEqual(a.map(u=>u.topics.map(t=>[t.sourceUnit,t.sourceTopic])),
  b.map(u=>u.topics.map(t=>[t.sourceUnit,t.sourceTopic])));
 assert.match(topic(es,1,0).html,/lengua flexiva/);
 assert.match(topic(va,1,0).html,/llengua flexiva/);
 assert.match(topic(es,1,2).html,/Nominativo/);
 assert.match(topic(va,1,2).html,/Nominatiu/);
 assert.match(topic(es,6,0).html,/Perfecto de indicativo/);
 assert.match(topic(va,6,0).html,/Perfet d’indicatiu/);
 assert.match(topic(es,7,1).html,/Pluscuamperfecto/);
 assert.match(topic(va,7,1).html,/Plusquamperfet/);
 assert.match(topic(es,8,1).html,/Pronombres personales/);
 assert.match(topic(va,8,1).html,/Pronoms personals/);
 for(let u=1;u<=8;u++){
  for(let j=0;j<a[u-1].topics.length;j++){
   const tables=(body)=>[...body.matchAll(/<table\b/gu)].length;
   assert.equal(tables(a[u-1].topics[j].html),tables(b[u-1].topics[j].html),
    'Discrepancia entre tablas bilingües: '+u+'/'+j);
  }
 }
});

test('La gramática de 4.º se abre en la biblioteca y en el itinerario de ScholaClassica',()=>{
 const portal=read(root,'public/app.js'),index=read(root,'public/index.html');
 assert.ok(portal.includes("id:'gramatica',label:'Gramática · Latín de 4.º de ESO'"));
 assert.ok(portal.includes('curso=4&unidad=1'));
 assert.ok(index.includes('curso=4&amp;unidad=1'));
 for(const [lang,folder,js] of [['es','', 'assets/app.js'],['val','val','app.js']]){
  const html=read(join(dest,folder),'curso.html');
  const home=read(join(dest,folder),'index.html');
  const script=read(join(dest,folder),js);
  assert.ok(html.includes('<option value="4">')&&home.includes('<option value="4">'));
  assert.ok(home.includes('curso=4&amp;unidad=1'));
  assert.ok(script.includes('curriculum-latin4.json'));
  assert.ok(script.includes('selection.year==='));
  assert.ok(script.includes("year==='4'&&language==='latin'?8"));
  assert.ok(script.includes("lang.value!=='latin'"));
  assert.ok(script.includes("selection.year!=='2'"));
  assert.ok(script.includes('const currentUnits='));
  execFileSync(process.execPath,['--check',join(dest,folder,js)]);
  assert.ok(lang==='val'?html.includes('4t d'):html.includes('4.º'));
 }
});

test('Alterar el temario o suprimir paradigmas detiene la compilación',()=>{
 const base=join(src);
 const cv=JSON.parse(read(base,'assets/curriculum.json'));
 const indicative=read(base,'indicativo.html');
 const nouns=read(base,'sustantivos.html');
 const adjectives=read(base,'adjetivos.html');
 const opt={curriculum:cv,indicative,nouns,adjectives,locale:'es'};
 assert.throws(()=>makeLatin4Curriculum({...opt,indicative:indicative.replace(
  'id="pluscuamperfecto-de-indicativo"','id="sin-pluscuamperfecto"')}),/Falta tiempo verbal/);
 assert.throws(()=>makeLatin4Curriculum({...opt,nouns:nouns.replace(
  'id="tercera-declinacion"','id="sin-tercera"')}),/AssertionError/);
 const altered=structuredClone(cv);
 altered.latin.units[0].topics[0].html=altered.latin.units[0].topics[0].html
  .replace('<h3>Segunda declinación</h3>','');
 assert.throws(()=>makeLatin4Curriculum({...opt,curriculum:altered}),/Falta epígrafe/);
});

test('El adaptador exige el temario docente exacto, no inventa UD9–10',()=>{
 const vocab=read(join(root,'.sources/vocabula'),'gramatica-contenidos.js');
 assert.match(vocab,/GRAMMAR_CONTENT/);
 // Debe existir un temario de exactamente ocho unidades, independientemente
 // de las etiquetas complementarias UD9/UD10 del vocabulario.
 const mat=vocab.match(/window\.GRAMMAR_CONTENT\s*=\s*(\{[\s\S]*\});?\s*$/u);
 const o=JSON.parse(mat[1]);
 assert.equal(o.syllabi.lat4.length,8);
 assert.ok(!o.syllabi.lat4.some(([u])=>/^UD (?:9|10)$/.test(u)));
});
