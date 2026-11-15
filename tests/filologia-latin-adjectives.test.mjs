import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {auditLatinAdjectiveRisk,LATIN_ADJECTIVES_RISK_REFERENCE}
 from '../scripts/audit-latin-adjectives.mjs';
import {correctWritten,makeWrittenQuestions}
 from '../public/morfologia/written.mjs';

const root=resolve(import.meta.dirname,'..');
const bank=JSON.parse(readFileSync(join(root,
 'dist/apps/morfologia/data/paradigmas.json'),'utf8'));
const read=id=>bank.records.find(r=>r.id===id);
test('Latín I y 4.º: diez paradigmas, 360 casillas con orden de casos y género contrastado',()=>{
 assert.equal(LATIN_ADJECTIVES_RISK_REFERENCE.length,5);
 const audit=auditLatinAdjectiveRisk(bank);
 assert.equal(audit.checkedModels,10);
 assert.equal(audit.checkedSlots,360);
 assert.deepEqual(audit.results.map(x=>x.slotsChecked),Array(10).fill(36));
 assert.equal(new Set(audit.results.map(x=>x.id)).size,10);
 assert.ok(audit.results.every(x=>x.source.length>0&&x.unit<=8));
 assert.ok(audit.noAutomaticNewForms);
});
test('Los adjetivos de tercera distinguen -i/-ium frente a vetere/veterum',()=>{
 for(const language of ['latin','latin4']){
  const prefix=language==='latin4'?'latin4-appendix-':'';
  const id=x=>language==='latin'?'latin-adj-'+x:prefix+'latin-adj-'+x;
  const get=(name,cas,gender,number)=>read(id(name)).forms.find(f=>
    f.case===cas&&f.gender===gender&&f.number===number).form;
  assert.equal(get('acer','vocativo','masculino','singular'),'acer');
  assert.equal(get('acer','ablativo','neutro','singular'),'acri');
  assert.equal(get('acer','nominativo','neutro','plural'),'acria');
  assert.equal(get('brevis','genitivo','femenino','plural'),'brevium');
  assert.equal(get('audax','ablativo','femenino','singular'),'audaci');
  assert.equal(get('audax','nominativo','neutro','plural'),'audacia');
  assert.equal(get('vetus','ablativo','neutro','singular'),'vetere');
  assert.equal(get('vetus','genitivo','masculino','plural'),'veterum');
  assert.equal(get('vetus','nominativo','neutro','plural'),'vetera');
 }
 for(const [language,id,unit] of [
   ['latin','latin-ud2-adjetivo-bonus',2],
   ['latin4','latin4-appendix-bonus',3]
 ]){
  const record=read(id);
  const voc=record.forms.find(f=>f.case==='vocativo'&&
    f.gender==='masculino'&&f.number==='singular');
  const abl=record.forms.find(f=>f.case==='ablativo'&&
    f.gender==='femenino'&&f.number==='singular');
  assert.equal(voc.form,'bone');
  assert.equal(abl.form,'bonā');
  const written=makeWrittenQuestions({...bank,records:[record]},
   {language,unit,limit:30,rng:()=>.39});
  const candidate=written.find(q=>q.prompt==='Escribe la forma de vocativo masculino singular.');
  assert.ok(candidate,id);
  assert.equal(correctWritten(candidate,'bone').correct,true);
  assert.equal(correctWritten(candidate,'bonus').correct,false);
 }
});
test('La matriz rechaza formas corruptas sin actualizar fuentes ni progreso',()=>{
 for(const [id,caseName,gender,number,wrong] of [
  ['latin-adj-acer','vocativo','masculino','singular','acre'],
  ['latin4-appendix-latin-adj-acer','vocativo','masculino','singular','acre'],
  ['latin-adj-vetus','ablativo','neutro','singular','veteri'],
  ['latin4-appendix-latin-adj-audax','genitivo','neutro','plural','audacum'],
  ['latin4-appendix-bonus','vocativo','masculino','singular','bonus']
 ]){
  const records=bank.records.map(r=>r.id!==id?r:{
    ...r,forms:r.forms.map(f=>f.case===caseName&&f.gender===gender&&
     f.number===number?{...f,form:wrong}:f)});
  assert.throws(()=>auditLatinAdjectiveRisk({...bank,records}),
   /Forma discordante/);
 }
});
