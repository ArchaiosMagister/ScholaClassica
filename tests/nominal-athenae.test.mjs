import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {compileAthenae} from '../scripts/nominal-athenae.mjs';
import {validateBank,availableRecords,makeQuestions,evaluate} from '../public/morfologia/engine.mjs';
import {makeWrittenQuestions,makeTableExercises,correctWritten,evaluateTable} from '../public/morfologia/written.mjs';
import {greekNounPhrasePairs} from '../public/morfologia/greek-noun-phrases.mjs';
const root=resolve(import.meta.dirname,'..');
const read=f=>readFileSync(join(root,f),'utf8');
const bank=JSON.parse(read('dist/apps/morfologia/data/paradigmas.json'));
const lock=JSON.parse(read('config/sources.lock.json'));
const decisions=JSON.parse(read('config/nominal-teacher-decisions.json'));
const ath=bank.records.find(r=>r.id==='griego-sustantivo-decision-athenai');
test('Ἀθῆναι se limita estrictamente a cinco casos plurales áticos documentados',()=>{
 validateBank(bank);
 assert.ok(ath);
 assert.equal(ath.unit,4);
 assert.equal(ath.gender,'femenino');
 assert.equal(ath.evidence.numberScope,'plural');
 assert.equal(ath.evidence.vocabulaEntry,'b8e417b32b6f3692');
 assert.deepEqual(ath,compileAthenae({vocabulaData:read('vendor/vocabula/data.js'),
  vocabulaSha:lock.sources.vocabula.sha,decisions}));
 assert.deepEqual(ath.forms.map(f=>[f.case,f.form]),[
 ['nominativo','Ἀθῆναι'],['vocativo','Ἀθῆναι'],
 ['acusativo','Ἀθήνας'],['genitivo','Ἀθηνῶν'],['dativo','Ἀθήναις']]);
 assert.ok(ath.forms.every(f=>f.number==='plural'));
 assert.equal(ath.forms.length,5);
 assert.ok(!availableRecords(bank,{language:'griego',unit:3}).some(r=>r.id===ath.id));
 assert.ok(availableRecords(bank,{language:'griego',unit:4}).some(r=>r.id===ath.id));
 assert.ok(!greekNounPhrasePairs(bank,{language:'griego',unit:5}).some(p=>p.noun.id===ath.id));
});
test('Escritura, análisis y tabla de cinco celdas sin inventar singular',()=>{
 const scope={...bank,records:[ath]};
 const questions=makeWrittenQuestions(scope,{language:'griego',unit:4,limit:10,rng:()=>.6});
 assert.equal(questions.length,5);
 assert.ok(questions.every(x=>x.prompt.includes('plural')&&correctWritten(x,x.acceptedForms[0]).correct));
 assert.equal(questions.some(x=>x.prompt.includes('singular')),false);
 const tables=makeTableExercises(scope,{language:'griego',unit:4,limit:10,rng:()=>.6});
 assert.equal(tables.length,1);
 assert.equal(tables[0].cells.length,5);
 assert.ok(tables[0].id.endsWith(':plural'));
 assert.ok(tables[0].cells.every(c=>c.number==='plural'));
 assert.equal(evaluateTable(tables[0],Object.fromEntries(tables[0].cells.map(c=>[c.id,c.acceptedForms[0]]))).complete,true);
 const choices=makeQuestions(scope,{language:'griego',unit:4,activity:'analysis',limit:20,rng:()=>.3});
 assert.ok(choices.length>0);
 assert.ok(choices.every(q=>evaluate(q,q.correct).correct));
});
test('La excepción de cinco casillas no se aplica a otro sustantivo',()=>{
 const fake=structuredClone(ath);
 fake.id='griego-sustantivo-no-acreditado';
 assert.throws(()=>validateBank({...bank,records:[fake]}),/sin documentación/i);
 const distorted=structuredClone(ath);
 distorted.forms[0].number='singular';
 assert.throws(()=>validateBank({...bank,records:[distorted]}),/sin documentación/i);
});
