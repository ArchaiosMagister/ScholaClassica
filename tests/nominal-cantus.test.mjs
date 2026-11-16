import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {compileCantus} from '../scripts/nominal-latin-teacher.mjs';
import {availableRecords,validateBank,makeQuestions,evaluate} from '../public/morfologia/engine.mjs';
import {makeWrittenQuestions,makeTableExercises,correctWritten,evaluateTable}
 from '../public/morfologia/written.mjs';
const root=resolve(import.meta.dirname,'..');
const read=f=>readFileSync(join(root,f),'utf8');
const bank=JSON.parse(read('dist/apps/morfologia/data/paradigmas.json'));
const lock=JSON.parse(read('config/sources.lock.json'));
const decisions=JSON.parse(read('config/nominal-teacher-decisions.json'));
const cantus=bank.records.find(r=>r.id==='latin-sustantivo-decision-cantus');
test('cantus: exclusivamente cuarta declinación; doce casos y origen fijo',()=>{
 validateBank(bank);
 assert.ok(cantus);
 assert.deepEqual(cantus,compileCantus({vocabulaData:read('.sources/vocabula/data.js'),
  vocabulaSha:lock.sources.vocabula.sha,decisions}));
 assert.equal(cantus.unit,7);
 assert.equal(cantus.gender,'masculino');
 assert.equal(cantus.forms.length,12);
 assert.equal(new Set(cantus.forms.map(f=>f.analysis)).size,12);
 const get=(cas,n)=>cantus.forms.find(f=>f.case===cas&&f.number===n).form;
 for(const [cas,n,val] of [['genitivo','singular','cantus'],
  ['genitivo','plural','cantuum'],['dativo','singular','cantui'],
  ['acusativo','plural','cantus'],['ablativo','singular','cantu']]){
  assert.equal(get(cas,n),val);
 }
 assert.ok(!cantus.forms.some(x=>['canti','cantorum','cante','cantis','cantos'].includes(x.form)));
 assert.ok(!availableRecords(bank,{language:'latin',unit:6}).some(r=>r.id===cantus.id));
 assert.ok(availableRecords(bank,{language:'latin',unit:7}).some(r=>r.id===cantus.id));
});
test('No se adelanta cantus: tablas, escritura y análisis sin mezcla con segundo',()=>{
 const single={...bank,records:[cantus]};
 const tables=makeTableExercises(single,{language:'latin',unit:7,limit:8,rng:()=>.4});
 assert.equal(tables.length,1);
 assert.equal(tables[0].cells.length,12);
 assert.equal(evaluateTable(tables[0],Object.fromEntries(tables[0].cells.map(x=>[x.id,x.acceptedForms[0]]))).complete,true);
 const written=makeWrittenQuestions(single,{language:'latin',unit:7,limit:25,rng:()=>.8});
 assert.equal(written.length,12);
 assert.ok(written.every(q=>correctWritten(q,q.acceptedForms[0]).correct));
 const analysis=makeQuestions(single,{language:'latin',unit:7,activity:'analysis',limit:20,rng:()=>.1});
 assert.ok(analysis.length>0);
 assert.ok(analysis.every(q=>evaluate(q,q.correct).correct));
});
