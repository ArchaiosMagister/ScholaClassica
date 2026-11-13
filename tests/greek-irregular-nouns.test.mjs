import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {compileGreekIrregularNouns} from '../scripts/irregular-greek-nouns.mjs';
import {makeGreekNounPhraseTables,greekNounPhrasePairs}
  from '../public/morfologia/greek-noun-phrases.mjs';
const root=resolve(import.meta.dirname,'..');
const read=p=>JSON.parse(readFileSync(join(root,p),'utf8'));
const lock=read('config/sources.lock.json');
const curriculum=read('.sources/appendix/assets/curriculum.json');
const bank=read('dist/apps/morfologia/data/paradigmas.json');
const vocabulaData=readFileSync(join(root,'.sources/vocabula/data.js'),'utf8');
const items=compileGreekIrregularNouns({
  curriculum,vocabulaData,vocabulaSha:lock.sources.vocabula.sha,
  existingRecords:bank.records.filter(x=>!x.id.startsWith('griego-sustantivo-irregular-'))
});
test('cuatro irregulares de tercera, identificados con entrada real UD8',()=>{
  assert.equal(items.length,4);
  const previous=bank.records.filter(x=>x.id.startsWith('griego-sustantivo-irregular-'));
  assert.deepEqual(previous,items);
  for(const r of items){
    assert.equal(r.unit,8);
    assert.equal(r.kind,'sustantivo');
    assert.ok(r.gender);
    assert.ok(r.forms.length>=11);
    assert.equal(new Set(r.forms.map(f=>f.case+':'+f.number)).size,10);
    assert.ok(r.evidence.references.length>=2);
    assert.equal(r.evidence.vocabulaSha,lock.sources.vocabula.sha);
    assert.ok(r.forms.every(f=>!f.form.includes('(')&&!f.form.includes(')')));
  }
});
test('ἀνήρ, γυνή, πατήρ, μήτηρ tienen genitivos, vocativos y dativos correctos',()=>{
  const find=name=>items.find(r=>r.paradigm.startsWith(name+','));
  for(const [lemma,gen,voc,dat] of [
    ['ἀνήρ','ἀνδρός','ἄνερ','ἀνδράσι'],
    ['γυνή','γυναικός','γύναι','γυναιξί'],
    ['πατήρ','πατρός','πάτερ','πατράσι'],
    ['μήτηρ','μητρός','μῆτερ','μητράσι']]){
    const r=find(lemma);assert.ok(r);
    assert.equal(r.forms.find(f=>f.case==='genitivo'&&f.number==='singular').form,gen);
    assert.equal(r.forms.find(f=>f.case==='vocativo'&&f.number==='singular').form,voc);
    const variations=r.forms.filter(f=>f.case==='dativo'&&f.number==='plural').map(f=>f.form);
    assert.deepEqual(variations,[dat,dat+'ν']);
  }
});
test('no hay sintagmas prematuros; ν opcional es válida en los dos órdenes',()=>{
  const id=items.find(r=>r.paradigm.startsWith('ἀνήρ,')).id;
  const selected=new Set(['griego-articulo','griego-adj-agathos',
    'griego-adj-barbaros','griego-adj-megas',id]);
  const sub={...bank,records:bank.records.filter(r=>selected.has(r.id))};
  assert.equal(greekNounPhrasePairs(sub,{language:'griego',unit:8}).length,3);
  const questions=makeGreekNounPhraseTables(sub,{language:'griego',unit:8,
    limit:3,rng:()=>.2});
  const dat=questions.flatMap(q=>q.cells)
    .filter(c=>c.case==='dativo'&&c.number==='plural');
  assert.ok(dat.length>=1);
  assert.ok(dat.every(c=>c.acceptedForms.length===4));
});
