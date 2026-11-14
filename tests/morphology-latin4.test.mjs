import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {compileLatin4} from '../scripts/morphology-latin4.mjs';
import {availableRecords,validateBank,makeQuestions,evaluate} from '../public/morfologia/engine.mjs';
import {makeWrittenQuestions,correctWritten,makeTableExercises,evaluateTable} from '../public/morfologia/written.mjs';
import {phrasePairs,makePhraseQuestions,makePhraseTables} from '../public/morfologia/sintagmas.mjs';

const root=resolve(import.meta.dirname,'..');
const read=(file)=>readFileSync(join(root,file),'utf8');
const lock=JSON.parse(read('config/sources.lock.json'));
const bank=JSON.parse(read('dist/apps/morfologia/data/paradigmas.json'));
const latin4=compileLatin4({
  baseRecords:bank.records.filter(x=>x.language==='latin'),
  teacherParadigmsJs:read('.sources/vocabula/gramatica-paradigmas.js'),
  teacherImperfectsJs:read('.sources/vocabula/gramatica-latin-imperfectos.js'),
  syllabusJs:read('.sources/vocabula/gramatica-contenidos.js'),
  latinAdjectivesHtml:read('.sources/appendix/adjetivos.html'),
  vocabulaSha:lock.sources.vocabula.sha
});
const rng=()=>.42;

