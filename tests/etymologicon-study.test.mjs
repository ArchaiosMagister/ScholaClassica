import test from 'node:test';
import assert from 'node:assert/strict';
import {compileTeacherAudit} from '../scripts/compile-etymologicon-gr1.mjs';
import {createLearnerCatalog} from '../scripts/build-etymologicon.mjs';
import {createStudyBank} from '../apps/etymologicon/study.mjs';
import {createWriteTwoCorrector} from '../shared/academic/greek-etymology/corrector/write-two.mjs';
import {emptyProgress,validateProgress,exportProgress,importProgress,recordCardReview,
  recordMatchingRound,progressSummary,filteredEtyma,chooseAdaptive}
  from '../apps/etymologicon/progress.mjs';

const catalog=createLearnerCatalog(compileTeacherAudit());
const study=createStudyBank(catalog);
const eligible=catalog.etymons.filter(e=>e.editorialStatus==='approved_for_documented_derivatives');
const at='2026-11-12T19:00:00.000Z';

test('las tarjetas presentan solo las 108 fichas aprobadas y sus derivados, sin añadir propuestas',()=>{
  assert.equal(study.eligibleIds.length,108);
  assert.equal(study.getCard('grc:δικη'),null);
  assert.equal(study.getCard('grc:inexistente'),null);
  const d=new Map(catalog.derivatives.map(x=>[x.id,x]));
  for(const e of eligible){
    const card=study.getCard(e.id);
    assert.equal(card.id,e.id);
    assert.equal(card.lemma,e.lemma);
    assert.equal(card.meaning,e.meaning);
    assert.ok(card.derivatives.length>=2);
    assert.deepEqual(card.derivatives.map(x=>x.id).sort(),[...e.teacherApprovedDerivatives].sort());
    assert.ok(card.derivatives.every(x=>x.form===d.get(x.id).form));
  }
});
test('la relación no da falsos errores: cada derivado identifica inequívocamente a su étimo',()=>{
  const round=study.createRound(eligible,{count:4,random:()=>0.33});
  assert.equal(round.pairs.length,4);
  assert.equal(round.spanishOptions.length,4);
  assert.equal(new Set(round.pairs.map(x=>x.etymonId)).size,4);
  assert.equal(new Set(round.pairs.map(x=>x.derivativeId)).size,4);
  assert.deepEqual(new Set(round.pairs.map(x=>x.derivativeId)),
    new Set(round.spanishOptions.map(x=>x.derivativeId)));
  for(const pair of round.pairs){
    assert.ok(eligible.some(x=>x.id===pair.etymonId));
    assert.ok(study.getCard(pair.etymonId).derivatives.some(x=>x.id===pair.derivativeId));
    const globalOwners=catalog.relations.filter(r=>r.derivativeId===pair.derivativeId&&
      r.editorialStatus==='teacher_audit_approved'&&r.eligibleFor.includes('write_two'));
    assert.equal(globalOwners.length,1,'Derivado compartido no se debe convertir en correspondencia 1:1');
  }
});
test('no hay ronda si solo queda un étimo; unidades y aleatoriedad se validan',()=>{
  assert.equal(study.createRound([]),null);
  assert.equal(study.createRound([eligible[0]]),null);
  assert.throws(()=>study.createRound(eligible,{count:1}),/número/);
  assert.throws(()=>study.createRound(eligible,{random:()=>1}),/aleatoriedad/);
  const units=[...new Set(eligible.flatMap(x=>x.units))];
  let checked=0;
  for(const unit of units){
    const pool=eligible.filter(e=>e.units.includes(unit));
    if(study.matchable(pool).length>=2){
      const round=study.createRound(pool,{random:()=>0.5});
      assert.ok(round.pairs.length>=2);
      assert.ok(round.pairs.every(pair=>pool.some(x=>x.id===pair.etymonId)));
      checked++;
    }
  }
  assert.ok(checked>0);
});
test('autoevaluar tarjetas es independiente de la nota de escritura y deja un error pendiente',()=>{
  let progress=recordCardReview(emptyProgress(),eligible,'grc:προσ',false,at);
  assert.deepEqual(progress.courses.gr1.records,{});
  assert.equal(progress.activities.cards.records['grc:προσ'].forgotten,1);
  assert.equal(progressSummary(progress,eligible).cardsReviewed,1);
  assert.equal(progressSummary(progress,eligible).cardsForgotten,1);
  assert.equal(progressSummary(progress,eligible).exercises,0);
  assert.deepEqual(filteredEtyma(eligible,progress,{mode:'errors'}).map(x=>x.id),['grc:προσ']);
  progress=recordCardReview(progress,eligible,'grc:προσ',true,'2026-11-12T19:01:00.000Z');
  assert.equal(progress.activities.cards.records['grc:προσ'].needsReview,true);
  progress=recordCardReview(progress,eligible,'grc:προσ',true,'2026-11-12T19:02:00.000Z');
  assert.equal(progress.activities.cards.records['grc:προσ'].needsReview,false);
  assert.equal(progressSummary(progress,eligible).cardsRemembered,2);
  assert.equal(progressSummary(progress,eligible).needingReview,0);
});
test('relaciones contabilizan cada étimo una vez al completar una ronda y ponderan reintentos',()=>{
  const round=study.createRound(eligible,{random:()=>0.4});
  let progress=recordMatchingRound(emptyProgress(),eligible,round.pairs.map((p,i)=>
    ({etymonId:p.etymonId,firstTry:i!==0})),at);
  const summary=progressSummary(progress,eligible);
  assert.equal(summary.pairsPracticed,round.maximum);
  assert.equal(summary.pairsFirstTry,round.maximum-1);
  assert.equal(summary.pairsWithRetries,1);
  assert.equal(summary.exercises,0);
  assert.equal(summary.needingReview,1);
  const id=round.pairs[0].etymonId;
  assert.equal(progress.activities.matching.records[id].needsReview,true);
  for(const time of ['2026-11-12T19:01:00.000Z','2026-11-12T19:02:00.000Z']){
    progress=recordMatchingRound(progress,eligible,
      round.pairs.map(p=>({etymonId:p.etymonId,firstTry:true})),time);
  }
  assert.equal(progress.activities.matching.records[id].needsReview,false);
  assert.equal(progressSummary(progress,eligible).needingReview,0);
});
test('los errores de tarjetas y relación se suman al modo de errores sin duplicar étimos',()=>{
  let progress=recordCardReview(emptyProgress(),eligible,'grc:προσ',false,at);
  const partner=eligible.find(e=>e.id!=='grc:προσ');
  progress=recordMatchingRound(progress,eligible,[
    {etymonId:'grc:προσ',firstTry:false},
    {etymonId:partner.id,firstTry:true}
  ],'2026-11-12T19:01:00.000Z');
  assert.deepEqual(filteredEtyma(eligible,progress,{mode:'errors'}).map(e=>e.id),['grc:προσ']);
  assert.equal(progressSummary(progress,eligible).needingReview,1);
});
test('exportación incluye tarjetas y parejas y admite copias antiguas sin estas secciones',()=>{
  let p=recordCardReview(emptyProgress(),eligible,'grc:προσ',false,at);
  const another=eligible.find(e=>e.id!=='grc:προσ');
  p=recordMatchingRound(p,eligible,[{etymonId:'grc:προσ',firstTry:false},
    {etymonId:another.id,firstTry:true}],'2026-11-12T19:01:00.000Z');
  const json=exportProgress(p,eligible,'2026-11-12T19:02:00.000Z');
  assert.deepEqual(importProgress(json,eligible),p);
  assert.ok(json.includes('"activities"'));
  assert.ok(!json.includes('submitted'));
  const old=JSON.parse(JSON.stringify(p));
  delete old.activities;
  const normalized=validateProgress(old,eligible);
  assert.deepEqual(normalized.activities,emptyProgress().activities);
  assert.deepEqual(normalized.courses,p.courses);
  assert.deepEqual(normalized.courses.gr2.records,{});
});
test('se rechazan importaciones manipuladas de tarjetas o relaciones y no se modifica el banco',()=>{
  const p=recordCardReview(emptyProgress(),eligible,'grc:προσ',false,at);
  const bad=structuredClone(p);
  bad.activities.cards.records['grc:προσ'].remembered=99;
  assert.throws(()=>importProgress(JSON.stringify(bad),eligible),/suma/);
  const unknown=structuredClone(p);
  unknown.activities.matching.records['grc:extranjero']=
    {attempts:1,correct:0,incorrect:1,streak:0,needsReview:true,lastPracticed:at};
  assert.throws(()=>validateProgress(unknown,eligible),/desconocido/);
  const future=structuredClone(p);
  future.activities.cards.records['grc:προσ'].lastPracticed='2099-01-01T00:00:00.000Z';
  assert.throws(()=>validateProgress(future,eligible),/futura/);
  assert.equal(catalog.etymons.length,111);
  assert.equal(catalog.derivatives.length,201);
  assert.equal(catalog.relations.length,217);
  const corrector=createWriteTwoCorrector(catalog);
  assert.equal(corrector.grade('grc:προσ',['proselito','prosodia']).total,1.5);
});
