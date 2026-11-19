import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {RULES} from '../src/rules.mjs';
import {availableWords,availableFocusedWords,chooseFromPool,requiredRules} from '../src/engine.mjs';
import {studyWordsForRule,findStudyWords,shuffleStudyWords} from '../src/study.mjs';
import {
 DIFFICULTY_LEVELS,DIFFICULTY_FILTERS,difficultyScore,proposedDifficultyLevel,
 makeDifficultyData,difficultyErrors,difficultyLabel,filterWordsByDifficulty,filterWordsByDifficultyLevels
} from '../src/difficulty.mjs';
const words=JSON.parse(readFileSync(new URL('../data/pilot.json',import.meta.url),'utf8')).words;
const data=JSON.parse(readFileSync(new URL('../data/difficulty.json',import.meta.url),'utf8'));
const records=data.assignments;
const word=latin=>words.find(w=>w.latin===latin);

test('Todas las fichas tienen un nivel persistido y reproducible, sin alterar el banco',()=>{
 assert.equal(DIFFICULTY_LEVELS.length,4);
 assert.equal(words.length,522);
 assert.equal(Object.keys(records).length,words.length);
 assert.deepEqual(difficultyErrors(words,data),[]);
 assert.deepEqual(makeDifficultyData(words,records),data);
 for(const w of words){
  assert.equal(records[w.id].level,proposedDifficultyLevel(w));
  assert.equal(records[w.id].origin,'automatico');
  assert.match(difficultyLabel(records[w.id].level),/^Nivel [1-4]/);
 }
 assert.deepEqual([1,2,3,4].map(n=>words.filter(w=>records[w.id].level===n).length),[101,282,115,24]);
});
test('Calibración: bŏnam fácil y annuculum muy difícil, sin penalizar -m fija',()=>{
 const facil=word('bŏnam'),compleja=word('annuculum');
 assert.ok(facil);assert.ok(compleja);
 assert.equal(records[facil.id].level,1);
 assert.equal(records[compleja.id].level,4);
 for(const w of [facil,compleja]){
  const withoutM={...w,changes:w.changes.filter(c=>c.rule!=='FIX_M')};
  assert.equal(difficultyScore(w),difficultyScore(withoutM));
 }
});
test('Filtros todos, exacto y hasta máximo no introducen entradas indebidas',()=>{
 assert.equal(DIFFICULTY_FILTERS.length,8);
 assert.equal(filterWordsByDifficulty(words,records,'all'),words);
 for(let level=1;level<=4;level++){
  const exact=filterWordsByDifficulty(words,records,'exact-'+level);
  assert.ok(exact.length>0);
  assert.ok(exact.every(w=>records[w.id].level===level));
  if(level<=3){
   const upto=filterWordsByDifficulty(words,records,'upto-'+level);
   assert.equal(upto.length,words.filter(w=>records[w.id].level<=level).length);
   assert.ok(upto.every(w=>records[w.id].level<=level));
  }
 }
 assert.throws(()=>filterWordsByDifficulty(words,records,'invalido'),/inválido/);
});
test('Practicar general respeta simultáneamente normas completas y dificultad',()=>{
 const all=new Set(RULES.map(x=>x.id));
 for(const rules of [all,new Set(['ABER']),new Set(['DIPT','SONOR','ABER']),new Set(['PALAT','ABER','SINC','CUL'])]){
  const base=availableWords(words,rules);
  for(let level=1;level<=4;level++){
   const eligible=filterWordsByDifficulty(base,records,'exact-'+level);
   assert.ok(eligible.every(w=>requiredRules(w).every(id=>rules.has(id))));
   assert.ok(eligible.every(w=>records[w.id].level===level));
   const chosen=chooseFromPool(eligible,10,()=>0.25);
   assert.ok(chosen.every(w=>eligible.includes(w)));
   assert.equal(chosen.length,Math.min(10,eligible.length));
  }
 }
});
test('Repaso de una norma permite normas adicionales pero cumple nivel',()=>{
 for(const r of RULES){
  const candidate=availableFocusedWords(words,r.id);
  for(const level of [1,2,3,4]){
   const selected=filterWordsByDifficulty(candidate,records,'exact-'+level);
   assert.ok(selected.every(w=>w.changes.some(c=>c.rule===r.id)));
   assert.ok(selected.every(w=>records[w.id].level===level));
  }
 }
});
test('Estudiar conserva mezcla, búsqueda y filtro de subtipos',()=>{
 const deck=shuffleStudyWords(words,()=>0.37);
 const filtered=filterWordsByDifficulty(deck,records,'exact-4');
 assert.deepEqual(filtered.map(w=>w.id),deck.filter(w=>records[w.id].level===4).map(w=>w.id));
 const query=findStudyWords(words,'añojo');
 assert.ok(query.some(w=>w.latin==='annuculum'));
 assert.equal(filterWordsByDifficulty(query,records,'exact-4').length,1);
 assert.equal(filterWordsByDifficulty(query,records,'exact-1').length,0);
 for(const r of RULES){
  const list=studyWordsForRule(words,r.id);
  for(const level of [1,4]){
   const subset=filterWordsByDifficulty(list,records,'exact-'+level);
   assert.ok(subset.every(w=>w.changes.some(c=>c.rule===r.id)));
  }
 }
});
test('Una clasificación dañada, incompleta o incoherente es rechazada',()=>{
 const clone=structuredClone(data),one=words[0].id;
 delete clone.assignments[one];
 assert.ok(difficultyErrors(words,clone).some(s=>s.includes(one)));
 clone.assignments[one]={level:8,origin:'automatico'};
 assert.ok(difficultyErrors(words,clone).some(s=>s.includes('Nivel inválido')));
 clone.assignments[one]={level:5-proposedDifficultyLevel(words[0]),origin:'automatico'};
 assert.ok(difficultyErrors(words,clone).some(s=>s.includes('desactualizada')));
 clone.assignments[one]={level:4,origin:'docente'};
 assert.equal(difficultyErrors(words,clone).length,0);
 const rebuilt=makeDifficultyData(words,clone.assignments);
 assert.equal(rebuilt.assignments[one].level,4);
 assert.equal(rebuilt.assignments[one].origin,'docente');
 clone.assignments['no-existe']={level:1,origin:'automatico'};
 assert.ok(difficultyErrors(words,clone).some(s=>s.includes('ID ajeno')));
});

