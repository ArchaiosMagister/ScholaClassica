import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {compileLiber} from '../scripts/nominal-latin-teacher.mjs';
import {availableRecords,validateBank} from '../public/morfologia/engine.mjs';
import {makeWrittenQuestions,makeTableExercises,correctWritten,evaluateTable}
 from '../public/morfologia/written.mjs';
const root=resolve(import.meta.dirname,'..');
const read=f=>readFileSync(join(root,f),'utf8');
const bank=JSON.parse(read('dist/apps/morfologia/data/paradigmas.json'));
const lock=JSON.parse(read('config/sources.lock.json'));
const decisions=JSON.parse(read('config/nominal-teacher-decisions.json'));
const noun=bank.records.find(r=>r.id==='latin-sustantivo-decision-liber');
test('liber (libro) conserva nominativo con -e-, pierde e en el tema y pertenece a 2.ª',()=>{
 validateBank(bank);
 assert.ok(noun);
 assert.deepEqual(noun,compileLiber({vocabulaData:read('vendor/vocabula/data.js'),
  vocabulaSha:lock.sources.vocabula.sha,decisions}));
 assert.equal(noun.unit,1);
 assert.equal(noun.gender,'masculino');
 assert.equal(noun.forms.length,12);
 const form=(c,n)=>noun.forms.find(f=>f.case===c&&f.number===n).form;
 assert.deepEqual([form('nominativo','singular'),form('vocativo','singular'),form('genitivo','singular'),
  form('acusativo','singular'),form('genitivo','plural')],
  ['liber','liber','libri','librum','librorum']);
 assert.ok(!noun.forms.some(f=>['libera','liberum','liberam'].includes(f.form)));
 assert.ok(availableRecords(bank,{language:'latin',unit:1}).some(r=>r.id===noun.id));
});
test('liber libro y el adjetivo līber libre no se confunden en identidad ni evaluación',()=>{
 const reserve=JSON.parse(read('data/morfologia/adjetivos-reservados.json')).records[0];
 assert.equal(reserve.id,'latin-adjetivo-reserva-liber-free');
 assert.equal(reserve.entry,'līber, lībera, līberum');
 assert.equal(reserve.notForGrading,true);
 assert.ok(!bank.records.some(x=>x.id===reserve.id));
 assert.equal(existsSync(join(root,'dist/data/morfologia/adjetivos-reservados.json')),false);
 const single={...bank,records:[noun]};
 const written=makeWrittenQuestions(single,{language:'latin',unit:1,limit:20,rng:()=>.3});
 assert.equal(written.length,12);
 assert.ok(written.every(q=>correctWritten(q,q.acceptedForms[0]).correct));
 const table=makeTableExercises(single,{language:'latin',unit:1,limit:5,rng:()=>.3});
 assert.equal(table.length,1);
 assert.equal(table[0].cells.length,12);
 assert.equal(evaluateTable(table[0],Object.fromEntries(table[0].cells.map(x=>[x.id,x.acceptedForms[0]]))).complete,true);
});
