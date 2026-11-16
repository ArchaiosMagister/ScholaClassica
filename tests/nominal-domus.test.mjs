import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {compileDomus} from '../scripts/nominal-latin-teacher.mjs';
import {availableRecords,practiceEligibleEntries,practiceOrdinaryEntries,validateBank,makeQuestions,evaluate}
 from '../public/morfologia/engine.mjs';
import {makeWrittenQuestions,makeTableExercises,evaluateTable,correctWritten}
 from '../public/morfologia/written.mjs';
const root=resolve(import.meta.dirname,'..');
const read=f=>readFileSync(join(root,f),'utf8');
const bank=JSON.parse(read('dist/apps/morfologia/data/paradigmas.json'));
const lock=JSON.parse(read('config/sources.lock.json'));
const decisions=JSON.parse(read('config/nominal-teacher-decisions.json'));
const domus=bank.records.find(r=>r.id==='latin-sustantivo-decision-domus');
const get=(cas,n)=>domus.forms.filter(f=>f.case===cas&&f.number===n).map(f=>f.form);
test('domus: cuarto y segundo tema, 19 lecturas, locativo singular propio',()=>{
 validateBank(bank);
 assert.ok(domus);
 assert.deepEqual(domus,compileDomus({vocabulaData:read('.sources/vocabula/data.js'),
  vocabulaSha:lock.sources.vocabula.sha,decisions}));
 assert.equal(domus.unit,7);
 assert.equal(domus.gender,'femenino');
 assert.equal(domus.forms.length,19);
 assert.deepEqual(get('genitivo','singular'),['domus','domi']);
 assert.deepEqual(get('genitivo','plural'),['domuum','domorum']);
 assert.deepEqual(get('acusativo','plural'),['domos','domus']);
 assert.deepEqual(get('dativo','singular'),['domui','domo']);
 assert.deepEqual(get('ablativo','singular'),['domo','domu']);
 assert.deepEqual(get('locativo','singular'),['domi','domui']);
 assert.ok(!domus.forms.some(f=>f.case==='locativo'&&f.number==='plural'));
 assert.ok(!availableRecords(bank,{language:'latin',unit:6}).some(r=>r.id===domus.id));
 assert.ok(availableRecords(bank,{language:'latin',unit:7}).some(r=>r.id===domus.id));
});
test('Variantes raras admitidas como respuesta, sin preguntas nominales originadas por ellas',()=>{
 const allowed=practiceEligibleEntries(domus);
 const ordinary=practiceOrdinaryEntries(domus);
 assert.equal(allowed.length,19);
 assert.equal(ordinary.length,16);
 assert.ok(allowed.some(f=>f.form==='domorum'&&f.case==='genitivo'));
 assert.ok(!ordinary.some(f=>f.form==='domorum'&&f.case==='genitivo'));
 assert.ok(ordinary.some(f=>f.form==='domi'&&f.case==='locativo'));
 const just={...bank,records:[domus]};
 const qs=makeWrittenQuestions(just,{language:'latin',unit:7,limit:30,rng:()=>.2});
 const gen=qs.find(q=>q.prompt==='Escribe la forma de genitivo singular.');
 assert.ok(gen);
 assert.ok(gen.acceptedForms.includes('domus')&&gen.acceptedForms.includes('domi'));
 assert.equal(correctWritten(gen,'domi').correct,true);
 const loc=qs.find(q=>q.prompt==='Escribe la forma de locativo singular.');
 assert.ok(loc);
 assert.equal(correctWritten(loc,'domi').correct,true);
 assert.equal(correctWritten(loc,'domui').correct,true);
 const tables=makeTableExercises(just,{language:'latin',unit:7,limit:5,rng:()=>.2});
 assert.equal(tables.length,1);
 assert.equal(tables[0].cells.length,12,'El locativo singular no crea columnas dobles');
 assert.equal(evaluateTable(tables[0],Object.fromEntries(tables[0].cells.map(x=>[x.id,x.acceptedForms[0]]))).complete,true);
 const analysis=makeQuestions(just,{language:'latin',unit:7,activity:'analysis',limit:40,rng:()=>.2});
 assert.ok(analysis.length>0&&analysis.every(q=>evaluate(q,q.correct).correct));
 assert.ok(!analysis.some(q=>q.correct==='domorum'),'La lectura poética no inicia preguntas');
});
test('Una mutación en la fuente antigua o la decisión detiene la compilación',()=>{
 const original=read('.sources/vocabula/data.js');
 assert.throws(()=>compileDomus({vocabulaData:original.replace('domus, –us (o –i)','domus, –i'),
  vocabulaSha:lock.sources.vocabula.sha,decisions}),/No se corresponde|Expected values|strictly equal/i);
 const other=structuredClone(decisions);
 other.choices.domus='cuarta-exclusiva';
 assert.throws(()=>compileDomus({vocabulaData:original,vocabulaSha:lock.sources.vocabula.sha,decisions:other}),/cuarta|conservar/i);
});
