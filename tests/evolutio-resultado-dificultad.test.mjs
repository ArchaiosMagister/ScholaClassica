import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {correctCastilianSourceWords,assertCastilianSyncopeSpans,assertCastilianPositionSpans,assertCastilianSpecificRules} from '../scripts/evolutio-castellano-lote100.mjs';
import {
 resultSpellingDistance,resultDifficultyComponents,resultDifficultyScore,
 resultDifficultyLevel,curatedDifficultyLevel,curatedDifficultyIds,RESULT_DIFFICULTY_METHOD
} from '../scripts/evolutio-result-difficulty.mjs';
import {
 isProperName,eligiblePracticeWords
} from '../scripts/evolutio-practice-eligibility.mjs';

const root=resolve(import.meta.dirname,'..');
const source=join(root,'vendor/evolutio');
const moduleDir=join(root,'dist/apps/evolucion-fonetica');
const parse=p=>JSON.parse(readFileSync(p,'utf8'));
const bank=parse(join(moduleDir,'data/pilot.json'));
const unchanged=parse(join(source,'data/pilot.json'));
const original=parse(join(source,'data/difficulty.json'));
const updated=parse(join(moduleDir,'data/difficulty.json'));
const word=latin=>bank.words.find(w=>w.latin===latin);
const added=bank.words.slice(unchanged.words.length);


test('Se conservan 522 fichas fuente y se añaden 100 castellanas sin romper IDs ni decisiones docentes',()=>{
 assert.equal(unchanged.words.length,522);
 assert.equal(bank.words.length,622);
 assert.deepEqual(bank.words.slice(0,522),correctCastilianSourceWords(unchanged.words));
 assert.equal(added.length,100);
 assert.deepEqual(Object.keys(updated.assignments).slice(0,522),Object.keys(original.assignments));
 assert.ok(added.every(w=>w.id.startsWith('xl-')&&w.source.lot===21));
 assert.equal(original.method,'criterio-didactico-v1');
 assert.equal(updated.method,RESULT_DIFFICULTY_METHOD);
 assert.equal(updated.status,'clasificacion-provisional');
 const counts=[1,2,3,4].map(level=>bank.words.filter(w=>updated.assignments[w.id].level===level).length);
 assert.equal(counts.reduce((a,b)=>a+b,0),622);
 assert.ok(counts.every(n=>n>0),'Hay niveles vacíos después de la revisión');
 assert.ok(unchanged.words.filter(w=>updated.assignments[w.id].level!==original.assignments[w.id].level).length>=80);
 assert.ok(curatedDifficultyIds().length>=100);
 assert.ok(curatedDifficultyIds().every(id=>bank.words.some(w=>w.id===id)),'Curaduría con ID ajeno');
 for(const w of unchanged.words){
  const old=original.assignments[w.id],now=updated.assignments[w.id];
  if(old?.origin==='docente')assert.deepEqual(now,old,'No se respeta decisión docente: '+w.id);
 }
});

test('El lote contiene exactamente 100 patrimoniales inéditas del Excel, con fragmentos y trazabilidad',async()=>{
 const {CASTILIAN_ADDITIONS,integrateCastilianAdditions,ADDITION_SOURCE}=
  await import('../scripts/evolutio-castellano-lote100.mjs');
 const {validationErrors,availableWords,availableFocusedWords}=
  await import('../dist/apps/evolucion-fonetica/src/engine.mjs');
 assert.equal(ADDITION_SOURCE.sheet,'Banco');
 assert.equal(CASTILIAN_ADDITIONS.length,100);
 assert.deepEqual(added,CASTILIAN_ADDITIONS);
 assert.deepEqual(bank,integrateCastilianAdditions(unchanged));
 assert.deepEqual(validationErrors(bank),[]);
 const existing=new Set(unchanged.words.map(w=>w.id));
 assert.ok(added.every(w=>!existing.has(w.id)&&w.source.classification==='PATRIMONIAL'));
 assert.equal(new Set(added.map(w=>w.id)).size,100);
 assert.ok(added.every(w=>w.changes.some(c=>c.rule!=='FIX_M')));
 assert.ok(added.every(w=>w.answers.every(a=>a===a.toLocaleLowerCase('es'))));
 assert.ok(added.every(w=>updated.assignments[w.id]?.level>=1&&updated.assignments[w.id]?.level<=4));
 const {RULES}=await import('../dist/apps/evolucion-fonetica/src/rules.mjs');
 const all=new Set(RULES.map(r=>r.id));
 assert.ok(added.every(w=>availableWords([w],all).length===1));
 for(const r of RULES)for(const w of added.filter(w=>w.changes.some(t=>t.rule===r.id))){
  assert.deepEqual(availableFocusedWords([w],r.id),[w]);
 }
 // El análisis histórico valenciano y los repositorios originales no se modifican.
});

