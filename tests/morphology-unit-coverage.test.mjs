import test from 'node:test';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {
  CURRICULAR_MORPHOLOGY_PLAN,EARLY_LATIN1_RESOLUTIONS,
  auditMorphologyCurricularCoverage,loadMorphologyCurricularCoverage
} from '../scripts/audit-morphology-curricular-coverage.mjs';

const sources=loadMorphologyCurricularCoverage(resolve(import.meta.dirname,'..'));
const report=auditMorphologyCurricularCoverage(sources);

test('Los 264 paradigmas se distribuyen en 32 unidades sin adelantar 4.º UD9–10',()=>{
  assert.deepEqual(report.counts,{latin1:94,latin4:76,griego1:94});
  assert.equal(report.courses.latin1.units[0].newRecords,13);
  assert.equal(report.courses.latin1.units[1].newRecords,8);
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
test('Las dos reservas de Latín I están resueltas exclusivamente por los ejemplos verificados',()=>{
  assert.deepEqual(report.findings,[]);
  assert.equal(report.findingsTotal,0);
  assert.equal(report.resolutionsTotal,2);
  assert.deepEqual(report.resolutions.map(x=>[x.course,x.unit,x.recordId]),[
    ['latin1',1,EARLY_LATIN1_RESOLUTIONS.infinitives.id],
    ['latin1',2,EARLY_LATIN1_RESOLUTIONS.locatives.id]
  ]);
  const ud1=report.courses.latin1.units[0].topics
    .find(t=>t.topic==='Infinitivo de presente activo');
  assert.equal(ud1.status,'ejemplos-documentados-practicables');
  assert.deepEqual(ud1.exercise.infinitivo,{
    choiceAnalysis:5,choiceForm:5,written:5,tables:0
  });
  const ud2=report.courses.latin1.units[1].topics
    .find(t=>t.topic==='El locativo');
  assert.equal(ud2.status,'caso-especial-presente');
  assert.deepEqual(ud2.exercise.sustantivo,{
    choiceAnalysis:5,choiceForm:0,written:0,tables:0
  },'El locativo no debe aparecer como declinación productiva');
  assert.equal(ud2.newForms,5);
});
test('La pérdida de un ejemplo o de la política no productiva reabre solo su reserva',()=>{
  const withoutInfinitive=structuredClone(sources.bank);
  const inf=withoutInfinitive.records.find(r=>
    r.id===EARLY_LATIN1_RESOLUTIONS.infinitives.id);
  inf.forms.pop();
  const first=auditMorphologyCurricularCoverage({
    ...sources,bank:withoutInfinitive
  },{sampleExercises:false});
  assert.deepEqual(first.findings.map(x=>[x.course,x.unit,x.status]),[
    ['latin1',1,'ejemplos-documentados-pendientes']
  ]);
  assert.equal(first.resolutionsTotal,1);
  const productive=structuredClone(sources.bank);
  productive.records.find(r=>r.id===EARLY_LATIN1_RESOLUTIONS.locatives.id)
    .evidence.practiceScope='all';
  const second=auditMorphologyCurricularCoverage({
    ...sources,bank:productive
  },{sampleExercises:false});
  assert.deepEqual(second.findings.map(x=>[x.course,x.unit,x.status]),[
    ['latin1',2,'caso-especial-incompleto']
  ]);
  assert.equal(second.resolutionsTotal,1);
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
