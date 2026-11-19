import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { RULES } from '../src/rules.mjs';
import { chars, normAnswer, resultMatches, requiredRules, availableWords, chooseWords, changeMatches, gradeChange, isComplete, validationErrors, coverage, newCardState, checkResult, applyChange, checkAllChanges, optionRuleIds } from '../src/engine.mjs';
const dataset = JSON.parse(readFileSync(new URL('../data/pilot.json', import.meta.url),'utf8'));
const words=dataset.words;
const word=id=>words.find(x=>x.id===`xl-${id}`);
test('Banco íntegro, identificado y filológicamente referenciado',()=>{
 assert.deepEqual(validationErrors(dataset),[]);
 assert.ok(words.length>=52); // Crece por lotes sin límite superior artificial.
 assert.equal(words.length,new Set(words.map(x=>x.id)).size);
 assert.ok(words.every(x=>x.source.file==='banco_evolucion_fonetica_con_filtro_didactico.xlsx'||x.source?.generatorId));
});
test('20 normas oficiales exactamente, cubiertas todas',()=>{
 assert.equal(RULES.length,20);
 assert.equal(new Set(RULES.map(x=>x.id)).size,20);
 const report=coverage(words);
 assert.deepEqual(Object.keys(report).sort(),RULES.map(x=>x.id).sort());
 for(const [rule,count] of Object.entries(report))assert.ok(count>0,`Sin ejemplos: ${rule}`);
});
test('La -m fija nunca se confunde con apócope',()=>{
 for(const w of words){const m=w.changes.filter(x=>x.rule==='FIX_M');assert.equal(m.length,w.latin.endsWith('m')?1:0);assert.ok(!requiredRules(w).includes('FIX_M'));}
 const poena=word(245);
 assert.deepEqual(requiredRules(poena),['MONOP']);
 assert.equal(availableWords(words,new Set(['MONOP'])).some(x=>x.id===poena.id),true);
 assert.equal(gradeChange(poena,{rule:'APOC',spans:[[poena.latin.length-1,poena.latin.length]]}).correct,false);
 assert.equal(gradeChange(poena,{rule:'FIX_M',spans:[[poena.latin.length-1,poena.latin.length]]}).correct,true);
});
test('Criterio aprobado: -um > -o exige abertura final y caída fija de -m',()=>{
 const endings=words.filter(w=>w.latin.endsWith('um'));
 assert.ok(endings.length>=10,'El lote debe incluir suficientes terminaciones -um');
 for(const w of endings) {
   const length=chars(w.latin).length, end=length-2;
   const abertura=w.changes.find(t=>t.rule==='ABER' && t.output==='o' && t.spans?.some(([a,b])=>a===end && b===end+1));
   const perdida=w.changes.find(t=>t.rule==='FIX_M' && t.spans?.some(([a,b])=>a===end+1 && b===end+2));
   assert.ok(abertura, `${w.latin}: falta abertura de u final`);
   assert.ok(perdida, `${w.latin}: falta pérdida fija de -m`);
   assert.ok(requiredRules(w).includes('ABER'));
   assert.ok(!availableWords([w],new Set()).length);
 }
 const incompatible=structuredClone(endings[0]);
 incompatible.changes=incompatible.changes.filter(t=>!(t.rule==='ABER' && t.spans?.some(([a])=>a===chars(incompatible.latin).length-2)));
 assert.ok(validationErrors({version:1,words:[incompatible]}).some(e=>e.includes('falta abertura final')));
});

