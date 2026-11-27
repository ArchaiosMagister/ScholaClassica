import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {correctCastilianSourceWords,assertCastilianSyncopeSpans,assertCastilianPositionSpans,assertCastilianSpecificRules,assertCastilianOpeningSpans,assertCastilianInitialRules,assertCastilianSonorizationSpans,assertCastilianGreekGraphs,assertFinalDirectResults} from '../scripts/evolutio-castellano-lote100.mjs';
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
 assert.equal(resultDifficultyLevel(word('aut')),4);
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
  ['cultellum','PALAT',[[2,4]],'ch'],
  ['dixit','APOC',[[4,5]],'∅'],
  ['filictum','ABER',[[3,4]],'e'],
  ['gemmam','PALAT',[[0,1]],'y'],
  ['mascŭlum','PALAT',[[2,6]],'ch'],
  ['quattuor','METAT',[[6,7],[7,8]],'ro'],
  ['sitim','APOC',[[3,4]],'∅'],
  ['sitim','ABER',[[1,2]],'e'],
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
 assert.equal(reviewed.length,622);
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
 assert.equal(gradeChange(sello,{rule:'SINC',spans:[[2,4]]}).correct,true);
 assert.equal(gradeChange(sello,{rule:'SINC',spans:[[2,3]]}).correct,false);
 assert.equal(gradeChange(sello,{rule:'ABER',spans:[[3,4]]}).correct,false);
 assert.match(sello.explanation,/resultado actual/);
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

test('Metátesis, asimilación y simplificación: fragmentos y explicaciones',async()=>{
 const {gradeChange}=await import('../dist/apps/evolucion-fonetica/src/engine.mjs');
 const entregar=word('integrare');
 assert.deepEqual(entregar.changes.find(c=>c.rule==='METAT').spans,[[3,5],[5,6]]);
 assert.equal(gradeChange(entregar,{rule:'METAT',spans:[[3,5],[5,6]]}).correct,true);
 const rotura=word('rupturam');
 assert.ok(rotura.changes.some(c=>c.rule==='ASMIL'&&c.output==='tt'));
 assert.ok(rotura.changes.some(c=>c.rule==='SIMPL'&&c.output==='t'));
 assert.match(rotura.explanation,/asimilación de pt en tt y simplificación/);
 for(const latin of ['comitem','comitatum','semitam']){
  const w=word(latin);
  assert.ok(w.changes.some(c=>c.rule==='ASMIL'&&c.output==='n'));
  assert.match(w.explanation,/asimilación/i);
 }
 assert.equal(word('committere').changes.filter(c=>c.rule==='SIMPL').length,2);
 assert.match(word('committere').explanation,/ambas geminadas/);
 assert.match(word('quattuor').explanation,/medieval quatro/);
});

test('Cantidad vocálica y acento: no se confunde vocal breve con sílaba breve',()=>{
 const autumnum=word('autumnum'),rupturam=word('rupturam'),cuminum=word('cuminum');
 assert.match(autumnum.changes.find(c=>c.id==='t2').note,/u tónica/);
 assert.match(autumnum.explanation,/larga por posición/);
 assert.match(rupturam.changes.find(c=>c.id==='t1').note,/u pretónica/);
 assert.match(rupturam.explanation,/-tū-/);
 assert.match(cuminum.explanation,/cumīnum es larga y tónica/);
 assert.ok(!cuminum.changes.some(c=>c.rule==='MIN_MBR'));
 assert.match(word('frigĭdum').explanation,/frīgĭdum.*segunda ĭ es breve y postónica/);
 for(const latin of ['compărāre','fricāre','supĕrāre'])
  assert.match(word(latin).explanation,/pretónica/);
 for(const latin of ['fabŭlam','littĕram','nĕbŭlam','stabĭlem','calidum','mutabĭlem','opĕram','sŏlĭdum'])
  assert.match(word(latin).explanation,/postónica/);
});

test('Cotejo DLE: étimos discutidos, homónimos y reconstrucciones',()=>{
 for(const latin of ['doctum','ductum'])assert.match(word(latin).explanation,/etimológic[a-z]*, no derivación segura/);
 assert.match(word('lutum').explanation,/luto, de luctus: no son dobletes/);
 assert.match(word('nucalem').explanation,/tardío nucālis/);
 assert.match(word('cuppam').explanation,/cuppa, distinto de cupa/);
 assert.match(word('cupam').explanation,/distingue cupa de cuppa/);
 assert.match(word('faminem').explanation,/\*famen, -ĭnis/);
 assert.match(word('annuculum').explanation,/Añejo procede de annicŭlus/);
 assert.match(word('uinciculum').explanation,/ave vencejo procede de oncejo/);
 assert.match(word('stylum').explanation,/no como étimo preferente/);
 assert.match(word('eremitam').explanation,/eremīta/);
});

test('Helenismos: étimos DLE, adaptación culta y precisión de las explicaciones',()=>{
 assert.match(word('crystallinum').explanation,/crystallĭnus.*analogía/);
 assert.match(word('hypogeum').explanation,/hypogaeum/);
 assert.match(word('epithetum').explanation,/epithĕton/);
 assert.match(word('myopem').explanation,/myops, myōpis/);
 assert.match(word('gryphum').explanation,/llave de las cañerías/);
 assert.match(word('æschylum').explanation,/no de prótesis/);
 assert.ok(!word('æschylum').changes.some(c=>c.rule==='PROT'));
 assert.match(word('fœtidum').explanation,/foetibundus/);
});

