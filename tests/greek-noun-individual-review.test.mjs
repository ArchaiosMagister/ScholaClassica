import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {compileGreekExigibleNounBatch} from '../scripts/greek-noun-conciliation.mjs';
import {INDIVIDUAL_GREEK_NOUN_CHECKS,verifyNineGreekNounRecords,CASE_ORDER,
 NUMBER_ORDER} from '../scripts/greek-noun-individual-review.mjs';
import {availableRecords,makeQuestions,practiceEligibleEntries,practiceOrdinaryEntries} from '../public/morfologia/engine.mjs';
import {makeGreekNounPhraseQuestions,makeGreekNounPhraseTables} from '../public/morfologia/greek-noun-phrases.mjs';
import {applyReview,emptyReview,reviewCounts} from '../public/morfologia/review.mjs';
import {makeTableExercises,makeWrittenQuestions,evaluateTable,correctWritten}
 from '../public/morfologia/written.mjs';

const root=resolve(import.meta.dirname,'..');
const vocab=join(root,'.sources/vocabula');
const lex=readFileSync(join(vocab,'data.js'),'utf8');
const appendix=JSON.parse(readFileSync(join(root,'vendor/appendix/assets/curriculum.json'),'utf8'));
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
 assert.deepEqual(bank.records.slice(bank.records.findIndex(x=>x.id===selected[0].id),
  bank.records.findIndex(x=>x.id===selected[0].id)+9),selected,'El banco publicado en build debe conservar evidencia completa');
 assert.equal(bank.records.filter(x=>x.language==='griego').length,94);
 let checked=0;
 for(const [i,spec] of INDIVIDUAL_GREEK_NOUN_CHECKS.entries()){
  const record=selected[i];
  assert.equal(record.id,'griego-sustantivo-'+spec.id);
  assert.equal(record.unit,spec.unit);
  assert.equal(record.gender,spec.gender);
  assert.equal(record.forms.length,10);
  assert.equal(spec.forms.length,5);
  assert.equal(record.evidence.status,'paradigma-documentado');
  assert.equal(record.evidence.individualVerification.status,'contrastado-individualmente');
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
 const original=selected.map(x=>{
  const record=structuredClone(x);
  record.evidence.review='conciliación interfuentes; pendiente de revisión docente individual';
  delete record.evidence.individualVerification;
  return record;
 });
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
 assert.equal(word.evidence.status,'paradigma-documentado');
 assert.equal(word.evidence.individualVerification.status,'contrastado-individualmente');
 assert.match(word.evidence.review,/no constituye prueba de atestación textual/);
});

test('Las nueve fichas siguen corregibles: οὐρανός solo con las cinco formas singulares',()=>{
 for(const record of selected){
  const single={...bank,records:[record]};
  const table=makeTableExercises(single,{language:'griego',unit:record.unit,rng:()=>.5});
  assert.equal(table.length,1);
  assert.equal(table[0].cells.length,record.id==='griego-sustantivo-ouranos'?5:10);
  if(record.id==='griego-sustantivo-ouranos'){
   assert.ok(table[0].cells.every(c=>c.number==='singular'));
   assert.ok(table[0].id.endsWith(':singular'));
  }
  const answers=Object.fromEntries(table[0].cells.map(x=>[x.id,x.acceptedForms[0]]));
  assert.equal(evaluateTable(table[0],answers).complete,true);
  const written=makeWrittenQuestions(single,{
   language:'griego',unit:record.unit,limit:30,rng:()=>.5
  });
  assert.ok(written.length>=(record.id==='griego-sustantivo-ouranos'?5:8));
  assert.ok(written.every(q=>correctWritten(q,q.acceptedForms[0]).correct));
 }
});


