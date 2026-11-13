import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {compileGreekNounBatch} from '../scripts/greek-noun-conciliation.mjs';
import {compileGreekNounExpansion} from '../scripts/greek-noun-bulk.mjs';
import {readGreekNounSource} from '../scripts/greek-noun-conciliation.mjs';
import {availableRecords} from '../public/morfologia/engine.mjs';
import {greekNounPhrasePairs,makeGreekNounPhraseTables}
  from '../public/morfologia/greek-noun-phrases.mjs';

const root=resolve(import.meta.dirname,'..');
const lock=JSON.parse(readFileSync(join(root,'config/sources.lock.json'),'utf8'));
const curriculum=JSON.parse(readFileSync(join(root,'.sources/appendix/assets/curriculum.json'),'utf8'));
const bank=JSON.parse(readFileSync(join(root,'dist/apps/morfologia/data/paradigmas.json'),'utf8'));
const src=await readGreekNounSource(join(root,'.sources/vocabula'));
const input={curriculum,...src,vocabulaSha:lock.sources.vocabula.sha};
const legacy=compileGreekNounBatch(input);
const rerun=(changes={})=>compileGreekNounExpansion({...input,existingRecords:legacy,...changes});
const result=rerun();

test('ampliación no manual: importa un lote verificable, sin duplicar los ocho testigos',()=>{
  assert.ok(result.records.length>=10,'El banco debe ganar bastantes más de ocho nombres');
  assert.ok(bank.records.length>92+result.records.length,'También contiene nuevos nombres latinos');
  assert.deepEqual(bank.records.slice(84,92),legacy);
  assert.deepEqual(bank.records.slice(92,92+result.records.length),result.records);
  assert.equal(result.audit.incorporated,result.records.length);
  assert.equal(result.audit.reviewNeeded,result.review.length);
  assert.equal(result.audit.sourceSha,lock.sources.vocabula.sha);
  assert.ok(result.review.length>0,'Deben existir candidatos apartados por evidencia insuficiente');
  assert.equal(new Set(bank.records.map(r=>r.id)).size,bank.records.length);
});

test('las entradas nuevas tienen 10 casillas, unitad curricular, género y procedencia',()=>{
  const tags=new Set(['nominativo','vocativo','acusativo','genitivo','dativo']
    .flatMap(c=>['singular','plural'].map(n=>c+':'+n)));
  for(const record of result.records){
    assert.ok([4,5,7,8,9,10].includes(record.unit));
    assert.ok(!record.gender||['masculino','femenino','neutro'].includes(record.gender));
    assert.ok(record.evidence.genderEvidence);
    assert.ok(record.forms.length>=10,'Diez casillas y posibles variantes documentadas');
    assert.deepEqual(new Set(record.forms.map(f=>f.case+':'+f.number)),tags);
    assert.ok(record.forms.every(f=>f.form===f.form.normalize('NFC')));
    assert.ok(record.forms.every(f=>!/[\u0304\u0306]/u.test(f.form.normalize('NFD'))));
    assert.equal(record.evidence.vocabulaSha,lock.sources.vocabula.sha);
    assert.equal(record.evidence.license,'CC BY-SA 3.0');
    assert.match(record.evidence.review,/pendiente de revisión docente/);
    assert.ok(record.evidence.vocabulaEntry);
    assert.equal(record.evidence.status,'paradigma-documentado');
  }
  assert.ok(result.records.some(r=>r.paradigm.includes('βιβλίον')));
  assert.ok(result.records.some(r=>r.paradigm.includes('ἀγορά')));
  assert.ok(result.records.some(r=>r.paradigm.includes('ναύτης')));
  assert.ok(result.records.some(r=>r.paradigm.includes('ἄνθρωπος')&&!r.gender));
  assert.ok(result.records.some(r=>r.evidence.genderEvidence),
    'El género conserva trazabilidad de la evidencia lexicográfica');
});