test('Latín 4.º: compilación reproducible, ocho unidades y 76 modelos aislados',()=>{
  validateBank(bank);
  assert.ok(bank.records.length>220);
  assert.deepEqual(bank.coverage.latin4,[1,2,3,4,5,6,7,8]);
  assert.deepEqual(bank.records.slice(144,220),latin4);
  assert.equal(latin4.length,76);
  assert.deepEqual(Array.from({length:8},(_,i)=>latin4.filter(r=>r.unit===i+1).length),
    [2,11,2,17,6,19,12,7]);
  assert.equal(new Set(bank.records.map(r=>r.id)).size,bank.records.length);
  assert.ok(latin4.every(r=>r.language==='latin4'&&
    r.evidence.status==='paradigma-documentado'&&r.forms.every(f=>f.form&&f.analysis)));
  assert.equal(bank.vocabulaSha,lock.sources.vocabula.sha);
  assert.equal(bank.appendixSha,lock.sources.appendix.sha);
});
test('Las formas de UD2/4/5/6/7/8 se desbloquean sin adelantar contenidos',()=>{
  const at=unit=>availableRecords(bank,{language:'latin4',unit});
  const u1=at(1),u2=at(2),u3=at(3),u4=at(4),u5=at(5),u6=at(6),u7=at(7),u8=at(8);
  assert.equal(u1.length,2);
  assert.ok(u1.every(r=>r.kind==='sustantivo'));
  assert.ok(u2.some(r=>r.paradigm.includes('presente activo')));
  assert.ok(u3.some(r=>r.id==='latin4-appendix-bonus'));
  assert.ok(!u3.some(r=>r.paradigm.includes('imperfecto')));
  assert.ok(u4.some(r=>r.paradigm.includes('imperfecto')));
  assert.ok(!u4.some(r=>r.paradigm.startsWith('rex')));
  assert.ok(u5.some(r=>r.paradigm.startsWith('rex')));
  assert.ok(u6.some(r=>r.paradigm.includes('perfecto activo')));
  assert.ok(u6.some(r=>r.paradigm.includes('presente pasivo')));
  assert.ok(!u6.some(r=>r.paradigm.includes('pluscuamperfecto')));
  assert.ok(u7.some(r=>r.paradigm.includes('pluscuamperfecto')));
  assert.ok(u7.some(r=>r.paradigm.startsWith('brevis')));
  assert.ok(!u7.some(r=>r.paradigm.startsWith('exercitus')));
  assert.ok(u8.some(r=>r.paradigm.startsWith('exercitus')));
  assert.ok(u8.some(r=>r.id==='latin4-docente-lat-ego'));
  assert.ok(u8.some(r=>r.id==='latin4-docente-lat-tu'));
  assert.throws(()=>at(9),/todavía no disponible/);
  assert.throws(()=>availableRecords(bank,{language:'latin4',unit:0}),/todavía no disponible/);
});
test('El modelo bonus del Appendix es íntegro; el bonus docente parcial no se completa por analogía',()=>{
  const bonus=latin4.find(r=>r.id==='latin4-appendix-bonus');
  assert.equal(bonus.forms.length,36);
  assert.equal(bonus.forms.find(f=>f.analysis==='vocativo masculino singular').form,'bone');
  assert.equal(bonus.forms.find(f=>f.analysis==='genitivo femenino plural').form,'bonarum');
  assert.equal(bonus.forms.find(f=>f.analysis==='ablativo femenino singular').form,'bonā');
  const partial=latin4.find(r=>r.id==='latin4-docente-lat-bonus');
  assert.equal(partial.forms.length,15);
  assert.ok(!makeTableExercises({...bank,records:[partial]},
    {language:'latin4',unit:3,limit:10,rng}).length);
  const tables=makeTableExercises({...bank,records:[bonus]},
    {language:'latin4',unit:3,limit:10,rng});
  assert.equal(tables.length,3);
  assert.ok(tables.every(x=>x.cells.length===12));
});
test('Pronombres de UD8: dos genitivos plurales correctos, sin inventar formas',()=>{
  const ego=latin4.find(r=>r.id==='latin4-docente-lat-ego');
  const gen=ego.forms.filter(f=>f.case==='genitivo'&&f.number==='plural');
  assert.deepEqual(gen.map(f=>f.form),['nostri','nostrum']);
  const written=makeWrittenQuestions({...bank,records:[ego]},
    {language:'latin4',unit:8,limit:30,rng});
  const question=written.find(q=>q.prompt.includes('genitivo plural'));
  assert.deepEqual(question.acceptedForms,['nostri','nostrum']);
  assert.equal(correctWritten(question,'nostrum').correct,true);
  assert.equal(correctWritten(question,'nostri').correct,true);
});
test('Las seis conjugaciones de presente y los imperfectos documentados se practican sin reglas nuevas',()=>{
  const present=latin4.filter(r=>r.unit===2&&r.kind==='verbo');
  const imperfect=latin4.filter(r=>r.unit===4&&r.kind==='verbo');
  assert.equal(present.length,7);
  assert.equal(imperfect.length,17);
  assert.ok(imperfect.some(r=>r.paradigm.startsWith('audio')&&
    r.forms.some(f=>f.form==='audiebam')));
  assert.ok(imperfect.some(r=>r.paradigm.startsWith('capio')&&
    r.forms.some(f=>f.form==='capiebant')));
  for(const unit of [1,2,3,4,5,6,7,8]){
    const q=makeQuestions(bank,{language:'latin4',unit,activity:'form',rng,limit:10});
    assert.ok(q.length>0,'Sin reconocimiento en UD'+unit);
    assert.ok(q.every(x=>evaluate(x,x.correct).correct));
    const written=makeWrittenQuestions(bank,{language:'latin4',unit,limit:10,rng});
    assert.ok(written.length>0,'Sin escritura en UD'+unit);
    assert.ok(written.every(x=>correctWritten(x,x.acceptedForms[0]).correct));
  }
});
test('Desde UD3 hay sintagmas de 4.º solo si ambas flexiones están completas',()=>{
  assert.throws(()=>phrasePairs(bank,{language:'latin4',unit:2}),/solo está disponible desde UD3/);
  const pairs=phrasePairs(bank,{language:'latin4',unit:3});
  assert.ok(pairs.length>=3);
  assert.ok(pairs.every(x=>x.adjective.id==='latin4-appendix-bonus'));
  assert.ok(pairs.some(x=>x.noun.paradigm==='puella'));
  const cards=makePhraseQuestions(bank,{language:'latin4',unit:3,limit:10,rng});
  assert.equal(cards.length,10);
  assert.ok(cards.every(q=>correctWritten(q,q.acceptedForms[0]).correct));
  const tables=makePhraseTables(bank,{language:'latin4',unit:3,limit:10,rng});
  assert.ok(tables.length>0);
  assert.ok(tables.every(q=>evaluateTable(q,
    Object.fromEntries(q.cells.map(c=>[c.id,c.acceptedForms[0]]))).complete));
  assert.ok(phrasePairs(bank,{language:'latin4',unit:8}).length>pairs.length);
});
test('Fuentes cambiadas abortan la compilación y no contaminan Latín I o Griego I',()=>{
  const args={
    baseRecords:bank.records.filter(r=>r.language==='latin'),
    teacherParadigmsJs:read('.sources/vocabula/gramatica-paradigmas.js'),
    teacherImperfectsJs:read('.sources/vocabula/gramatica-latin-imperfectos.js'),
    syllabusJs:read('.sources/vocabula/gramatica-contenidos.js'),
    latinAdjectivesHtml:read('.sources/appendix/adjetivos.html'),
    vocabulaSha:lock.sources.vocabula.sha
  };
  assert.throws(()=>compileLatin4({...args,
    latinAdjectivesHtml:args.latinAdjectivesHtml.replace(
      'Adjetivos de la primera clase · <i lang="la">bonus</i>',
      'Adjetivos de primera clase SIN REVISAR · <i lang="la">bonus</i>')}),/paradigma de bonus/);
  assert.throws(()=>compileLatin4({...args,teacherImperfectsJs:'window.GRAMMAR_PARADIGMS=[];'}),
    /cambió de formato/);
  assert.equal(bank.records.filter(r=>!['latin4','latin2'].includes(r.language)).length,
    144+9+19,'El banco anterior permanece intacto y se anexan los dos lotes curriculares');
  assert.ok(bank.records.filter(r=>r.language==='latin').every(r=>r.unit<=10));
  assert.ok(bank.records.filter(r=>r.language==='griego').every(r=>r.unit<=14));
});
