import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {compileLatinCurricularFollowup}
  from '../scripts/morphology-curricular-followup.mjs';
import {compileGreekEarlyNounBatch,readGreekNounSource}
  from '../scripts/greek-noun-conciliation.mjs';
import {validateBank,availableRecords,makeQuestions,evaluate}
  from '../public/morfologia/engine.mjs';
import {makeWrittenQuestions,makeTableExercises,correctWritten,evaluateTable}
  from '../public/morfologia/written.mjs';
const root=resolve(import.meta.dirname,'..');
const curriculum=JSON.parse(readFileSync(join(root,'.sources/appendix/assets/curriculum.json'),'utf8'));
const bank=JSON.parse(readFileSync(join(root,'dist/apps/morfologia/data/paradigmas.json'),'utf8'));
const source=JSON.parse(readFileSync(join(root,'config/sources.lock.json'),'utf8'));
const extras=bank.records.slice(-28,-9);
const latin=extras.filter(r=>r.language==='latin');
const greek=extras.filter(r=>r.language==='griego');
const find=id=>bank.records.find(r=>r.id===id);
const rng=()=>.371;
const only=r=>({...bank,records:[r]});

test('Segundo lote: 19 fichas nuevas, fuentes explícitas y las anteriores sin desplazar',()=>{
  validateBank(bank);
  assert.equal(extras.length,19);
  assert.equal(latin.length,12);
  assert.equal(greek.length,7);
  assert.equal(new Set(extras.map(r=>r.id)).size,19);
  assert.ok(extras.every(r=>r.evidence.status==='paradigma-documentado'));
  assert.deepEqual(bank.records.slice(-28,-16),
    compileLatinCurricularFollowup(curriculum,bank.records.slice(0,-28)));
  assert.ok(extras.every(r=>!bank.records.slice(0,-28).some(old=>old.id===r.id)));

  assert.equal(bank.records.filter(r=>r.language==='latin2').length,500,
    'Latín II y su verificación permanecen intactos');
  assert.equal(bank.records.filter(r=>r.language==='latin').length,89);
  assert.equal(bank.records.filter(r=>r.language==='griego').length,92);
});

test('Reflexivo: solo cuatro casos, mismo valor para singular/plural y sin género',()=>{
  const r=find('latin-ud5-reflexivo-sui');
  assert.equal(r.unit,5);
  assert.equal(r.forms.length,4);
  assert.deepEqual(r.forms.map(f=>f.form),['se','sui','sibi','se']);
  assert.deepEqual(r.forms.map(f=>f.case),
    ['acusativo','genitivo','dativo','ablativo']);
  assert.ok(r.forms.every(f=>f.number==='singular o plural'&&!f.gender));
  assert.ok(!availableRecords(bank,{language:'latin',unit:4}).some(x=>x.id===r.id));
  const analysis=makeQuestions(only(r),{language:'latin',unit:5,
    kind:'pronombre',activity:'analysis',limit:10,rng});
  assert.equal(analysis.length,3,'Tres grafías, se con acusativo y ablativo');
  assert.ok(analysis.find(q=>q.form==='se')?.correct.includes(' / '));
  assert.ok(analysis.every(q=>q.options.length===4&&evaluate(q,q.correct).correct));
  const written=makeWrittenQuestions(only(r),{language:'latin',unit:5,limit:10,rng});
  assert.equal(written.length,4);
  assert.ok(written.every(q=>correctWritten(q,q.acceptedForms[0]).correct));
  assert.equal(makeTableExercises(only(r),{language:'latin',unit:5,rng}).length,0,
    'No se puede confundir número ni atribuir género al reflexivo');
});

test('Deponentes: cinco conjugaciones, seis personas, solo presente de indicativo',()=>{
  const cases=[
    ['hortor',['hortor','hortaris','hortatur','hortamur','hortamini','hortantur']],
    ['vereor',['vereor','vereris','veretur','veremur','veremini','verentur']],
    ['sequor',['sequor','sequeris','sequitur','sequimur','sequimini','sequuntur']],
    ['patior',['patior','pateris','patitur','patimur','patimini','patiuntur']],
    ['orior',['orior','oriris','oritur','orimur','orimini','oriuntur']]
  ];
  for(const [lemma,forms] of cases){
    const r=find('latin-ud7-deponente-'+lemma);
    assert.ok(r&&r.kind==='verbo'&&r.unit===7,lemma);
    assert.deepEqual(r.forms.map(f=>f.form),forms);
    assert.ok(r.forms.every(f=>f.tense==='presente'&&f.mood==='indicativo'&&
      f.voice.includes('deponente')&&f.analysis.includes('sentido activo')));
    assert.ok(r.evidence.contrastSources.length>=2);
    assert.ok(!availableRecords(bank,{language:'latin',unit:6}).some(x=>x.id===r.id));
    const q=makeQuestions(only(r),{language:'latin',unit:7,
      activity:'analysis',limit:10,rng});
    assert.equal(q.length,6);
    assert.ok(q.every(x=>x.options.length===4&&evaluate(x,x.correct).correct));
  }
});

