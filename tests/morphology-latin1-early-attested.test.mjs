import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {
  compileLatin1EarlyAttested,LATIN1_EARLY_IDS,
  EARLY_LATIN1_INFINITIVES,EARLY_LATIN1_LOCATIVES
} from '../scripts/morphology-latin1-early-attested.mjs';
import {
  validateBank,availableRecords,makeQuestions,evaluate
} from '../public/morfologia/engine.mjs';
import {
  makeWrittenQuestions,makeTableExercises,correctWritten
} from '../public/morfologia/written.mjs';

const root=resolve(import.meta.dirname,'..');
const curriculum=JSON.parse(readFileSync(join(root,'.sources/appendix/assets/curriculum.json'),'utf8'));
const bank=JSON.parse(readFileSync(join(root,'dist/apps/morfologia/data/paradigmas.json'),'utf8'));
const rng=()=>0.371;
const batch=compileLatin1EarlyAttested(curriculum);
const [infinitives,locatives]=batch;
const alone=record=>({...bank,records:[record]});

test('Los dos bloques son copia de diez ejemplos literales del Appendix, sin analogía',()=>{
  validateBank(bank);
  assert.deepEqual(batch.map(x=>x.id),[LATIN1_EARLY_IDS.infinitives,LATIN1_EARLY_IDS.locatives]);
  assert.deepEqual(batch.map(x=>x.unit),[1,2]);
  assert.deepEqual(infinitives.forms.map(x=>x.form),
    EARLY_LATIN1_INFINITIVES.map(x=>x[0]));
  assert.deepEqual(locatives.forms.map(x=>x.form),
    EARLY_LATIN1_LOCATIVES.map(x=>x[0]));
  assert.deepEqual(locatives.forms.map(x=>x.meaning),
    EARLY_LATIN1_LOCATIVES.map(x=>x[1]));
  assert.ok(infinitives.forms.every(x=>x.tense==='presente'&&x.voice==='activa'));
  assert.ok(locatives.forms.every(x=>x.case==='locativo'&&x.number==='singular'));
  assert.equal(locatives.evidence.practiceScope,'recognition-only');
  assert.deepEqual(bank.records.slice(-2),batch,
    'Las dos nuevas fichas han de ANEXARSE sin desplazar ningún ID ni posición previa');
  assert.equal(bank.records.filter(x=>x.language==='latin').length,94);
  assert.equal(bank.records.filter(x=>x.language==='latin'&&
    !Object.values(LATIN1_EARLY_IDS).includes(x.id)).length,92);
  assert.equal(bank.records.filter(x=>x.language==='latin4').length,76);
  assert.equal(bank.records.filter(x=>x.language==='griego').length,94);
  assert.equal(bank.records.filter(x=>x.language==='latin2').length,500);
  assert.equal(new Set(bank.records.map(x=>x.id)).size,bank.records.length);
});
test('UD1: cinco infinitivos distintos, sin pasivos ni compuestos y con respuesta escrita',()=>{
  const qBank=alone(infinitives);
  assert.deepEqual(infinitives.forms.map(x=>x.form),
    ['amare','habere','ducere','audire','capere']);
  for(const activity of ['analysis','form']){
    const questions=makeQuestions(qBank,{
      language:'latin',unit:1,kind:'infinitivo',activity,limit:10,rng
    });
    assert.equal(questions.length,5,activity);
    assert.ok(questions.every(q=>q.options.length===4&&
      new Set(q.options).size===4&&evaluate(q,q.correct).correct));
    assert.equal(new Set(questions.map(q=>q.id)).size,5);
    assert.ok(questions.every(q=>q.evidence.unit===1));
  }
  const written=makeWrittenQuestions(qBank,{
    language:'latin',unit:1,kind:'infinitivo',limit:10,rng
  });
  assert.equal(written.length,5);
  assert.ok(written.every(q=>correctWritten(q,q.correct).correct));
  assert.equal(makeTableExercises(qBank,{language:'latin',unit:1}).length,0);
});
test('UD2: reconocimiento de locativos reales sin producción ni tabla fingida',()=>{
  const qBank=alone(locatives);
  const questions=makeQuestions(qBank,{language:'latin',unit:2,
    kind:'sustantivo',activity:'analysis',limit:10,rng});
  assert.equal(questions.length,5);
  assert.deepEqual(new Set(questions.map(q=>q.form)),
    new Set(['Corinthi','Romæ','domi','humi','ruri']));
  assert.ok(questions.every(q=>q.correct.includes('valor locativo')&&
    q.options.length===4&&new Set(q.options).size===4&&
    evaluate(q,q.correct).correct));
  assert.equal(makeQuestions(qBank,{language:'latin',unit:2,
    kind:'sustantivo',activity:'form',limit:10,rng}).length,0);
  assert.equal(makeWrittenQuestions(qBank,{language:'latin',unit:2,
    kind:'sustantivo',limit:10,rng}).length,0);
  assert.equal(makeTableExercises(qBank,{language:'latin',unit:2,
    kind:'sustantivo',limit:10,rng}).length,0);
});
test('La selección acumulativa protege unidades y paradigmas ya existentes',()=>{
  const l1=availableRecords(bank,{language:'latin',unit:1});
  const l2=availableRecords(bank,{language:'latin',unit:2});
  assert.ok(l1.some(r=>r.id===LATIN1_EARLY_IDS.infinitives));
  assert.ok(!l1.some(r=>r.id===LATIN1_EARLY_IDS.locatives));
  assert.ok(l2.some(r=>r.id===LATIN1_EARLY_IDS.locatives));
  assert.equal(l1.length,13);
  assert.equal(l2.length,21);
  assert.ok(bank.records.filter(r=>r.language==='latin4'||r.language==='griego')
    .every(r=>!Object.values(LATIN1_EARLY_IDS).includes(r.id)));
});
test('El compilador rechaza una fuente que deje de incluir cualquiera de los ejemplos',()=>{
  const lostInf=structuredClone(curriculum);
  const topic=lostInf.latin.units[0].topics.find(x=>x.title==='Infinitivo de presente activo');
  topic.html=topic.html.replace('ducere','');
  assert.throws(()=>compileLatin1EarlyAttested(lostInf),/dej[oó] de documentar.*ducere/iu);
  const lostLoc=structuredClone(curriculum);
  const loc=lostLoc.latin.units[1].topics.find(x=>x.title==='El locativo');
  loc.html=loc.html.replace('ruri','');
  assert.throws(()=>compileLatin1EarlyAttested(lostLoc),/dej[oó] de documentar.*ruri/iu);
});
test('Las políticas de reconocimiento y la aridad de cinco formas son restrictivas',()=>{
  const changed=structuredClone(bank);
  changed.records.find(r=>r.id===LATIN1_EARLY_IDS.locatives)
    .evidence.practiceScope='all';
  assert.throws(()=>validateBank(changed),/Alcance de ejercicios no documentado|Ficha sin documentación/);
  const extra=structuredClone(bank);
  extra.records.find(r=>r.id===LATIN1_EARLY_IDS.locatives)
    .forms.push({...locatives.forms[0],form:'Romae-nueva'});
  assert.throws(()=>validateBank(extra),/Locativo no productivo/);
  const removed=structuredClone(bank);
  removed.records.find(r=>r.id===LATIN1_EARLY_IDS.infinitives)
    .forms.pop();
  assert.throws(()=>validateBank(removed),/Ficha sin documentación/);
});