test('Neutros en -us, síncopa de g y coherencia de la abertura',async()=>{
 const {gradeChange}=await import('../dist/apps/evolucion-fonetica/src/engine.mjs');
 for(const latin of ['cŏrpus','pectus']){
  const w=word(latin);
  assert.ok(!w.changes.some(c=>c.rule==='APOC'));
  assert.match(w.explanation,/singular.*analogía/);
 }
 const rey=word('regem');
 assert.equal(gradeChange(rey,{rule:'SINC',spans:[[2,3]]}).correct,true);
 assert.equal(gradeChange(rey,{rule:'PALAT',spans:[[2,4]]}).correct,false);
 assert.match(rey.explanation,/rege > ree > rey/);
 const sed=word('sitim');
 assert.ok(!sed.changes.some(c=>c.rule==='ABER'&&c.spans[0][0]===3));
 assert.ok(sed.changes.some(c=>c.rule==='APOC'&&c.spans[0][0]===3));
 assert.doesNotThrow(()=>assertCastilianOpeningSpans(bank.words));
 assert.throws(()=>assertCastilianOpeningSpans([{latin:'factum',changes:[{rule:'ABER',spans:[[1,2]],output:'e'}]}]),/abertura ajena a i\/u/);
});

test('Yod: metátesis de materia y distinción entre inflexión y abertura',async()=>{
 const {gradeChange}=await import('../dist/apps/evolucion-fonetica/src/engine.mjs');
 const madera=word('materiam');
 assert.equal(gradeChange(madera,{rule:'METAT',spans:[[4,5],[5,6]]}).correct,true);
 assert.ok(!madera.changes.some(c=>c.rule==='SINC'));
 assert.match(madera.explanation,/maderia > madeira/);
 for(const latin of ['noctem','octo','podium','proximum','lectum','despectum']){
  const w=word(latin);
  assert.ok(!w.changes.some(c=>c.rule==='DIPT'),latin);
  assert.match(w.explanation,/yod/i,latin);
 }
 for(const latin of ['fŏrtia','sŏmnum'])assert.ok(word(latin).changes.some(c=>c.rule==='DIPT'));
 for(const latin of ['multum','pugnum'])assert.equal(gradeChange(word(latin),{rule:'ABER',spans:[[1,2]]}).correct,false,latin);
});

test('Aspiración, aféresis, prótesis y consonantización no se confunden con grafías',()=>{
 assert.doesNotThrow(()=>assertCastilianInitialRules(bank.words));
 assert.throws(()=>assertCastilianInitialRules([{latin:'germanum',changes:[{rule:'ASPIR',spans:[[0,1]],output:'h'}]}]),/aspiración ajena/);
 assert.throws(()=>assertCastilianInitialRules([{latin:'clauem',changes:[{rule:'CONS',spans:[[3,4]],output:'v'}]}]),/consonantización ajena/);
 assert.throws(()=>assertCastilianInitialRules([{latin:'æschylum',changes:[{rule:'PROT',spans:[],anchor:0,output:'e'}]}]),/prótesis incoherente/);
 for(const latin of ['iurare','maiorem','maium','iocum','iuncum','iacere','iuuentutem','iam'])
  assert.match(word(latin).explanation,/ya tenía valor consonántico|ya era consonántica/);
 assert.ok(word('germanum').changes.some(c=>c.rule==='AFER'));
 assert.ok(!word('germanum').changes.some(c=>c.rule==='ASPIR'));
 assert.ok(word('stellam').changes.some(c=>c.rule==='EPENT'));
 assert.ok(word('stellam').changes.some(c=>c.rule==='PROT'));
});


test('Sonorización: oclusiva simple, líquidas y grupos secundarios',async()=>{
 const {gradeChange}=await import('../dist/apps/evolucion-fonetica/src/engine.mjs');
 assert.doesNotThrow(()=>assertCastilianSonorizationSpans(bank.words));
 for(const latin of ['capram','lacrimam','patrem','petram','duplare','lucrum','latrare']){
  const w=word(latin),c=w.changes.find(c=>c.rule==='SONOR');
  assert.equal(gradeChange(w,{rule:'SONOR',spans:c.spans}).correct,true,latin);
  assert.match(w.explanation,/grupo/i,latin);
 }
 for(const latin of ['cuppam','buccam','siccum','guttam','littĕram','fabŭlam','nĕbŭlam','regŭlam','compărāre'])
  assert.ok(!word(latin).changes.some(c=>c.rule==='SONOR'),latin);
 for(const id of ['xl-980','xl-953','xl-949','xl-1008','xl-64','xl-246']){
  const w=bank.words.find(w=>w.id===id);
  assert.ok(w,id);
  assert.match(w.explanation,/intervocálica/i,id);
 }
 assert.match(word('latrare').explanation,/apócope/i);
 assert.throws(()=>assertCastilianSonorizationSpans([{latin:'cuppam',changes:[{rule:'SONOR',spans:[[2,3]],output:'b'}]}]),/oclusiva simple/);
 assert.throws(()=>assertCastilianSonorizationSpans([{latin:'fabam',changes:[{rule:'SONOR',spans:[[2,3]],output:'b'}]}]),/oclusiva simple/);
 assert.throws(()=>assertCastilianSonorizationSpans([{latin:'campum',changes:[{rule:'SONOR',spans:[[3,4]],output:'b'}]}]),/oclusiva simple/);
 assert.throws(()=>assertCastilianSonorizationSpans([{latin:'capram',changes:[{rule:'SONOR',spans:[[2,4]],output:'br'}]}]),/oclusiva simple/);
});


test('Consonantización de i latina en j/y: obligatoria también cuando i ya era consonántica',async()=>{
 const {gradeChange}=await import('../dist/apps/evolucion-fonetica/src/engine.mjs');
 const expected=[['xl-161',0,'j'],['xl-190',2,'y'],['xl-191',2,'y'],['xl-533',0,'j'],['xl-539',0,'j'],['xl-527',0,'y'],['xl-164',0,'j'],['xl-529',0,'y']];
 assert.deepEqual(bank.words.filter(w=>w.changes.some(c=>c.rule==='CONS')).map(w=>w.id).sort(),expected.map(e=>e[0]).sort());
 for(const [id,a,output] of expected){
  const w=bank.words.find(w=>w.id===id),cs=w.changes.filter(c=>c.rule==='CONS');
  assert.equal(cs.length,1,id);
  assert.deepEqual(cs[0].spans,[[a,a+1]],id);
  assert.equal(cs[0].output,output,id);
  assert.equal(gradeChange(w,{rule:'CONS',spans:[[a,a+1]]}).correct,true,id);
  assert.match(w.explanation,/Debe seleccionarse la norma de consonantización/,id);
  assert.match(cs[0].note,/aunque ya tenía valor consonántico/,id);
 }
 const juventud=word('iuuentutem');
 assert.equal(gradeChange(juventud,{rule:'CONS',spans:[[2,3]]}).correct,false);
 for(const id of ['xl-243','xl-544','xl-122','xl-257','xl-564','xl-265'])
  assert.ok(!bank.words.find(w=>w.id===id).changes.some(c=>c.rule==='CONS'),id);
});


