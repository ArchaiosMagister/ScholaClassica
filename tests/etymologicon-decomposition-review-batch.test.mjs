import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {compileTeacherAudit} from '../scripts/compile-etymologicon-gr1.mjs';
import {createLearnerCatalog} from '../scripts/build-etymologicon.mjs';
import {expandGreekI} from '../scripts/expand-etymologicon-gr1.mjs';
import {createStudyCatalog} from '../scripts/compile-etymologicon-study.mjs';
import {createDecompositionCatalog,createExpandedDecompositionCatalog} from '../scripts/compile-etymologicon-decomposition.mjs';
import {createDecompositionBank} from '../apps/etymologicon/decomposition.mjs';
const base=compileTeacherAudit(),learners=createLearnerCatalog(base),expanded=expandGreekI(learners),study=createStudyCatalog(base,expanded);
const batch=JSON.parse(readFileSync(new URL('../shared/academic/greek-etymology/decomposition/gr1-review-batch-20261126.json',import.meta.url),'utf8'));
const pilot=createDecompositionCatalog(learners);
const result=createExpandedDecompositionCatalog(learners,expanded,study);
const engine=createDecompositionBank(result);
test('74 ejercicios con definición y sentido etimológico, conservando las 16 fichas originales',()=>{
  assert.equal(result.entries.length,74);
  assert.deepEqual(result.entries.slice(0,16).map(({etymologicalSense,definitionType,...entry})=>entry),pilot.entries);
  assert.equal(result.audit.catalogDerivatives,487);
  assert.equal(result.audit.awaitingIndividualDecompositionReview,413);
  assert.equal(engine.size,74);
  assert.equal(result.publicationAllowed,false);
  const expected={teocracia:'UD1','biografía':'UD2','cronología':'UD2','xilófono':'UD3','prólogo':'UD4','caligrafía':'UD5','polifonía':'UD5','geología':'UD6','dermatología':'UD8','monólogo':'UD12'};
  assert.deepEqual(Object.fromEntries(result.entries.slice(25,35).map(e=>[e.form,e.introducedAtUnit])),expected);
  const latest={"fonología":"UD3","diálogo":"UD4","politeísmo":"UD5","demagogo":"UD6","hidrografía":"UD6","autodidacta":"UD7","iconografía":"UD8","hipodérmico":"UD8","plutocracia":"UD8","cosmopolita":"UD12","xilografía":"UD2","paradoja":"UD4","megafonía":"UD5","anáfora":"UD6","hipogeo":"UD6","hidrofobia":"UD6","bibliófilo":"UD6","andrógino":"UD8","encéfalo":"UD9","cefalópodo":"UD9"};
  assert.deepEqual(Object.fromEntries(result.entries.slice(35,55).map(e=>[e.form,e.introducedAtUnit])),latest);
  const fifth={"fonógrafo":"UD3","ergonomía":"UD3","doxología":"UD3","anacronismo":"UD4","autónomo":"UD7","ginecología":"UD8","oftalmología":"UD9","podología":"UD9","cefalalgia":"UD12","otalgia":"UD12"};
  assert.deepEqual(Object.fromEntries(result.entries.slice(55,65).map(e=>[e.form,e.introducedAtUnit])),fifth);
  assert.deepEqual(Object.fromEntries(result.entries.slice(65).map(e=>[e.form,e.introducedAtUnit])),{"monoteísmo":"UD12","macrocéfalo":"UD9","microcosmos":"UD12","macrocosmos":"UD12","monografía":"UD12","polícromo":"UD12","bibliomanía":"UD11","gastralgia":"UD12","laringología":"UD9"});
  assert.ok(!result.entries.some(e=>e.form==='neumología'||e.form==='hemofobia'));
  assert.match(study.words.find(w=>w.form==='doxología').connection,/gloria o alabanza/);
  for(const item of result.entries){
    assert.equal(item.definitionType,'glosa_didactica_contrastada',item.form);
    assert.ok(item.etymologicalSense.length>20,item.form);
    const word=study.words.find(w=>w.form===item.form);
    assert.equal(word.dleDefinition,item.meaning,item.form);
    assert.equal(word.connection,item.etymologicalSense,item.form);
    assert.equal(item.enabledForExams,false);
    assert.equal(engine.grade(item.id,item.parts.map(p=>p.greek)).total,2,item.form);
    assert.equal(engine.grade(item.id,item.parts.map(p=>p.latinAccepted[0])).total,2,item.form);
    assert.equal(engine.grade(item.id,item.parts.map(p=>p.greek).reverse()).total,0,item.form);
    for(let n=1;n<=12;n++)assert.equal(engine.available({mode:'unit',unit:'UD'+n}).some(x=>x.id===item.id),n>=Number(item.introducedAtUnit.slice(2)),item.form+' UD'+n);
  }
  assert.equal(engine.grade('decomp:gr1:talasocracia',['θάλασσα','κράτος']).total,2);
  assert.equal(engine.grade('decomp:gr1:politeismo',['polis','theos']).total,1);
  assert.equal(engine.grade('decomp:gr1:politeismo',['polys','theos']).total,2);
  assert.equal(engine.grade('decomp:gr1:cosmopolita',['kosmos','polis']).total,2);
  assert.equal(engine.grade('decomp:gr1:talasocracia',['thalassa','kratos']).total,2);
});
test('el compilador rechaza candidatos sin autorización, duplicados o con unidades/componente incorrectos',()=>{
  for(const change of [
    x=>x.items[0].enabledForPractice=false,
    x=>x.items.push(structuredClone(x.items[0])),
    x=>x.items[0].introducedAtUnit='UD1',
    x=>x.items[0].components[0].etymonId='grc:θεοσ',
    x=>x.items[0].enabledForExams=true,
    x=>x.items[0].form='no_catalogada'
  ]){
    const copy=structuredClone(batch);change(copy);
    assert.throws(()=>createExpandedDecompositionCatalog(learners,expanded,study,copy));
  }
  const invalid=structuredClone(result);invalid.audit.approvedForPractice=16;
  assert.throws(()=>createDecompositionBank(invalid));
});
