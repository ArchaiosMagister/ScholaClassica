import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {compileLatin2} from '../scripts/morphology-latin2.mjs';
import {validateBank,makeQuestions,availableRecords,evaluate} from '../public/morfologia/engine.mjs';
import {makeWrittenQuestions,correctWritten,makeTableExercises,evaluateTable} from '../public/morfologia/written.mjs';

const root=resolve(import.meta.dirname,'..');
const bank=JSON.parse(readFileSync(join(root,'dist/apps/morfologia/data/paradigmas.json'),'utf8'));
const base=bank.records.slice(0,220);
const latin2=bank.records.filter(x=>x.language==='latin2');
const rng=()=>.41;
const only=r=>({...bank,records:[r]});

test('Latín II reutiliza formas documentadas sin unidades y sin mutar las 220 fichas anteriores',()=>{
  validateBank(bank);
  assert.deepEqual(bank.coverage.latin2,[0]);
  assert.ok(latin2.length>=60);
  assert.equal(bank.records.slice(220,296).length,compileLatin2(base).length);
  assert.deepEqual(bank.records.slice(220,296),compileLatin2(base));
  assert.deepEqual(bank.records.slice(0,220),base);
  assert.deepEqual(new Set(latin2.map(r=>r.kind)),
    new Set(['sustantivo','adjetivo','pronombre','verbo','participio','infinitivo']));
  assert.ok(latin2.every(r=>r.unit===0&&r.evidence.status==='paradigma-documentado'&&
    r.headword&&r.forms.every(f=>f.analysis.startsWith(r.kind+' · ')&&
      f.analysis.includes(' · '+r.headword+' · '))));
  assert.equal(availableRecords(bank,{language:'latin2',unit:0}).length,latin2.length);
  assert.throws(()=>availableRecords(bank,{language:'latin2',unit:1}),/todavía no disponible/);
});
test('El análisis de bonæ presenta la clase, grado, enunciado y TODAS las lecturas',()=>{
  const bonus=latin2.find(r=>r.id==='latin2-latin4-appendix-bonus');
  assert.ok(bonus);
  const q=makeQuestions(only(bonus),{language:'latin2',unit:0,activity:'analysis',limit:30,rng})
    .find(item=>item.form==='bonæ');
  assert.ok(q,'No aparece bonæ');
  assert.equal(q.headword,'bonus, bona, bonum');
  assert.match(q.correct,/adjetivo · grado positivo · bonus, bona, bonum · nominativo · femenino · plural/);
  assert.match(q.correct,/adjetivo · grado positivo · bonus, bona, bonum · genitivo · femenino · singular/);
  assert.match(q.correct,/dativo · femenino · singular/);
  assert.match(q.correct,/vocativo · femenino · plural/);
  assert.equal(q.options.length,4);
  assert.equal(evaluate(q,q.correct).correct,true);
});
test('Sustantivos: género único y declinación; adjetivos: grado y tipo',()=>{
  const noun=latin2.find(r=>r.id==='latin2-latin-ud7-res');
  assert.ok(noun);
  assert.ok(noun.forms.every(f=>f.analysis.startsWith('sustantivo · res, rei · ')&&
    f.analysis.includes(' · femenino · ')&&f.analysis.endsWith(' · 5.ª declinación')));
  const comparative=latin2.find(r=>r.id==='latin2-latin-ud9-comparativo');
  assert.ok(comparative);
  assert.ok(comparative.forms.every(f=>f.analysis.includes('adjetivo · grado comparativo · altior, altius')));
});
test('Pronombres: tipo, enunciado, caso, género y número',()=>{
  const relative=latin2.find(r=>r.id==='latin2-latin-ud6-relativo');
  assert.ok(relative);
  assert.ok(relative.forms.some(f=>f.analysis.includes('pronombre · relativo · qui, quæ, quod ·')));
  assert.ok(relative.forms.every(f=>f.case&&f.gender&&f.number&&f.analysis.includes(f.case+' · '+f.gender+' · '+f.number)));
});
test('Verbos: enunciado completo, persona, número, tiempo, modo, voz',()=>{
  const present=latin2.find(r=>r.paradigm==='amo, amavi, amatum (1.ª)'&&r.forms.some(f=>f.form==='amamus'));
  const passive=latin2.find(r=>r.paradigm==='amo, amavi, amatum (1.ª)'&&r.forms.some(f=>f.form==='amatur'));
  assert.ok(present&&passive);
  assert.match(present.forms.find(f=>f.form==='amamus').analysis,
    /verbo · amo, amavi, amatum \(1\.ª\) · 1\.ª persona · plural · presente · indicativo · voz activa/);
  assert.match(passive.forms.find(f=>f.form==='amatur').analysis,/3\.ª persona · singular · presente · indicativo · voz pasiva/);
  const sum=latin2.find(r=>r.paradigm==='sum, fui, — (irregular)'&&r.forms.some(f=>f.form==='sunt'));
  assert.ok(sum);
  assert.match(sum.forms.find(f=>f.form==='sunt').analysis,/voz activa$/);
});
test('Participios: enunciado verbal, tiempo y voz, y rasgos nominales documentados',()=>{
  for(const [id,tense,voice] of [
    ['latin2-latin-ud10-participio-presente','presente','activa'],
    ['latin2-latin-ud10-participio-perfecto','perfecto','pasiva']
  ]){
    const r=latin2.find(x=>x.id===id);
    assert.ok(r);
    assert.ok(r.forms.every(f=>f.analysis.startsWith('participio · amo, amavi, amatum (1.ª) · '+
      tense+' · voz '+voice+' · '+f.case+' · '+f.gender+' · '+f.number)));
  }
});
test('Infinitivos: dos voces del presente y tiempos compuestos solo cuando la fuente los documenta',()=>{
  const records=latin2.filter(r=>r.kind==='infinitivo');
  assert.ok(records.length>=5);
  for(const r of records){
    assert.ok(r.forms.length>=2);
    assert.ok(r.forms.every(f=>f.analysis.startsWith('infinitivo · '+r.headword+' · ')));
    const questions=makeQuestions(only(r),{language:'latin2',unit:0,activity:'analysis',limit:30,rng});
    assert.ok(questions.length>=2,'Sin preguntas de análisis: '+r.id);
    assert.ok(questions.every(q=>q.options.length===4&&
      new Set(q.options).size===4&&evaluate(q,q.correct).correct));
  }
  const amo=records.find(x=>x.headword.startsWith('amo,'));
  assert.equal(amo.forms.length,6);
  assert.ok(amo.forms.some(f=>f.analysis.includes('perfecto · voz pasiva')));
  const habere=records.find(x=>x.headword.startsWith('habeo,'));
  assert.equal(habere.forms.length,2);
});
test('Práctica escrita y tablas: aceptar variantes sin inventar la lectura sintáctica',()=>{
  const r=latin2.find(x=>x.id==='latin2-latin4-appendix-bonus');
  const qs=makeWrittenQuestions(only(r),{language:'latin2',unit:0,limit:30,rng});
  assert.ok(qs.length>0&&qs.every(q=>correctWritten(q,q.acceptedForms[0]).correct));
  const tables=makeTableExercises(only(r),{language:'latin2',unit:0,limit:10,rng});
  assert.equal(tables.length,3);
  assert.ok(tables.every(q=>evaluateTable(q,
    Object.fromEntries(q.cells.map(c=>[c.id,c.acceptedForms[0]]))).complete));
  for(const lang of ['latin','latin4','griego']){
    const question=makeQuestions(bank,{language:lang,unit:lang==='latin4'?3:5,
      activity:'analysis',limit:10,rng});
    assert.ok(question.length);
    assert.ok(question.every(q=>q.correct.startsWith(
      (q.correct.split(' · ')[0])+' · ')&&q.headword));
  }
});