test('Asimilación, disimilación y metátesis: selección de fragmentos originales',async()=>{
 const {gradeChange}=await import('../dist/apps/evolucion-fonetica/src/engine.mjs');
 const cases=[
  ['xl-731','METAT',[[1,2],[2,3]]],['xl-736','METAT',[[2,3],[3,4]]],
  ['xl-726','METAT',[[3,4],[4,5]]],['xl-732','METAT',[[4,5],[5,6]]],
  ['xl-722','METAT',[[1,2],[4,5]]],['xl-724','METAT',[[3,5],[5,6]]],
  ['xl-728','METAT',[[2,3],[6,7]]],['xl-727','METAT',[[2,3],[6,7]]],
  ['xl-234','METAT',[[2,3],[6,7]]],['xl-733','METAT',[[2,3],[4,5]]],
  ['xl-720','METAT',[[2,3],[4,5]]],['xl-318','METAT',[[2,3],[4,5]]],
  ['xl-602','DISIMIL',[[2,3],[5,6]]],['xl-605','DISIMIL',[[2,3],[5,6]]],
  ['xl-606','DISIMIL',[[0,1],[4,5]]],['xl-608','DISIMIL',[[5,6],[7,8]]],
  ['xl-64','ASMIL',[[2,3]]],['xl-490','ASMIL',[[2,3]]],['xl-506','ASMIL',[[2,3]]],
  ['xl-502','ASMIL',[[2,4]]],['xl-502','SIMPL',[[2,4]]]
 ];
 for(const [id,rule,spans] of cases){
  const w=bank.words.find(w=>w.id===id);
  assert.ok(w,id);
  assert.equal(gradeChange(w,{rule,spans}).correct,true,id+' '+rule);
  if(spans.length===2)assert.equal(gradeChange(w,{rule,spans:[spans[0]]}).correct,false,id);
 }
 for(const id of ['xl-602','xl-605','xl-606','xl-608']){
  const w=bank.words.find(w=>w.id===id),c=w.changes.find(c=>c.rule==='DISIMIL');
  assert.equal(gradeChange(w,{rule:'METAT',spans:c.spans}).correct,false,id);
 }
});


test('Grafías griegas y palatalización: correspondencias, fragmentos y evaluación',async()=>{
 const {gradeChange}=await import('../dist/apps/evolucion-fonetica/src/engine.mjs');
 assert.doesNotThrow(()=>assertCastilianGreekGraphs(bank.words));
 const ids=["xl-633","xl-794","xl-58","xl-711","ge-EVF-1076","ge-EVF-1077","ge-EVF-1078","ge-EVF-1079","ge-EVF-1080","ge-EVF-1081","ge-EVF-1082","ge-EVF-1083","ge-EVF-1085","ge-EVF-1086","ge-EVF-1087","ge-EVF-1088","ge-EVF-1090","ge-EVF-1092","ge-EVF-1094","ge-EVF-1095","ge-EVF-1096","ge-EVF-1097","ge-EVF-1098","ge-EVF-1099","ge-EVF-1100","ge-EVF-1104","ge-EVF-1106","ge-EVF-1107","ge-EVF-1108","ge-EVF-1109","ge-EVF-1110","ge-EVF-1111","ge-EVF-1113","ge-EVF-1114","ge-EVF-1115","ge-EVF-1116","ge-EVF-1117","ge-EVF-1118","ge-EVF-1119","ge-EVF-1120","ge-EVF-1121","ge-EVF-1122","ge-EVF-1123","ge-EVF-1124","ge-EVF-1125","ge-EVF-1126","ge-EVF-1127","ge-EVF-1128","ge-EVF-1129","ge-EVF-1130","ge-EVF-1131","ge-EVF-1132","ge-EVF-1133","ge-EVF-1134","ge-EVF-1135","ge-EVF-1136","ge-EVF-1137","ge-EVF-1138","ge-EVF-1140","ge-EVF-1141","ge-EVF-1142","ge-EVF-1143","ge-EVF-1171","ge-EVF-1172","ge-EVF-1181","ge-EVF-1182","ge-EVF-1183","ge-EVF-1185","ge-EVF-1186","ge-EVF-1187","ge-EVF-1188","ge-EVF-1189","ge-EVF-1190","ge-EVF-1191","ge-EVF-1192","ge-EVF-1193","ge-EVF-1194","ge-EVF-1196","ge-EVF-1198","ge-EVF-1199"];
 for(const id of ids){
  const w=bank.words.find(w=>w.id===id);
  assert.match(w.explanation,/Grafías que se seleccionan por separado/);
  for(const c of w.changes.filter(c=>c.rule==='GRIE')){
   assert.equal(gradeChange(w,{rule:'GRIE',spans:c.spans}).correct,true,id);
   assert.equal(gradeChange(w,{rule:'ASPIR',spans:c.spans}).correct,false,id);
  }
 }
 for(const id of ["xl-61","xl-122","xl-257","xl-804","xl-842","xl-851","xl-46","xl-48","xl-60","xl-63","xl-69","xl-127","xl-183","xl-227","xl-827","xl-97","xl-98","xl-146","xl-192","xl-194","xl-209","xl-255","xl-273","xl-283","ge-EVF-0813","ge-EVF-0817","ge-EVF-0852","ge-EVF-0239"]){
  const w=bank.words.find(w=>w.id===id);
  for(const c of w.changes.filter(c=>c.rule==='PALAT'))assert.equal(gradeChange(w,{rule:'PALAT',spans:c.spans}).correct,true,id);
 }
 const tronar=bank.words.find(w=>w.id==='xl-616');
 assert.equal(gradeChange(tronar,{rule:'EPENT',spans:[],anchor:1}).correct,true);
 assert.equal(gradeChange(tronar,{rule:'PROT',spans:[],anchor:0}).correct,false);
 assert.match(word('clamare').explanation,/apócope/);
 assert.throws(()=>assertCastilianGreekGraphs([{latin:'chartam',changes:[{rule:'GRIE',spans:[[1,2]],output:'c'}]}]),/grafía griega incoherente/);
});


