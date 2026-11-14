import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {compileGreekExigibleNounBatch} from '../scripts/greek-noun-conciliation.mjs';
import {INDIVIDUAL_GREEK_NOUN_CHECKS,verifyNineGreekNounRecords,CASE_ORDER,
 NUMBER_ORDER} from '../scripts/greek-noun-individual-review.mjs';
import {availableRecords} from '../public/morfologia/engine.mjs';
import {makeTableExercises} from '../public/morfologia/tables.mjs';
import {evaluateTable,correctWritten} from '../public/morfologia/written.mjs';
import {makeWrittenQuestions} from '../public/morfologia/written.mjs';

const root=resolve(import.meta.dirname,'..');
const vocab=join(root,'.sources/vocabula');
const lex=readFileSync(join(vocab,'data.js'),'utf8');
const appendix=JSON.parse(readFileSync(join(root,'.sources/appendix/assets/curriculum.json'),'utf8'));
const lock=JSON.parse(readFileSync(join(root,'config/sources.lock.json'),'utf8'));
const parts=Array.from({length:8},(_,i)=>JSON.parse(readFileSync(join(vocab,'data/unimorph-syllabus/grc/part-0'+i+'.json'),'utf8')));
const bank=JSON.parse(readFileSync(join(root,'dist/apps/morfologia/data/paradigmas.json'),'utf8'));
const generate=override=>compileGreekExigibleNounBatch({
 curriculum:appendix,vocabulaData:lex,unimorphParts:parts,
 vocabulaSha:lock.sources.vocabula.sha,...override});
const selected=generate();
const ONLY=(r)=>({records:[r],coverage:bank.coverage});

test('90/90 casillas griegas cotejadas por caso y número, sin inventar duales',()=>{
 assert.equal(INDIVIDUAL_GREEK_NOUN_CHECKS.length,9);
 assert.equal(selected.length,9);
 assert.equal(new Set(selected.map(x=>x.id)).size,9);
 assert.deepEqual(bank.records.slice(-9),selected,'El banco publicado en build debe conservar evidencia completa');
 assert.equal(bank.records.filter(x=>x.language==='griego').length,92);
 let checked=0;
 for(const [i,spec] of INDIVIDUAL_GREEK_NOUN_CHECKS.entries()){
  const record=selected[i];
  assert.equal(record.id,'griego-sustantivo-'+spec.id);
  assert.equal(record.unit,spec.unit);
  assert.equal(record.gender,spec.gender);
  assert.equal(record.forms.length,10);
  assert.equal(spec.forms.length,5);
  assert.equal(record.evidence.status,'formas-contrastadas-individualmente');
  assert.equal(record.evidence.vocabulaSha,lock.sources.vocabula.sha);
  const v=record.evidence.individualVerification;
  assert.equal(v.checkedCount,10);
  assert.equal(v.slots.length,10);
  assert.equal(v.source,spec.url);
  assert.equal(v.grammar,spec.grammar);
  assert.equal(v.date,'2026-11-14');
  for(const [j,row] of spec.forms.entries()){
   assert.equal(row[0],CASE_ORDER[j]);
   for(const [k,number] of NUMBER_ORDER.entries()){
    const f=record.forms.find(x=>x.case===row[0]&&x.number===number);
    assert.ok(f,'Casilla no encontrada '+spec.lemma+' '+row[0]+' '+number);
    assert.equal(f.form,row[k+1],spec.lemma+' '+row[0]+' '+number);
    const slot=v.slots.find(x=>x.case===row[0]&&x.number===number);
    assert.ok(slot);
    assert.equal(slot.form,f.form);
    assert.equal(slot.status,'paradigma-ático-contrastado');
    checked++;
   }
  }
  assert.equal(availableRecords(bank,{language:'griego',unit:spec.unit-1})
   .some(x=>x.id===record.id),false,'Nunca adelantar '+spec.lemma);
  assert.ok(availableRecords(bank,{language:'griego',unit:spec.unit})
   .some(x=>x.id===record.id),'No perder elegibilidad de '+spec.lemma);
 }
 assert.equal(checked,90);
});

test('Mutaciones en cualquier casilla, diacrítico, etiqueta, género o unidad fallan cerradas',()=>{
 const original=selected.map(x=>structuredClone(x));
 for(let i=0;i<original.length;i++){
  const record=original[i];
  for(let j=0;j<record.forms.length;j++){
   const broken=structuredClone(original);
   broken[i].forms[j].form+='ξ';
   assert.throws(()=>verifyNineGreekNounRecords(broken),
    /Desacuerdo de acentos, espíritu o flexión/,
    'Aceptada errata en '+record.id+' '+record.forms[j].analysis);
  }
 }
 const untrusted=structuredClone(original);
 untrusted[0].unit=6;
 assert.throws(()=>verifyNineGreekNounRecords(untrusted),/Unidad curricular inesperada/);
 const gender=structuredClone(original);
 gender[1].gender='femenino';
 assert.throws(()=>verifyNineGreekNounRecords(gender),/Género inesperado/);
 const wrong=structuredClone(original);
 wrong[0].forms[0].case='ablativo';
 assert.throws(()=>verifyNineGreekNounRecords(wrong),/Falta casilla|Duplicidad/);
 const incomplete=structuredClone(original);
 incomplete[0].forms.pop();
 assert.throws(()=>verifyNineGreekNounRecords(incomplete),/Casillas fuera del inventario/);
});

test('οὐρανός: cinco plurales correctos en el paradigma, pero reserva diacrónica expresa',()=>{
 const word=selected.find(x=>x.id==='griego-sustantivo-ouranos');
 assert.ok(word);
 const v=word.evidence.individualVerification;
 assert.match(v.historicalReservation,/uso posterior/i);
 assert.equal(v.slots.filter(x=>x.number==='plural'&&
  x.usage==='no-acreditado-en-griego-clasico-por-esta-fuente').length,5);
 assert.equal(v.slots.filter(x=>x.number==='singular'&&x.usage).length,0);
 assert.ok(word.forms.some(x=>x.form==='οὐρανοῖς'&&x.number==='plural'));
 assert.equal(word.evidence.status,'formas-contrastadas-individualmente');
 assert.match(word.evidence.review,/no constituye prueba de atestación textual/);
});

test('Las diez casillas de cada lema siguen corregibles en las actividades, sin alterar sorteo',()=>{
 for(const record of selected){
  const single={...bank,records:[record]};
  const table=makeTableExercises(single,{language:'griego',unit:record.unit,rng:()=>.5});
  assert.equal(table.length,1);
  assert.equal(table[0].cells.length,10);
  const answers=Object.fromEntries(table[0].cells.map(x=>[x.id,x.acceptedForms[0]]));
  assert.equal(evaluateTable(table[0],answers).complete,true);
  const written=makeWrittenQuestions(single,{
   language:'griego',unit:record.unit,limit:30,rng:()=>.5
  });
  assert.ok(written.length>=8);
  assert.ok(written.every(q=>correctWritten(q,q.acceptedForms[0]).correct));
 }
});
