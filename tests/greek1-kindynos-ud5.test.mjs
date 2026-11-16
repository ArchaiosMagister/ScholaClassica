import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {applyGreek1KindynosUd5,GREEK1_KINDYNOS_GENERAL_ID,
  GREEK1_KINDYNOS_EXAM_ID} from '../scripts/greek1-kindynos-ud5-decision.mjs';
import {scholaVocabularyAll,scholaVocabularyRecordProgress}
  from '../scripts/vocabula-all-model.mjs';

const root=resolve(import.meta.dirname,'..');
const parse=file=>JSON.parse(readFileSync(file,'utf8')
  .replace(/^window\.VOCAB\s*=/u,'').replace(/;\s*$/u,''));
const original=parse(join(root,'.sources/vocabula/data.js'));
const integrated=parse(join(root,'dist/apps/vocabulario/data.js'));
const byId=new Map(integrated.map(x=>[x.id,x]));

test('Decisión docente exclusiva de κίνδυνος General y copia original inmutable',()=>{
  const snapshot=JSON.stringify(original);
  const adapted=applyGreek1KindynosUd5(original);
  assert.equal(JSON.stringify(original),snapshot,'El adaptador no muta el original');
  assert.equal(adapted.length,2055);
  assert.deepEqual(adapted.map(x=>x.id),original.map(x=>x.id));
  const general=adapted.find(e=>e.id===GREEK1_KINDYNOS_GENERAL_ID);
  const exam=adapted.find(e=>e.id===GREEK1_KINDYNOS_EXAM_ID);
  assert.deepEqual(general.units,['UD 5']);
  assert.deepEqual(exam,original.find(e=>e.id===GREEK1_KINDYNOS_EXAM_ID));
  assert.deepEqual(original.find(e=>e.id===GREEK1_KINDYNOS_GENERAL_ID).units,
    ['Sin unidad acreditada']);
  const gr1Modified=adapted.filter(e=>e.subject==='gr1'&&
    JSON.stringify(e)!==JSON.stringify(original.find(row=>row.id===e.id)));
  assert.deepEqual(gr1Modified.map(e=>e.id),[GREEK1_KINDYNOS_GENERAL_ID]);
  for(const entry of adapted.filter(e=>e.subject==='gr1')){
    const published=byId.get(entry.id);
    assert.deepEqual(published,entry,'La copia debe coincidir con la decisión: '+entry.id);
  }
  assert.equal(integrated.filter(e=>e.subject==='gr1'&&
    e.mode==='general'&&e.units?.includes('Sin unidad acreditada')).length,183);
  assert.equal(integrated.filter(e=>e.subject==='gr1'&&
    e.mode==='examen'&&e.units?.includes('UD 5')).length,
    original.filter(e=>e.subject==='gr1'&&
      e.mode==='examen'&&e.units?.includes('UD 5')).length);
});
test('Los 15 ejemplos de Appendix y las 168 restantes no cambian en ScholaClassica',()=>{
  const sourceUnassigned=original.filter(e=>e.subject==='gr1'&&
    e.mode==='general'&&e.units?.includes('Sin unidad acreditada'));
  assert.equal(sourceUnassigned.length,184);
  for(const e of sourceUnassigned){
    if(e.id===GREEK1_KINDYNOS_GENERAL_ID)continue;
    assert.deepEqual(byId.get(e.id),e,'No se autorizó cambiar '+e.form);
  }
});
test('UD5 activa la ficha General sin fusionar Examen ni perder el progreso',()=>{
  const selected=scholaVocabularyAll(integrated,'gr1',['UD 5']);
  const general=selected.find(e=>e.id===GREEK1_KINDYNOS_GENERAL_ID);
  const exam=selected.find(e=>e.id===GREEK1_KINDYNOS_EXAM_ID);
  assert.ok(general,'Debe ser posible estudiar κίνδυνος General en UD5');
  assert.ok(exam,'Examen UD5 debe seguir visible');
  assert.equal(general.mode,'general');
  assert.equal(exam.mode,'examen');
  assert.deepEqual(general.scholaSources.map(e=>e.id),[GREEK1_KINDYNOS_GENERAL_ID]);
  assert.deepEqual(exam.scholaSources.map(e=>e.id),[GREEK1_KINDYNOS_EXAM_ID]);
  const progress={
    [GREEK1_KINDYNOS_GENERAL_ID]:{total:3,right:2,failed:true},
    [GREEK1_KINDYNOS_EXAM_ID]:{total:2,right:2,failed:false}
  };
  scholaVocabularyRecordProgress(progress,general,true);
  assert.deepEqual(progress,{
    [GREEK1_KINDYNOS_GENERAL_ID]:{total:4,right:3,failed:false},
    [GREEK1_KINDYNOS_EXAM_ID]:{total:2,right:2,failed:false}
  },'El progreso sigue ligado a su identificador histórico, sin tocar Examen');
});
test('La decisión se bloquea si cambia el histórico o la ficha Examen',()=>{
  const moved=structuredClone(original);
  moved.find(e=>e.id===GREEK1_KINDYNOS_EXAM_ID).units=['UD 6'];
  assert.throws(()=>applyGreek1KindynosUd5(moved),
    /La evidencia de Examen UD5 cambió/);
  const replaced=structuredClone(original);
  replaced.find(e=>e.id===GREEK1_KINDYNOS_GENERAL_ID).meaning='otro significado';
  assert.throws(()=>applyGreek1KindynosUd5(replaced),
    /Expected values to be strictly deep-equal/);
  const reassigned=structuredClone(original);
  reassigned.find(e=>e.id===GREEK1_KINDYNOS_GENERAL_ID).units=['UD 5'];
  assert.throws(()=>applyGreek1KindynosUd5(reassigned),
    /La fuente General cambió/);
});
