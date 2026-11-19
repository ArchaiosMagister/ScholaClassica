import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 newCardState,checkResult,checkAllChanges,revealCard,assessedChanges
} from '../src/engine.mjs';
const words=JSON.parse(readFileSync(new URL('../data/pilot.json',import.meta.url),'utf8')).words;
const word=latin=>words.find(w=>w.latin===latin);
const guess=(t,i)=>({id:'g-'+i,targetId:t.id,rule:t.rule,spans:t.spans,anchor:t.anchor});

test('La solución puede revelarse desde el resultado sin acreditar la respuesta ni las normas',()=>{
 const w=word('focum'),state=newCardState(w);
 assert.equal(state.phase,1);
 assert.equal(state.revealed,false);
 assert.equal(revealCard(state,'manual'),true);
 assert.equal(state.phase,3);
 assert.equal(state.revealed,true);
 assert.equal(state.revealPhase,1);
 assert.equal(state.revealReason,'manual');
 assert.equal(state.attempts,0);
 assert.equal(state.mistakes,0);
 assert.equal(state.solved.size,0);
 assert.equal(checkResult(state,'fuego'),false);
 assert.equal(checkAllChanges(state,w.changes.map(guess)).complete,false);
 assert.equal(revealCard(state,'manual'),false);
});
test('Tres intentos fallidos de palabra pueden finalizar en explicación, sin falso acierto',()=>{
 const state=newCardState(word('focum'));
 for(let i=1;i<=3;i++){
  assert.equal(checkResult(state,'equivocada'),false);
  assert.equal(state.attempts,i);
  assert.equal(state.phase,1);
 }
 assert.equal(state.mistakes,3);
 assert.equal(revealCard(state,'limit'),true);
 assert.equal(state.revealPhase,1);
 assert.equal(state.revealReason,'limit');
 assert.equal(state.phase,3);
});
test('El alumno que acierta la palabra aún puede ver la solución durante análisis',()=>{
 const w=word('focum'),state=newCardState(w);
 assert.equal(checkResult(state,'fuego'),true);
 assert.equal(state.phase,2);
 assert.equal(revealCard(state,'manual'),true);
 assert.equal(state.revealPhase,2);
 assert.equal(state.revealed,true);
 assert.equal(state.solved.size,0);
});
test('Tres comprobaciones incompletas de normas son contables, conservan los aciertos parciales',()=>{
 const w=word('lupum'),state=newCardState(w,'ABER');
 assert.equal(checkResult(state,'lobo'),true);
 const targets=assessedChanges(w,'ABER');
 assert.equal(targets.length,2);
 for(let i=1;i<=3;i++){
  const result=checkAllChanges(state,[guess(targets[0],0)]);
  assert.equal(result.complete,false);
  assert.equal(result.correct,1);
  assert.equal(result.remaining,1);
  assert.equal(state.analysisAttempts,i);
  assert.equal(state.phase,2);
 }
 assert.equal(state.solved.size,1);
 assert.equal(revealCard(state,'limit'),true);
 assert.equal(state.phase,3);
 assert.equal(state.solved.size,1);
 assert.equal(state.revealPhase,2);
});
test('En modo guiado o a ciegas, pulsar comprobar sin norma elegida no consume intento',()=>{
 const w=word('focum'),state=newCardState(w);
 checkResult(state,'fuego');
 const none=checkAllChanges(state,[]);
 assert.equal(none.complete,false);
 assert.equal(state.analysisAttempts,0);
 const missing=checkAllChanges(state,[{id:'none',spans:[[0,1]],rule:''}]);
 assert.equal(missing.complete,false);
 assert.equal(state.analysisAttempts,0);
 assert.equal(state.phase,2);
});
test('Un acierto tras fallos anteriores sigue siendo un acierto, no una solución revelada',()=>{
 const w=word('focum'),state=newCardState(w);
 checkResult(state,'incorrecto');
 assert.equal(checkResult(state,'fuego'),true);
 const targets=assessedChanges(w);
 const wrong=checkAllChanges(state,[{id:'wrong',rule:'DIPT',spans:[[0,1]]}]);
 assert.equal(wrong.complete,false);
 assert.equal(state.analysisAttempts,1);
 const correct=checkAllChanges(state,targets.map(guess));
 assert.equal(correct.complete,true);
 assert.equal(state.analysisAttempts,2);
 assert.equal(state.phase,3);
 assert.equal(state.revealed,false);
 assert.equal(revealCard(state,'limit'),false);
});
test('Repaso focalizado exige solo la norma elegida y no acredita otras tras revelar',()=>{
 const w=word('focum'),s=newCardState(w,'DIPT');
 checkResult(s,'fuego');
 const only=assessedChanges(w,'DIPT');
 const all=w.changes.length;
 assert.equal(only.length,1);
 assert.ok(all>only.length);
 assert.equal(revealCard(s,'manual'),true);
 assert.equal(s.solved.size,0);
 assert.equal(s.phase,3);
});
test('No se admiten motivos de revelación inventados',()=>{
 const s=newCardState(word('focum'));
 assert.throws(()=>revealCard(s,'otro'),/inválido/);
 assert.equal(s.phase,1);
});
