import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {compileAdditionalMorphology} from '../scripts/morphology-expansion.mjs';
import {availableRecords,makeQuestions,evaluate} from '../public/morfologia/engine.mjs';
const root=resolve(import.meta.dirname,'..'),src=join(root,'.sources/appendix');
const curriculum=JSON.parse(readFileSync(join(src,'assets/curriculum.json'),'utf8'));
const latinIndicativeHtml=readFileSync(join(src,'indicativo.html'),'utf8');
const latinAdjectivesHtml=readFileSync(join(src,'adjetivos.html'),'utf8');
const bank=JSON.parse(readFileSync(join(root,'dist/apps/morfologia/data/paradigmas.json'),'utf8'));
const expanded=compileAdditionalMorphology({curriculum,latinIndicativeHtml,latinAdjectivesHtml});
test('la nueva colección tiene 20 paradigmas, con evidencia de tabla y sin duplicados',()=>{
  assert.equal(expanded.length,20);
  assert.equal(bank.records.length,220);
  assert.deepEqual(bank.records.slice(40,60),expanded);
  assert.deepEqual(bank.coverage,{latin:[1,2,3,4,5,6,7,8,9,10],griego:[1,2,3,4,5,6,7,8,9,10,11,12,13,14],latin4:[1,2,3,4,5,6,7,8]});
  assert.equal(expanded.filter(r=>r.kind==='verbo').length,12);
  assert.equal(expanded.filter(r=>r.language==='latin'&&r.kind==='adjetivo').length,4);
  assert.equal(expanded.filter(r=>r.language==='griego'&&r.kind==='adjetivo').length,4);
  for(const r of expanded){
    assert.equal(r.evidence.status,'paradigma-documentado');
    assert.ok(r.evidence.file&&r.evidence.topic&&r.evidence.caption);
    assert.ok(r.forms.every(f=>f.form&&f.analysis&&!f.form.includes('<')));
  }
});
test('Latín UD4: cinco conjugaciones + sum, perfectos y pluscuamperfectos activos',()=>{
  const records=expanded.filter(r=>r.language==='latin'&&r.kind==='verbo');
  assert.equal(records.length,12);
  assert.ok(records.every(r=>r.unit===4&&r.evidence.file==='indicativo.html'));
  const forms=id=>records.find(r=>r.id===id)?.forms.map(f=>f.form);
  assert.deepEqual(forms('latin-perfecto-2'),['duxi','duxisti','duxit','duximus','duxistis','duxerunt']);
  assert.deepEqual(forms('latin-pluscuamperfecto-2'),['duxeram','duxeras','duxerat','duxeramus','duxeratis','duxerant']);
  assert.deepEqual(forms('latin-perfecto-sum'),['fui','fuisti','fuit','fuimus','fuistis','fuerunt']);
  assert.deepEqual(forms('latin-pluscuamperfecto-sum'),['fueram','fueras','fuerat','fueramus','fueratis','fuerant']);
  assert.ok(records.some(r=>r.paradigm.includes('amo, amavi, amatum')));
  assert.ok(records.some(r=>r.paradigm.includes('habeo, habui, habitum')));
  assert.ok(records.some(r=>r.paradigm.includes('audio, audivi, auditum')));
  assert.ok(records.some(r=>r.paradigm.includes('capio, cepi, captum')));
  assert.ok(!availableRecords(bank,{language:'latin',unit:3}).some(r=>r.id==='latin-perfecto-2'));
  assert.ok(availableRecords(bank,{language:'latin',unit:4}).some(r=>r.id==='latin-pluscuamperfecto-2'));
});
test('Latín UD5: brevis, acer, audax, vetus; casos y género con sincretismo',()=>{
  const adjectives=expanded.filter(r=>r.language==='latin'&&r.kind==='adjetivo');
  assert.deepEqual(adjectives.map(r=>r.id),
    ['latin-adj-brevis','latin-adj-acer','latin-adj-audax','latin-adj-vetus']);
  const get=(id,cas,gender,number)=>adjectives.find(r=>r.id===id).forms.find(f=>
    f.case===cas&&f.gender===gender&&f.number===number).form;
  assert.equal(get('latin-adj-brevis','nominativo','femenino','singular'),'brevis');
  assert.equal(get('latin-adj-brevis','nominativo','neutro','plural'),'brevia');
  assert.equal(get('latin-adj-acer','nominativo','masculino','singular'),'acer');
  assert.equal(get('latin-adj-acer','nominativo','femenino','singular'),'acris');
  assert.equal(get('latin-adj-acer','nominativo','neutro','plural'),'acria');
  assert.equal(get('latin-adj-audax','genitivo','masculino','plural'),'audacium');
  assert.equal(get('latin-adj-audax','acusativo','neutro','plural'),'audacia');
  assert.equal(get('latin-adj-vetus','genitivo','neutro','plural'),'veterum');
  assert.equal(get('latin-adj-vetus','ablativo','masculino','singular'),'vetere');
  const q=makeQuestions({...bank,records:adjectives},
    {language:'latin',unit:5,activity:'analysis',limit:30,rng:()=>.42});
  assert.ok(q.some(card=>card.ambiguous&&card.correct.includes('femenino')));
  assert.ok(!availableRecords(bank,{language:'latin',unit:4}).some(r=>r.kind==='adjetivo'));
});
test('Griego UD5: dos modelos regulares y dos irregulares con acentos y fusiones reales',()=>{
  const forms=id=>expanded.find(r=>r.id==='griego-adj-'+id).forms;
  for(const id of ['agathos','barbaros','polys','megas']){
    assert.equal(forms(id).length,30);
    assert.ok(forms(id).every(f=>f.case&&f.gender&&f.number));
  }
  const caseForm=(id,cas,gender,number)=>forms(id).find(f=>f.case===cas&&f.gender===gender&&f.number===number).form;
  assert.equal(caseForm('agathos','nominativo','masculino','singular').normalize('NFC'),'ἀγαθός');
  assert.equal(caseForm('agathos','nominativo','femenino','singular').normalize('NFC'),'ἀγαθή');
  assert.equal(caseForm('barbaros','nominativo','masculino','singular'),
    caseForm('barbaros','nominativo','femenino','singular'));
  assert.equal(caseForm('polys','nominativo','neutro','singular').normalize('NFC'),'πολύ');
  assert.equal(caseForm('polys','acusativo','neutro','singular').normalize('NFC'),'πολύ');
  assert.equal(caseForm('megas','nominativo','neutro','singular').normalize('NFC'),'μέγα');
  assert.equal(caseForm('megas','acusativo','neutro','singular').normalize('NFC'),'μέγα');
  assert.ok(!availableRecords(bank,{language:'griego',unit:4}).some(r=>r.kind==='adjetivo'));
  assert.equal(availableRecords(bank,{language:'griego',unit:5}).filter(r=>r.kind==='adjetivo').length,4);
});
test('Concordancia artículo-adjetivo: cuatro respuestas, ninguna alternativa válida como distractor',()=>{
  assert.throws(()=>makeQuestions(bank,{language:'griego',unit:4,activity:'agreement'}),
    /concordancia griega solo está disponible desde UD5/);
  assert.throws(()=>makeQuestions(bank,{language:'latin',unit:5,activity:'agreement'}),
    /concordancia griega solo está disponible desde UD5/);
  const q=makeQuestions(bank,{language:'griego',unit:5,activity:'agreement',limit:30,rng:()=>.43});
  assert.equal(q.length,30);
  const adjectives=availableRecords(bank,{language:'griego',unit:5,kind:'adjetivo'});
  const article=bank.records.find(r=>r.id==='griego-articulo');
  for(const item of q){
    assert.equal(item.options.length,4);
    assert.equal(new Set(item.options).size,4);
    assert.ok(item.prompt.includes('concuerda'));
    const art=article.forms.find(a=>a.form.normalize('NFC')===item.article&&
      a.analysis===item.articleAnalysis);
    assert.ok(art,'El artículo tiene que estar documentado');
    const adjective=adjectives.find(a=>a.paradigm===item.paradigm);
    assert.ok(adjective);
    const accepted=[...new Set(adjective.forms.filter(f=>
      f.case===art.case&&f.gender===art.gender&&f.number===art.number).map(f=>f.form.normalize('NFC')))];
    assert.deepEqual(item.acceptedForms,accepted);
    assert.equal(item.options.filter(x=>accepted.includes(x)).length,1);
    assert.ok(item.options.includes(item.correct));
    assert.equal(evaluate(item,item.correct).correct,true);
  }
});
test('Las modificaciones de las tablas fuentes no se importan en silencio',()=>{
  assert.throws(()=>compileAdditionalMorphology({
    curriculum,latinIndicativeHtml:latinIndicativeHtml.replace(
      '<caption>Perfecto de indicativo · voz activa</caption>',
      '<caption>Una tabla no revisada</caption>'),
    latinAdjectivesHtml
  }),/Tabla curricular no encontrada/);
  const broken=structuredClone(curriculum);
  broken.griego.units.find(u=>u.number===5).topics
    .find(t=>t.title==='Adjetivos 2–1–2 y 2–2').html=
    broken.griego.units.find(u=>u.number===5).topics.find(t=>t.title==='Adjetivos 2–1–2 y 2–2')
      .html.replace('<caption>Tipo 1 · tabla 100</caption>','<caption>Tabla sin evidencia</caption>');
  assert.throws(()=>compileAdditionalMorphology({curriculum:broken,latinIndicativeHtml,latinAdjectivesHtml}),
    /Tabla curricular no encontrada/);
});