test('la selección de unidad y los sintagmas mantienen coherencia',()=>{
  assert.equal(availableRecords(bank,{language:'griego',unit:3,kind:'sustantivo'}).length,0);
  const at4=availableRecords(bank,{language:'griego',unit:4,kind:'sustantivo'});
  const at5=availableRecords(bank,{language:'griego',unit:5,kind:'sustantivo'});
  const at7=availableRecords(bank,{language:'griego',unit:7,kind:'sustantivo'});
  assert.ok(at4.length>4&&at5.length>=at4.length&&at7.length>at5.length);
  assert.equal(greekNounPhrasePairs(bank,{language:'griego',unit:7}).length,
    at7.filter(r=>r.gender).length*3);
  assert.ok(!at7.some(r=>r.paradigm.includes('πατρίς')||r.paradigm.includes('σῶμα')));
  const at8=availableRecords(bank,{language:'griego',unit:8,kind:'sustantivo'});
  assert.ok(at8.length>at7.length,'Los nombres de tercera consonántica entran en UD8');
  assert.ok(!at7.some(r=>r.evidence.topic==='Tercera declinación: consonantes'));
  assert.ok(at8.some(r=>r.evidence.topic==='Tercera declinación: consonantes'));
  assert.ok(at8.some(r=>r.paradigm.includes('ἄνθρωπος')&&!r.gender));
});

test('al alterar datos faltantes, no se habilita una ficha inferida',()=>{
  const changed=structuredClone(src.unimorphParts);
  for(const part of changed){
    const ix=part.findIndex(r=>r[0]==='βιβλίον'&&r[2]==='N;DAT;PL');
    if(ix>=0){part.splice(ix,1);break}
  }
  const downgraded=rerun({unimorphParts:changed});
  assert.ok(!downgraded.records.some(r=>r.paradigm.includes('βιβλίον')));
  assert.ok(downgraded.review.some(r=>r.lemma.normalize('NFD').startsWith('βιβλ')));
  assert.throws(()=>rerun({vocabulaSha:'main'}),/SHA de Vocabula no fijado/);
});


test('UD8 recupera géneros docentes explícitos y las variantes de ν eufónica',()=>{
  const goat=result.records.find(r=>r.paradigm.startsWith('αἴξ,'));
  assert.ok(goat,'αἴξ con acepción femenina declarada debe incorporarse');
  assert.equal(goat.gender,'femenino');
  assert.match(goat.evidence.genderEvidence,/docente/);
  assert.ok(result.records.some(r=>r.paradigm.startsWith('ἄνθρωπος,')&&!r.gender),
    'El nombre se declina, pero no se atribuye género arbitrario a ἄνθρωπος');
  const elder=result.records.find(r=>r.paradigm.startsWith('γέρων,'));
  assert.ok(elder,'γέρων con artículo docente y casillas atestiguadas');
  assert.equal(elder.unit,8);
  const dat=elder.forms.filter(f=>f.case==='dativo'&&f.number==='plural').map(f=>f.form);
  assert.equal(dat.length,2);
  assert.ok(dat.every(f=>!f.includes('(')&&!f.includes(')')));
  assert.equal(dat[0]+'ν',dat[1]);
  const ids=new Set(['griego-articulo','griego-adj-agathos',
    'griego-adj-barbaros','griego-adj-megas',elder.id]);
  const subset={...bank,records:bank.records.filter(r=>ids.has(r.id))};
  const pairs=greekNounPhrasePairs(subset,{language:'griego',unit:8});
  assert.equal(pairs.length,3);
  const tables=makeGreekNounPhraseTables(subset,{
    language:'griego',unit:8,limit:3,rng:()=>.25});
  assert.ok(tables.length>=1);
  const cells=tables.flatMap(t=>t.cells).filter(c=>c.case==='dativo'&&c.number==='plural');
  assert.ok(cells.length>=1);
  assert.ok(cells.every(c=>c.acceptedForms.length===4),
    'ν opcional por dos posiciones atributivas produce cuatro opciones válidas');
});
