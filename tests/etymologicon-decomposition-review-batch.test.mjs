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
test('35 ejercicios; se conservan los 16 originales exactamente y se incorporan 19 revisados',()=>{
  assert.equal(result.entries.length,35);
  assert.deepEqual(result.entries.slice(0,16),pilot.entries);
  assert.equal(result.audit.catalogDerivatives,487);
  assert.equal(result.audit.awaitingIndividualDecompositionReview,452);
  assert.equal(engine.size,35);
  assert.equal(result.publicationAllowed,false);
  const expected={teocracia:'UD1','biografía':'UD2','cronología':'UD2','xilófono':'UD3','prólogo':'UD4','caligrafía':'UD5','polifonía':'UD5','geología':'UD6','dermatología':'UD8','monólogo':'UD12'};
  assert.deepEqual(Object.fromEntries(result.entries.slice(25).map(e=>[e.form,e.introducedAtUnit])),expected);
  for(const item of result.entries){
    assert.equal(item.enabledForExams,false);
    assert.equal(engine.grade(item.id,item.parts.map(p=>p.greek)).total,2,item.form);
    assert.equal(engine.grade(item.id,item.parts.map(p=>p.latinAccepted[0])).total,2,item.form);
    assert.equal(engine.grade(item.id,item.parts.map(p=>p.greek).reverse()).total,0,item.form);
    for(let n=1;n<=12;n++)assert.equal(engine.available({mode:'unit',unit:'UD'+n}).some(x=>x.id===item.id),n>=Number(item.introducedAtUnit.slice(2)),item.form+' UD'+n);
  }
  assert.equal(engine.grade('decomp:gr1:talasocracia',['θάλασσα','κράτος']).total,2);
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
