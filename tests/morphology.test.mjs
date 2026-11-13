import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {compileMorphology} from '../scripts/build-morphology.mjs';
import {validateBank,availableRecords,makeQuestions,evaluate} from '../public/morfologia/engine.mjs';
const root=resolve(import.meta.dirname,'..');
const lock=JSON.parse(readFileSync(join(root,'config/sources.lock.json'),'utf8'));
const source=JSON.parse(readFileSync(join(root,'.sources/appendix/assets/curriculum.json'),'utf8'));
const compiled=JSON.parse(readFileSync(join(root,'dist/apps/morfologia/data/paradigmas.json'),'utf8'));
const latinNounsHtml=readFileSync(join(root,'.sources/appendix/sustantivos.html'),'utf8');
const latinIndicativeHtml=readFileSync(join(root,'.sources/appendix/indicativo.html'),'utf8');
const latinAdjectivesHtml=readFileSync(join(root,'.sources/appendix/adjetivos.html'),'utf8');
const sampleRng=()=>.37;
test('el banco tiene SHA del Appendix fijado y se recompila exactamente desde sus tablas',()=>{
  assert.equal(compiled.appendixSha,lock.sources.appendix.sha);
  const core=compileMorphology(source,lock.sources.appendix.sha,{
    latinNounsHtml,latinIndicativeHtml,latinAdjectivesHtml});
  assert.deepEqual(compiled.records.slice(0,core.records.length),core.records);
  assert.equal(compiled.vocabulaSha,lock.sources.vocabula.sha);
  validateBank(compiled);
  assert.ok(compiled.records.length>92);
  assert.deepEqual(compiled.coverage,{latin:[1,2,3,4,5,6,7],griego:[1,2,3,4,5,6,7]});
  assert.ok(compiled.records.every(r=>r.evidence.status==='paradigma-documentado'));
  assert.ok(compiled.records.every(r=>r.forms.every(f=>f.form&&!f.form.includes('<'))));
});
test('el currículo desbloquea tiempos y categorías solo en su unidad',()=>{
  const l1=availableRecords(compiled,{language:'latin',unit:1});
  const l2=availableRecords(compiled,{language:'latin',unit:2});
  const l3=availableRecords(compiled,{language:'latin',unit:3});
  const l4=availableRecords(compiled,{language:'latin',unit:4});
  const l5=availableRecords(compiled,{language:'latin',unit:5});
  assert.ok(l1.length>=9);
  assert.ok(l2.length>=15);
  assert.ok(l3.length>=26);
  assert.ok(l4.length>=42);
  assert.ok(l5.length>=46);
  assert.ok(l1.some(r=>r.paradigm.startsWith('rosa')));
  assert.ok(l1.every(r=>r.unit===1));
  assert.ok(l2.some(r=>r.paradigm.includes('imperfecto')));
  assert.ok(!l2.some(r=>r.paradigm.includes('pasivo')));
  assert.ok(l3.some(r=>r.paradigm==='amo · presente pasivo'));
  assert.ok(l3.some(r=>r.paradigm==='duco · imperfecto pasivo'));
  assert.ok(l3.some(r=>r.kind==='desinencia'));
  assert.ok(!l3.some(r=>r.paradigm.startsWith('dux,')));
  assert.ok(l4.some(r=>r.paradigm.startsWith('dux,')));
  assert.ok(l4.some(r=>r.paradigm.startsWith('mare,')));
  const g1=availableRecords(compiled,{language:'griego',unit:1});
  const g2=availableRecords(compiled,{language:'griego',unit:2});
  const g3=availableRecords(compiled,{language:'griego',unit:3});
  const g4=availableRecords(compiled,{language:'griego',unit:4});
  const g5=availableRecords(compiled,{language:'griego',unit:5});
  assert.deepEqual([g1.length,g2.length,g3.length],[2,4,10]);
  assert.ok(g4.length>14,'La expansión nominal se desbloquea a partir de UD4');
  assert.ok(g5.length>g4.length,'Los sustantivos de UD5 no se anticipan a UD4');
  assert.ok(!g1.some(r=>r.kind==='artículo'));
  assert.ok(g3.some(r=>r.kind==='artículo'));
  assert.equal(g3.filter(r=>r.paradigm.startsWith('1.ª declinación griega')).length,5);
  assert.ok(!g2.some(r=>r.paradigm.startsWith('1.ª declinación griega')));
  assert.throws(()=>availableRecords(compiled,{language:'latin',unit:8}),/Unidad todavía no disponible/);
  assert.throws(()=>availableRecords(compiled,{language:'griego',unit:8}),/Unidad todavía no disponible/);
});
test('las formas recuperan tabla y no se obtienen por generación especulativa',()=>{
  const rose=compiled.records.find(r=>r.paradigm.startsWith('rosa'));
  assert.deepEqual(rose.forms.find(f=>f.analysis==='acusativo singular').form,'rosam');
  const bellum=compiled.records.find(r=>r.paradigm.startsWith('bellum'));
  assert.equal(bellum.forms.find(f=>f.analysis==='nominativo plural').form,'bella');
  const sum=compiled.records.find(r=>r.paradigm==='sum · presente');
  assert.equal(sum.forms.find(f=>f.analysis==='3.ª plural · presente').form,'sunt');
  const greek=compiled.records.find(r=>r.paradigm.startsWith('εἰμί'));
  assert.ok(greek.forms.some(f=>f.form.normalize('NFD').startsWith('ε')));
  const article=compiled.records.find(r=>r.kind==='artículo');
  assert.equal(article.forms.length,24);
  assert.ok(article.forms.some(f=>f.form==='τοῦ'));
});
test('el motor reconoce sincretismo y no fuerza análisis único de formas ambiguas',()=>{
  const roseBank={...compiled,records:compiled.records.filter(r=>r.paradigm.startsWith('rosa'))};
  const cards=makeQuestions(roseBank,{language:'latin',unit:1,activity:'analysis',limit:30,rng:sampleRng});
  const syncretic=cards.find(q=>q.paradigm.startsWith('rosa')&&q.form==='rosa');
  assert.ok(syncretic,'Debe incluirse rosa ambigua');
  assert.match(syncretic.correct,/nominativo singular/);
  assert.match(syncretic.correct,/vocativo singular/);
  assert.equal(syncretic.ambiguous,true);
  assert.equal(new Set(syncretic.options).size,4);
  assert.ok(syncretic.options.includes(syncretic.correct));
  assert.equal(evaluate(syncretic,syncretic.correct).correct,true);
  assert.throws(()=>evaluate(syncretic,'respuesta externa'),/ajena al ejercicio/);
});
test('los ejercicios excluyen morfología no documentada y no filtran lemas',()=>{
  const greek=makeQuestions(compiled,{language:'griego',unit:2,activity:'form',limit:10,rng:sampleRng});
  assert.equal(greek.length,10);
  assert.ok(greek.every(q=>q.evidence.unit<=2));
  assert.ok(greek.every(q=>q.options.length===4&&new Set(q.options).size===4));
  assert.ok(greek.every(q=>q.options.includes(q.correct)));
  assert.equal(existsSync(join(root,'dist/apps/morfologia/sw.js')),true);
  assert.equal(existsSync(join(root,'dist/morfologia')),false);
  assert.equal(existsSync(join(root,'dist/apps/examenes')),false);
});