test('Superlativos: tres modelos regulares y dos irregulares, 36 formas por paradigma',()=>{
  for(const [lemma,sourceId] of [
    ['altissimus','latin2-cuaderno-nominal-adjective-altissimus'],
    ['pulcherrimus','latin2-cuaderno-nominal-adjective-pulcherrimus'],
    ['facillimus','latin2-cuaderno-nominal-adjective-facillimus'],
    ['optimus','latin2-pau-unimorph-adjetivo-optimus'],
    ['maximus','latin2-pau-unimorph-adjetivo-maximus']
  ]){
    const r=find('latin-ud9-superlativo-'+lemma),original=find(sourceId);
    assert.ok(r&&original);
    assert.equal(r.kind,'adjetivo');
    assert.equal(r.unit,9);
    assert.equal(r.forms.length,36);
    assert.deepEqual(r.forms.map(f=>f.form),original.forms.map(f=>f.form),
      'Solo son admisibles las grafías ya documentadas');
    assert.ok(r.forms.every(f=>f.analysis.endsWith('grado superlativo')));
    assert.ok(!availableRecords(bank,{language:'latin',unit:8}).some(x=>x.id===r.id));
    const tables=makeTableExercises(only(r),{language:'latin',unit:9,rng});
    assert.equal(tables.length,3);
    assert.ok(tables.every(q=>evaluateTable(q,Object.fromEntries(
      q.cells.map(c=>[c.id,c.acceptedForms[0]]))).complete));
  }
});

test('Participio perfecto de UD10: 36 casillas y 18 históricas intactas',()=>{
  const r=find('latin-ud10-participio-perfecto-completo');
  const old=find('latin-ud10-participio-perfecto');
  assert.equal(r.kind,'participio');
  assert.equal(r.forms.length,36);
  assert.equal(old.forms.length,18);
  assert.deepEqual(r.forms.slice(0,18).map(f=>f.form),old.forms.map(f=>f.form));
  for(const [gender,expected] of [
    ['masculino','amati'],['femenino','amatæ'],['neutro','amata']
  ])assert.equal(r.forms.find(f=>f.case==='nominativo'&&
    f.number==='plural'&&f.gender===gender).form,expected);
  assert.equal(makeTableExercises(only(r),{
    language:'latin',unit:9,rng
  }).length,0,'No debe adelantarse a UD9');
  const tables=makeTableExercises(only(r),{language:'latin',unit:10,rng});
  assert.equal(tables.length,3);
  assert.ok(tables.every(q=>q.cells.length===12));
  assert.ok(tables.every(q=>evaluateTable(q,Object.fromEntries(
    q.cells.map(c=>[c.id,c.acceptedForms[0]]))).complete));
  assert.ok(r.evidence.notes.includes('no por consulta individual'));
});

test('Griego: siete sustantivos completos UniMorph+Vocabula, sin asignación arbitraria',()=>{
  assert.equal(greek.length,7);
  assert.equal(greek.filter(r=>r.unit===1).length,1);
  assert.equal(greek.filter(r=>r.unit===4).length,6);
  for(const r of greek){
    assert.equal(r.kind,'sustantivo');
    assert.equal(r.forms.length,10);
    assert.ok(r.evidence.vocabulaSha===source.sources.vocabula.sha);
    assert.ok(r.evidence.review.includes('pendiente'));
    const keys=new Set(r.forms.map(f=>f.case+':'+f.number));
    assert.equal(keys.size,10);
    assert.ok(r.forms.every(f=>f.form.normalize('NFC')===f.form));
    const qs=makeWrittenQuestions(only(r),{language:'griego',unit:r.unit,limit:10,rng});
    assert.ok(qs.length>=8);
    assert.ok(qs.every(q=>correctWritten(q,q.acceptedForms[0]).correct));
    const tables=makeTableExercises(only(r),{language:'griego',unit:r.unit,rng});
    assert.equal(tables.length,1);
    assert.ok(evaluateTable(tables[0],Object.fromEntries(
      tables[0].cells.map(c=>[c.id,c.acceptedForms[0]]))).complete);
  }
  const anthropos=find('griego-sustantivo-anthropos');
  assert.equal(anthropos.unit,1);
  assert.equal(anthropos.gender,'común');
  assert.match(anthropos.paradigm,/ὁ\/ἡ/);
  assert.equal(anthropos.forms.find(f=>f.case==='genitivo'&&
    f.number==='singular').form,'ἀνθρώπου');
  for(const id of ['biblion','zoon','agora','aletheia','adikia','eleutheria']){
    const r=find('griego-sustantivo-'+id);
    assert.equal(r.unit,4,'El bloque UD1–4 del vocabulario no acredita una subunidad');
    assert.ok(!availableRecords(bank,{language:'griego',unit:3}).some(x=>x.id===r.id));
  }
});

test('Los filtros siguen acumulativos y las tandas conservan diversidad',()=>{
  const requirements=[['latin',5,['sustantivo','adjetivo','pronombre','verbo']],
    ['latin',10,['sustantivo','adjetivo','pronombre','verbo','participio']],
    ['griego',4,['sustantivo','desinencia','artículo','verbo']],
    ['griego',10,['sustantivo','adjetivo','pronombre','verbo','participio','infinitivo']]];
  for(const [language,unit,kinds] of requirements){
    const available=new Set(availableRecords(bank,{language,unit}).map(r=>r.kind));
    for(const kind of kinds)assert.ok(available.has(kind),language+' UD'+unit+' '+kind);
    const q=makeQuestions(bank,{language,unit,kind:'todos',activity:'analysis',
      limit:20,rng});
    assert.ok(new Set(q.map(x=>x.kind)).size>=4);
    assert.ok(q.every(x=>evaluate(x,x.correct).correct));
  }
});
