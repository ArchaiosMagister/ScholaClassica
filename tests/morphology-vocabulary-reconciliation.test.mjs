import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {compileGreekExigibleNounBatch} from '../scripts/greek-noun-conciliation.mjs';
import {parseVocabularySource,classifyVocabularyUnit,reconcileVocabulary,
  auditPracticeCoverage,createTeacherAudit}
  from '../scripts/audit-morphology-vocabulary.mjs';
import {availableRecords,makeQuestions,evaluate}
  from '../public/morfologia/engine.mjs';
import {makeWrittenQuestions,makeTableExercises,correctWritten,evaluateTable}
  from '../public/morfologia/written.mjs';
import {greekNounPhrasePairs}
  from '../public/morfologia/greek-noun-phrases.mjs';
const root=resolve(import.meta.dirname,'..');
const lock=JSON.parse(readFileSync(join(root,'config/sources.lock.json'),'utf8'));
const bank=JSON.parse(readFileSync(join(root,'dist/apps/morfologia/data/paradigmas.json'),'utf8'));
const vocabulary=parseVocabularySource(readFileSync(join(root,
  '.sources/vocabula/data.js'),'utf8'));
const curriculum=JSON.parse(readFileSync(join(root,
  '.sources/appendix/assets/curriculum.json'),'utf8'));
const unmorph=Array.from({length:8},(_,i)=>JSON.parse(readFileSync(join(root,
  '.sources/vocabula/data/unimorph-syllabus/grc/part-0'+i+'.json'),'utf8')));
const find=id=>bank.records.find(r=>r.id===id);
const rng=()=>.39;
const only=r=>({...bank,records:[r]});

test('No convertir los bloques UD1–4, UD6–7 y UD9–10 en unidades arbitrarias',()=>{
  assert.deepEqual(classifyVocabularyUnit('UD 1–4'),
    {group:'UD 1–4',type:'block',start:1,end:4});
  assert.deepEqual(classifyVocabularyUnit('UD 6–7'),
    {group:'UD 6–7',type:'block',start:6,end:7});
  assert.deepEqual(classifyVocabularyUnit('UD 9–10'),
    {group:'UD 9–10',type:'block',start:9,end:10});
  assert.deepEqual(classifyVocabularyUnit('UD 5'),
    {group:'UD 5',type:'unit',start:5,end:5});
  assert.equal(classifyVocabularyUnit('Palabras básicas').type,'transversal');
  assert.equal(classifyVocabularyUnit('Preposiciones').type,'transversal');
  assert.equal(classifyVocabularyUnit('Sin unidad acreditada').type,'unaccredited');
  assert.throws(()=>classifyVocabularyUnit('UD 10–2'),/malformada/);
  assert.throws(()=>parseVocabularySource('window.VOCAB=[{}]'),/Vocabula|VOCAB|formato/);
});

test('Vocabula general no equivale a exigible; ninguna etiqueta ajena altera el currículo',()=>{
  const report=reconcileVocabulary(bank,vocabulary,lock.sources.vocabula.sha);
  assert.equal(report.schema,'schola-curriculum-vocabulary-audit/v1');
  assert.equal(report.courses.latin.vocabularyTotal,856);
  assert.equal(report.courses.latin.examTotal,115);
  assert.equal(report.courses.griego.vocabularyTotal,503);
  assert.equal(report.courses.griego.examTotal,171);
  assert.equal(report.unaccredited.filter(x=>x.course==='griego').length,184);
  assert.equal(report.unaccredited.filter(x=>x.course==='griego'&&
    vocabulary.find(v=>v.id===x.id)?.mode!=='general').length,0);
  assert.equal(report.outsideCurriculum.filter(x=>x.course==='latin').length,140);
  assert.ok(report.outsideCurriculum.every(x=>x.groups.includes('UD 11–12')));
  assert.equal(bank.coverage.latin.at(-1),10);
  assert.equal(bank.coverage.griego.at(-1),14);
  assert.ok(!report.assignments.some(x=>
    x.groups.includes('Sin unidad acreditada')));
});

test('Concordancia docente: palabra y enunciado, grupo original y primera unidad segura',()=>{
  const r=reconcileVocabulary(bank,vocabulary,lock.sources.vocabula.sha);
  for(const [lemma,unit,group] of [
    ['ἀρχή',5,'UD 5'],['στρατηγός',5,'UD 5'],
    ['ἐπιστολή',7,'UD 6–7'],['κεφαλή',7,'UD 6–7'],
    ['μάχη',7,'UD 6–7'],['πέτρα',7,'UD 6–7'],
    ['οὐρανός',9,'UD 9'],['ὅπλον',10,'UD 10'],['φόβος',10,'UD 10']
  ]){
    const x=r.assignments.find(a=>a.course==='griego'&&
      a.lemma.normalize('NFC')===lemma.normalize('NFC'));
    assert.ok(x,'Vocabulario exigible no conciliado: '+lemma);
    assert.equal(x.firstGuaranteed,unit,lemma);
    assert.ok(x.groups.includes(group));
    assert.equal(x.status,'model-present',lemma);
    assert.ok(x.unlockedUnits.includes(unit),lemma);
  }
  const anthropos=r.assignments.find(x=>x.course==='griego'&&x.lemma==='ἄνθρωπος');
  assert.ok(anthropos);
  assert.equal(anthropos.firstGuaranteed,4,'Vocabulario etiquetado por bloque UD1–4');
  assert.ok(anthropos.unlockedUnits.includes(1),
    'El ejemplo gramatical puede introducirse antes de ser exigible como bloque');
});