test('Vocalismo: diptongos latinos, hiatos secundarios y apócope',async()=>{
 const {gradeChange}=await import('../dist/apps/evolucion-fonetica/src/engine.mjs');
 const a=word('aut');
 assert.equal(gradeChange(a,{rule:'MONOP',spans:[[0,2]]}).correct,true);
 assert.equal(gradeChange(a,{rule:'APOC',spans:[[2,3]]}).correct,true);
 assert.equal(gradeChange(a,{rule:'SINC',spans:[[2,3]]}).correct,false);
 for(const latin of ['cælum','cænum']){
  const w=word(latin);
  assert.equal(gradeChange(w,{rule:'MONOP',spans:[[1,2]]}).correct,true);
  assert.equal(gradeChange(w,{rule:'DIPT',spans:[[1,2]]}).correct,true);
 }
 const pie=word('pedem');
 assert.equal(gradeChange(pie,{rule:'APOC',spans:[[3,4]]}).correct,true);
 assert.match(pie.explanation,/resultado actual/);
 const piel=word('pellem');
 assert.equal(gradeChange(piel,{rule:'PALAT',spans:[[2,4]]}).correct,false);
 assert.equal(gradeChange(piel,{rule:'SIMPL',spans:[[2,4]]}).correct,true);
 assert.match(piel.explanation,/castellano actual/);
 assert.ok(!word('cultellum').changes.some(c=>c.rule==='DIPT'));
 assert.equal(gradeChange(word('sitim'),{rule:'ABER',spans:[[3,4]]}).correct,false);
 assert.match(word('sĕcat').explanation,/apócope/);
});


