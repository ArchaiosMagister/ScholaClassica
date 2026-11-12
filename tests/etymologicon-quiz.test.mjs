import test from 'node:test';
import assert from 'node:assert/strict';
import {compileTeacherAudit} from '../scripts/compile-etymologicon-gr1.mjs';
import {createLearnerCatalog} from '../scripts/build-etymologicon.mjs';
import {createQuizBank,greekKey,latinKey,latinToGreekPreview}
  from '../apps/etymologicon/quiz.mjs';
import {createWriteTwoCorrector} from '../shared/academic/greek-etymology/corrector/write-two.mjs';
import {emptyProgress,recordQuizAttempt,progressSummary,filteredEtyma,
  validateProgress,exportProgress,importProgress} from '../apps/etymologicon/progress.mjs';

const catalog=createLearnerCatalog(compileTeacherAudit());
const quiz=createQuizBank(catalog);
const eligible=catalog.etymons.filter(x=>x.editorialStatus==='approved_for_documented_derivatives');
const derivatives=new Map(catalog.derivatives.map(x=>[x.id,x]));
const at='2026-11-12T20:00:00.000Z';
test('108 étimos disponen de preguntas con respuesta correcta y distractores catalogados distintos',()=>{
  assert.equal(eligible.length,108);
  for(const e of eligible){
    const q=quiz.mcq(e.id,{random:()=>0.37});
    assert.ok(q,'sin pregunta para '+e.id);
    assert.equal(q.etymonId,e.id);
    assert.equal(q.options.length,4);
    assert.equal(new Set(q.options.map(x=>x.id)).size,4);
    assert.ok(q.options.some(x=>x.id===q.correctId));
    assert.ok(q.options.every(x=>derivatives.get(x.id)?.form===x.form));
    const approved=new Set(e.teacherApprovedDerivatives);
    for(const option of q.options){
      assert.equal(approved.has(option.id),option.id===q.correctId,
        'el distractor no puede ser respuesta válida para este étimo');
    }
    assert.equal(quiz.gradeMcq(q,q.correctId).correct,true);
    const wrong=q.options.find(x=>x.id!==q.correctId);
    assert.equal(quiz.gradeMcq(q,wrong.id).correct,false);
  }
});
test('las preguntas de respuesta múltiple no inventan derivados o aceptan etimos solo de consulta',()=>{
  assert.equal(quiz.mcq('grc:δικη'),null);
  assert.equal(quiz.mcq('grc:no-existe'),null);
  assert.equal(quiz.gradeMcq(quiz.mcq(eligible[0].id),'es:no-existe').status,'unanswered');
  assert.throws(()=>quiz.mcq(eligible[0].id,{optionCount:2}),/opciones/);
  assert.throws(()=>quiz.mcq(eligible[0].id,{random:()=>1}),/azar/);
  assert.equal(catalog.etymons.length,111);
  assert.equal(catalog.derivatives.length,201);
  assert.equal(catalog.relations.length,217);
});
test('las preguntas inversas solo se generan con derivados de dueño global único',()=>{
  assert.ok(quiz.inverseEligibleIds.length>20,'deben existir varias preguntas inversas posibles');
  const relationOwners=new Map();
  for(const r of catalog.relations){
    if(r.editorialStatus!=='teacher_audit_approved'||!r.eligibleFor.includes('write_two'))continue;
    if(!relationOwners.has(r.derivativeId))relationOwners.set(r.derivativeId,new Set());
    relationOwners.get(r.derivativeId).add(r.etymonId);
  }
  for(const eId of quiz.inverseEligibleIds){
    const q=quiz.inverse(eId,{random:()=>0.38});
    assert.ok(q);
    assert.equal(q.etymonId,eId);
    assert.equal(q.source,'approved_direct_relation_unique_owner');
    assert.equal(relationOwners.get(q.derivativeId).size,1);
    assert.equal([...relationOwners.get(q.derivativeId)][0],eId);
    assert.equal(derivatives.get(q.derivativeId).form,q.derivative);
    assert.equal(quiz.gradeInverse(q,q.canonicalLemma).correct,true);
    assert.equal(quiz.gradeInverse(q,greekKey(q.canonicalLemma)).correct,true,
      'no se deben exigir tildes ni espíritus a una respuesta griega');
  }
});
test('transliteración latina y vista previa respeta φ, θ y los lemas con acentos',()=>{
  assert.equal(latinToGreekPreview('philos'),'φιλος');
  assert.equal(latinToGreekPreview('logos'),'λογος');
  assert.equal(latinToGreekPreview('sophia'),'σοφια');
  assert.equal(quiz.preview('philos').greek,'φίλος');
  assert.equal(quiz.preview('sophia').greek,'σοφία');
  assert.equal(quiz.preview('logos').greek,'λόγος');
  assert.equal(greekKey('ΦΊΛΟΣ'),'φιλοσ');
  assert.equal(greekKey('φίλος'),'φιλοσ');
  assert.equal(latinKey('PHÍLOS'),'philos');
});
test('separar transliteración visual de la aceptación: ni similitudes ni entradas mixtas puntúan',()=>{
  const target=quiz.inverseEligibleIds[0];
  const question=quiz.inverse(target,{random:()=>0});
  assert.equal(quiz.gradeInverse(question,'').status,'unanswered');
  assert.equal(quiz.gradeInverse(question,'philos!').correct,false);
  assert.equal(quiz.gradeInverse(question,'λόγοςfoo').correct,false);
  assert.equal(quiz.gradeInverse(question,'loogs').correct,false);
  assert.equal(quiz.gradeInverse(question,'sophia-algo').correct,false);
  const other=quiz.inverseEligibleIds.find(id=>id!==target);
  const otherLemma=quiz.inverse(other,{random:()=>0}).canonicalLemma;
  const result=quiz.gradeInverse(question,otherLemma);
  assert.equal(result.correct,false);
  assert.ok(['incorrect','ambiguous'].includes(result.status));
});
test('la ambigüedad entre lemas no se resuelve arbitrariamente ni por transliteración',()=>{
  const fake={
    schema:'etymologicon-audited-catalog/v1',course:'gr1',
    etymons:[
      {id:'grc:a',lemma:'φίλος',editorialStatus:'approved_for_documented_derivatives',
        teacherApprovedDerivatives:['es:a','es:b']},
      {id:'grc:b',lemma:'φῖλος',editorialStatus:'approved_for_documented_derivatives',
        teacherApprovedDerivatives:['es:c','es:d']}
    ],
    derivatives:['a','b','c','d'].map(x=>({id:'es:'+x,form:x,
      editorialStatus:'teacher_audit_approved',officialOrthographicVariants:[]})),
    relations:[['a','a'],['a','b'],['b','c'],['b','d']].map(([a,b],i)=>({
      id:'rel'+i,etymonId:'grc:'+a,derivativeId:'es:'+b,
      editorialStatus:'teacher_audit_approved',eligibleFor:['write_two']
    })),
    excluded:[]
  };
  const local=createQuizBank(fake);
  assert.equal(local.preview('philos').status,'ambiguous');
  const q=local.inverse('grc:a',{random:()=>0});
  assert.equal(local.gradeInverse(q,'philos').status,'ambiguous');
  assert.equal(local.gradeInverse(q,'φίλος').status,'ambiguous');
});
test('estadísticas separadas, repetición y exportaciones retrocompatibles',()=>{
  let state=recordQuizAttempt(emptyProgress(),eligible,'mcq','grc:προσ',false,at);
  state=recordQuizAttempt(state,eligible,'inverse','grc:προσ',true,'2026-11-12T20:01:00.000Z');
  assert.equal(progressSummary(state,eligible).mcqAttempted,1);
  assert.equal(progressSummary(state,eligible).mcqCorrect,0);
  assert.equal(progressSummary(state,eligible).inverseAttempted,1);
  assert.equal(progressSummary(state,eligible).inverseCorrect,1);
  assert.equal(progressSummary(state,eligible).exercises,0);
  assert.deepEqual(filteredEtyma(eligible,state,{mode:'errors'}).map(e=>e.id),['grc:προσ']);
  for(const time of ['2026-11-12T20:02:00.000Z','2026-11-12T20:03:00.000Z'])
    state=recordQuizAttempt(state,eligible,'mcq','grc:προσ',true,time);
  assert.equal(state.activities.mcq.records['grc:προσ'].needsReview,false);
  assert.equal(progressSummary(state,eligible).needingReview,0);
  const restored=importProgress(exportProgress(state,eligible),eligible);
  assert.deepEqual(restored,state);
  const older=structuredClone(state);
  delete older.activities.mcq;
  delete older.activities.inverse;
  const migrated=validateProgress(older,eligible);
  assert.equal(migrated.activities.mcq.records['grc:προσ'],undefined);
  assert.equal(migrated.activities.inverse.records['grc:προσ'],undefined);
  assert.equal(migrated.courses.gr2.records['grc:προσ'],undefined);
  assert.equal(createWriteTwoCorrector(catalog).grade('grc:προσ',['proselito','prosodia']).total,1.5);
});