test('La distancia ortográfica sirve de base auxiliar, pero no fija el nivel de los casos curados',()=>{
 const w=word('focum');
 const parts=resultDifficultyComponents(w);
 assert.ok(Math.abs(parts.score-(parts.resultDistance*0.85+parts.ruleLoad*0.15))<1e-12);
 assert.equal(resultDifficultyScore(w),Math.round(parts.score*10000)/10000);
 assert.equal(parts.ruleLoad,w.changes.filter(t=>t.rule!=='FIX_M').length/5);
 assert.equal(curatedDifficultyLevel(w),2);
 assert.ok(parts.resultDistance>0.3);
 assert.equal(resultDifficultyLevel(w),2);
});

test('Las evoluciones reconocibles no quedan artificialmente en niveles altos',()=>{
 for(const [latin,level] of [
  ['bŏnam',1],['uitam',1],['caballum',1],
  ['pro',1],['iurare',1],['focum',2],['lupum',2],
  ['spatium',2],['ætatem',2],['spissum',2],['sibilare',2],
  ['sphæram',2],['iocum',2],['clauem',2]
 ]){
  assert.equal(resultDifficultyLevel(word(latin)),level,latin);
  assert.equal(updated.assignments[word(latin).id].level,level,'Datos publicados: '+latin);
 }
});

test('Los resultados opacos no quedan catalogados como fáciles por su grafía',()=>{
 for(const [latin,level] of [
  ['leguminem',3],['despectum',3],['parabolam',3],
  ['homĭnem',3],['pericŭlum',3],
  ['tripedem',4],['annuculum',4],['miraculum',4],
  ['ocŭlum',4],['specŭlum',4]
 ]){
  assert.equal(resultDifficultyLevel(word(latin)),level,latin);
  assert.equal(updated.assignments[word(latin).id].level,level,'Datos publicados: '+latin);
 }
 assert.equal(resultDifficultyLevel(word('aut')),3);
 assert.equal(resultDifficultyLevel(word('bŏnam')),1);
});

test('La m final, u/v y dos transformaciones habituales no cuentan como obstáculos mayores',()=>{
 assert.ok(resultSpellingDistance('uitam','vida')<0.20);
 assert.ok(resultSpellingDistance('clauem','llave')<0.25);
 assert.ok(resultSpellingDistance('bŏnam','buena')<0.20);
 assert.ok(resultSpellingDistance('caballum','caballo')<0.15);
 assert.ok(resultSpellingDistance('pro','por')<0.25);
 assert.ok(resultSpellingDistance('aurum','oro')<0.3);
});

test('Los nombres propios quedan fuera de toda práctica y permanecen en el banco de Estudiar',async()=>{
 const proper=bank.words.filter(isProperName);
 const practice=eligiblePracticeWords(bank.words);
 assert.equal(proper.length,35);
 assert.equal(practice.length,587);
 assert.ok(proper.some(w=>w.latin==='Christum'));
 assert.ok(proper.some(w=>w.latin==='Cæsarem'));
 assert.ok(proper.some(w=>w.latin==='ægyptum'));
 assert.ok(practice.some(w=>w.latin==='Chimæram')); // quimera es común
 assert.ok(practice.some(w=>w.latin==='Pharum')); // faro es común
 assert.ok(practice.some(w=>w.latin==='Lycæum')); // liceo es común
 assert.ok(bank.words.every(w=>practice.includes(w)!==isProperName(w)));
 const {availableWords,availableFocusedWords}=await import('../dist/apps/evolucion-fonetica/src/engine.mjs');
 const {RULES}=await import('../dist/apps/evolucion-fonetica/src/rules.mjs');
 const all=new Set(RULES.map(r=>r.id));
 for(const group of [
  availableWords(practice,all),
  ...RULES.map(r=>availableFocusedWords(practice,r.id))
 ]){
  assert.ok(group.every(w=>!isProperName(w)));
 }
 const js=readFileSync(join(moduleDir,'src/app.mjs'),'utf8');
 assert.match(js,/practiceWords=eligiblePracticeWords\(words\)/);
 assert.match(js,/availableFocusedWords\(practiceWords,focusRule\)/);
 assert.match(js,/availableWords\(practiceWords,selected\)/);
 assert.match(js,/availableFocusedWords\(practiceWords,r\.id\)/);
 // Estudiar y su buscador siguen leyendo el conjunto íntegro.
 assert.match(js,/findStudyWords\(words,study\.query\)/);
 assert.match(js,/shuffleStudyWords\(words\)/);
});

