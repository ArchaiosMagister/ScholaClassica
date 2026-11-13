import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {
 resultSpellingDistance,resultDifficultyComponents,resultDifficultyScore,
 resultDifficultyLevel,RESULT_DIFFICULTY_METHOD
} from '../scripts/evolutio-result-difficulty.mjs';

const root=resolve(import.meta.dirname,'..');
const source=join(root,'.sources/evolutio');
const moduleDir=join(root,'dist/apps/evolucion-fonetica');
const parse=p=>JSON.parse(readFileSync(p,'utf8'));
const bank=parse(join(moduleDir,'data/pilot.json'));
const unchanged=parse(join(source,'data/pilot.json'));
const original=parse(join(source,'data/difficulty.json'));
const updated=parse(join(moduleDir,'data/difficulty.json'));
const word=latin=>bank.words.find(w=>w.latin===latin);

test('El banco de 522 palabras y sus anotaciones se conservan íntegros',()=>{
 assert.equal(bank.words.length,522);
 assert.deepEqual(bank,unchanged);
 assert.deepEqual(Object.keys(updated.assignments),Object.keys(original.assignments));
 assert.equal(original.method,'criterio-didactico-v1');
 assert.equal(updated.method,RESULT_DIFFICULTY_METHOD);
 assert.equal(updated.status,'clasificacion-provisional');
 assert.deepEqual([1,2,3,4].map(level=>bank.words.filter(w=>updated.assignments[w.id].level===level).length),
  [160,201,129,32]);
 assert.ok(bank.words.filter(w=>updated.assignments[w.id].level!==original.assignments[w.id].level).length>=80);
});
test('La distancia al resultado representa el 85 % y las leyes solo el 15 %',()=>{
 const w=word('focum');
 const parts=resultDifficultyComponents(w);
 assert.ok(Math.abs(parts.score-(parts.resultDistance*0.85+parts.ruleLoad*0.15))<1e-12);
 assert.equal(resultDifficultyScore(w),Math.round(parts.score*10000)/10000);
 assert.equal(parts.ruleLoad,w.changes.filter(t=>t.rule!=='FIX_M').length/5);
 assert.ok(parts.resultDistance>0.3);
});
test('Las formas transparentes no se penalizan por contar leyes',()=>{
 assert.equal(resultDifficultyLevel(word('bŏnam')),1);
 assert.equal(resultDifficultyLevel(word('uitam')),1);
 assert.equal(resultDifficultyLevel(word('caballum')),1);
 assert.equal(updated.assignments[word('caballum').id].level,1);
 assert.equal(original.assignments[word('caballum').id].level,2);
 assert.equal(resultDifficultyLevel(word('clauem')),1);
});
test('Se penaliza un resultado difícil de prever aunque tenga pocas reglas',()=>{
 const transparent=word('bŏnam'),opaque=word('aut');
 assert.equal(transparent.changes.filter(c=>c.rule!=='FIX_M').length,1);
 assert.equal(opaque.changes.filter(c=>c.rule!=='FIX_M').length,1);
 assert.ok(resultSpellingDistance(opaque.latin,opaque.answers[0])>resultSpellingDistance(transparent.latin,transparent.answers[0]));
 assert.equal(resultDifficultyLevel(opaque),4);
 assert.equal(resultDifficultyLevel(transparent),1);
 assert.equal(resultDifficultyLevel(word('annuculum')),4);
 assert.equal(resultDifficultyLevel(word('miraculum')),4);
});
test('No se penalizan la m final ni la equivalencia u/v',()=>{
 assert.ok(resultSpellingDistance('uitam','vida')<0.20);
 assert.ok(resultSpellingDistance('clauem','llave')<0.25);
 assert.ok(resultSpellingDistance('bŏnam','buena')<0.20);
 assert.ok(resultSpellingDistance('caballum','caballo')<0.15);
});
test('El módulo integrado valida y filtra los niveles recalibrados sin resultados indebidos',async()=>{
 const engine=await import('../dist/apps/evolucion-fonetica/src/difficulty.mjs');
 assert.deepEqual(engine.difficultyErrors(bank.words,updated),[]);
 assert.deepEqual(engine.makeDifficultyData(bank.words,original.assignments),updated);
 for(const group of [[1],[2,4],[1,3],[],[1,2,3,4]]){
  const chosen=new Set(group);
  const filtered=engine.filterWordsByDifficultyLevels(bank.words,updated.assignments,chosen);
  assert.equal(filtered.length,bank.words.filter(w=>chosen.has(updated.assignments[w.id].level)).length);
  assert.ok(filtered.every(w=>chosen.has(updated.assignments[w.id].level)));
 }
 const teacherId=word('uitam').id;
 const overrides={...updated.assignments,[teacherId]:{level:4,origin:'docente'}};
 const rebuilt=engine.makeDifficultyData(bank.words,overrides);
 assert.equal(rebuilt.assignments[teacherId].level,4);
 assert.equal(rebuilt.assignments[teacherId].origin,'docente');
 assert.deepEqual(engine.difficultyErrors(bank.words,rebuilt),[]);
});
test('El módulo local está precargado para uso sin conexión',()=>{
 const sw=readFileSync(join(moduleDir,'sw.js'),'utf8');
 const js=readFileSync(join(moduleDir,'src/app.mjs'),'utf8');
 assert.match(sw,/src\/result-difficulty\.mjs/);
 assert.match(sw,/resultado-v2/);
 assert.match(sw,/CACHE_PREFIX='schola-evolutio-'/);
 assert.match(js,/dificultad refleja sobre todo cuánto cuesta deducir el resultado castellano/);
});
