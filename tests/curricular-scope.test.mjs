import test from 'node:test';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {auditCurricularScope,loadCurricularScope,COURSE_SCOPES}
  from '../scripts/audit-curricular-scope.mjs';
import {scholaVocabularyVisibleUnits} from '../scripts/vocabula-all-model.mjs';

const root=resolve(import.meta.dirname,'..');
const source=loadCurricularScope(root);
const report=auditCurricularScope(source);

test('Tres currículos y 2055 fichas históricas: ninguna unidad o ID se inventa',()=>{
  assert.deepEqual(COURSE_SCOPES.map(x=>x.maxUnit),[10,8,14]);
  assert.equal(report.schema,'scholaclassica-auditoria-alcance-curricular/v1');
  assert.equal(report.sourceCards,2055);
  assert.equal(report.copyCards,2055);
  assert.deepEqual(Object.values(report.courses).map(x=>x.morphologyCards),[92,76,94]);
  assert.equal(report.reviewedLatin4Ud8Ids.length,17);
  for(const x of Object.values(report.courses)){
    assert.deepEqual(x.esTopics,x.valTopics,'Paridad de lecciones en dos idiomas');
  }
});
test('Latín I: unidades 11–12 son General histórico, nunca Examen',()=>{
  const x=report.courses.latin1;
  assert.deepEqual(x.sourceVocabulary,{general:741,examen:115});
  assert.deepEqual(x.historicalGroups.onlyBeyond,{general:82,examen:0});
  assert.deepEqual(x.historicalGroups.sharedBeyond,{general:58,examen:0});
  assert.deepEqual(x.beyondLabels,['UD 11–12']);
  assert.deepEqual(x.firstAndLastExamUnit,[1,7]);
  assert.equal(x.lateExamEntries.length,0);
});
test('Latín 4.º: 6 deponentes de UD10 preservados como ampliación no exigible',()=>{
  const x=report.courses.latin4;
  assert.deepEqual(x.sourceVocabulary,{general:379,examen:127});
  assert.deepEqual(x.historicalGroups.onlyBeyond,{general:43,examen:6});
  assert.deepEqual(x.historicalGroups.sharedBeyond,{general:39,examen:0});
  assert.deepEqual(x.historicalGroups.crossingBoundary,{general:0,examen:17});
  assert.equal(x.lateExamEntries.length,6);
  assert.ok(x.lateExamEntries.every(e=>e.units.length===1&&e.units[0]==='UD 10'));
  assert.deepEqual(x.beyondLabels,['UD 9','UD 10']);
  assert.ok(!x.integratedVisibleUnitLabels.includes('UD 9'));
  assert.ok(!x.integratedVisibleUnitLabels.includes('UD 10'));
  assert.ok(x.integratedOptionalUnitLabels.includes('UD 9'));
  assert.ok(x.integratedOptionalUnitLabels.includes('UD 10'));
  assert.deepEqual(scholaVocabularyVisibleUnits('lat4',['UD 8','UD 9','UD 10']),
    ['UD 8']);
});
test('Griego I: 184 fichas sin unidad son General, no Examen',()=>{
  const x=report.courses.griego1;
  assert.deepEqual(x.sourceVocabulary,{general:332,examen:171});
  assert.deepEqual(x.historicalGroups.withoutAccreditedUnit,{general:184,examen:0});
  assert.deepEqual(x.historicalGroups.onlyBeyond,{general:0,examen:0});
  assert.deepEqual(x.firstAndLastExamUnit,[1,10]);
  assert.equal(x.lateExamEntries.length,0);
});
test('Guardas contra reclasificaciones o adelantos curriculares no autorizados',()=>{
  const copy=structuredClone(source);
  const late=report.courses.latin4.lateExamEntries[0];
  copy.integrated.find(x=>x.id===late.id).units=['UD 8'];
  assert.throws(()=>auditCurricularScope(copy),/No promover automáticamente/u);
  const copy2=structuredClone(source);
  const greek=copy2.source.find(x=>x.subject==='gr1'&&
    x.units?.includes('Sin unidad acreditada'));
  greek.mode='examen';
  assert.throws(()=>auditCurricularScope(copy2),/No trasladar palabras sin UD/u);
  const copy3=structuredClone(source);
  copy3.bank.records.find(x=>x.language==='latin4').unit=9;
  assert.throws(()=>auditCurricularScope(copy3),/Morfología fuera de las unidades/u);
});