test('El filtro no devuelve fenómenos no elegidos (incluso en 250 combinaciones)',()=>{
 let seed=8342;const rng=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
 const sets=[new Set(),new Set(RULES.map(x=>x.id)),...RULES.map(x=>new Set([x.id]))];
 for(let j=0;j<250;j++)sets.push(new Set(RULES.filter(()=>rng()>.42).map(x=>x.id)));
 for(const selected of sets){const pool=availableWords(words,selected);assert.ok(pool.every(w=>requiredRules(w).every(r=>selected.has(r))));assert.ok(pool.every(w=>requiredRules(w).length>0));}
 assert.equal(chooseWords(words,new Set(['MONOP']),999,()=>0).length,availableWords(words,new Set(['MONOP'])).length);
});
test('Las respuestas permiten mayúsculas y espacios, pero no eliminan tildes',()=>{
 assert.equal(normAnswer('  PENA  '),'pena');
 assert.equal(resultMatches(word(245),'  PeNa '),true);
 assert.equal(resultMatches(word(605),'marmol'),false);
 assert.equal(resultMatches(word(605),'  MÁRMOL '),true);
 assert.equal(resultMatches(word(245),'pœnam'),false);
});
test('No se desbloquea el análisis con un resultado erróneo y no se revela la respuesta',()=>{
 const state=newCardState(word(245));
 assert.equal(applyChange(state,word(245).changes[0]).correct,false);
 assert.equal(state.phase,1);
 assert.equal(checkResult(state,'incorrecto'),false);
 assert.equal(state.phase,1);
 assert.equal(checkResult(state,'pena'),true);
 assert.equal(state.phase,2);
 assert.equal(checkResult(state,'pena'),false);
});
test('El motor comprueba regla, posición y repetición, incluso en cambios solapados',()=>{
 const sample=word(502);const asim=sample.changes.find(x=>x.rule==='ASMIL');const simpl=sample.changes.find(x=>x.rule==='SIMPL');
 assert.deepEqual(asim.spans,simpl.spans);
 assert.equal(changeMatches(asim,simpl),false);
 assert.equal(gradeChange(sample,{...asim,rule:'SIMPL'}).correct,true);
 assert.equal(gradeChange(sample,{...asim,spans:[[0,1]]}).correct,false);
 const solved=new Set([asim.id]);
 assert.equal(gradeChange(sample,asim,solved).repeated,true);
 assert.equal(gradeChange(sample,simpl,solved).correct,true);
});
test('Grupos de varias letras, tramos no contiguos e inserciones tienen índices válidos',()=>{
 const changes=words.flatMap(w=>w.changes.map(t=>({word:w,...t})));
 assert.ok(changes.some(t=>t.spans.some(([start,end])=>end-start>1)));
 assert.ok(changes.some(t=>t.spans.length>1));
 assert.ok(changes.some(t=>t.anchor===0));
 assert.ok(changes.some(t=>t.anchor>0));
 const stellam=word(614);
 assert.equal(stellam.changes.filter(t=>t.anchor!==undefined).length,2);
 const metathesis=word(722).changes.find(t=>t.rule==='METAT');
 assert.equal(metathesis.spans.length,2);
 assert.notEqual(metathesis.spans[0][1],metathesis.spans[1][0]);
 const min=word(150).changes.find(t=>t.rule==='MIN_MBR');
 assert.equal(chars(word(150).latin).slice(...min.spans[0]).join(''),'mĭn');
});
test('Cada tarjeta se puede completar, sin avance prematuro, con sus transformaciones anotadas',()=>{
 for(const w of words){const s=newCardState(w);assert.equal(checkResult(s,w.answers[0]),true);assert.equal(s.phase,2);
  for(let i=0;i<w.changes.length;i++){
   const outcome=applyChange(s,w.changes[i]);assert.equal(outcome.correct,true,`${w.id}/${w.changes[i].id}`);
   assert.equal(s.solved.size,i+1);
   assert.equal(s.phase,i===w.changes.length-1?3:2);
  }
  assert.ok(isComplete(w,s.solved));
 }
});
test('La ampliación de un lote no altera los filtros ni el banco anterior',()=>{
 const baseline=JSON.stringify(words);
 const newWord=structuredClone(word(245));newWord.id='new-lot';newWord.source.row=9999;
 const augmented=[...words,newWord];const rules=new Set(['MONOP']);
 const orig=availableWords(words,rules).map(w=>w.id);
 const after=availableWords(augmented,rules).map(w=>w.id).filter(id=>id!=='new-lot');
 assert.deepEqual(after,orig);
 assert.equal(JSON.stringify(words),baseline);
});

test('miraculum → milagro tiene subtipo -CUL- → -G- y anotación completa y posicional',()=>{
 const mir=word(727);
 assert.equal(mir.latin,'miraculum');
 assert.equal(mir.answers[0],'milagro');
 assert.deepEqual(mir.changes.map(t=>t.rule),['SONOR','SINC','CUL','METAT','ABER','FIX_M']);
 assert.deepEqual(mir.changes.find(t=>t.rule==='CUL').spans,[[4,7]]);
 assert.equal(mir.changes.find(t=>t.rule==='CUL').subtype,'-CUL- > -G-');
 const mal=structuredClone(mir);mal.changes.find(t=>t.rule==='CUL').subtype='desconocido';
 assert.ok(validationErrors({version:1,words:[mal]}).some(e=>e.includes('subtipo -CUL- desconocido')));
 assert.deepEqual(mir.changes.find(t=>t.rule==='SONOR').spans,[[4,5]]);
 assert.deepEqual(mir.changes.find(t=>t.rule==='SINC').spans,[[5,6]]);
 assert.deepEqual(mir.changes.find(t=>t.rule==='METAT').spans,[[2,3],[6,7]]);
 assert.deepEqual(mir.changes.find(t=>t.rule==='ABER').spans,[[7,8]]);
 assert.deepEqual(mir.changes.find(t=>t.rule==='FIX_M').spans,[[8,9]]);
 assert.equal(gradeChange(mir,{rule:'CUL',spans:[[4,7]]}).correct,true);
 assert.equal(gradeChange(mir,{rule:'CUL',spans:[[4,6]]}).correct,false);
 assert.equal(gradeChange(mir,{rule:'METAT',spans:[[2,3]]}).correct,false);
 assert.equal(gradeChange(mir,{rule:'METAT',spans:[[2,3],[6,7]]}).correct,true);
 const allowed=new Set(['CUL','SONOR','SINC','METAT','ABER']);
 assert.deepEqual(requiredRules(mir).sort(),[...allowed].sort());
 assert.equal(availableWords([mir],allowed).length,1);
 for(const rule of allowed){const incomplete=new Set(allowed);incomplete.delete(rule);assert.equal(availableWords([mir],incomplete).length,0,`Debe exigir ${rule}`);}
 const state=newCardState(mir);assert.equal(checkResult(state,'milagro'),true);
 for(const item of mir.changes)assert.equal(applyChange(state,{rule:item.rule,spans:item.spans}).correct,true);
 assert.equal(state.phase,3);
});

