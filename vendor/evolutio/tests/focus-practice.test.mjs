import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { RULES, FIXED_RULE } from '../src/rules.mjs';
import {
 availableWords, availableFocusedWords, chooseFocusedWords, assessedChanges,
 newCardState, checkResult, checkAllChanges, applyChange, requiredRules
} from '../src/engine.mjs';
const words=JSON.parse(readFileSync(new URL('../data/pilot.json',import.meta.url),'utf8')).words;
const word=latin=>words.find(w=>w.latin===latin);
const guess=(change,id=change.id)=>({id,rule:change.rule,spans:change.spans,anchor:change.anchor,targetId:change.id});

test('Una sola norma ofrece fichas aun cuando el filtro estricto las excluye',()=>{
 const fuego=word('focum');assert.ok(fuego);
 assert.ok(requiredRules(fuego).length>1);
 assert.equal(availableWords(words,new Set(['DIPT'])).some(w=>w.id===fuego.id),false);
 assert.equal(availableFocusedWords(words,'DIPT').some(w=>w.id===fuego.id),true);
 assert.equal(assessedChanges(fuego,'DIPT').length,1);
 assert.equal(assessedChanges(fuego,'DIPT')[0].rule,'DIPT');
});

test('La elección focal admite exactamente 20 normas, no la regla fija ni identificadores inventados',()=>{
 for (const rule of RULES){
  const pool=availableFocusedWords(words,rule.id);
  assert.ok(pool.length>0,rule.name);
  assert.ok(pool.every(w=>w.changes.some(c=>c.rule===rule.id)),rule.id);
 }
 assert.deepEqual(availableFocusedWords(words,FIXED_RULE.id),[]);
 assert.deepEqual(availableFocusedWords(words,'INVENTADA'),[]);
 assert.throws(()=>newCardState(word('focum'),'INVENTADA'),/Norma focal no válida/);
 assert.throws(()=>newCardState(word('focum'),'CUL'),/no contiene/);
});

test('El banco conserva al menos 252 fichas y las consultas focalizadas no lo modifican',()=>{
 assert.ok(words.length>=252);
 const copy=JSON.stringify(words);
 for(const rule of RULES)availableFocusedWords(words,rule.id);
 assert.equal(JSON.stringify(words),copy);
});

test('El sorteo focal ajusta la cantidad y no incorpora palabras ajenas',()=>{
 const pool=availableFocusedWords(words,'AFER');
 assert.equal(pool.length,1);
 assert.deepEqual(chooseFocusedWords(words,'AFER',999,()=>0).map(w=>w.id),pool.map(w=>w.id));
 assert.equal(chooseFocusedWords(words,'AFER',0).length,0);
 const random=chooseFocusedWords(words,'PALAT',15,()=>0.5);
 assert.equal(random.length,15);
 assert.equal(new Set(random.map(w=>w.id)).size,15);
 assert.ok(random.every(w=>w.changes.some(c=>c.rule==='PALAT')));
 assert.equal(chooseFocusedWords(words,'FIX_M',10).length,0);
});

test('La segunda fase sigue bloqueada hasta acertar el resultado castellano',()=>{
 const w=word('focum'),state=newCardState(w,'DIPT');
 const t=assessedChanges(w,'DIPT')[0];
 assert.equal(checkAllChanges(state,[guess(t)]).complete,false);
 assert.equal(state.phase,1);
 assert.equal(checkResult(state,'no lo sé'),false);
 assert.equal(state.phase,1);
 assert.equal(checkResult(state,'fuego'),true);
 assert.equal(state.phase,2);
});

test('Solo se corrigen los cambios de la norma elegida: ni la -m fija ni otras leyes',()=>{
 const w=word('focum'),target=assessedChanges(w,'DIPT')[0];
 const other=w.changes.find(c=>c.rule==='ABER');
 const fixed=w.changes.find(c=>c.rule===FIXED_RULE.id);
 assert.ok(other);assert.ok(fixed);
 const state=newCardState(w,'DIPT');
 assert.equal(checkResult(state,'fuego'),true);
 let checked=checkAllChanges(state,[guess(fixed,'fixed')]);
 assert.equal(checked.complete,false);
 assert.equal(checked.correct,0);
 assert.equal(checked.results[0].status,'incorrect');
 checked=checkAllChanges(state,[guess(other,'other')]);
 assert.equal(checked.complete,false);
 assert.equal(checked.correct,0);
 checked=checkAllChanges(state,[guess(target)]);
 assert.equal(checked.complete,true);
 assert.equal(checked.correct,1);
 assert.equal(checked.remaining,0);
 assert.equal(state.phase,3);
 assert.equal(state.solved.has(fixed.id),false);
});