test('Resultado castellano actual: 77 fichas con correspondencias y fragmentos explícitos',async()=>{
 const {gradeChange}=await import('../dist/apps/evolucion-fonetica/src/engine.mjs');
 const cases=[["xl-35",[["SINC",[[2,3]],null,""],["APOC",[[5,6]],null,""]]],["xl-52",[["SONOR",[[2,3]],null,"d"]]],["xl-184",[["ABER",[[1,2]],null,"o"],["SONOR",[[2,3]],null,"b"],["ABER",[[3,4]],null,"o"]]],["xl-342",[["ABER",[[1,2]],null,"e"],["SIMPL",[[2,4]],null,"t"]]],["xl-359",[["ABER",[[1,2]],null,"e"],["ABER",[[3,4]],null,"o"]]],["xl-915",[["SIMPL",[[2,4]],null,"s"]]],["xl-34",[["DIPT",[[1,2]],null,"ue"]]],["xl-47",[["SONOR",[[2,3]],null,"b"],["APOC",[[5,6]],null,""]]],["xl-74",[["SINC",[[3,4]],null,""],["APOC",[[6,7]],null,""]]],["xl-84",[["SONOR",[[2,3]],null,"d"],["ABER",[[3,4]],null,"o"]]],["xl-99",[["SONOR",[[3,4]],null,"g"],["APOC",[[6,7]],null,""]]],["xl-112",[["ASPIR",[[0,1]],null,"h"],["SONOR",[[2,3]],null,"d"],["ABER",[[3,4]],null,"o"]]],["xl-119",[["ASPIR",[[0,1]],null,"h"],["SONOR",[[2,3]],null,"g"],["ABER",[[3,4]],null,"o"]]],["xl-123",[["ASPIR",[[0,1]],null,"h"],["ABER",[[3,4]],null,"o"]]],["xl-128",[["DIPT",[[1,2]],null,"ue"]]],["xl-169",[["SONOR",[[2,3]],null,"g"],["ABER",[[3,4]],null,"o"]]],["xl-177",[["SINC",[[2,3]],null,""],["APOC",[[5,6]],null,""]]],["xl-180",[["SINC",[[2,3]],null,""],["APOC",[[5,6]],null,""]]],["xl-181",[["SONOR",[[2,3]],null,"d"],["APOC",[[3,4]],null,""]]],["xl-226",[["ABER",[[3,4]],null,"o"],["SIMPL",[[4,6]],null,"m"]]],["xl-271",[["SONOR",[[4,5]],null,"d"],["APOC",[[5,6]],null,""]]],["xl-272",[["SONOR",[[2,3]],null,"b"],["APOC",[[5,6]],null,""]]],["xl-282",[["SONOR",[[4,5]],null,"d"],["ABER",[[5,6]],null,"o"]]],["xl-303",[["PROT",[],0,"e"],["APOC",[[6,7]],null,""]]],["xl-306",[["PROT",[],0,"e"],["SIMPL",[[1,3]],null,"c"]]],["xl-422",[["ABER",[[1,2]],null,"e"],["ABER",[[3,4]],null,"o"]]],["xl-427",[["ABER",[[1,2]],null,"o"],["SONOR",[[2,3]],null,"d"],["APOC",[[5,6]],null,""]]],["xl-434",[["ABER",[[1,2]],null,"e"],["ABER",[[3,4]],null,"o"]]],["xl-436",[["PROT",[],0,"e"],["ABER",[[2,3]],null,"e"],["SIMPL",[[3,5]],null,"s"],["ABER",[[5,6]],null,"o"]]],["xl-443",[["ABER",[[1,2]],null,"o"],["ABER",[[4,5]],null,"o"]]],["xl-519",[["ASPIR",[[0,1]],null,"h"],["SONOR",[[5,6]],null,"g"]]],["xl-579",[["DIPT",[[1,2]],null,"ue"]]],["xl-587",[["DIPT",[[1,2]],null,"ue"]]],["xl-874",[["PROT",[],0,"e"]]],["xl-916",[["SIMPL",[[2,4]],null,"s"]]],["xl-50",[["SONOR",[[2,3]],null,"b"],["ABER",[[3,4]],null,"o"],["APOC",[[4,5]],null,""]]],["xl-56",[["SONOR",[[2,3]],null,"b"],["ABER",[[3,4]],null,"o"],["PALAT",[[4,6]],null,"ll"]]],["xl-83",[["SONOR",[[2,3]],null,"d"],["APOC",[[3,4]],null,""]]],["xl-117",[["ASPIR",[[0,1]],null,"h"],["APOC",[[6,7]],null,""]]],["xl-130",[["DIPT",[[1,2]],null,"ue"]]],["xl-136",[["ASPIR",[[0,1]],null,"h"],["ABER",[[3,4]],null,"o"]]],["xl-137",[["ASPIR",[[0,1]],null,"h"],["ABER",[[1,2]],null,"o"],["ABER",[[4,5]],null,"o"]]],["xl-138",[["ASPIR",[[0,1]],null,"h"],["ABER",[[1,2]],null,"o"]]],["xl-140",[["PALAT",[[2,4]],null,"ñ"],["SONOR",[[5,6]],null,"d"],["ABER",[[6,7]],null,"o"]]],["xl-206",[["DIPT",[[1,2]],null,"ue"],["PALAT",[[2,4]],null,"ll"]]],["xl-214",[["ABER",[[1,2]],null,"e"]]],["xl-217",[["PALAT",[[1,3]],null,"ch"],["ABER",[[5,6]],null,"o"]]],["xl-221",[["PALAT",[[1,3]],null,"ll"]]],["xl-238",[["ABER",[[1,2]],null,"e"],["PALAT",[[2,4]],null,"ñ"]]],["xl-243",[["PALAT",[[0,2]],null,"ll"]]],["xl-253",[["ABER",[[1,2]],null,"o"],["PALAT",[[2,4]],null,"ll"],["ABER",[[4,5]],null,"o"]]],["xl-270",[["SINC",[[2,3]],null,""],["ABER",[[3,4]],null,"e"],["SIMPL",[[4,6]],null,"t"]]],["xl-290",[["ABER",[[1,2]],null,"e"],["PALAT",[[2,4]],null,"ñ"]]],["xl-291",[["ABER",[[1,2]],null,"e"],["ABER",[[3,4]],null,"e"],["PALAT",[[4,6]],null,"j"],["APOC",[[8,9]],null,""]]],["xl-308",[["PROT",[],0,"e"],["PALAT",[[3,5]],null,"ñ"],["ABER",[[5,6]],null,"o"]]],["xl-316",[["PALAT",[[2,4]],null,"ch"],["ABER",[[4,5]],null,"o"]]],["xl-322",[["PALAT",[[2,3]],null,"j"],["APOC",[[5,6]],null,""]]],["xl-341",[["PALAT",[[2,4]],null,"ci"],["ABER",[[4,5]],null,"o"]]],["xl-420",[["ABER",[[1,2]],null,"e"],["SONOR",[[2,3]],null,"g"],["APOC",[[5,6]],null,""]]],["xl-433",[["ABER",[[1,2]],null,"e"]]],["xl-449",[["ABER",[[2,3]],null,"o"],["ABER",[[5,6]],null,"o"]]],["xl-452",[["ABER",[[1,2]],null,"o"],["SIMPL",[[2,4]],null,"s"],["APOC",[[4,5]],null,""]]],["xl-455",[["ABER",[[0,1]],null,"o"]]],["xl-489",[["SIMPL",[[1,3]],null,"t"],["APOC",[[5,6]],null,""]]],["xl-517",[["ASPIR",[[0,1]],null,"h"],["ABER",[[1,2]],null,"e"]]],["xl-548",[["PALAT",[[2,4]],null,"ll"]]],["xl-581",[["DIPT",[[1,2]],null,"ue"],["ABER",[[5,6]],null,"o"]]],["xl-575",[["DIPT",[[1,2]],null,"ie"]]],["xl-810",[["PALAT",[[4,6]],null,"ll"],["ABER",[[6,7]],null,"o"]]],["xl-796",[["SONOR",[[1,2]],null,"g"],["PALAT",[[3,5]],null,"z"],["APOC",[[7,8]],null,""]]],["xl-802",[["PALAT",[[1,3]],null,"j"],["ABER",[[3,4]],null,"o"]]],["xl-823",[["PALAT",[[2,4]],null,"ñ"],["ABER",[[4,5]],null,"o"]]],["xl-855",[["PALAT",[[3,5]],null,"ñ"],["APOC",[[7,8]],null,""]]],["xl-864",[["PROT",[],0,"e"],["PALAT",[[3,5]],null,"ñ"],["ABER",[[5,6]],null,"o"]]],["xl-865",[["PROT",[],0,"e"],["ABER",[[3,4]],null,"e"],["PALAT",[[4,6]],null,"ch"],["ABER",[[6,7]],null,"o"]]],["xl-343",[["SONOR",[[4,5]],null,"d"],["APOC",[[5,6]],null,""]]],["ge-EVF-0366",[["ABER",[[1,2]],null,"o"]]]];
 for(const [id,changes] of cases){
  const w=bank.words.find(w=>w.id===id);
  assert.ok(w,id);
  assert.deepEqual(w.changes.filter(c=>c.rule!=='FIX_M').map(c=>[c.rule,c.spans,c.anchor??null,c.output]),changes,id);
  assert.ok(w.explanation.startsWith(w.latin+' > '+w.answers[0]+': '),id);
  for(const [rule,spans,anchor] of changes)assert.equal(gradeChange(w,{rule,spans,...(anchor===null?{}:{anchor})}).correct,true,id+' '+rule);
 }
 for(const [latin,rule,spans] of [['palumbam','SINC',[[5,6]]],['cumbam','SIMPL',[[2,4]]],['fumum','ABER',[[1,2]]],['truncum','SONOR',[[4,5]]],['uitium','CONS',[[3,4]]]])
  assert.equal(gradeChange(word(latin),{rule,spans}).correct,false,latin);
});