test('pasiva UD3: presentes, imperfectos y variantes pasivas están documentados',()=>{
  const find=(name)=>compiled.records.find(r=>r.paradigm===name);
  const amor=find('amo · presente pasivo');
  assert.equal(amor.unit,3);
  assert.equal(amor.forms[0].form,'amor');
  assert.equal(amor.forms[1].form,'amaris');
  assert.equal(find('duco · presente pasivo').forms[1].form,'duceris');
  assert.equal(find('capio · imperfecto pasivo').forms[5].form,'capiebantur');
  const endings=compiled.records.find(r=>r.id==='latin-desinencias-pasivas');
  assert.ok(endings.forms.some(f=>f.form==='-re'&&f.person==='2.ª singular'));
  assert.ok(endings.forms.some(f=>f.form==='-ris'&&f.person==='2.ª singular'));
  assert.ok(!compiled.records.some(r=>r.paradigm==='sum · presente pasivo'));
});
test('tercera declinación UD4: cuatro temas, neutros e irregularidades explícitas',()=>{
  const n=name=>compiled.records.find(r=>r.paradigm.startsWith(name));
  const form=(r,cas,number)=>r.forms.filter(f=>f.case===cas&&f.number===number).map(f=>f.form);
  const dux=n('dux,'),civis=n('civis,'),flumen=n('flumen,'),mare=n('mare,');
  for(const r of [dux,civis,flumen,mare]){
    assert.equal(r.unit,4);
    assert.equal(r.evidence.file,'sustantivos.html');
    assert.equal(r.evidence.caption,'Tercera declinación · cuatro paradigmas');
  }
  assert.deepEqual(form(dux,'genitivo','plural'),['ducum']);
  assert.deepEqual(form(civis,'genitivo','plural'),['civium']);
  assert.deepEqual(form(flumen,'genitivo','plural'),['fluminum']);
  assert.deepEqual(form(mare,'genitivo','plural'),['marium']);
  assert.deepEqual(form(mare,'nominativo','plural'),['maria']);
  assert.deepEqual(form(mare,'vocativo','plural'),['maria']);
  assert.deepEqual(form(mare,'acusativo','plural'),['maria']);
  assert.deepEqual(form(mare,'ablativo','singular'),['mari']);
  assert.deepEqual(form(civis,'acusativo','plural'),['cives','civis']);
  assert.ok(civis.forms.every(f=>!f.form.includes(' / ')));
});
test('Griego I UD3: alfa puro, eta, mixto y masculinos separados sin inventar sustantivos',()=>{
  const list=compiled.records.filter(r=>r.id.startsWith('griego-1'));
  assert.equal(list.length,5);
  const names=list.map(r=>r.id);
  assert.deepEqual(names,['griego-1f-alfa-puro','griego-1f-eta','griego-1f-mixto',
    'griego-1m-alfa','griego-1m-eta']);
  const find=(id)=>list.find(r=>r.id===id);
  const caseForm=(record,cas,number='singular')=>record.forms.find(f=>
    f.case===cas&&f.number===number).form;
  assert.equal(caseForm(find('griego-1f-alfa-puro'),'genitivo'),'–ας');
  assert.equal(caseForm(find('griego-1f-eta'),'genitivo'),'–ης');
  assert.equal(caseForm(find('griego-1f-mixto'),'nominativo'),'–α');
  assert.equal(caseForm(find('griego-1f-mixto'),'genitivo'),'–ης');
  assert.equal(caseForm(find('griego-1f-mixto'),'dativo'),'–ῃ');
  assert.equal(caseForm(find('griego-1m-alfa'),'nominativo'),'–ας');
  assert.equal(caseForm(find('griego-1m-eta'),'nominativo'),'–ης');
  assert.equal(caseForm(find('griego-1m-eta'),'vocativo'),'–α');
  for(const record of list){
    assert.equal(record.kind,'desinencia');
    assert.equal(record.forms.length,10);
    assert.ok(record.forms.every(f=>f.form.startsWith('–')));
    assert.ok(record.forms.every(f=>f.analysis.includes(record.forms[0].gender)));
    assert.ok(record.forms.every(f=>f.analysis.includes(record.paradigm.split(' · ').at(-1))));
  }
});
test('alternativas válidas de civis nunca se presentan como respuestas falsas',()=>{
  const civis=compiled.records.find(r=>r.paradigm.startsWith('civis,'));
  const subBank={...compiled,records:[civis]};
  const qs=makeQuestions(subBank,{language:'latin',unit:4,activity:'form',limit:30,rng:sampleRng});
  const acc=qs.find(q=>q.prompt.includes('acusativo plural'));
  assert.ok(acc);
  assert.deepEqual(acc.acceptedForms,['cives','civis']);
  assert.equal(acc.options.filter(o=>acc.acceptedForms.includes(o)).length,1);
  assert.ok(acc.options.includes(acc.correct));
  assert.equal(evaluate(acc,acc.correct).correct,true);
  assert.match(evaluate(acc,acc.correct).expected,/cives \/ civis/);
  const analysis=makeQuestions(subBank,{language:'latin',unit:4,activity:'analysis',limit:30,
    rng:sampleRng});
  const syncretic=analysis.find(q=>q.form==='cives');
  assert.ok(syncretic);
  assert.match(syncretic.correct,/nominativo plural/);
  assert.match(syncretic.correct,/acusativo plural/);
});