test('Nueve sustantivos nuevos, género y diez casillas cotejados sin formas deducidas',()=>{
  const names=['arche','strategos','epistole','kephale','mache','petra',
    'ouranos','hoplon','phobos'];
  const records=compileGreekExigibleNounBatch({curriculum,
    vocabulaData:readFileSync(join(root,'.sources/vocabula/data.js'),'utf8'),
    unimorphParts:unmorph,vocabulaSha:lock.sources.vocabula.sha});
  assert.deepEqual(records.map(x=>x.id),
    names.map(id=>'griego-sustantivo-'+id));
  assert.deepEqual(bank.records.slice(-9),records,
    'Las nueve fichas quedan anexadas al final sin desplazar otras');
  assert.equal(bank.records.filter(x=>x.language==='griego').length,92);
  assert.equal(bank.records.filter(x=>x.language==='latin').length,89);
  for(const r of records){
    assert.equal(r.forms.length,10);
    assert.equal(new Set(r.forms.map(f=>f.case+':'+f.number)).size,10);
    assert.ok(['masculino','femenino','neutro'].includes(r.gender));
    assert.equal(r.evidence.vocabulaSha,lock.sources.vocabula.sha);
    assert.ok(r.evidence.review.includes('pendiente de revisión docente individual'));
    assert.equal(r.evidence.status,'paradigma-documentado');
    const written=makeWrittenQuestions(only(r),
      {language:'griego',unit:r.unit,limit:30,rng});
    assert.ok(written.length>=8);
    assert.ok(written.every(q=>correctWritten(q,q.acceptedForms[0]).correct));
    const decl=makeTableExercises(only(r),{language:'griego',unit:r.unit,rng});
    assert.equal(decl.length,1);
    assert.equal(evaluateTable(decl[0],Object.fromEntries(
      decl[0].cells.map(x=>[x.id,x.acceptedForms[0]]))).complete,true);
    const q=makeQuestions(only(r),
      {language:'griego',unit:r.unit,activity:'analysis',rng});
    // El sincretismo puede reducir las grafías distintas, sobre todo en neutros.
    assert.ok(q.length>=5&&q.every(x=>evaluate(x,x.correct).correct));
    assert.ok(!availableRecords(bank,{language:'griego',unit:r.unit-1})
      .some(x=>x.id===r.id),'Palabra adelantada antes del grupo exigible');
  }
  assert.equal(find('griego-sustantivo-anthropos').gender,'común');
  assert.equal(greekNounPhrasePairs(bank,{language:'griego',unit:10}).length,69);
  assert.ok(!greekNounPhrasePairs(bank,{language:'griego',unit:10})
    .some(x=>x.noun.id==='griego-sustantivo-anthropos'));
});

test('Reflexivo se/sui/sibi: selección de forma viable con solo tres opciones reales',()=>{
  const r=find('latin-ud5-reflexivo-sui');
  assert.ok(r);
  const qs=makeQuestions(only(r),{
    language:'latin',unit:5,kind:'pronombre',activity:'form',limit:30,rng
  });
  assert.equal(qs.length,4);
  const forms=new Set(['se','sui','sibi']);
  for(const q of qs){
    assert.equal(q.options.length,3);
    assert.deepEqual(new Set(q.options),forms);
    assert.equal(evaluate(q,q.correct).correct,true);
    assert.ok(q.options.every(form=>forms.has(form)),
      'No se introducen formas inventadas para completar cuatro botones');
  }
  assert.ok(qs.every(q=>!q.prompt.includes('nominativo')));
});

test('La auditoría de modalidades separa tablas improcedentes y fichas nunca evaluadas',()=>{
  const a=auditPracticeCoverage(bank);
  assert.equal(a.latin.available,89);
  assert.equal(a.griego.available,92);
  assert.deepEqual(a.latin.noForm,[]);
  assert.deepEqual(a.griego.noForm,[]);
  assert.deepEqual(a.latin.noAnalysis,[]);
  assert.deepEqual(a.griego.noAnalysis,[]);
  assert.deepEqual(a.latin.noWritten,[]);
  assert.deepEqual(a.griego.noWritten,[]);
  assert.ok(a.latin.noTable.some(x=>x.kind==='verbo'),
    'La ausencia de tabla verbal nominal no constituye una incidencia');
  assert.ok(a.griego.noTable.some(x=>x.kind==='infinitivo'));
  assert.equal(a.latin.byUnit.at(-1).cumulative,89);
  assert.equal(a.griego.byUnit.at(-1).cumulative,92);
  const full=createTeacherAudit(bank,vocabulary,lock.sources.vocabula.sha);
  assert.equal(full.concordance.courses.griego.records,92);
  assert.equal(full.practice.griego.available,92);
});