test('Decisión docente: excluir exactamente cinco plurales de οὐρανός, no eliminarlos del banco',()=>{
 const current=selected.find(r=>r.id==='griego-sustantivo-ouranos');
 assert.ok(current);
 const v=current.evidence.individualVerification,policy=v.practiceExclusion;
 const five=CASE_ORDER.map(cas=>cas+':plural');
 assert.equal(policy.policy,'exclude-plural-from-new-exercises');
 assert.deepEqual(policy.slots,five);
 assert.equal(current.forms.length,10);
 assert.equal(current.forms.filter(f=>f.number==='plural').length,5);
 assert.deepEqual(practiceEligibleEntries(current).map(f=>f.case+':'+f.number),
  CASE_ORDER.map(cas=>cas+':singular'));
 assert.deepEqual(practiceOrdinaryEntries(current),practiceEligibleEntries(current));
 assert.equal(availableRecords(bank,{language:'griego',unit:9,kind:'sustantivo'})
  .find(r=>r.id===current.id)?.forms.length,10);
 for(const other of selected.filter(r=>r.id!==current.id)){
  assert.equal(other.evidence.individualVerification.practiceExclusion,undefined);
  assert.equal(practiceEligibleEntries(other).length,10);
 }
 const invalid=structuredClone(current);
 invalid.evidence.individualVerification.practiceExclusion.slots.pop();
 assert.throws(()=>practiceEligibleEntries(invalid),/Reserva docente/);
});

test('Selección y repaso: ningún plural de οὐρανός reaparece en ninguna modalidad',()=>{
 const current=selected.find(r=>r.id==='griego-sustantivo-ouranos');
 const single={...bank,records:[current]};
 const original=structuredClone(current);
 delete original.evidence.individualVerification.practiceExclusion;
 const legacy={...bank,records:[original]};
 const excluded=new Set(current.forms.filter(f=>f.number==='plural').map(f=>f.form));
 const fixed=()=>.37;
 for(const activity of ['form','analysis']){
  const before=makeQuestions(legacy,{language:'griego',unit:9,kind:'sustantivo',
   activity,limit:30,rng:fixed});
  const after=makeQuestions(single,{language:'griego',unit:9,kind:'sustantivo',
   activity,limit:30,rng:fixed});
  assert.equal(after.length,5,'Singulares deben seguir practicables: '+activity);
  assert.ok(before.length>after.length,'Plurales antes estaban disponibles: '+activity);
  assert.ok(after.every(q=>!excluded.has(q.form)&&!excluded.has(q.correct)&&
   !(q.acceptedForms||[]).some(form=>excluded.has(form))&&
   !(q.options||[]).some(form=>excluded.has(form))));
  assert.ok(after.every(q=>before.some(old=>old.id===q.id)),
   'No renumerar las preguntas singulares ni perder su progreso de '+activity);
  if(activity==='form')assert.ok(after.every(q=>q.prompt.includes('singular')));
  if(activity==='analysis')assert.ok(after.every(q=>q.correct.includes('singular')));
  const previous=before.find(q=>activity==='form'?
   q.prompt.includes('plural'):q.correct.includes('plural'));
  assert.ok(previous);
  const history=applyReview(emptyReview(),previous.id,false,1000);
  assert.equal(reviewCounts(history,1000).errors,1);
  const selectedErrors=makeQuestions(single,{language:'griego',unit:9,
   kind:'sustantivo',activity,reviewMode:'errors',reviewState:history,
   now:1000,limit:30,rng:fixed});
  assert.deepEqual(selectedErrors,[],
   'El historial no debe reintroducir el plural al elegir repaso de errores');
  assert.equal(reviewCounts(history,1000).practiced,1,'No borrar el historial antiguo');
  assert.equal(history.items[previous.id].seen,1);
 }
 const oldWritten=makeWrittenQuestions(legacy,{language:'griego',unit:9,
  kind:'sustantivo',limit:30,rng:fixed});
 const newWritten=makeWrittenQuestions(single,{language:'griego',unit:9,
  kind:'sustantivo',limit:30,rng:fixed});
 assert.equal(newWritten.length,5);
 assert.ok(oldWritten.length>newWritten.length);
 assert.ok(newWritten.every(q=>q.prompt.includes('singular')&&
  q.acceptedForms.every(form=>!excluded.has(form))&&
  oldWritten.some(old=>old.id===q.id)));
 const oldTables=makeTableExercises(legacy,{language:'griego',unit:9,
  kind:'sustantivo',limit:30,rng:fixed});
 const newTables=makeTableExercises(single,{language:'griego',unit:9,
  kind:'sustantivo',limit:30,rng:fixed});
 assert.equal(oldTables.length,1);
 assert.equal(oldTables[0].cells.length,10);
 assert.equal(newTables.length,1);
 assert.equal(newTables[0].cells.length,5);
 assert.ok(newTables[0].cells.every(c=>c.number==='singular'&&
   c.acceptedForms.every(form=>!excluded.has(form))));
 assert.equal(newTables[0].id,oldTables[0].id+':singular');
 assert.match(newTables[0].prompt,/en singular\./);
 assert.equal(evaluateTable(newTables[0],Object.fromEntries(newTables[0].cells
   .map(c=>[c.id,c.acceptedForms[0]]))).complete,true);
 const historicTable=applyReview(emptyReview(),oldTables[0].id,false,1500);
 assert.equal(reviewCounts(historicTable,1500).practiced,1);
 assert.deepEqual(makeTableExercises(single,{language:'griego',unit:9,
  kind:'sustantivo',reviewMode:'errors',reviewState:historicTable,
  now:1500,limit:30,rng:fixed}),[]);
 assert.ok(historicTable.items[oldTables[0].id]);
});

