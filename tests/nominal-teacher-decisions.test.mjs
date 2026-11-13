import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {compileGreekNounExpansion} from '../scripts/greek-noun-bulk.mjs';
import {readGreekNounSource} from '../scripts/greek-noun-conciliation.mjs';
import {applyNominalTeacherDecisions} from '../scripts/nominal-teacher-decisions.mjs';
import {availableRecords,makeQuestions} from '../public/morfologia/engine.mjs';
import {makeWrittenQuestions,makeTableExercises,correctWritten}
  from '../public/morfologia/written.mjs';
import {greekNounPhrasePairs,makeGreekNounPhraseTables}
  from '../public/morfologia/greek-noun-phrases.mjs';

const root=resolve(import.meta.dirname,'..');
const read=p=>JSON.parse(readFileSync(join(root,p),'utf8'));
const bank=read('dist/apps/morfologia/data/paradigmas.json');
const curriculum=read('.sources/appendix/assets/curriculum.json');
const lock=read('config/sources.lock.json');
const manifest=read('config/nominal-teacher-decisions.json');
const source=await readGreekNounSource(join(root,'.sources/vocabula'));
const get=id=>bank.records.find(r=>r.id===id);
const scope=(r,cas,number)=>r.forms.filter(f=>f.case===cas&&f.number===number)
  .map(f=>f.form);
const otherGreek=compileGreekNounExpansion({
  curriculum,...source,vocabulaSha:lock.sources.vocabula.sha,
  existingRecords:bank.records.slice(84,92)
});
const baseline=bank.records.filter(r=>!r.id.includes('-sustantivo-decision-'))
  .map(record=>{
    if(['ἄνθρωπος','παῖς'].some(lemma=>record.paradigm.startsWith(lemma+',')))
      return otherGreek.records.find(x=>x.id===record.id);
    return record;
  });
const applied=applyNominalTeacherDecisions({
  records:baseline,curriculum,vocabulaData:source.vocabulaData,
  vocabulaSha:lock.sources.vocabula.sha,manifest
});
const date=(id)=>get('latin-sustantivo-decision-'+id);

test('las seis decisiones aprobadas se reproducen exactamente, sin cambiar importadores',()=>{
  assert.equal(manifest.status,'aprobado-por-docente');
  assert.equal(Object.keys(manifest.choices).length,6);
  assert.deepEqual(applied.approved,manifest.choices);
  assert.deepEqual(applied.records,bank.records);
  assert.equal(applied.added.length,4);
  assert.equal(applied.changed.length,2);
  assert.equal(applied.stagedAdjectives.length,1);
  assert.equal(new Set(bank.records.map(r=>r.id)).size,bank.records.length);
  const changed=structuredClone(manifest);
  changed.choices.pais='masculino-docente';
  assert.throws(()=>applyNominalTeacherDecisions({
    records:baseline,curriculum,vocabulaData:source.vocabulaData,
    vocabulaSha:lock.sources.vocabula.sha,manifest:changed}),/selección docente aprobada cambió/);
});

test('domus: las dos declinaciones y locativo están acreditados sin fusionar casos',()=>{
  const r=date('domus');
  assert.ok(r&&r.unit===7&&r.gender==='femenino');
  assert.deepEqual(scope(r,'genitivo','singular'),['domus','domi']);
  assert.deepEqual(scope(r,'dativo','singular'),['domui','domo']);
  assert.deepEqual(scope(r,'ablativo','singular'),['domo','domu']);
  assert.deepEqual(scope(r,'acusativo','plural'),['domos','domus']);
  assert.deepEqual(scope(r,'genitivo','plural'),['domuum','domorum']);
  assert.deepEqual(scope(r,'locativo','singular'),['domi','domui']);
  assert.ok(!r.forms.some(f=>f.case==='locativo'&&f.number==='plural'));
  assert.ok(r.evidence.restrictedVariants['genitivo:plural:domorum'].includes('poético'));
  assert.ok(!availableRecords(bank,{language:'latin',unit:6})
    .some(x=>x.id===r.id));
  const loc=makeWrittenQuestions({...bank,records:[r]},
    {language:'latin',unit:7,limit:50,rng:()=>.17})
    .find(q=>q.prompt==='Escribe la forma de locativo singular.');
  assert.ok(loc);
  assert.equal(correctWritten(loc,'domi').correct,true);
  assert.equal(correctWritten(loc,'domui').correct,true);
});

test('cantus solo tiene paradigma de cuarta y excluye las lecturas de segunda',()=>{
  const r=date('cantus');
  assert.ok(r&&r.unit===7&&r.gender==='masculino');
  assert.deepEqual(scope(r,'genitivo','singular'),['cantus']);
  assert.deepEqual(scope(r,'dativo','singular'),['cantui']);
  assert.deepEqual(scope(r,'genitivo','plural'),['cantuum']);
  assert.ok(!r.forms.some(f=>['canti','cante','cantis','cantorum','cantos'].includes(f.form)));
});

