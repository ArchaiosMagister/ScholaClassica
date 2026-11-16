import test from 'node:test';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {
  CURRICULAR_MORPHOLOGY_PLAN,auditMorphologyCurricularCoverage,
  loadMorphologyCurricularCoverage
} from '../scripts/audit-morphology-curricular-coverage.mjs';

const sources=loadMorphologyCurricularCoverage(resolve(import.meta.dirname,'..'));
const report=auditMorphologyCurricularCoverage(sources);

test('Los 262 paradigmas se distribuyen en 32 unidades sin adelantar 4.º UD9–10',()=>{
  assert.deepEqual(report.counts,{latin1:92,latin4:76,griego1:94});
  assert.equal(Object.values(report.courses).reduce((n,c)=>n+c.grammarUnits,0),32);
  assert.deepEqual(Object.values(report.courses).map(c=>c.grammarUnits),[10,8,14]);
  assert.deepEqual(
    Object.values(CURRICULAR_MORPHOLOGY_PLAN).map(units=>
      units.reduce((n,u)=>n+u.length,0)),[30,15,28]
  );
  assert.equal(sources.bank.records.filter(r=>r.language==='latin4'&&r.unit>8).length,0);
  for(const course of Object.values(report.courses)){
    assert.equal(course.units.reduce((n,u)=>n+u.newRecords,0),course.records);
    assert.ok(course.units.every(u=>u.newRecords>=1));
    assert.ok(course.units.every(u=>u.newForms>0));
    for(const u of course.units)for(const row of u.topics){
      assert.ok(row.status);
      if(row.mode==='introduced'&&row.newRecords>0){
        assert.ok(row.recordIds.length);
        assert.ok(row.newForms>0);
        assert.ok(row.exercise,'Cada categoría nueva debe tener diagnóstico de actividades');
      }
    }
  }
});
test('No se confunde sintaxis/invariables con lagunas flexivas',()=>{
  for(const course of Object.values(report.courses)){
    for(const unit of course.units)for(const topic of unit.topics){
      if(topic.mode==='not-flexional'){
        assert.equal(topic.status,'no-aplica-flexion');
        assert.equal(topic.newRecords,0);
      }
    }
  }
  const latin1=report.courses.latin1.units;
  assert.equal(latin1[1].topics.find(t=>t.topic==='El locativo').mode,'special-case');
  assert.equal(latin1[2].topics.find(t=>t.topic==='Adjetivos sustantivados').mode,'reused');
  assert.equal(report.courses.griego1.units[4].topics
    .find(t=>t.topic==='Sustantivación del adjetivo').mode,'reused');
});
test('El infinitivo latino UD8 se reconoce por el análisis real aunque el modelo sea de tipo verbo',()=>{
  const topic=report.courses.latin1.units[7].topics
    .find(t=>t.topic==='Infinitivos y oración de infinitivo');
  assert.equal(topic.status,'categoria-introducida');
  assert.deepEqual(topic.kinds,['verbo']);
  assert.equal(topic.markerMatches,true);
  assert.ok(topic.exactTopicEvidence>=1,'La fuente ha de referir el tema UD8');
  assert.ok(topic.exercise.verbo.written>0,'Deben poder responderse infinitivos por escrito');
  const passive=report.courses.latin1.units[8].topics
    .find(t=>t.topic==='Participio de perfecto y tiempos compuestos pasivos');
  assert.equal(passive.status,'categoria-introducida');
  assert.equal(passive.markerMatches,true);
  assert.ok(passive.exactTopicEvidence>=1);
});
test('Las dos reservas de Latín I son independientes de los temas sintácticos',()=>{
  assert.deepEqual(report.findings.map(x=>[x.course,x.unit,x.topic,x.status]),[
    ['latin1',1,'Infinitivo de presente activo','sin-modelo-nuevo-de-la-categoria'],
    ['latin1',2,'El locativo','caso-especial-sin-ficha']
  ]);
});
test('La auditoría es solo lectura, sin modificar unidades, fichas ni progreso',()=>{
  const snapshot=JSON.stringify(sources.bank);
  auditMorphologyCurricularCoverage(sources,{sampleExercises:false});
  assert.equal(JSON.stringify(sources.bank),snapshot);
  assert.equal(report.schema,'scholaclassica-cobertura-morfologia-unidades/v1');
  assert.equal(report.findingsTotal,report.findings.length);
  assert.ok(report.findings.every(x=>x.course&&x.unit&&x.topic&&x.note));
});
test('Si una unidad deja de tener el modelo recién explicado, queda una reserva explícita',()=>{
  const altered={bank:{
    ...sources.bank,records:sources.bank.records.filter(r=>!(r.language==='latin4'&&
      r.unit===4&&r.kind==='verbo'))
  },curricula:sources.curricula};
  const diff=auditMorphologyCurricularCoverage(altered,{sampleExercises:false});
  const item=diff.findings.find(x=>x.course==='latin4'&&x.unit===4&&
    x.topic==='Imperfecto de indicativo activo');
  assert.ok(item,'Falta un aviso por desaparecer el imperfecto de 4.º');
  assert.equal(item.status,'sin-modelo-nuevo-de-la-categoria');
});
test('La matriz no reinterpreta equivalencia filológica ES/VAL como simple identidad de títulos',()=>{
  const changed=structuredClone({
    es:sources.curricula.latin1.es,
    val:sources.curricula.latin1.val
  });
  changed.val.latin.units[0].topics[0].html='';
  const modified={bank:sources.bank,curricula:{
    ...sources.curricula,latin1:changed
  }};
  assert.throws(()=>auditMorphologyCurricularCoverage(modified,{sampleExercises:false}),
    /Tablas desiguales ES\/VAL/);
});