test('Comprobar todo no evalúa cada desplegable al elegirlo y no avanza con respuestas incompletas',()=>{
 const poena=word(245);
 const state=newCardState(poena);
 assert.equal(checkResult(state,'pena'),true);
 const initial=[{id:'g1',targetId:poena.changes[0].id,...poena.changes[0],rule:''},
                {id:'g2',targetId:poena.changes[1].id,...poena.changes[1],rule:''}];
 const a=checkAllChanges(state,initial);
 assert.equal(a.complete,false);assert.equal(a.correct,0);
 assert.deepEqual(a.results.map(r=>r.status),['missing','missing']);
 assert.equal(state.phase,2);
 initial[0].rule=poena.changes[0].rule;
 const b=checkAllChanges(state,initial);
 assert.equal(b.correct,1);assert.equal(b.remaining,1);assert.equal(state.phase,2);
 initial[1].rule=poena.changes[1].rule;
 const c=checkAllChanges(state,initial);
 assert.equal(c.complete,true);assert.equal(state.phase,3);
});
test('Comprobación conjunta mantiene asociaciones exactas con solapamientos guiados',()=>{
 const w=word(502),state=newCardState(w);checkResult(state,w.answers[0]);
 const drafts=w.changes.map((c,i)=>({id:`g${i}`,targetId:c.id,spans:c.spans,anchor:c.anchor,rule:c.rule}));
 const overlap=drafts.filter(d=>JSON.stringify(d.spans)===JSON.stringify(w.changes.find(c=>c.rule==='ASMIL').spans));
 assert.ok(overlap.length>=2);
 const wrong=structuredClone(drafts);
 const x=wrong.find(d=>d.targetId===w.changes.find(c=>c.rule==='ASMIL').id);
 x.rule='SIMPL';
 const result=checkAllChanges(state,wrong);
 assert.equal(result.complete,false);assert.equal(result.results.find(r=>r.id===x.id).status,'incorrect');
 assert.equal(state.phase,2);
 x.rule='ASMIL';
 const correct=checkAllChanges(state,wrong);
 assert.equal(correct.complete,true);assert.equal(state.phase,3);
});
test('Comprobar todo en modo a ciegas admite tramos discontinuos e inserciones, pero no extras',()=>{
 const w=word(614);const state=newCardState(w);checkResult(state,w.answers[0]);
 const drafts=w.changes.map((c,i)=>({id:`b${i}`,rule:c.rule,spans:c.spans,anchor:c.anchor}));
 const withExtra=[...drafts,{id:'extra',rule:drafts[0].rule,spans:drafts[0].spans,anchor:drafts[0].anchor}];
 const first=checkAllChanges(state,withExtra);
 assert.equal(first.complete,false);assert.equal(first.results.at(-1).status,'incorrect');assert.equal(state.phase,2);
 const second=checkAllChanges(state,drafts);
 assert.equal(second.complete,true);assert.equal(state.phase,3);
});


test('La pérdida fija de -m es la primera opción aplicable sin cambiar el filtro',()=>{
 const poena=word(245),latinWithoutM=word(35);
 const selected=['MONOP','ABER'];
 const first=optionRuleIds(poena,selected);
 assert.deepEqual(first,['FIX_M','MONOP','ABER']);
 assert.deepEqual(selected,['MONOP','ABER'],'No se modifica la lista original');
 assert.deepEqual(optionRuleIds(latinWithoutM,selected),selected,'La norma fija se omite si no procede');
 assert.deepEqual(optionRuleIds(poena,['FIX_M',...selected]),first,'La norma fija no se duplica');
 assert.deepEqual(requiredRules(poena),['MONOP'],'La norma fija sigue fuera del filtrado');
});