test('Sintagmas con οὐρανός: solo singular, claves de tablas anteriores conservadas',()=>{
 const idSet=new Set(['griego-articulo','griego-sustantivo-ouranos',
  'griego-adj-agathos','griego-adj-barbaros','griego-adj-megas']);
 const records=bank.records.filter(r=>idSet.has(r.id));
 assert.equal(records.length,5,'Conservar artículo, un sustantivo y tres adjetivos');
 const current={...bank,records};
 const legacy={...bank,records:structuredClone(records)};
 delete legacy.records.find(r=>r.id==='griego-sustantivo-ouranos')
  .evidence.individualVerification.practiceExclusion;
 const choices={language:'griego',unit:9,limit:30,rng:()=>.4};
 const oldWritten=makeGreekNounPhraseQuestions(legacy,choices);
 const newWritten=makeGreekNounPhraseQuestions(current,choices);
 assert.equal(oldWritten.length,24);
 assert.equal(newWritten.length,12);
 assert.ok(newWritten.every(q=>q.prompt.includes(' singular.')&&
   oldWritten.some(x=>x.id===q.id)));
 const oldTables=makeGreekNounPhraseTables(legacy,choices);
 const newTables=makeGreekNounPhraseTables(current,choices);
 assert.equal(oldTables.length,3);
 assert.equal(newTables.length,3);
 for(const table of newTables){
  const previous=oldTables.find(t=>table.id===t.id+':singular');
  assert.ok(previous);
  assert.equal(previous.cells.length,8);
  assert.equal(table.cells.length,4);
  assert.ok(table.cells.every(c=>c.number==='singular'));
  assert.match(table.prompt,/singular\./);
  assert.equal(evaluateTable(table,Object.fromEntries(table.cells.map(c=>
   [c.id,c.acceptedForms[0]]))).complete,true);
 }
 const oldTableKey=oldTables[0].id;
 const state=applyReview(emptyReview(),oldTableKey,false,3000);
 assert.equal(reviewCounts(state,3000).practiced,1);
 assert.deepEqual(makeGreekNounPhraseTables(current,{...choices,
   reviewMode:'errors',reviewState:state,now:3000}),[]);
 assert.ok(state.items[oldTableKey]);
 // Los otros sustantivos siguen ofreciendo ambos números.
 const other=bank.records.find(x=>x.id==='griego-sustantivo-phobos');
 const ordinary={...bank,records:[...records.filter(r=>r.id!=='griego-sustantivo-ouranos'),other]};
 const otherTables=makeGreekNounPhraseTables(ordinary,{...choices,unit:10});
 assert.equal(otherTables.length,3);
 assert.ok(otherTables.every(t=>t.cells.length===8&&t.cells.some(c=>c.number==='plural')));
});
