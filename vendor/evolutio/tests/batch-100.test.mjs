import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { RULES } from '../src/rules.mjs';
import { chars, resultMatches, checkResult, checkAllChanges, newCardState, validationErrors, requiredRules, availableWords, optionRuleIds } from '../src/engine.mjs';
const read=path=>JSON.parse(readFileSync(new URL('../'+path,import.meta.url),'utf8'));
const root=read('data/pilot.json');
const manifest=read('data/batches/2026-11-12-100.json');
const original=root.words.slice(0,manifest.previousCount);
const newcomers=root.words.slice(manifest.previousCount,manifest.previousCount+manifest.newCount);
const secondBatchBank=root.words.slice(0,manifest.previousCount+manifest.newCount);
const unique=a=>new Set(a).size===a.length;

test('Segundo lote suma exactamente 100 palabras con el primer lote conservado salvo grafía u/v',()=>{
 assert.equal(manifest.newCount,100);
 assert.equal(manifest.previousCount,52);
 assert.equal(secondBatchBank.length,152);
 assert.ok(root.words.length>=152);
 assert.deepEqual(newcomers.map(x=>x.id),manifest.ids);
 assert.deepEqual(newcomers.map(x=>x.source.row),manifest.rows);
 assert.ok(unique(root.words.map(w=>w.id)));
 // La grafía latina cambió a u; este snapshot protege el lote ya normalizado.
 assert.equal(createHash('sha256').update(JSON.stringify(original)).digest('hex'),'847ba2baea7c394926362877546687c4f0f006626a2279aa0984e31d908d99db');
 assert.deepEqual(validationErrors(root),[]);
});

test('Las nuevas 100 fichas conservan su lote, fila, clase patrimonial y explicación',()=>{
 assert.deepEqual(Object.keys(manifest.bySourceLot).sort(),['1','2','3','4','5','6','7','8','9','10'].sort());
 assert.ok(newcomers.every(w=>w.status==='reviewed-pilot' && w.source.classification==='PATRIMONIAL'));
 assert.ok(newcomers.every(w=>w.source.file===manifest.source && w.source.sheet==='Banco' && w.source.row>1 && w.source.lot>=1 && w.source.lot<=10));
 assert.ok(newcomers.every(w=>w.explanation && w.changes.every(t=>t.note && typeof t.output==='string')));
 assert.ok(unique(newcomers.map(w=>w.latin.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase())));
});

test('17 normas distintas presentes en el lote, 20 representadas acumuladas',()=>{
 const kinds=new Set(newcomers.flatMap(w=>requiredRules(w)));
 assert.equal(kinds.size,17);
 assert.deepEqual(RULES.filter(r=>!kinds.has(r.id)).map(r=>r.id).sort(),manifest.unrepresentedNew.slice().sort());
 assert.ok(RULES.every(r=>root.words.some(w=>requiredRules(w).includes(r.id))));
 const fix= new Set(newcomers.filter(w=>w.latin.endsWith('m')).map(w=>w.id));
 assert.ok(fix.size>50);
 for (const w of newcomers){
  const m=w.changes.filter(x=>x.rule==='FIX_M');
  assert.equal(m.length,fix.has(w.id)?1:0);
  const u=chars(w.latin).at(-2);
  if(w.latin.endsWith('um')){
   assert.ok(w.changes.some(t=>t.rule==='ABER' && t.output==='o' && t.spans.some(([a,b])=>a===chars(w.latin).length-2&&b===chars(w.latin).length-1)));
  }
  if(m.length)assert.equal(optionRuleIds(w,new Set(RULES.map(r=>r.id)))[0],'FIX_M');
 }
});

test('Regresión: el filtro exige todas las normas de las 152 fichas',()=>{
 const all=new Set(RULES.map(r=>r.id));
 assert.equal(availableWords(secondBatchBank,all).length,152);
 for(const w of newcomers){
  const needed=requiredRules(w);
  assert.ok(needed.length);
  assert.equal(availableWords([w],new Set(needed)).length,1);
  for(const r of needed){const removed=new Set(needed);removed.delete(r);assert.equal(availableWords([w],removed).length,0,`${w.latin}: falta ${r}`);}
 }
});

test('Todas las nuevas fichas son resolubles con Comprobar todo, sin saltar fase 1',()=>{
 for(const w of newcomers){
  const state=newCardState(w);
  assert.equal(resultMatches(w,w.answers[0]),true);
  assert.equal(state.phase,1);
  const before=checkAllChanges(state,w.changes.map(t=>({...t,targetId:t.id})));
  assert.equal(before.complete,false);
  assert.equal(state.phase,1);
  assert.equal(checkResult(state,w.answers[0]),true);
  assert.equal(state.phase,2);
  const guesses=w.changes.map(t=>({...t,targetId:t.id}));
  const result=checkAllChanges(state,guesses);
  assert.ok(result.complete,`${w.latin}: revisión de tarjeta completa`);
  assert.equal(state.phase,3);
 }
});

test('Ejemplos con grupos, cruces, reglas dobles y punto de inserción',()=>{
 const byRow=row=>root.words.find(w=>w.id==='xl-'+row);
 assert.deepEqual(byRow(226).changes.find(t=>t.rule==='SIMPL').spans,[[4,6]]); // palumbam, mb
 assert.equal(byRow(125).changes.find(t=>t.rule==='PALAT').subtype,'fl- > ll-');
 assert.equal(byRow(309).changes.find(t=>t.rule==='GRIE').subtype,'y > i');
 assert.equal(byRow(602).changes.find(t=>t.rule==='DISIMIL').spans.length,2);
 assert.equal(byRow(728).changes.find(t=>t.rule==='METAT').spans.length,2);
 assert.equal(byRow(1028).changes.find(t=>t.rule==='VOC').spans[0][1]-byRow(1028).changes.find(t=>t.rule==='VOC').spans[0][0],2);
 assert.equal(byRow(303).changes.find(t=>t.rule==='PROT').anchor,0);
 assert.equal(byRow(1042).changes.find(t=>t.rule==='CUL').subtype,'-CUL- > -J-');
 assert.ok(byRow(1042).changes.some(t=>t.rule==='SINC'));
 assert.equal(byRow(1035).changes.find(t=>t.rule==='MIN_MBR').output,'mbr');
 const w=byRow(37);
 assert.deepEqual(w.changes.filter(t=>['MONOP','DIPT'].includes(t.rule)).map(t=>t.spans),[[[1,2]],[[1,2]]]);
});
