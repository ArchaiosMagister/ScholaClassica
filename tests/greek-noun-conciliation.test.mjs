import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {compileGreekNounBatch} from '../scripts/greek-noun-conciliation.mjs';
import {makeGreekNounPhraseQuestions,makeGreekNounPhraseTables,
  greekNounPhrasePairs,graveInContext} from '../public/morfologia/greek-noun-phrases.mjs';
import {availableRecords} from '../public/morfologia/engine.mjs';
import {correctWritten,evaluateTable} from '../public/morfologia/written.mjs';
const root=resolve(import.meta.dirname,'..');
const source=join(root,'.sources/vocabula');
const curriculum=JSON.parse(readFileSync(join(root,'.sources/appendix/assets/curriculum.json'),'utf8'));
const lock=JSON.parse(readFileSync(join(root,'config/sources.lock.json'),'utf8'));
const vocabulaData=readFileSync(join(source,'data.js'),'utf8');
const unimorphParts=Array.from({length:8},(_,i)=>
  JSON.parse(readFileSync(join(source,'data/unimorph-syllabus/grc/part-0'+i+'.json'),'utf8')));
const bank=JSON.parse(readFileSync(join(root,'dist/apps/morfologia/data/paradigmas.json'),'utf8'));
const rerun=(more={})=>compileGreekNounBatch({curriculum,vocabulaData,unimorphParts,
  vocabulaSha:lock.sources.vocabula.sha,...more});