test('Estudiar permite cualquier combinación independiente de niveles, incluso ninguno',()=>{
 const original=words.map(w=>w.id);
 const cases=[
  [1,3],[2,4],[1,4],[1],[3],[1,2,3,4],[]
 ];
 for(const chosen of cases){
  const levels=new Set(chosen);
  const result=filterWordsByDifficultyLevels(words,records,levels);
  const expected=words.filter(w=>levels.has(records[w.id].level));
  assert.deepEqual(result.map(w=>w.id),expected.map(w=>w.id));
  assert.deepEqual(words.map(w=>w.id),original);
 }
 assert.equal(filterWordsByDifficultyLevels(words,records,new Set()).length,0);
 assert.equal(filterWordsByDifficultyLevels(words,records,new Set([1,3])).length,216);
 assert.equal(filterWordsByDifficultyLevels(words,records,new Set([2,4])).length,306);
});
test('Multiselección funciona tras búsqueda y barajado, conserva orden y normas',()=>{
 const deck=shuffleStudyWords(words,()=>0.71);
 const levels=new Set([1,4]);
 const selected=filterWordsByDifficultyLevels(deck,records,levels);
 assert.deepEqual(selected.map(w=>w.id),deck.filter(w=>levels.has(records[w.id].level)).map(w=>w.id));
 assert.equal(selected.length,125);
 const found=findStudyWords(words,'añojo');
 assert.ok(filterWordsByDifficultyLevels(found,records,new Set([4])).some(w=>w.latin==='annuculum'));
 assert.equal(filterWordsByDifficultyLevels(found,records,new Set([1,2])).length,0);
 for(const rule of RULES){
  const byRule=studyWordsForRule(words,rule.id);
  const pick=filterWordsByDifficultyLevels(byRule,records,new Set([2,4]));
  assert.ok(pick.every(w=>w.changes.some(c=>c.rule===rule.id)));
  assert.ok(pick.every(w=>[2,4].includes(records[w.id].level)));
 }
 assert.throws(()=>filterWordsByDifficultyLevels(words,records,[1,2]),/inválida/);
 assert.throws(()=>filterWordsByDifficultyLevels(words,records,new Set([0,5])),/inválida/);
 const broken={...records,[words[0].id]:{level:9}};
 assert.throws(()=>filterWordsByDifficultyLevels(words,broken,new Set([1])),/clasificación/);
});

test('Practicar admite dificultades no consecutivas sin violar las normas exigibles',()=>{
 const selectedLevels=new Set([1,3]);
 const legalRules=new Set(RULES.map(r=>r.id));
 const general=filterWordsByDifficultyLevels(availableWords(words,legalRules),records,selectedLevels);
 assert.equal(general.length,216);
 assert.ok(general.every(w=>selectedLevels.has(records[w.id].level)));
 const limitedRules=new Set(['ABER','DIPT','SONOR']);
 const limited=filterWordsByDifficultyLevels(availableWords(words,limitedRules),records,selectedLevels);
 assert.ok(limited.every(w=>requiredRules(w).every(rule=>limitedRules.has(rule))));
 assert.ok(limited.every(w=>selectedLevels.has(records[w.id].level)));
 for(const rule of RULES){
  const pool=filterWordsByDifficultyLevels(availableFocusedWords(words,rule.id),records,new Set([2,4]));
  assert.ok(pool.every(w=>w.changes.some(c=>c.rule===rule.id)));
  assert.ok(pool.every(w=>[2,4].includes(records[w.id].level)));
 }
 assert.equal(filterWordsByDifficultyLevels(availableWords(words,legalRules),records,new Set()).length,0);
 assert.equal(chooseFromPool([],10).length,0);
});
