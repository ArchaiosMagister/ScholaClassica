import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {compileCurricularGapBatch} from '../scripts/morphology-curricular-gaps.mjs';
import {validateBank,availableRecords,makeQuestions,evaluate}
  from '../public/morfologia/engine.mjs';
import {makeWrittenQuestions,correctWritten,makeTableExercises,evaluateTable}
  from '../public/morfologia/written.mjs';

const root=resolve(import.meta.dirname,'..');
const curriculum=JSON.parse(readFileSync(join(root,'.sources/appendix/assets/curriculum.json'),'utf8'));
const bank=JSON.parse(readFileSync(join(root,'dist/apps/morfologia/data/paradigmas.json'),'utf8'));
const batch=compileCurricularGapBatch(curriculum);
const get=id=>batch.find(r=>r.id===id);
const rng=()=>0.37;
const one=r=>({...bank,records:[r]});

test('9 nuevos paradigmas tienen procedencia comprobable; no cambian registros antiguos',()=>{
  validateBank(bank);
  assert.equal(batch.length,9);
  assert.deepEqual(bank.records.slice(-9),batch);
  assert.equal(new Set(batch.map(r=>r.id)).size,9);
  assert.equal(batch.filter(r=>r.language==='latin').length,6);
  assert.equal(batch.filter(r=>r.language==='griego').length,3);
  assert.ok(batch.every(r=>r.evidence.status==='paradigma-documentado'&&
    r.evidence.file==='assets/curriculum.json'&&r.evidence.unit===r.unit));
  assert.ok(bank.records.slice(0,220).every(r=>!get(r.id)));
  assert.ok(batch.every(r=>r.forms.every(f=>f.form&&f.analysis)));
});

test('Latín I UD1: puer conserva -e; ager tiene pérdida de -e, por tabla',()=>{
  for(const [id,nominative,genitive] of [
    ['latin-ud1-sustantivo-puer','puer','pueri'],
    ['latin-ud1-sustantivo-ager','ager','agri']
  ]){
    const r=get(id);
    assert.equal(r.unit,1);
    assert.equal(r.kind,'sustantivo');
    assert.equal(r.forms.length,12);
    assert.equal(r.forms.find(f=>f.case==='nominativo'&&f.number==='singular').form,
      nominative);
    assert.equal(r.forms.find(f=>f.case==='genitivo'&&f.number==='singular').form,
      genitive);
    assert.ok(!availableRecords(bank,{language:'latin',unit:1})
      .some(x=>x.id==='latin-ud2-adjetivo-bonus'));
    const tables=makeTableExercises(one(r),{language:'latin',unit:1,rng});
    assert.equal(tables.length,1);
    assert.ok(evaluateTable(tables[0],Object.fromEntries(
      tables[0].cells.map(c=>[c.id,c.acceptedForms[0]]))).complete);
  }
});

test('Latín I UD2: bonus tiene 36 casillas con género y seis casos',()=>{
  const r=get('latin-ud2-adjetivo-bonus');
  assert.equal(r.unit,2);assert.equal(r.kind,'adjetivo');
  assert.equal(r.forms.length,36);
  assert.equal(r.forms.find(f=>f.case==='vocativo'&&f.gender==='masculino'&&
    f.number==='singular').form,'bone');
  assert.equal(r.forms.find(f=>f.case==='ablativo'&&f.gender==='femenino'&&
    f.number==='singular').form,'bonā');
  const tables=makeTableExercises(one(r),{language:'latin',unit:2,limit:10,rng});
  assert.equal(tables.length,3);
  const q=makeQuestions(one(r),{language:'latin',unit:2,activity:'analysis',rng});
  assert.ok(q.length>0&&q.every(x=>evaluate(x,x.correct).correct));
  assert.ok(!availableRecords(bank,{language:'latin',unit:1})
    .some(x=>x.id===r.id));
});

test('Latín I UD3: personales sin género ni vocativo, genitivos plurales variantes',()=>{
  const r=get('latin-ud3-pronombres-personales');
  assert.equal(r.forms.length,22);
  assert.ok(r.forms.every(f=>f.case!=='vocativo'&&!f.gender));
  assert.deepEqual(r.forms.filter(f=>f.analysis==='genitivo · 1.ª persona · plural')
    .map(f=>f.form),['nostri','nostrum']);
  assert.deepEqual(r.forms.filter(f=>f.analysis==='genitivo · 2.ª persona · plural')
    .map(f=>f.form),['vestri','vestrum']);
  const q=makeWrittenQuestions(one(r),{
    language:'latin',unit:3,rng,limit:30
  }).find(x=>x.prompt.includes('genitivo · 1.ª persona · plural'));
  assert.ok(q);
  assert.ok(correctWritten(q,'nostri').correct);
  assert.ok(correctWritten(q,'nostrum').correct);
  assert.equal(makeTableExercises(one(r),{language:'latin',unit:3,rng}).length,0,
    'No se pueden mezclar personas en una tabla de casos sin encabezados');
});

test('Latín I UD3: imperativo de presente, cinco conjugaciones y 10 formas',()=>{
  const r=get('latin-ud3-imperativos');
  assert.equal(r.unit,3);assert.equal(r.forms.length,10);
  for(const [form,lemma,number] of [['ama','amo','singular'],
    ['amate','amo','plural'],['duc','duco','singular'],
    ['ducite','duco','plural'],['cape','capio','singular']]){
    assert.ok(r.forms.some(f=>f.form===form&&f.number===number&&
      f.analysis.includes(lemma)&&f.mood==='imperativo'),form);
  }
  assert.ok(!r.forms.some(f=>f.form==='duce'||f.form==='face'));
  const q=makeQuestions(one(r),{language:'latin',unit:3,activity:'analysis',rng,limit:10});
  assert.equal(q.length,10);
  assert.ok(q.every(x=>x.options.length===4&&evaluate(x,x.correct).correct));
});