const nouns=rerun();
const rng=()=>.42;
const get=id=>nouns.find(x=>x.id==='griego-sustantivo-'+id);
test('lote cerrado: 8 sustantivos con nominativo, genitivo y género documentados',()=>{
  assert.ok(bank.records.length>92);
  assert.deepEqual(bank.records.slice(84,92),nouns);
  assert.equal(bank.vocabulaSha,lock.sources.vocabula.sha);
  assert.deepEqual(nouns.map(r=>r.id),[
    'griego-sustantivo-hippos','griego-sustantivo-bios','griego-sustantivo-dike',
    'griego-sustantivo-arete','griego-sustantivo-logos','griego-sustantivo-doron',
    'griego-sustantivo-nike','griego-sustantivo-eirene'
  ]);
  assert.deepEqual(nouns.map(r=>r.gender),[
    'masculino','masculino','femenino','femenino',
    'masculino','neutro','femenino','femenino']);
  assert.deepEqual(nouns.map(r=>r.unit),[4,4,4,4,7,7,7,7]);
  for(const record of nouns){
    assert.equal(record.forms.length,10);
    assert.equal(new Set(record.forms.map(x=>x.case+':'+x.number)).size,10);
    assert.equal(record.evidence.status,'paradigma-documentado');
    assert.equal(record.evidence.vocabulaSha,lock.sources.vocabula.sha);
    assert.ok(record.evidence.vocabulaEntry);
    assert.ok(record.evidence.review.includes('pendiente de revisión docente individual'));
    assert.equal(record.evidence.license,'CC BY-SA 3.0');
    assert.ok(record.forms.every(x=>!/[\u0304\u0306]/u.test(x.form.normalize('NFD'))));
    assert.ok(record.forms.every(x=>x.analysis&&x.form&&x.form.length<50));
  }
});
test('testigos: formas completas con acentos y variación de cantidad no exigida',()=>{
  const noun=(id,cas,number)=>get(id).forms.find(x=>x.case===cas&&x.number===number).form;
  assert.equal(noun('hippos','nominativo','singular'),'ἵππος');
  assert.equal(noun('hippos','genitivo','singular'),'ἵππου');
  assert.equal(noun('bios','acusativo','plural'),'βίους');
  assert.equal(noun('dike','dativo','singular'),'δίκῃ');
  assert.equal(noun('arete','genitivo','singular'),'ἀρετῆς');
  assert.equal(noun('logos','genitivo','plural'),'λόγων');
  assert.equal(noun('doron','nominativo','plural'),'δῶρα');
  assert.equal(noun('doron','acusativo','plural'),'δῶρα');
  assert.equal(noun('nike','nominativo','plural'),'νῖκαι');
  assert.equal(noun('eirene','genitivo','plural'),'εἰρηνῶν');
  assert.ok(!nouns.some(r=>r.paradigm.includes('ἄνθρωπος')),
    'ἄνθρωπος no entra en el lote sin resolver género contextual');
});
test('desbloqueo curricular: cuatro nombres UD4 y otros cuatro únicamente UD7',()=>{
  assert.equal(availableRecords(bank,{language:'griego',unit:3,kind:'sustantivo'}).length,0);
  assert.ok(availableRecords(bank,{language:'griego',unit:4,kind:'sustantivo'}).length>4);
  assert.ok(availableRecords(bank,{language:'griego',unit:5,kind:'sustantivo'}).length>4);
  assert.ok(availableRecords(bank,{language:'griego',unit:6,kind:'sustantivo'}).length>4);
  assert.ok(availableRecords(bank,{language:'griego',unit:7,kind:'sustantivo'}).length>8);
});
test('las fuentes se rechazan ante género contradictorio, laguna o falta de unidad',()=>{
  const wrongForms=structuredClone(unimorphParts);
  const row=wrongForms.flat().find(x=>x[0]==='ἵππος'&&x[2]==='N;NOM;SG');
  assert.ok(row);
  row[3]='ἡ '+row[1];
  assert.throws(()=>rerun({unimorphParts:wrongForms}),/artículo nominal no acredita género/i);
  const missing=structuredClone(unimorphParts);
  const position=missing.findIndex(x=>x.some(r=>r[0]==='δίκη'&&r[2]==='N;DAT;PL'));
  const index=missing[position].findIndex(r=>r[0]==='δίκη'&&r[2]==='N;DAT;PL');
  missing[position].splice(index,1);
  assert.throws(()=>rerun({unimorphParts:missing}),/diez casillas/);
  const vocabItems=JSON.parse(vocabulaData.slice('window.VOCAB='.length).replace(/;\s*$/,''));
  const target=vocabItems.find(x=>x.subject==='gr1'&&x.mode==='examen'&&x.form==='ἵππος, –ου');
  assert.ok(target,'Debe modificarse la entrada concreta de examen, no la general');
  target.form='ἵππος, –XX';
  const wrongLex='window.VOCAB='+JSON.stringify(vocabItems)+';';
  assert.throws(()=>rerun({vocabulaData:wrongLex}),/Lema o unidad de examen ambiguos|Enunciado nominal no esperado/);
  assert.throws(()=>rerun({vocabulaSha:'main'}),/SHA Vocabula no fijado/);
});
test('sintagmas triples: dos posiciones atributivas correctas, acento grave contextual',()=>{
  assert.equal(graveInContext('ἀγαθός'),'ἀγαθὸς');
  assert.equal(graveInContext('ἀρετή'),'ἀρετὴ');
  assert.equal(graveInContext('ἵππος'),'ἵππος');
  assert.equal(graveInContext('μεγάλη'),'μεγάλη');
  assert.throws(()=>greekNounPhrasePairs(bank,{language:'latin',unit:5}),/solo se habilitan/);
  assert.throws(()=>greekNounPhrasePairs(bank,{language:'griego',unit:4}),/solo se habilitan/);
  assert.ok(greekNounPhrasePairs(bank,{language:'griego',unit:5}).length>12);
  assert.ok(greekNounPhrasePairs(bank,{language:'griego',unit:7}).length>24);
  const tables=makeGreekNounPhraseTables(bank,{language:'griego',unit:7,limit:30,rng});
  assert.equal(tables.length,30);
  assert.ok(tables.every(t=>t.gender&&t.cells.length===8&&t.sources.length===3));
  const hippos=tables.find(t=>t.paradigm.includes('ἵππος')&&t.paradigm.includes('ἀγαθός'));
  assert.ok(hippos);
  const nom=hippos.cells.find(x=>x.id==='nominativo:singular');
  assert.deepEqual(nom.acceptedForms,['ὁ ἀγαθὸς ἵππος','ὁ ἵππος ὁ ἀγαθός']);
  assert.equal(correctWritten({...hippos,activity:'written',acceptedForms:nom.acceptedForms},
    'ὁ ἵππος ὁ ἀγαθός').correct,true);
  assert.equal(correctWritten({...hippos,activity:'written',acceptedForms:nom.acceptedForms},
    'ὁ ἵππος ἀγαθός').correct,false);
  const dike=tables.find(t=>t.paradigm.includes('δίκη')&&t.paradigm.includes('ἀγαθός'));
  assert.ok(dike);
  assert.deepEqual(dike.cells.find(x=>x.id==='nominativo:singular').acceptedForms,
    ['ἡ ἀγαθὴ δίκη','ἡ δίκη ἡ ἀγαθή']);
  const arete=tables.find(t=>t.paradigm.includes('ἀρετή')&&t.paradigm.includes('ἀγαθός'));
  assert.ok(arete);
  assert.ok(arete.cells.find(x=>x.id==='nominativo:singular').acceptedForms
    .includes('ἡ ἀρετὴ ἡ ἀγαθή'));
  const all=Object.fromEntries(hippos.cells.map(c=>[c.id,c.acceptedForms[0]]));
  assert.equal(evaluateTable(hippos,all).complete,true);
  all['nominativo:singular']='ὁ ἵππος ὁ ἀγαθός';
  assert.equal(evaluateTable(hippos,all).complete,true);
});
test('escritura nominal triple no penaliza el orden atributivo válido y mantiene las tres fuentes',()=>{
  const qs=makeGreekNounPhraseQuestions(bank,{language:'griego',unit:5,limit:30,rng});
  assert.equal(qs.length,30);
  for(const q of qs){
    assert.equal(q.activity,'written');
    assert.equal(q.sources.length,3);
    assert.equal(q.acceptedForms.length,2);
    assert.ok(q.acceptedForms.every(form=>form.split(' ').length>=3));
    assert.equal(correctWritten(q,q.acceptedForms[0]).status,'correct');
    assert.equal(correctWritten(q,q.acceptedForms[1]).status,'correct');
    assert.equal(correctWritten(q,'ἀπαράδεκτος').status,'morphology');
  }
  const later=makeGreekNounPhraseQuestions(bank,{language:'griego',unit:7,limit:30,rng});
  assert.ok(later.some(q=>q.paradigm.includes('δῶρον')||
    q.paradigm.includes('λόγος')||q.paradigm.includes('νίκη')));
});
