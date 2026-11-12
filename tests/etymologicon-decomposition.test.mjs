import test from 'node:test';
import assert from 'node:assert/strict';
import {compileTeacherAudit} from '../scripts/compile-etymologicon-gr1.mjs';
import {createLearnerCatalog} from '../scripts/build-etymologicon.mjs';
import {createDecompositionCatalog} from '../scripts/compile-etymologicon-decomposition.mjs';
import {createDecompositionBank} from '../apps/etymologicon/decomposition.mjs';
import {emptyProgress,recordQuizAttempt,progressSummary,exportProgress,importProgress,
  filteredEtyma} from '../apps/etymologicon/progress.mjs';
import {createWriteTwoCorrector} from '../shared/academic/greek-etymology/corrector/write-two.mjs';

const academic=createLearnerCatalog(compileTeacherAudit());
const pilot=createDecompositionCatalog(academic);
const engine=createDecompositionBank(pilot);
const now='2026-11-12T20:00:00.000Z';
test('inventario auditado conserva 111/201/217, pero solo habilita 16 compuestos contrastados',()=>{
  assert.equal(academic.etymons.length,111);
  assert.equal(academic.derivatives.length,201);
  assert.equal(academic.relations.length,217);
  assert.equal(pilot.schema,'etymologicon-decomposition-learners/v1');
  assert.equal(pilot.status,'closed_pilot_for_guided_practice_not_exam');
  assert.equal(pilot.publicationAllowed,false);
  assert.equal(pilot.entries.length,16);
  assert.equal(engine.size,16);
  assert.equal(pilot.audit.derivativesReviewedForEligibility,201);
  assert.equal(pilot.audit.approvedForPractice,16);
  assert.equal(pilot.audit.awaitingIndividualDecompositionReview,185);
  assert.equal(pilot.audit.unreviewedDerivativeIds.length,185);
  assert.ok(pilot.entries.every(e=>e.enabledForExams===false));
  assert.ok(pilot.entries.every(e=>e.evidence.url.startsWith('https://dle.rae.es/')));
  assert.ok(pilot.entries.every(e=>e.parts.length===2));
  assert.equal(new Set(pilot.entries.map(x=>x.derivativeId)).size,16);
});
test('las 16 descomposiciones admiten exclusivamente sus dos bases aprobadas',()=>{
  const etymons=new Set(academic.etymons.map(e=>e.id));
  const derivatives=new Set(academic.derivatives.map(d=>d.id));
  for(const item of pilot.entries){
    assert.ok(derivatives.has(item.derivativeId),item.form);
    assert.ok(item.parts.every(p=>etymons.has(p.etymonId)),item.form);
    const exact=engine.grade(item.id,item.parts.map(p=>p.greek));
    assert.equal(exact.total,2,item.form);
    assert.deepEqual(exact.answers.map(a=>a.points),[1,1]);
    const latin=engine.grade(item.id,item.parts.map(p=>p.latinAccepted[0]));
    assert.equal(latin.total,2,item.form+' latinizado');
    assert.ok(item.introducedAtUnit.startsWith('UD'));
    assert.ok(item.parts.every(p=>p.combiningForm&&p.gloss));
  }
});
test('los componentes no se pueden confundir ni aceptar por semejanza o intercambiados',()=>{
  const philosophy=pilot.entries.find(x=>x.form==='filosofía');
  assert.ok(philosophy);
  assert.equal(engine.grade(philosophy.id,['philos','sophia']).total,2);
  assert.equal(engine.grade(philosophy.id,['φιλος','σοφια']).total,2);
  assert.equal(engine.grade(philosophy.id,['sophia','philos']).total,0);
  assert.equal(engine.grade(philosophy.id,['philos','sohpia']).total,1);
  assert.equal(engine.grade(philosophy.id,['philos','logos']).total,1);
  assert.equal(engine.grade(philosophy.id,['filos!','sophia']).total,1);
  assert.equal(engine.grade(philosophy.id,['','']).total,0);
  assert.equal(engine.grade(philosophy.id,['φίλοςfoo','σοφία']).total,1);
  assert.throws(()=>engine.grade('decomp:no-existe',['a','b']),/autorizada/);
  assert.throws(()=>engine.grade(philosophy.id,['philos']),/dos componentes/);
});
test('la transliteración muestra la palabra griega reconocida y no concede puntos por preview orientativa',()=>{
  assert.equal(engine.read('philos').greek,'φίλος');
  assert.equal(engine.read('sophia').greek,'σοφία');
  assert.equal(engine.read('logos').greek,'λόγος');
  assert.equal(engine.read('sohpia').status,'not_catalogued');
  assert.equal(engine.read('sophia-algo').status,'not_catalogued');
  assert.equal(engine.read('λόγος latin').status,'not_catalogued');
  assert.equal(engine.read(' ').status,'blank');
});
test('unidades de introducción: nunca aparece un compuesto antes de haber visto ambos étimos',()=>{
  for(const item of pilot.entries){
    const minUnit=Number(item.introducedAtUnit.slice(2));
    for(let n=1;n<=12;n++){
      const entries=engine.available({mode:'unit',unit:'UD'+n});
      assert.equal(entries.some(e=>e.id===item.id),n>=minUnit,item.form+' UD'+n);
    }
  }
  assert.equal(engine.available({mode:'unit',unit:'all'}).length,0);
  const pool=academic.etymons.filter(e=>e.id===pilot.entries[0].parts[0].etymonId);
  assert.ok(engine.available({mode:'errors',pool}).some(x=>x.id===pilot.entries[0].id));
  assert.equal(engine.available({mode:'general'}).length,16);
  const pick=engine.select(engine.available(),{random:()=>0});
  assert.equal(pick.id,pilot.entries[0].id);
  assert.notEqual(engine.select(engine.available(),{random:()=>0,previousId:pick.id}).id,pick.id);
  assert.equal(engine.select([]),null);
  assert.throws(()=>engine.select(engine.available(),{random:()=>1}),/Aleatoriedad/);
});
test('el progreso de descomposición permanece separado y compatible con copias JSON antiguas',()=>{
  const item=pilot.entries[0],anchor=item.parts[0].etymonId;
  const original=emptyProgress();
  let progress=recordQuizAttempt(original,academic.etymons,'decomposition',anchor,false,now);
  assert.equal(progressSummary(progress,academic.etymons).decompositionAttempted,1);
  assert.equal(progressSummary(progress,academic.etymons).decompositionPerfect,0);
  assert.equal(progressSummary(progress,academic.etymons).exercises,0);
  assert.ok(filteredEtyma(academic.etymons,progress,{mode:'errors'}).some(e=>e.id===anchor));
  progress=recordQuizAttempt(progress,academic.etymons,'decomposition',anchor,true,
    '2026-11-12T20:01:00.000Z');
  progress=recordQuizAttempt(progress,academic.etymons,'decomposition',anchor,true,
    '2026-11-12T20:02:00.000Z');
  assert.equal(progressSummary(progress,academic.etymons).decompositionPerfect,2);
  assert.equal(progress.activities.decomposition.records[anchor].needsReview,false);
  assert.deepEqual(importProgress(exportProgress(progress,academic.etymons),academic.etymons),progress);
  const prior=structuredClone(progress);
  delete prior.activities.decomposition;
  const restored=importProgress(JSON.stringify(prior),academic.etymons);
  assert.deepEqual(restored.activities.decomposition.records,{});
  assert.deepEqual(restored.courses.gr2.records,{});
  assert.equal(createWriteTwoCorrector(academic).grade('grc:προσ',['proselito','prosodia']).total,1.5);
});
test('no activar Griego II ni declarar verificadas otras 185 relaciones',()=>{
  assert.ok(!pilot.entries.some(e=>e.verificationStatus!=='approved_for_guided_decomposition'));
  assert.ok(pilot.audit.unreviewedDerivativeIds.every(id=>
    !pilot.entries.some(e=>e.derivativeId===id)));
  assert.equal(pilot.sourceCatalog,'etymologicon-audited-catalog/v1');
  assert.ok(academic.relations.every(r=>!r.decompositionReady));
});