test('La abertura repetida se exige en todas sus posiciones; no basta una ni un duplicado',()=>{
 const w=word('lupum');const changes=assessedChanges(w,'ABER');
 assert.equal(changes.length,2);
 const state=newCardState(w,'ABER');assert.ok(checkResult(state,'lobo'));
 let checked=checkAllChanges(state,[guess(changes[0])]);
 assert.equal(checked.correct,1);assert.equal(checked.remaining,1);assert.equal(state.phase,2);
 checked=checkAllChanges(state,[guess(changes[0]),guess(changes[0],'fake')]);
 assert.equal(checked.complete,false);
 assert.equal(checked.results[1].status,'incorrect');
 checked=checkAllChanges(state,changes.map(guess));
 assert.equal(checked.complete,true);assert.equal(checked.correct,2);assert.equal(state.phase,3);
});

test('La corrección guiada comprueba la posición vinculada al targetId',()=>{
 const w=word('lupum'),t=assessedChanges(w,'ABER');
 const s=newCardState(w,'ABER');checkResult(s,'lobo');
 const mistaken={...guess(t[1]),targetId:t[0].id};
 const checked=checkAllChanges(s,[guess(t[0]),mistaken]);
 assert.equal(checked.complete,false);
 assert.equal(checked.results[1].status,'incorrect');
});

test('El modo a ciegas comprueba rangos, inserciones y tramos no contiguos',()=>{
 for(const [wordName,rule] of [['stellam','EPENT'],['miraculum','METAT'],['noctem','PALAT']]){
  const w=word(wordName);assert.ok(w,wordName);
  const targets=assessedChanges(w,rule);assert.ok(targets.length>0);
  const state=newCardState(w,rule);checkResult(state,w.answers[0]);
  const incorrect={id:'invalid',rule,spans:[[0,1]]};
  if(!targets.some(t=>JSON.stringify(t.spans)===JSON.stringify(incorrect.spans) && t.anchor==null)){
   assert.equal(checkAllChanges(state,[incorrect]).complete,false);
  }
  const result=checkAllChanges(state,targets.map((c,i)=>({id:'b-'+i,rule:c.rule,spans:c.spans,anchor:c.anchor})));
  assert.equal(result.complete,true,wordName);
 }
});

test('La corrección focal no acepta respuestas extra ni reglas incorrectas',()=>{
 const w=word('focum'),t=assessedChanges(w,'DIPT')[0];
 const s=newCardState(w,'DIPT');checkResult(s,'fuego');
 let check=checkAllChanges(s,[{...guess(t),rule:'ABER'}]);
 assert.equal(check.complete,false);assert.equal(s.phase,2);
 check=checkAllChanges(s,[guess(t),{...guess(t),id:'extra'}]);
 assert.equal(check.complete,false);assert.equal(check.correct,1);
 check=checkAllChanges(s,[guess(t)]);
 assert.equal(check.complete,true);
});

test('Los estados generales no cambian y siguen exigiendo todas las transformaciones',()=>{
 const w=word('focum');
 const state=newCardState(w);
 assert.equal(state.focusRule,null);
 assert.deepEqual(assessedChanges(w),w.changes);
 checkResult(state,'fuego');
 const targeted=assessedChanges(w,'DIPT').map(guess);
 assert.equal(checkAllChanges(state,targeted).complete,false);
 assert.equal(state.phase,2);
 assert.equal(checkAllChanges(state,w.changes.map(guess)).complete,true);
 assert.equal(state.phase,3);
});

test('La evaluación individual heredada también respeta el foco sin tocar el resto',()=>{
 const w=word('focum'),s=newCardState(w,'DIPT');
 checkResult(s,'fuego');
 const fixed=w.changes.find(c=>c.rule===FIXED_RULE.id);
 assert.equal(applyChange(s,guess(fixed)).correct,false);
 const t=assessedChanges(w,'DIPT')[0];
 assert.equal(applyChange(s,guess(t)).correct,true);
 assert.equal(s.phase,3);
});
