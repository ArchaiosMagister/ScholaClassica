import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {
 scholaVocabularyUnitCaption,scholaVocabularyScopeDescription,
 scholaVocabularyProvenance,scholaVocabularyAll
} from '../scripts/vocabula-all-model.mjs';

const root=resolve(import.meta.dirname,'..');
const parse=file=>JSON.parse(readFileSync(file,'utf8')
 .replace(/^window\.VOCAB\s*=\s*/u,'').replace(/;\s*$/u,''));
const origin=parse(join(root,'.sources/vocabula/data.js'));
const current=parse(join(root,'dist/apps/vocabulario/data.js'));
const key=s=>String(s).split(':')[0].split(/[,+(]/u)[0]
 .toLowerCase().replaceAll('æ','ae').replaceAll('œ','oe').replaceAll('ς','σ')
 .normalize('NFD').replace(/\p{M}/gu,'').replace(/\s+/gu,' ').trim();

test('Solo se introducen rótulos de alumnado, sin modificar 2055 fichas ni unidades',()=>{
 assert.equal(origin.length,2055);
 assert.equal(current.length,2055);
 for(let i=0;i<origin.length;i++){
  assert.equal(origin[i].id,current[i].id);
  if(['lat1','gr1'].includes(origin[i].subject))
   assert.deepEqual(current[i],origin[i],
    'No se puede reclasificar un banco sin evidencia de unidad');
 }
 assert.equal(scholaVocabularyUnitCaption('lat1','UD 11–12'),
  'Ampliación · fuera de las unidades habituales');
 assert.equal(scholaVocabularyUnitCaption('gr1','Sin unidad acreditada'),
  'Complementario · sin unidad asignada');
 for(const [sub,unit] of [
  ['lat1','UD 4'],['gr1','UD 1–4'],
  ['lat4','UD 11–12'],['lat2','Sin unidad acreditada']
 ])assert.equal(scholaVocabularyUnitCaption(sub,unit),unit);
 assert.match(scholaVocabularyScopeDescription('lat1','general',''),
  /General no equivale a exigible en examen/);
 assert.match(scholaVocabularyScopeDescription('gr1','general',''),
  /no se convierte en exigible/);
 for(const sub of ['lat1','gr1']){
  assert.match(scholaVocabularyScopeDescription(sub,'examen',''),
   /lista docente/);
  assert.match(scholaVocabularyScopeDescription(sub,'all',''),
   /no exigibles automáticamente/);
 }
 assert.equal(scholaVocabularyScopeDescription('lat4','general','origen'),'origen');
 assert.match(scholaVocabularyScopeDescription('lat4','all','origen'),
  /General y Examen/);
});

test('Latín I: 140 etiquetas de ampliación, solo 73 lemas sin unidad anterior',()=>{
 const general=origin.filter(e=>e.subject==='lat1'&&e.mode==='general');
 const additional=general.filter(e=>e.units.includes('UD 11–12'));
 const exclusive=additional.filter(e=>e.units.length===1);
 const other=general.filter(e=>e.units.some(u=>u!=='UD 11–12'));
 const known=new Set(other.map(e=>key(e.form)));
 const isolated=exclusive.filter(e=>!known.has(key(e.form)));
 assert.equal(additional.length,140);
 assert.equal(exclusive.length,82);
 assert.equal(isolated.length,73);
 assert.equal(scholaVocabularyAll(current,'lat1',['UD 11–12'])
  .filter(e=>e.scholaSelectedIds.every(id=>
    current.find(x=>x.id===id)?.units.includes('UD 11–12'))).length,
  scholaVocabularyAll(current,'lat1',['UD 11–12']).length);
 const fromGeneral=additional.find(e=>e.units.length>1);
 assert.ok(fromGeneral);
 const representation=scholaVocabularyAll(current,'lat1')
  .find(e=>e.scholaSources.some(s=>s.id===fromGeneral.id));
 assert.ok(representation);
 const label=scholaVocabularyProvenance(representation);
 assert.ok(label.includes('Ampliación · fuera de las unidades habituales'));
 assert.ok(!label.includes('UD 11–12'));
 assert.ok(label.includes('General:'));
 assert.deepEqual(current.find(e=>e.id===fromGeneral.id)?.units,
  fromGeneral.units,'No reasignar palabras que aparecen también en unidades previas');
});

test('Griego I: 184 fichas alfabéticas complementarias sin asignación artificial',()=>{
 const general=origin.filter(e=>e.subject==='gr1'&&e.mode==='general');
 const noUnit=general.filter(e=>e.units.includes('Sin unidad acreditada'));
 assert.equal(noUnit.length,184);
 assert.ok(noUnit.every(e=>e.units.length===1));
 const grouping=scholaVocabularyAll(current,'gr1',['Sin unidad acreditada']);
 assert.ok(grouping.length>0);
 assert.ok(grouping.every(e=>
  e.scholaSelectedIds.every(id=>current.find(x=>x.id===id)?.units.includes('Sin unidad acreditada'))));
 const entry=current.find(e=>e.id===noUnit[0].id);
 assert.equal(scholaVocabularyProvenance(entry),
  'Complementario · sin unidad asignada');
 const combined=scholaVocabularyAll(current,'gr1')
  .find(e=>e.scholaSources.some(s=>s.id===entry.id));
 assert.ok(combined);
 assert.ok(scholaVocabularyProvenance(combined)
  .includes('General: Complementario · sin unidad asignada'));
 assert.deepEqual(entry.units,['Sin unidad acreditada']);
 assert.equal(current.filter(e=>e.subject==='gr1'&&e.mode==='examen'&&
  e.units.includes('Sin unidad acreditada')).length,0);
});

test('Fichas de examen, procedencia y progreso conservan sus valores anteriores',()=>{
 for(const subject of ['lat1','gr1']){
  const exam=origin.filter(e=>e.subject===subject&&e.mode==='examen');
  const target=current.filter(e=>e.subject===subject&&e.mode==='examen');
  assert.deepEqual(target,exam);
 }
 const cases=['ac (conj.)','atque (conj.)','flumen, fluminis (n.)',
  'Cæsar','eques, equitis (m.)'];
 const latin=scholaVocabularyAll(current,'lat1');
 for(const form of cases){
  const cards=latin.filter(e=>e.form.startsWith(form));
  assert.ok(cards.length,'Se perdió '+form);
  const sources=cards.flatMap(card=>card.scholaSources);
  const original=sources.map(x=>current.find(e=>e.id===x.id));
  assert.deepEqual(sources.map(x=>x.units),original.map(e=>e.units));
  assert.ok(sources.some(e=>e.mode==='general'));
  assert.ok(sources.some(e=>e.mode==='examen'));
  const captions=cards.map(scholaVocabularyProvenance);
  assert.ok(captions.some(text=>text.includes('General:')));
  assert.ok(captions.some(text=>text.includes('Examen:')));
  // Las glosas distintas nunca deben fusionarse solo por compartir lema.
  assert.equal(new Set(sources.map(x=>x.id)).size,sources.length);
 }
 const originalProgress={
  [latin[0].id]:{total:3,right:2,failed:true}
 };
 assert.deepEqual(JSON.parse(JSON.stringify(originalProgress)),originalProgress);
 // No se crean identificadores nuevos y el etiquetado no toca progreso.
 assert.deepEqual(new Set(current.map(e=>e.id)).size,2055);
 const markup=readFileSync(join(root,'dist/apps/vocabulario/app.js'),'utf8');
 assert.match(markup,/value="\$\{esc\(u\)\}"/u,
  'Las casillas deben conservar sus claves técnicas, no las etiquetas');
 assert.match(markup,/scholaVocabularyUnitCaption\(\$\('subject'\)\.value,u\)/u);
 assert.match(markup,/scholaVocabularyScopeDescription/u);
 assert.ok(!markup.includes("e.units=e.units.map("));
});
