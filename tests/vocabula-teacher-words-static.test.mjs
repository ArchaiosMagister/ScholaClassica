import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {APPROVED_TEACHER_WORDS,integrateReviewedTeacherWords}
 from '../scripts/migrate-vocabula-teacher-words.mjs';

const root=resolve(import.meta.dirname,'..');
const parse=path=>JSON.parse(readFileSync(join(root,path),'utf8')
 .replace(/^window\.VOCAB\s*=\s*/,'').replace(/;\s*$/,''));
const source=parse('vendor/vocabula/data.js');
const final=parse('dist/apps/vocabulario/data.js');

test('Dos aportaciones de Ephesius se incorporan en Latín I y II sin reemplazar el banco histórico',()=>{
 assert.equal(source.length,2055);
 assert.equal(APPROVED_TEACHER_WORDS.length,2);
 assert.equal(final.length,2057);
 assert.equal(new Set(final.map(x=>x.id)).size,final.length);
 const sourceById=new Map(source.map(w=>[w.id,w]));
 for(const [id,item] of sourceById){
  const actual=final.find(w=>w.id===id);
  assert.ok(actual,'ID académico perdido: '+id);
  if(item.subject!=='lat4'&&item.subject!=='gr1')assert.deepEqual(actual,item,
   'No modificar una ficha histórica de '+item.subject);
 }
 for(const row of APPROVED_TEACHER_WORDS){
  const present=final.filter(w=>w.subject===row.subject&&
   w.mode==='general'&&w.form===row.form);
  assert.equal(present.length,1,'La aportación docente debe ser única por asignatura');
  assert.deepEqual(present[0],row);
  assert.equal(final.filter(w=>w.subject===row.subject&&
   w.mode==='examen'&&w.form===row.form).length,0,
   'No incluir Ephesius en Examen sin autorización');
  assert.equal(row.answers.length,2);
  assert.match(row.id,/^custom-[\da-f-]+-general$/);
 }
 assert.deepEqual(APPROVED_TEACHER_WORDS.map(x=>x.subject),['lat1','lat2']);
 assert.deepEqual(APPROVED_TEACHER_WORDS.map(x=>x.units),[['UD 10'],['Adjetivos']]);
});

test('Un cambio de fuente que duplique Ephesius provoca error y exige revisión',()=>{
 const reviewed=integrateReviewedTeacherWords(source);
 assert.equal(reviewed.length,2057);
 assert.throws(()=>integrateReviewedTeacherWords(reviewed),/2055 fichas auditadas/);
 const collision=[...source.slice(0,-1),{...source.at(-1),
  subject:'lat1',mode:'general',form:'Ephesius, –a, –um'}];
 assert.throws(()=>integrateReviewedTeacherWords(collision),/Existe una ficha académica/);
});
