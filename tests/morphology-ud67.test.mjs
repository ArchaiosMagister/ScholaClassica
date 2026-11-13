import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {compileMorphologyUd67} from '../scripts/morphology-ud6-ud7.mjs';
import {availableRecords,makeQuestions} from '../public/morfologia/engine.mjs';
import {makeWrittenQuestions,correctWritten,evaluateTable} from '../public/morfologia/written.mjs';
import {phrasePairs,makePhraseQuestions,makePhraseTables} from '../public/morfologia/sintagmas.mjs';
const root=resolve(import.meta.dirname,'..');
const source=JSON.parse(readFileSync(join(root,'.sources/appendix/assets/curriculum.json'),'utf8'));
const bank=JSON.parse(readFileSync(join(root,'dist/apps/morfologia/data/paradigmas.json'),'utf8'));
const extra=compileMorphologyUd67(source);
const rng=()=>.38;
const get=id=>bank.records.find(x=>x.id===id);
test('84 paradigmas; 24 nuevos exactamente cotejados con Appendix fijado por SHA',()=>{
  assert.equal(extra.length,24);
  assert.equal(bank.records.length,144);
  assert.deepEqual(bank.records.slice(60,84),extra);
  assert.deepEqual(bank.coverage,{latin:[1,2,3,4,5,6,7,8,9,10],griego:[1,2,3,4,5,6,7,8,9,10,11,12,13,14]});
  assert.ok(extra.every(x=>x.evidence.status==='paradigma-documentado'));
  assert.ok(extra.every(x=>x.evidence.file==='assets/curriculum.json'));
  assert.ok(extra.every(x=>x.unit===6||x.unit===7));
});
test('Latín UD6: tres demostrativos y relativo, sin vocativo fabricado',()=>{
  const ids=['latin-ud6-hic','latin-ud6-iste','latin-ud6-ille','latin-ud6-relativo'];
  assert.deepEqual(extra.filter(r=>r.language==='latin'&&r.unit===6).map(r=>r.id),ids);
  for(const id of ids){
    const record=get(id);
    assert.equal(record.kind,'pronombre');
    assert.equal(record.forms.length,30);
    assert.ok(record.forms.every(f=>f.case!=='vocativo'));
  }
  assert.equal(get('latin-ud6-hic').forms.find(f=>f.analysis==='nominativo masculino singular')?.form,'hic');
  assert.equal(get('latin-ud6-relativo').forms.find(f=>f.analysis==='acusativo femenino plural')?.form,'quas');
  assert.ok(!availableRecords(bank,{language:'latin',unit:5}).some(r=>r.kind==='pronombre'));
  assert.equal(availableRecords(bank,{language:'latin',unit:6}).filter(r=>r.kind==='pronombre').length,4);
});
test('Latín UD7: cuarta y quinta declinación, futuro activo y pasivo con sum',()=>{
  for(const id of ['latin-ud7-exercitus','latin-ud7-cornu','latin-ud7-res']){
    const record=get(id);
    assert.equal(record.kind,'sustantivo');
    assert.equal(record.forms.length,12);
    assert.ok(record.forms.every(f=>f.case&&f.number));
  }
  assert.equal(get('latin-ud7-cornu').gender,'neutro');
  assert.equal(get('latin-ud7-res').gender,'femenino');
  assert.equal(get('latin-ud7-exercitus').forms.find(f=>f.analysis==='genitivo plural')?.form,'exercituum');
  assert.equal(get('latin-ud7-cornu').forms.find(f=>f.analysis==='nominativo plural')?.form,'cornua');
  assert.equal(get('latin-ud7-res').forms.find(f=>f.analysis==='acusativo singular')?.form,'rem');
  const futures=extra.filter(r=>r.language==='latin'&&r.unit===7&&r.kind==='verbo');
  assert.equal(futures.length,11);
  assert.equal(get('latin-ud7-futuro-activa-amo').forms[0].form,'amabo');
  assert.equal(get('latin-ud7-futuro-pasiva-duco').forms[1].form,'duceris');
  assert.equal(get('latin-ud7-futuro-pasiva-capio').forms[5].form,'capientur');
  assert.equal(get('latin-ud7-futuro-sum').forms[5].form,'erunt');
  assert.ok(!availableRecords(bank,{language:'latin',unit:6}).some(r=>r.id==='latin-ud7-futuro-sum'));
});
test('Griego UD6: presente medio-pasivo atestiguado y dos segundas singulares válidas',()=>{
  const record=get('griego-ud6-lyo-medio');
  assert.equal(record.kind,'verbo');
  assert.equal(record.unit,6);
  assert.equal(record.forms.length,7);
  assert.deepEqual(record.forms.filter(x=>x.person==='2.ª singular').map(x=>x.form),['λύει','λύῃ']);
  assert.equal(record.forms[0].form,'λύομαι');
  const only={...bank,records:[record]};
  const q=makeWrittenQuestions(only,{language:'griego',unit:6,limit:10,rng})
    .find(x=>x.prompt.includes('2.ª singular'));
  assert.deepEqual(q.acceptedForms,['λύει','λύῃ']);
  assert.equal(correctWritten(q,'λύει').correct,true);
  assert.equal(correctWritten(q,'λύῃ').correct,true);
  assert.equal(correctWritten(q,'λύη').status,'morphology');
  assert.ok(!availableRecords(bank,{language:'griego',unit:5}).some(x=>x.id===record.id));
});
test('Griego UD7: cuatro paradigmas pronominales y personales con variantes tónicas/átonas',()=>{
  const list=extra.filter(x=>x.language==='griego'&&x.unit===7);
  assert.equal(list.length,5);
  for(const record of list){
    assert.equal(record.kind,'pronombre');
    assert.ok(record.forms.every(form=>form.case!=='vocativo'));
  }
  assert.equal(get('griego-ud7-houtos').forms.find(x=>x.analysis==='nominativo masculino singular').form,'οὗτος');
  assert.equal(get('griego-ud7-autos').forms.find(x=>x.analysis==='genitivo neutro plural').form,'αὐτῶν');
  const pers=get('griego-ud7-personales');
  assert.ok(pers.forms.length>16);
  assert.deepEqual(pers.forms.filter(x=>x.analysis==='acusativo · 1.ª persona · singular').map(x=>x.form),['ἐμέ','με']);
  assert.ok(pers.forms.every(x=>x.gender===undefined));
  const only={...bank,records:[pers]};
  const q=makeWrittenQuestions(only,{language:'griego',unit:7,limit:30,rng})
    .find(x=>x.prompt.includes('acusativo · 1.ª persona · singular'));
  assert.deepEqual(q.acceptedForms,['ἐμέ','με']);
  assert.equal(correctWritten(q,'ἐμέ').correct,true);
  assert.equal(correctWritten(q,'με').correct,true);
});
test('sintagmas latinos: sólo sustantivos de género acreditado, y nunca civis/dux',()=>{
  assert.throws(()=>makePhraseQuestions(bank,{language:'latin',unit:4}),/solo está disponible desde UD5/);
  const early=phrasePairs(bank,{language:'latin',unit:5});
  assert.equal(early.length,5*4,'rosa, dominus, bellum, flumen y mare con cuatro adjetivos');
  assert.ok(early.every(p=>p.provenance.length===2));
  assert.ok(early.every(p=>!p.noun.paradigm.startsWith('civis,')&&!p.noun.paradigm.startsWith('dux,')));
  const later=phrasePairs(bank,{language:'latin',unit:7});
  assert.equal(later.length,8*4,'UD7 añade exercitus, cornu y res');
  const q=makePhraseQuestions(bank,{language:'latin',unit:5,limit:30,rng});
  assert.equal(q.length,30);
  for(const item of q){
    assert.equal(item.activity,'written');
    assert.equal(item.kind,'sintagma');
    assert.equal(item.sources.length,2);
    assert.ok(item.acceptedForms.every(x=>x.includes(' ')));
    assert.ok(correctWritten(item,item.acceptedForms[0]).correct);
  }
  const tables=makePhraseTables(bank,{language:'latin',unit:7,limit:30,rng});
  assert.equal(tables.length,30);
  assert.ok(tables.every(q=>q.cells.length===12));
  const model=tables.find(x=>x.paradigm.includes('res, rei'));
  assert.ok(model);
  const answers=Object.fromEntries(model.cells.map(x=>[x.id,x.acceptedForms[0]]));
  assert.equal(evaluateTable(model,answers).complete,true);
});
test('griego: artículo + adjetivo sustantivado, sin fingir un sustantivo completo',()=>{
  const pair=phrasePairs(bank,{language:'griego',unit:5});
  assert.equal(pair.length,4);
  assert.ok(pair.every(p=>p.note.includes('sin sustantivo independiente')));
  const tables=makePhraseTables(bank,{language:'griego',unit:5,limit:30,rng});
  assert.equal(tables.length,12);
  assert.ok(tables.every(t=>t.cells.length===8),'El artículo griego no tiene vocativo');
  assert.ok(tables.every(t=>t.sources.length===2));
  const m=tables.find(t=>t.paradigm.includes('ἀγαθός')&&t.gender==='masculino');
  assert.ok(m);
  assert.ok(m.cells.find(x=>x.id==='nominativo:singular').acceptedForms.includes('ὁ ἀγαθός'));
  const q=makePhraseQuestions(bank,{language:'griego',unit:5,limit:25,rng});
  assert.equal(q.length,25);
  assert.ok(q.every(x=>x.prompt.includes('adjetivo sustantivado')));
  assert.ok(q.every(x=>x.acceptedForms.every(y=>y.includes(' '))));
  assert.ok(q.every(x=>correctWritten(x,x.acceptedForms[0]).correct));
});
test('las celdas latinas con vocales largas aceptan entrada usual sin cantidad marcada',()=>{
  const cornuBank={...bank,records:[get('latin-ud7-cornu')]};
  const ex=makeWrittenQuestions(cornuBank,{language:'latin',unit:7,kind:'sustantivo',limit:30,rng});
  const chosen=ex.find(x=>x.acceptedForms.includes('cornū'));
  assert.ok(chosen);
  assert.equal(correctWritten(chosen,'cornu').correct,true);
  assert.equal(correctWritten(chosen,'CORNU').correct,true);
});
test('la comprobación editorial falla si cambian títulos y fuentes de tablas UD6–UD7',()=>{
  const altered=structuredClone(source);
  altered.latin.units.find(x=>x.number===7).topics
    .find(x=>x.title==='Cuarta y quinta declinación').html=
    altered.latin.units.find(x=>x.number===7).topics.find(x=>x.title==='Cuarta y quinta declinación')
      .html.replace('<caption>Quinta declinación ·','<caption>Tabla desconocida ·');
  assert.throws(()=>compileMorphologyUd67(altered),/Falta tabla/);
});
