import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {auditLatinNounsAndVerbs,LATIN_NOMINAL_REFERENCE,LATIN_VERBAL_REFERENCE}
 from '../scripts/audit-latin-third-verbs.mjs';
import {correctWritten,makeWrittenQuestions} from '../public/morfologia/written.mjs';
const root=resolve(import.meta.dirname,'..');
const bank=JSON.parse(readFileSync(join(root,
 'dist/apps/morfologia/data/paradigmas.json'),'utf8'));
const audited=auditLatinNounsAndVerbs(bank);
const find=(id)=>bank.records.find(x=>x.id===id);

test('Matriz latina: tercera declinación y seis familias verbales por cursos',()=>{
 assert.equal(LATIN_NOMINAL_REFERENCE.length,6);
 assert.equal(LATIN_VERBAL_REFERENCE.length,6);
 assert.deepEqual(audited.counts,{
  nouns:{models:10,slots:120,readings:122},
  verbs:{models:68,slots:408,readings:408},
  teacher:{models:5,slots:30,readings:30}
 });
 assert.equal(new Set(audited.results.nouns.map(x=>x.id)).size,10);
 assert.equal(new Set(audited.results.verbs.map(x=>x.id)).size,68);
 assert.equal(new Set(audited.results.teacher.map(x=>x.id)).size,5);
 assert.equal(audited.unchangedOriginalBanks,true);
 for(const part of Object.values(audited.results))
  assert.ok(part.every(x=>x.sources.length>0&&x.unit<=8));
});
test('Los temas consonánticos, los temas en -i y los neutros no se confunden',()=>{
 const n=(language,lemma)=>audited.results.nouns.find(x=>
  x.course===language&&x.lemma===lemma);
 for(const language of ['latin','latin4']){
  for(const key of ['dux','civis','flumen','mare'])assert.ok(n(language,key));
  const model=(lemma)=>find(n(language,lemma).id);
  const forms=(lemma,cas,number)=>model(lemma).forms.filter(f=>
   f.case===cas&&f.number===number).map(f=>f.form);
  assert.deepEqual(forms('civis','acusativo','plural'),['cives','civis']);
  assert.deepEqual(forms('civis','genitivo','plural'),['civium']);
  assert.deepEqual(forms('dux','genitivo','plural'),['ducum']);
  assert.deepEqual(forms('flumen','genitivo','plural'),['fluminum']);
  assert.deepEqual(forms('mare','genitivo','plural'),['marium']);
  assert.deepEqual(forms('mare','nominativo','plural'),['maria']);
  assert.deepEqual(forms('mare','vocativo','plural'),['maria']);
  assert.deepEqual(forms('mare','acusativo','plural'),['maria']);
  assert.deepEqual(forms('mare','ablativo','singular'),['mari']);
  const q=makeWrittenQuestions({...bank,records:[model('civis')]},
   {language,unit:language==='latin'?4:5,limit:30,rng:()=>.31});
  const acc=q.find(x=>x.prompt==='Escribe la forma de acusativo plural.');
  assert.ok(acc);
  assert.deepEqual(acc.acceptedForms,['cives','civis']);
  assert.equal(correctWritten(acc,'civis').correct,true);
  assert.equal(correctWritten(acc,'cives').correct,true);
 }
 for(const lemma of ['rex','corpus']){
  const r=find(n('latin4',lemma).id);
  assert.ok(r&&r.unit===5);
  assert.equal(r.forms.length,12);
 }
});
test('Mixta, tercera y cuarta conjugación: presentes, imperfectos y perfectum',()=>{
 const rows=audited.results.verbs;
 const form=(language,lemma,tense,voice,person)=>{
  const m=rows.find(r=>r.course===language&&r.lemma===lemma&&
   r.tense===tense&&r.voice===voice);
  assert.ok(m,language+' '+lemma+' '+tense+' '+voice);
  return find(m.id).forms.find(f=>f.person===person)?.form;
 };
 for(const language of ['latin','latin4']){
  assert.equal(form(language,'capio','presente','activo','3.ª plural'),'capiunt');
  assert.equal(form(language,'capio','imperfecto','activo','1.ª singular'),'capiebam');
  assert.equal(form(language,'capio','presente','pasivo','2.ª singular'),'caperis');
  assert.equal(form(language,'capio','imperfecto','pasivo','1.ª plural'),'capiebamur');
  assert.equal(form(language,'duco','imperfecto','activo','1.ª singular'),'ducebam');
  assert.equal(form(language,'audio','imperfecto','pasivo','2.ª plural'),'audiebamini');
  assert.equal(form(language,'habeo','perfecto','activo','1.ª singular'),'habui');
  assert.equal(form(language,'duco','perfecto','activo','1.ª singular'),'duxi');
  assert.equal(form(language,'capio','pluscuamperfecto','activo','3.ª plural'),'ceperant');
  assert.equal(form(language,'sum','perfecto','activo','3.ª plural'),'fuerunt');
 }
});
test('Cotejo cerrado: lecturas alteradas fallan y no reescriben datos',()=>{
 for(const [record,match,form] of [
  [audited.results.nouns.find(x=>x.course==='latin'&&x.lemma==='mare'),
   x=>x.case==='ablativo'&&x.number==='singular','mare'],
  [audited.results.nouns.find(x=>x.course==='latin4'&&x.lemma==='civis'),
   x=>x.case==='genitivo'&&x.number==='plural','civum'],
  [audited.results.verbs.find(x=>x.course==='latin4'&&x.lemma==='capio'&&
     x.tense==='imperfecto'&&x.voice==='activo'),
   x=>x.person==='1.ª singular','capebam'],
  [audited.results.teacher.find(x=>x.id==='latin4-docente-lat-amo-perfect'),
   x=>x.person==='1.ª singular','amavius']
 ]){
  const r=find(record.id);
  const changed=bank.records.map(x=>x.id===r.id?{
   ...x,forms:x.forms.map(y=>match(y)?{...y,form}:y)}:x);
  assert.throws(()=>auditLatinNounsAndVerbs({...bank,records:changed}),
   /Lectura divergente/);
 }
});