test('Latín I UD5: is ea id y variantes no fuerzan un vocativo inexistente',()=>{
  const r=get('latin-ud5-forico-is');
  assert.equal(r.unit,5);
  assert.ok(r.forms.length>30);
  assert.ok(r.forms.every(f=>f.case!=='vocativo'));
  assert.deepEqual(r.forms.filter(f=>f.case==='nominativo'&&
    f.gender==='masculino'&&f.number==='plural').map(f=>f.form),['ei','ii']);
  const q=makeWrittenQuestions(one(r),{
    language:'latin',unit:5,limit:30,rng
  }).find(x=>x.prompt.includes('nominativo masculino plural'));
  assert.ok(q);
  assert.ok(correctWritten(q,'ei').correct);
  assert.ok(correctWritten(q,'ii').correct);
  assert.equal(makeTableExercises(one(r),{language:'latin',unit:5,rng}).length,3);
  assert.ok(!availableRecords(bank,{language:'latin',unit:4}).some(x=>x.id===r.id));
});

test('Griego I UD6: los cuatro infinitivos proceden del texto y no inventan tiempos',()=>{
  const r=get('griego-ud6-infinitivos-presentes');
  assert.equal(r.unit,6);assert.equal(r.kind,'infinitivo');
  assert.deepEqual(r.forms.map(f=>f.form),
    ['λύειν','λύεσθαι','ἐσθίειν','γίγνεσθαι']);
  assert.ok(r.forms.every(f=>f.tense==='presente'));
  assert.ok(!availableRecords(bank,{language:'griego',unit:5})
    .some(x=>x.id===r.id));
  for(const activity of ['analysis','form']){
    const qs=makeQuestions(one(r),{language:'griego',unit:6,activity,limit:10,rng});
    assert.equal(qs.length,4,activity);
    assert.ok(qs.every(q=>q.options.length===4&&evaluate(q,q.correct).correct));
  }
  const written=makeWrittenQuestions(one(r),{language:'griego',unit:6,limit:10,rng});
  assert.equal(written.length,4);
  assert.ok(written.every(q=>correctWritten(q,q.acceptedForms[0]).correct));
});

test('Griego I UD10: λύων y λυόμενος, cuatro casos, acentuación y ν móvil',()=>{
  const active=get('griego-ud10-lyo-participio-activo');
  const middle=get('griego-ud10-lyo-participio-medio-pasivo');
  assert.equal(active.unit,10);
  assert.equal(active.kind,'participio');
  assert.equal(active.forms.length,26);
  assert.equal(middle.forms.length,24);
  assert.ok(active.evidence.contrast.url.includes('greek-classroom-rome'));
  for(const [r,masc,fem,neut] of [
    [active,'λύων','λύουσα','λῦον'],
    [middle,'λυόμενος','λυομένη','λυόμενον']
  ]){
    assert.deepEqual(r.forms.filter(f=>f.case==='nominativo'&&f.number==='singular')
      .map(f=>f.form),[masc,fem,neut]);
    assert.ok(r.forms.every(f=>['nominativo','acusativo','genitivo','dativo']
      .includes(f.case)));
    const tables=makeTableExercises(one(r),{
      language:'griego',unit:10,limit:10,rng
    });
    assert.equal(tables.length,3);
    assert.ok(tables.every(q=>evaluateTable(q,
      Object.fromEntries(q.cells.map(c=>[c.id,c.acceptedForms[0]]))).complete));
  }
  assert.deepEqual(active.forms.filter(f=>f.case==='dativo'&&
    f.gender==='masculino'&&f.number==='plural').map(f=>f.form),
    ['λύουσι','λύουσιν']);
  const q=makeWrittenQuestions(one(active),{
    language:'griego',unit:10,limit:30,rng
  }).find(x=>x.prompt.includes('dativo masculino plural'));
  assert.ok(q);
  assert.ok(correctWritten(q,'λύουσι').correct);
  assert.ok(correctWritten(q,'λύουσιν').correct);
  assert.equal(correctWritten(q,'λυουσι').status,'orthography');
  assert.ok(!availableRecords(bank,{language:'griego',unit:9})
    .some(x=>x.id===active.id));
});

test('Las tandas con todas las categorías equilibran Latín I y Griego I',()=>{
  for(const [language,unit,kinds] of [
    ['latin',3,['sustantivo','adjetivo','pronombre','verbo']],
    ['griego',10,['desinencia','verbo','sustantivo','adjetivo','pronombre','infinitivo','participio']]
  ]){
    for(const activity of ['analysis','form']){
      const questions=makeQuestions(bank,{language,unit,activity,
        kind:'todos',limit:20,rng});
      const present=new Set(questions.map(x=>x.kind));
      assert.ok(present.size>=Math.min(kinds.length,4),
        language+' '+activity+' concentró la tanda');
      assert.ok(questions.every(q=>q.evidence&&evaluate(q,q.correct).correct));
    }
    const written=makeWrittenQuestions(bank,{language,unit,kind:'todos',
      limit:20,rng});
    assert.ok(new Set(written.map(q=>q.kind)).size>=4);
  }
});
