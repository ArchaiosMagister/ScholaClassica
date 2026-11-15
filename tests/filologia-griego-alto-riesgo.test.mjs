import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {auditGreekRiskParadigms,GREEK_RISK_REFERENCE}
 from '../scripts/audit-greek-high-risk.mjs';
import {correctWritten,makeWrittenQuestions,makeTableExercises}
 from '../public/morfologia/written.mjs';

const root=resolve(import.meta.dirname,'..');
const bank=JSON.parse(readFileSync(join(root,
 'dist/apps/morfologia/data/paradigmas.json'),'utf8'));
const audited=auditGreekRiskParadigms(bank);
const get=id=>bank.records.find(r=>r.id===id);

test('Griego I: 110 casillas contrastadas, con seis lecturas alternativas y SHA de fuentes',()=>{
 assert.equal(GREEK_RISK_REFERENCE.length,7);
 assert.equal(audited.totalParadigms,7);
 assert.equal(audited.totalSlotsChecked,110);
 assert.equal(audited.totalReadingsChecked,116);
 assert.deepEqual(audited.results.map(r=>r.individualSlotsChecked),
  [10,10,10,10,10,30,30]);
 assert.deepEqual(audited.results.map(r=>r.individualReadingsChecked),
  [11,11,11,11,11,30,31]);
 assert.ok(audited.results.every(r=>
  r.independentReferences.length>0&&
  r.status==='contrastado-por-casilla-con-tabla-gramatical'));
 for(const result of audited.results){
  const r=get(result.id);
  assert.ok(r&&r.language==='griego');
  assert.equal(r.unit,result.unit);
 }
});
test('Las flexiones de vocativo atestiguadas no se confunden con errores ni notas',()=>{
 const checks=[
  ['griego-ud8-noun-113-0-0','ἐλπί','ἐλπί*'],
  ['griego-ud8-noun-115-0-1','ἡγεμών','ἡγεμόν'],
  ['griego-ud8-noun-119-0-0','ῥῆτορ','ῥήτορ'],
  ['griego-ud8-noun-119-1-0','πάτερ','πατήρ'],
  ['griego-ud8-noun-119-1-1','ἄνερ','ἀνήρ']
 ];
 for(const [id,accepted,rejected] of checks){
  const record=get(id);
  const questions=makeWrittenQuestions({...bank,records:[record]},
   {language:'griego',unit:8,limit:30,rng:()=>.29});
  const q=questions.find(x=>x.prompt==='Escribe la forma de vocativo singular.');
  assert.ok(q,id+' sin pregunta de vocativo');
  assert.ok(q.acceptedForms.includes(accepted));
  assert.equal(correctWritten(q,accepted).correct,true,id);
  assert.equal(correctWritten(q,rejected).correct,false,id);
 }
 const adjective=get('griego-adj-megas');
 const tables=makeTableExercises({...bank,records:[adjective]},
  {language:'griego',unit:5,limit:10,rng:()=>.42});
 const masc=tables.find(q=>q.gender==='masculino');
 assert.ok(masc);
 const cell=masc.cells.find(c=>c.id==='vocativo:singular');
 assert.deepEqual(cell?.acceptedForms,['μεγάλε','μέγας']);
 const polys=get('griego-adj-polys');
 const voc=polys.forms.find(f=>f.case==='vocativo'&&
   f.gender==='masculino'&&f.number==='singular');
 assert.equal(voc.form,'πολύς','No inferir *πολλέ como vocativo escolar');
});
test('La auditoría rechaza mutaciones filológicas y duplicados, sin reparar automáticamente',()=>{
 const replacements=[
  ['griego-ud8-noun-115-0-1','vocativo','singular','ἡγεμόν'],
  ['griego-ud8-noun-119-0-0','vocativo','singular','ῥήτορ'],
  ['griego-ud8-noun-113-0-0','vocativo','singular','ἐλπί*']
 ];
 for(const [id,cas,number,wrong] of replacements){
  const records=bank.records.map(r=>r.id!==id?r:
    {...r,forms:r.forms.map(f=>f.case===cas&&f.number===number?
      {...f,form:wrong}:f)});
  assert.throws(()=>auditGreekRiskParadigms({...bank,records}),
   /Lectura de paradigma discordante/);
 }
 const id='griego-adj-megas';
 const records=bank.records.map(r=>r.id!==id?r:
  {...r,forms:r.forms.filter(f=>!(f.form==='μέγας'&&
    f.case==='vocativo'&&f.gender==='masculino'&&f.number==='singular'))});
 assert.throws(()=>auditGreekRiskParadigms({...bank,records}),
  /Lectura de paradigma discordante/);
});