test('Últimas 124 fichas: correspondencia directa con el castellano actual',async()=>{
 const {gradeChange}=await import('../dist/apps/evolucion-fonetica/src/engine.mjs');
 const cases=[["xl-748",[["MONOP",[[0,2]],null,"o"],["PALAT",[[2,4]],null,"ll"]]],["xl-807",[["MONOP",[[4,5]],null,"e"],["PALAT",[[2,4]],null,"ll"]]],["xl-812",[["MONOP",[[1,2]],null,"e"],["SONOR",[[2,3]],null,"b"],["ABER",[[3,4]],null,"o"],["PALAT",[[4,6]],null,"ll"]]],["xl-912",[["SIMPL",[[5,7]],null,"s"],["APOC",[[9,10]],null,""]]],["xl-919",[["SIMPL",[[2,4]],null,"s"],["ABER",[[4,5]],null,"o"]]],["ge-EVF-0009",[["PALAT",[[1,3]],null,"j"]]],["ge-EVF-0016",[["SIMPL",[[1,3]],null,"s"]]],["ge-EVF-0187",[["SINC",[[2,3]],null,"∅"],["ABER",[[3,4]],null,"e"]]],["ge-EVF-0188",[["SINC",[[2,3]],null,"∅"],["ABER",[[3,4]],null,"e"],["ABER",[[7,8]],null,"o"]]],["ge-EVF-0201",[["SONOR",[[5,6]],null,"g"],["APOC",[[8,9]],null,"∅"]]],["ge-EVF-0234",[["DIPT",[[1,2]],null,"ie"]]],["ge-EVF-0240",[["PALAT",[[0,2]],null,"ll"],["ABER",[[2,3]],null,"e"],["SONOR",[[3,4]],null,"g"],["APOC",[[6,7]],null,"∅"]]],["ge-EVF-0258",[["PALAT",[[2,4]],null,"ll"],["ABER",[[4,5]],null,"o"]]],["ge-EVF-0261",[["SONOR",[[2,3]],null,"b"],["ABER",[[3,4]],null,"o"]]],["ge-EVF-0285",[["DIPT",[[1,2]],null,"ie"]]],["ge-EVF-0320",[["DIPT",[[1,2]],null,"ie"],["ABER",[[4,5]],null,"o"]]],["ge-EVF-0322",[["ABER",[[1,2]],null,"e"],["SONOR",[[4,5]],null,"d"],["APOC",[[5,6]],null,"∅"]]],["ge-EVF-0324",[["SONOR",[[2,3]],null,"d"],["ABER",[[3,4]],null,"o"]]],["ge-EVF-0326",[["ABER",[[0,1]],null,"o"],["SONOR",[[4,5]],null,"g"]]],["ge-EVF-0328",[["SINC",[[2,3]],null,"∅"]]],["ge-EVF-0331",[["DIPT",[[1,2]],null,"ie"]]],["ge-EVF-0332",[["SONOR",[[2,3]],null,"d"],["APOC",[[5,6]],null,"∅"]]],["ge-EVF-0334",[["ABER",[[1,2]],null,"e"],["PALAT",[[2,4]],null,"ll"],["ABER",[[4,5]],null,"o"]]],["ge-EVF-0337",[["SONOR",[[5,6]],null,"d"],["APOC",[[6,7]],null,"∅"]]],["ge-EVF-0338",[["SONOR",[[2,3]],null,"d"]]],["ge-EVF-0339",[["SONOR",[[2,3]],null,"d"],["APOC",[[3,4]],null,"∅"]]],["ge-EVF-0343",[["SONOR",[[7,8]],null,"d"],["APOC",[[8,9]],null,"∅"]]],["ge-EVF-0345",[["ABER",[[3,4]],null,"o"],["ABER",[[6,7]],null,"o"]]],["ge-EVF-0350",[["ABER",[[1,2]],null,"e"],["APOC",[[5,6]],null,"∅"]]],["ge-EVF-0351",[["ABER",[[2,3]],null,"e"],["SONOR",[[3,4]],null,"d"],["ABER",[[4,5]],null,"o"]]],["ge-EVF-0359",[["ABER",[[1,2]],null,"e"],["APOC",[[6,7]],null,"∅"]]],["ge-EVF-0360",[["ABER",[[1,2]],null,"e"]]],["ge-EVF-0363",[["ABER",[[4,5]],null,"e"],["APOC",[[8,9]],null,"∅"]]],["ge-EVF-0365",[["ABER",[[4,5]],null,"o"],["APOC",[[9,10]],null,"∅"]]],["ge-EVF-0370",[["ABER",[[1,2]],null,"o"],["APOC",[[6,7]],null,"∅"]]],["ge-EVF-0371",[["ABER",[[1,2]],null,"o"],["APOC",[[6,7]],null,"∅"]]],["ge-EVF-0372",[["ABER",[[1,2]],null,"o"],["ABER",[[4,5]],null,"o"]]],["ge-EVF-0380",[["ABER",[[1,2]],null,"o"],["APOC",[[8,9]],null,"∅"]]],["ge-EVF-0382",[["ABER",[[1,2]],null,"o"],["ABER",[[5,6]],null,"o"]]],["ge-EVF-0383",[["ABER",[[1,2]],null,"o"],["ABER",[[4,5]],null,"o"]]],["ge-EVF-0385",[["ABER",[[0,1]],null,"e"],["SONOR",[[6,7]],null,"d"],["APOC",[[9,10]],null,"∅"]]],["ge-EVF-0390",[["ABER",[[0,1]],null,"e"],["ABER",[[2,3]],null,"e"],["SONOR",[[5,6]],null,"g"],["ABER",[[6,7]],null,"o"]]],["ge-EVF-0391",[["ABER",[[0,1]],null,"e"],["APOC",[[6,7]],null,"∅"]]],["ge-EVF-0395",[["ABER",[[1,2]],null,"e"]]],["ge-EVF-0403",[["ABER",[[1,2]],null,"e"],["APOC",[[5,6]],null,"∅"]]],["ge-EVF-0404",[["ABER",[[1,2]],null,"e"],["SONOR",[[4,5]],null,"d"],["ABER",[[5,6]],null,"o"]]],["ge-EVF-0405",[["ABER",[[1,2]],null,"o"]]],["ge-EVF-0406",[["ABER",[[1,2]],null,"o"],["ABER",[[4,5]],null,"o"]]],["ge-EVF-0408",[["ABER",[[3,4]],null,"e"],["APOC",[[7,8]],null,"∅"]]],["ge-EVF-0411",[["ABER",[[1,2]],null,"e"],["ABER",[[4,5]],null,"o"]]],["ge-EVF-0416",[["ABER",[[3,4]],null,"e"],["APOC",[[7,8]],null,"∅"]]],["ge-EVF-0443",[["ABER",[[1,2]],null,"e"],["APOC",[[5,6]],null,"∅"]]],["ge-EVF-0449",[["ABER",[[1,2]],null,"o"]]],["ge-EVF-0450",[["ABER",[[1,2]],null,"o"]]],["ge-EVF-0452",[["ABER",[[0,1]],null,"o"],["ABER",[[3,4]],null,"o"]]],["ge-EVF-0545",[["SONOR",[[5,6]],null,"g"]]],["ge-EVF-0548",[["DIPT",[[1,2]],null,"ie"],["ABER",[[4,5]],null,"o"]]],["ge-EVF-0556",[["DIPT",[[1,2]],null,"ue"],["ABER",[[3,4]],null,"o"]]],["ge-EVF-0565",[["DIPT",[[1,2]],null,"ie"],["ABER",[[3,4]],null,"o"]]],["ge-EVF-0589",[["DIPT",[[1,2]],null,"ue"],["ABER",[[4,5]],null,"o"]]],["ge-EVF-0596",[["DIPT",[[1,2]],null,"ue"]]],["ge-EVF-0757",[["MONOP",[[1,3]],null,"o"],["ABER",[[4,5]],null,"o"]]],["ge-EVF-0812",[["PALAT",[[2,4]],null,"ll"],["ABER",[[4,5]],null,"o"]]],["ge-EVF-0814",[["ABER",[[1,2]],null,"e"],["PALAT",[[2,4]],null,"j"]]],["ge-EVF-0860",[["PALAT",[[2,4]],null,"ñ"]]],["ge-EVF-0869",[["PALAT",[[2,4]],null,"ll"],["SONOR",[[5,6]],null,"d"],["ABER",[[6,7]],null,"o"]]],["ge-EVF-0882",[["PROT",[],0,"e"]]],["ge-EVF-0884",[["PROT",[],0,"e"]]],["ge-EVF-1009",[["SONOR",[[1,2]],null,"g"],["SONOR",[[3,4]],null,"d"],["ABER",[[4,5]],null,"o"]]],["ge-EVF-1010",[["SONOR",[[3,4]],null,"d"]]],["ge-EVF-1022",[["SONOR",[[2,3]],null,"g"],["ABER",[[5,6]],null,"o"]]],["ge-EVF-1024",[["PROT",[],0,"e"],["SONOR",[[3,4]],null,"d"],["ABER",[[4,5]],null,"o"]]],["ge-EVF-1025",[["PROT",[],0,"e"],["SONOR",[[4,5]],null,"d"],["ABER",[[5,6]],null,"o"]]],["ge-EVF-0311",[["ABER",[[1,2]],null,"o"],["SONOR",[[2,3]],null,"b"]]],["ge-EVF-0800",[["PALAT",[[1,3]],null,"j"],["ABER",[[5,6]],null,"o"]]],["ge-EVF-0818",[["ABER",[[4,5]],null,"e"],["PALAT",[[5,7]],null,"j"],["ABER",[[7,8]],null,"o"]]],["ge-EVF-0834",[["PALAT",[[2,4]],null,"ll"]]],["ge-EVF-0868",[["PALAT",[[3,5]],null,"ch"]]],["ge-EVF-0278",[["SONOR",[[2,3]],null,"g"],["SONOR",[[6,7]],null,"d"],["SONOR",[[8,9]],null,"d"],["APOC",[[9,10]],null,"∅"]]],["ge-EVF-0352",[["ABER",[[4,5]],null,"e"],["SONOR",[[5,6]],null,"d"],["SONOR",[[7,8]],null,"d"],["APOC",[[8,9]],null,"∅"]]],["ge-EVF-0364",[["ABER",[[4,5]],null,"e"],["APOC",[[9,10]],null,"∅"]]],["ge-EVF-0379",[["ABER",[[4,5]],null,"e"],["SONOR",[[5,6]],null,"d"],["SONOR",[[7,8]],null,"d"],["APOC",[[8,9]],null,"∅"]]],["ge-EVF-0393",[["ABER",[[3,4]],null,"e"],["SONOR",[[4,5]],null,"d"],["SONOR",[[6,7]],null,"d"],["APOC",[[7,8]],null,"∅"]]],["ge-EVF-0423",[["ABER",[[1,2]],null,"e"],["APOC",[[6,7]],null,"∅"]]],["ge-EVF-0437",[["ABER",[[1,2]],null,"o"],["APOC",[[8,9]],null,"∅"]]],["ge-EVF-0503",[["PROT",[],0,"e"],["SIMPL",[[4,6]],null,"t"],["ABER",[[9,10]],null,"o"]]],["ge-EVF-0550",[["PALAT",[[2,4]],null,"ll"]]],["ge-EVF-0837",[["PALAT",[[3,5]],null,"ll"],["ABER",[[5,6]],null,"o"]]],["ge-EVF-1011",[["SONOR",[[1,2]],null,"b"]]],["ge-EVF-1058",[["SINC",[[2,3]],null,"∅"],["ABER",[[3,4]],null,"e"],["SIMPL",[[4,6]],null,"t"]]],["ge-EVF-1060",[["ABER",[[2,3]],null,"e"],["SONOR",[[3,4]],null,"b"]]],["ge-EVF-1073",[["ABER",[[1,2]],null,"e"],["PALAT",[[4,6]],null,"j"]]],["ge-EVF-1144",[["MONOP",[[0,1]],null,"e"]]],["ge-EVF-1145",[["MONOP",[[0,1]],null,"e"],["ABER",[[4,5]],null,"o"]]],["ge-EVF-1146",[["MONOP",[[0,1]],null,"e"],["ABER",[[3,4]],null,"o"]]],["ge-EVF-1147",[["MONOP",[[0,1]],null,"e"],["ABER",[[5,6]],null,"o"]]],["ge-EVF-1148",[["MONOP",[[0,1]],null,"e"],["ABER",[[8,9]],null,"o"]]],["ge-EVF-1149",[["MONOP",[[0,1]],null,"e"],["ABER",[[4,5]],null,"o"]]],["ge-EVF-1150",[["MONOP",[[0,1]],null,"e"]]],["ge-EVF-1151",[["MONOP",[[1,2]],null,"e"]]],["ge-EVF-1153",[["MONOP",[[1,2]],null,"e"],["APOC",[[5,6]],null,"∅"]]],["ge-EVF-1154",[["MONOP",[[1,2]],null,"e"]]],["ge-EVF-1155",[["MONOP",[[2,3]],null,"e"],["ABER",[[7,8]],null,"o"]]],["ge-EVF-1156",[["MONOP",[[1,2]],null,"e"],["ABER",[[6,7]],null,"o"]]],["ge-EVF-1157",[["MONOP",[[1,2]],null,"e"]]],["ge-EVF-1158",[["MONOP",[[3,4]],null,"e"]]],["ge-EVF-1159",[["MONOP",[[2,3]],null,"e"],["ABER",[[4,5]],null,"o"]]],["ge-EVF-1160",[["MONOP",[[1,2]],null,"e"],["ABER",[[5,6]],null,"o"]]],["ge-EVF-1161",[["MONOP",[[1,2]],null,"e"],["APOC",[[7,8]],null,"∅"]]],["ge-EVF-1163",[["MONOP",[[1,2]],null,"e"]]],["ge-EVF-1164",[["MONOP",[[1,2]],null,"e"],["ABER",[[7,8]],null,"o"]]],["ge-EVF-1165",[["MONOP",[[1,2]],null,"e"]]],["ge-EVF-1166",[["MONOP",[[2,3]],null,"e"]]],["ge-EVF-1167",[["MONOP",[[0,1]],null,"e"],["ABER",[[8,9]],null,"o"]]],["ge-EVF-1168",[["MONOP",[[0,1]],null,"e"],["ABER",[[8,9]],null,"o"]]],["ge-EVF-1169",[["MONOP",[[0,1]],null,"e"],["ABER",[[4,5]],null,"o"]]],["ge-EVF-1170",[["MONOP",[[1,2]],null,"e"],["ABER",[[7,8]],null,"o"]]],["ge-EVF-1173",[["MONOP",[[2,3]],null,"e"],["ABER",[[7,8]],null,"o"]]],["ge-EVF-1174",[["MONOP",[[2,3]],null,"e"],["ABER",[[7,8]],null,"o"]]],["ge-EVF-1175",[["MONOP",[[2,3]],null,"e"],["ABER",[[8,9]],null,"o"]]],["ge-EVF-1176",[["PROT",[],0,"e"],["MONOP",[[2,3]],null,"e"]]],["ge-EVF-1177",[["MONOP",[[4,5]],null,"e"]]],["ge-EVF-1180",[["MONOP",[[2,3]],null,"e"],["SIMPL",[[7,9]],null,"s"],["APOC",[[11,12]],null,"∅"]]],["ge-EVF-1201",[["PROT",[],0,"e"],["SIMPL",[[4,6]],null,"t"],["APOC",[[8,9]],null,"∅"]]]];
 assert.equal(cases.length,124);
 assert.doesNotThrow(()=>assertFinalDirectResults(bank.words));
 for(const [id,changes] of cases){
  const w=bank.words.find(w=>w.id===id);
  assert.ok(w,id);
  assert.deepEqual(w.changes.filter(c=>c.rule!=='FIX_M').map(c=>[c.rule,c.spans,c.anchor??null,c.output]),changes,id);
  for(const [rule,spans,anchor] of changes)assert.equal(gradeChange(w,{rule,spans,...(anchor===null?{}:{anchor})}).correct,true,id+' '+rule);
  assert.ok(w.explanation.startsWith(w.latin+' > '+w.answers[0]+': '),id);
 }
 const bad=word('uitam');
 assert.throws(()=>assertFinalDirectResults([{...bad,changes:bad.changes.filter(c=>c.rule!=='SONOR')}]),/resultado directo incoherente/);
 const sierva=word('sĕruam');
 assert.doesNotThrow(()=>assertFinalDirectResults([sierva]));
 const sana=word('sannam');
 assert.throws(()=>assertFinalDirectResults([{...sana,answers:['sana']}]),/resultado directo incoherente/);
});