test('liber (libro) y liber (libre) tienen identidad y destino independientes',()=>{
  const r=date('liber');
  assert.ok(r&&r.unit===1&&r.gender==='masculino');
  assert.deepEqual(scope(r,'genitivo','singular'),['libri']);
  assert.deepEqual(scope(r,'nominativo','plural'),['libri']);
  assert.deepEqual(scope(r,'vocativo','singular'),['liber']);
  assert.ok(!r.forms.some(f=>f.form==='libera'||f.form==='liberum'));
  const adj=applied.stagedAdjectives[0];
  assert.equal(adj.kind,'adjetivo');
  assert.equal(adj.entry,'līber, lībera, līberum');
  assert.equal(adj.notForGrading,true);
  assert.ok(!bank.records.some(x=>x.id===adj.id));
  assert.equal(adj.teacherDecision,'guardar-ambos');
});

test('ἄνθρωπος es masculino en sintagmas, sin borrar el empleo femenino contextual',()=>{
  const r=bank.records.find(r=>r.paradigm.startsWith('ἄνθρωπος,'));
  assert.ok(r);
  assert.equal(r.gender,'masculino');
  assert.deepEqual(r.agreementGenders,['masculino']);
  assert.equal(r.evidence.teacherDecision,'masculino-docente');
  assert.match(r.evidence.notes,/femenino documentado/);
  const phrases=greekNounPhrasePairs(bank,{language:'griego',unit:5})
    .filter(p=>p.noun.id===r.id);
  assert.equal(phrases.length,3);
  assert.ok(phrases.every(p=>p.gender==='masculino'));
  const tables=makeGreekNounPhraseTables({...bank,
    records:bank.records.filter(x=>['griego-articulo','griego-adj-agathos',
      'griego-adj-barbaros','griego-adj-megas',r.id].includes(x.id))},
    {language:'griego',unit:5,limit:3,rng:()=>.3});
  assert.ok(tables.every(q=>q.cells.find(c=>c.id==='nominativo:singular')
    .acceptedForms.every(x=>x.startsWith('ὁ '))));
});

test('παῖς permite ambos géneros sin duplicar las formas nominales',()=>{
  const r=bank.records.find(r=>r.paradigm.startsWith('παῖς,'));
  assert.ok(r&&r.unit===8);
  assert.deepEqual(r.agreementGenders,['masculino','femenino']);
  assert.equal(r.evidence.teacherDecision,'ambos-generos');
  assert.ok(!r.gender);
  const pairs=greekNounPhrasePairs(bank,{language:'griego',unit:8})
    .filter(p=>p.noun.id===r.id);
  assert.equal(pairs.length,6);
  assert.equal(new Set(pairs.map(p=>p.id)).size,6);
  assert.equal(pairs.filter(p=>p.gender==='masculino').length,3);
  assert.equal(pairs.filter(p=>p.gender==='femenino').length,3);
  const subset={...bank,records:bank.records.filter(x=>
    ['griego-articulo','griego-adj-agathos','griego-adj-barbaros',
      'griego-adj-megas',r.id].includes(x.id))};
  const tables=makeGreekNounPhraseTables(subset,{language:'griego',unit:8,
    limit:30,rng:()=>.2});
  assert.equal(tables.length,6);
  const males=tables.filter(t=>t.gender==='masculino');
  const females=tables.filter(t=>t.gender==='femenino');
  assert.ok(males.every(t=>t.cells.find(c=>c.id==='nominativo:singular')
    .acceptedForms.some(f=>f.startsWith('ὁ '))));
  assert.ok(females.every(t=>t.cells.find(c=>c.id==='nominativo:singular')
    .acceptedForms.some(f=>f.startsWith('ἡ '))));
  assert.ok(!greekNounPhrasePairs(bank,{language:'griego',unit:7})
    .some(p=>p.noun.id===r.id));
});

test('Ἀθῆναι solo tiene cinco casos plurales áticos y nada en singular',()=>{
  const r=get('griego-sustantivo-decision-athenai');
  assert.ok(r&&r.unit===4&&r.gender==='femenino');
  assert.equal(r.evidence.numberScope,'plural');
  assert.deepEqual(r.forms.map(f=>f.case),
    ['nominativo','vocativo','acusativo','genitivo','dativo']);
  assert.deepEqual(r.forms.map(f=>f.number),Array(5).fill('plural'));
  assert.deepEqual(scope(r,'genitivo','plural'),['Ἀθηνῶν']);
  assert.deepEqual(scope(r,'dativo','plural'),['Ἀθήναις']);
  assert.deepEqual(scope(r,'acusativo','plural'),['Ἀθήνας']);
  assert.ok(!availableRecords(bank,{language:'griego',unit:3})
    .some(x=>x.id===r.id));
  const sub={...bank,records:[r]};
  const table=makeTableExercises(sub,{language:'griego',unit:4,limit:1,rng:()=>.2});
  assert.equal(table.length,1);
  assert.equal(table[0].cells.length,5);
  assert.ok(table[0].cells.every(c=>c.number==='plural'));
  const written=makeWrittenQuestions(sub,{language:'griego',unit:4,
    limit:10,rng:()=>.2});
  assert.ok(written.some(q=>q.prompt.includes('genitivo plural')));
  assert.ok(!written.some(q=>q.prompt.includes('singular')));
  const mc=makeQuestions(sub,{language:'griego',unit:4,
    kind:'sustantivo',activity:'analysis',limit:10,rng:()=>.2});
  assert.ok(mc.length>0);
  assert.ok(!greekNounPhrasePairs(bank,{language:'griego',unit:5})
    .some(p=>p.noun.id===r.id),'No inventar sintagmas singulares');
});