test('El motor valida y filtra niveles sin saltos ni alteración de asignaciones docentes',async()=>{
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

test('La web integrada precarga los nuevos módulos y el banco para uso offline',()=>{
 const sw=readFileSync(join(moduleDir,'sw.js'),'utf8');
 const js=readFileSync(join(moduleDir,'src/app.mjs'),'utf8');
 assert.match(sw,/src\/result-difficulty\.mjs/);
 assert.match(sw,/src\/practice-eligibility\.mjs/);
 assert.match(sw,/lote100-v7/);
 assert.match(sw,/CACHE_PREFIX='schola-evolutio-'/);
 assert.match(js,/dificultad valora si es sencillo deducir el resultado castellano/);
 assert.match(js,/Los nombres propios no aparecen en las prácticas/);
});

test('Síncopa de auricŭlam y cunicŭlum: se evalúa la segunda u, no la primera',async()=>{
 const {gradeChange,chars}=await import('../dist/apps/evolucion-fonetica/src/engine.mjs');
 for(const latin of ['auricŭlam','cunicŭlum']){
  const w=word(latin),s=w.changes.find(c=>c.rule==='SINC');
  assert.deepEqual(s.spans,[[5,6]]);
  assert.equal(chars(latin).slice(5,6).join(''),'ŭ');
  assert.equal(gradeChange(w,{rule:'SINC',spans:[[1,2]]}).correct,false);
  assert.equal(gradeChange(w,{rule:'SINC',spans:[[5,6]]}).correct,true);
 }
 assert.equal(gradeChange(word('auricŭlam'),{rule:'MONOP',spans:[[0,2]]}).correct,true);
 assert.equal(gradeChange(word('cunicŭlum'),{rule:'ABER',spans:[[1,2]]}).correct,true);
 assert.doesNotThrow(()=>assertCastilianSyncopeSpans(bank.words));
 assert.throws(()=>assertCastilianSyncopeSpans([unchanged.words.find(w=>w.id==='xl-29')]),/síncopa sobre monoptongación/);
 assert.throws(()=>assertCastilianSyncopeSpans([unchanged.words.find(w=>w.id==='xl-80')]),/síncopa sobre abertura|síncopa de -cul- mal ubicada/);
});

test('Auditoría de fragmentos: segunda c de crucem y fenómenos omitidos del lote 100',async()=>{
 const {gradeChange}=await import('../dist/apps/evolucion-fonetica/src/engine.mjs');
 const c=word('crucem');
 assert.equal(gradeChange(c,{rule:'PALAT',spans:[[0,1]]}).correct,false);
 assert.equal(gradeChange(c,{rule:'PALAT',spans:[[3,4]]}).correct,true);
 for(const [latin,rule,spans,output] of [
  ['super','METAT',[[3,4],[4,5]],'re'],
  ['duplare','SONOR',[[2,3]],'b'],
  ['duplare','APOC',[[6,7]],'∅'],
  ['lucrum','SONOR',[[2,3]],'g'],
  ['comitatum','ASMIL',[[2,3]],'n'],
  ['semitam','ASMIL',[[2,3]],'n'],
  ['consuturam','SINC',[[4,5]],'∅'],
  ['cultellum','PALAT',[[5,7]],'ll'],
  ['maxillam','PALAT',[[4,6]],'ll'],
  ['recipere','APOC',[[7,8]],'∅']
 ]){
  const w=word(latin);
  assert.ok(w.changes.some(c=>c.rule===rule&&JSON.stringify(c.spans)===JSON.stringify(spans)&&c.output===output),latin);
  assert.equal(gradeChange(w,{rule,spans}).correct,true,latin);
 }
});

test('Apócopes finales y sonorizaciones interiores: nueve intervalos corregidos',async()=>{
 const {gradeChange}=await import('../dist/apps/evolucion-fonetica/src/engine.mjs');
 for(const [id,latin,changeId,rule,oldPos,newPos] of [["xl-36","cæcare","t2","SONOR",0,2],["xl-37","cæcum","t3","SONOR",0,2],["xl-78","cucullum","t2","SONOR",0,2],["xl-246","pŏpŭlum","t2","SONOR",0,2],["xl-87","decollare","t3","APOC",1,8],["xl-201","meliorem","t2","APOC",1,6],["xl-921","pensare","t2","APOC",1,6],["xl-509","temptare","t2","APOC",1,7],["xl-825","despoliare","t2","APOC",1,9]]){
  const w=word(latin),old=unchanged.words.find(w=>w.id===id);
  assert.equal(w.id,id);
  assert.deepEqual(w.changes.find(c=>c.id===changeId).spans,[[newPos,newPos+1]]);
  assert.equal(gradeChange(w,{rule,spans:[[oldPos,oldPos+1]]}).correct,false,latin);
  assert.equal(gradeChange(w,{rule,spans:[[newPos,newPos+1]]}).correct,true,latin);
  assert.throws(()=>assertCastilianPositionSpans([old]),/apócope no final|sonorización asignada/);
 }
 assert.doesNotThrow(()=>assertCastilianPositionSpans(bank.words));
});

test('Diptongación tónica, metátesis y pérdidas interiores omitidas',async()=>{
 const {gradeChange}=await import('../dist/apps/evolucion-fonetica/src/engine.mjs');
 const serp=word('serpĕntem');
 assert.equal(gradeChange(serp,{rule:'DIPT',spans:[[1,2]]}).correct,false);
 assert.equal(gradeChange(serp,{rule:'DIPT',spans:[[4,5]]}).correct,true);
 for(const [latin,rule,spans,output] of [
  ['tĕnĕrum','METAT',[[2,3],[4,5]],'rn'],
  ['scutarium','METAT',[[4,7]],'er'],
  ['frigĭdum','SINC',[[3,4]],'∅'],
  ['frigĭdum','SINC',[[5,6]],'∅'],
  ['heredĭtātem','SIMPL',[[4,5],[6,7]],'d'],
  ['heredĭtātem','SONOR',[[8,9]],'d'],
  ['heredĭtātem','APOC',[[9,10]],'∅']
 ]){
  const w=word(latin);
  assert.ok(w.changes.some(c=>c.rule===rule&&JSON.stringify(c.spans)===JSON.stringify(spans)&&c.output===output),latin);
  assert.equal(gradeChange(w,{rule,spans}).correct,true,latin);
 }
 const old=unchanged.words.find(w=>w.id==='xl-80');
 assert.throws(()=>assertCastilianSyncopeSpans([{
  ...old,changes:old.changes.filter(c=>c.rule!=='CUL')
 }]),/síncopa sobre abertura/);
});

test('Correcciones filológicas del nuevo bloque: fragmentos y fenómenos contrastados',async()=>{
 const {gradeChange}=await import('../dist/apps/evolucion-fonetica/src/engine.mjs');
 for(const [latin,rule,spans,output] of [
  ['calcem','PALAT',[[3,4]],'z'],
  ['falcem','PALAT',[[3,4]],'z'],
  ['luminaria','METAT',[[5,8]],'er'],
  ['cultellum','DIPT',[[4,5]],'ie'],
  ['dixit','APOC',[[4,5]],'∅'],
  ['filictum','ABER',[[3,4]],'e'],
  ['gemmam','PALAT',[[0,1]],'y'],
  ['mascŭlum','PALAT',[[2,6]],'ch'],
  ['quattuor','METAT',[[6,7],[7,8]],'ro'],
  ['sitim','APOC',[[3,4]],'∅'],
  ['sitim','ABER',[[3,4]],'e'],
  ['sŏlet','APOC',[[4,5]],'∅'],
  ['tingit','PALAT',[[2,4]],'ñ'],
  ['tingit','ABER',[[4,5]],'e'],
  ['uindĭcāre','SINC',[[3,4]],'∅']
 ]){
  const w=word(latin);
  assert.ok(w.changes.some(c=>c.rule===rule&&JSON.stringify(c.spans)===JSON.stringify(spans)&&c.output===output),latin);
  assert.equal(gradeChange(w,{rule,spans}).correct,true,latin);
 }
 for(const latin of ['factum','facturam','lactem','lactucam','maxillam','mataxam'])
  assert.match(word(latin).explanation,/yod/i,latin);
 assert.equal(word('sitim').changes.some(c=>c.rule==='SINC'),false);
 assert.match(word('dixit').explanation,/analogía/);
 assert.match(word('recipere').explanation,/conjugación/);
});

test('Las fichas revisadas nombran expresamente las normas del catálogo PAU',async()=>{
 const {ruleName}=await import('../dist/apps/evolucion-fonetica/src/rules.mjs');
 const reviewed=bank.words.filter((w,i)=>i>=unchanged.words.length||
  JSON.stringify(w)!==JSON.stringify(unchanged.words[i]));
 assert.equal(reviewed.length,159);
 for(const w of reviewed)for(const c of w.changes){
  if(c.rule==='FIX_M')continue;
  assert.ok(c.note.startsWith(ruleName(c.rule)+':'),w.latin+' '+c.rule+' '+c.note);
 }
 const solet=word('sŏlet'),vindicare=word('uindĭcāre');
 assert.equal(solet.changes.find(c=>c.rule==='APOC').note,'Apócope: «t» → «∅».');
 assert.equal(vindicare.changes.find(c=>c.rule==='SINC'&&c.spans[0][0]===3).note,'Síncopa: «d» → «∅».');
 assert.match(vindicare.explanation,/síncopa de d interior/);
 assert.match(word('crucem').explanation,/apócope de e final/);
 assert.match(word('auricŭlam').explanation,/monoptongación de au/);
 assert.throws(()=>assertCastilianPositionSpans([{...solet,changes:[{rule:'SINC',spans:[[4,5]]}]}]),/síncopa no interior/);
 assert.throws(()=>assertCastilianPositionSpans([{...vindicare,changes:[{rule:'APOC',spans:[[3,4]]}]}]),/apócope no final/);
});

test('Etapas acreditadas: sello, analogía de dijo y abertura de proveer',async()=>{
 const {gradeChange}=await import('../dist/apps/evolucion-fonetica/src/engine.mjs');
 const sello=word('sigĭllum');
 assert.equal(gradeChange(sello,{rule:'SINC',spans:[[2,4]]}).correct,false);
 assert.equal(gradeChange(sello,{rule:'SINC',spans:[[2,3]]}).correct,true);
 assert.equal(gradeChange(sello,{rule:'ABER',spans:[[3,4]]}).correct,true);
 assert.match(sello.explanation,/seello medieval/);
 assert.match(word('temperare').changes.find(c=>c.rule==='SINC').note,/pretónica/);
 assert.equal(word('dixit').changes.some(c=>c.rule==='ABER'),false);
 assert.match(word('dixit').explanation,/analogía/);
 assert.equal(gradeChange(word('prouidere'),{rule:'ABER',spans:[[4,5]]}).correct,true);
 assert.match(word('tegŭlam').explanation,/norma específica -CUL-/);
});

test('Normas específicas: 19 casos de -CUL-, diez de -MIN- y tres de vocalización sin duplicaciones',()=>{
 const byRule=rule=>bank.words.filter(w=>w.changes.some(c=>c.rule===rule));
 assert.equal(byRule('CUL').length,19);
 assert.equal(byRule('MIN_MBR').length,10);
 assert.equal(byRule('VOC').length,3);
 assert.doesNotThrow(()=>assertCastilianSpecificRules(bank.words));
 const withChange=(latin,c)=>{const w=word(latin);return [{...w,changes:[...w.changes,c]}]};
 assert.throws(()=>assertCastilianSpecificRules(withChange('homĭnem',{rule:'SINC',spans:[[3,4]]})),/duplicación de -MIN-/);
 assert.throws(()=>assertCastilianSpecificRules(withChange('homĭnem',{rule:'EPENT',spans:[],anchor:4})),/duplicación de -MIN-/);
 assert.throws(()=>assertCastilianSpecificRules(withChange('ocŭlum',{rule:'PALAT',spans:[[1,4]]})),/duplicación de palatalización/);
 assert.throws(()=>assertCastilianSpecificRules(withChange('saltum',{rule:'MONOP',spans:[[1,3]]})),/duplicación de vocalización/);
 for(const latin of ['miraculum','pericŭlum']){
  const w=word(latin);
  assert.throws(()=>assertCastilianSpecificRules([{...w,changes:w.changes.filter(c=>c.rule!=='METAT')}]),/faltan etapas/);
 }
 for(const latin of ['dŏmĭnam','dŏmĭnum','cuminum','cucullum']){
  assert.ok(!word(latin).changes.some(c=>['CUL','MIN_MBR'].includes(c.rule)));
 }
 for(const w of [...byRule('CUL'),...byRule('MIN_MBR'),...byRule('VOC')])
  assert.match(w.explanation,/Criterio de corrección:/);
});
