import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {auditLatinRemainingCurricularForms,LATIN_EXTRA_NOUNS,
 LATIN_EXTRA_FUTURES,LATIN_EXTRA_DEPONENTS,LATIN_EXTRA_IMPERATIVES,
 LATIN4_DOCENT_IMPERFECTS} from '../scripts/audit-latin-remaining.mjs';
import {makeWrittenQuestions,correctWritten,makeTableExercises}
 from '../public/morfologia/written.mjs';
const root=resolve(import.meta.dirname,'..');
const bank=JSON.parse(readFileSync(join(root,
 'dist/apps/morfologia/data/paradigmas.json'),'utf8'));
const single=id=>bank.records.find(r=>r.id===id);
const audit=auditLatinRemainingCurricularForms(bank);
test('Latín I y 4.º: 35 modelos pendientes con 262 casillas auditadas',()=>{
 assert.deepEqual(Object.keys(LATIN_EXTRA_NOUNS),['exercitus','cornu','res']);
 assert.equal(Object.keys(LATIN_EXTRA_FUTURES.activo).length,5);
 assert.equal(Object.keys(LATIN_EXTRA_FUTURES.pasivo).length,5);
 assert.equal(Object.keys(LATIN_EXTRA_DEPONENTS).length,5);
 assert.equal(Object.keys(LATIN_EXTRA_IMPERATIVES).length,5);
 assert.equal(Object.keys(LATIN4_DOCENT_IMPERFECTS).length,10);
 assert.deepEqual(audit.counts,
  {nominal:8,futures:11,deponents:5,imperatives:1,teacherImperfect:10});
 assert.deepEqual(audit.slots,
  {nominal:96,futures:66,deponents:30,imperatives:10,teacherImperfect:60});
 assert.equal(audit.readingsChecked,262);
 const ids=Object.values(audit.results).flat().map(x=>x.id);
 assert.equal(ids.length,35);
 assert.equal(new Set(ids).size,ids.length);
 assert.equal(audit.findings.sourceErrata.length,0);
 assert.equal(audit.findings.teacherReservations.length,1);
 for(const r of Object.values(audit.results).flat()){
  assert.ok(single(r.id)?.forms,'Falta ficha original '+r.id);
  assert.ok(r.source.startsWith('https://'),'Falta cita contrastiva '+r.id);
 }
});
test('Cuarta y quinta: identidad neutra, vocal larga y registros originales sin macrón',()=>{
 for(const language of ['latin','latin4']){
  const id=x=>(language==='latin'?'latin-ud7-':'latin4-appendix-latin-ud7-')+x;
  const form=(lemma,cas,number)=>single(id(lemma)).forms.find(f=>
    f.case===cas&&f.number===number)?.form;
  assert.equal(form('cornu','nominativo','singular'),'cornū');
  assert.equal(form('cornu','vocativo','singular'),'cornū');
  assert.equal(form('cornu','acusativo','singular'),'cornū');
  assert.equal(form('cornu','nominativo','plural'),'cornua');
  assert.equal(form('cornu','genitivo','plural'),'cornuum');
  assert.equal(form('exercitus','genitivo','plural'),'exercituum');
  assert.equal(form('exercitus','dativo','singular'),'exercitui');
  assert.equal(form('res','genitivo','plural'),'rerum');
  assert.equal(form('res','dativo','plural'),'rebus');
  assert.equal(form('res','acusativo','singular'),'rem');
  const unit=language==='latin'?7:8;
  const p=single(id('cornu'));
  const q=makeWrittenQuestions({...bank,records:[p]},
   {language,unit,limit:30,rng:()=>.37});
  assert.equal(correctWritten(q.find(x=>x.prompt.includes('nominativo plural')),'cornua').correct,true);
  assert.equal(correctWritten(q.find(x=>x.prompt.includes('nominativo plural')),'cornū').correct,false);
 }
 for(const lemma of ['exercitus','res']){
  const doc=single('latin4-docente-lat-'+lemma);
  assert.equal(doc.unit,8);
  assert.equal(doc.forms.length,12);
 }
 assert.equal(single('latin4-docente-lat-exercitus').forms
  .find(x=>x.case==='genitivo'&&x.number==='singular').form,'exercitus');
});
test('Futuro: alternancia -bo/-am y las cinco conjugaciones separadas de sum',()=>{
 const active=(lemma,person)=>single('latin-ud7-futuro-activa-'+lemma).forms
  .find(f=>f.person===person)?.form;
 const passive=(lemma,person)=>single('latin-ud7-futuro-pasiva-'+lemma).forms
  .find(f=>f.person===person)?.form;
 assert.equal(active('amo','1.ª singular'),'amabo');
 assert.equal(active('habeo','1.ª singular'),'habebo');
 assert.equal(active('duco','1.ª singular'),'ducam');
 assert.equal(active('audio','1.ª singular'),'audiam');
 assert.equal(active('capio','1.ª singular'),'capiam');
 assert.equal(passive('duco','2.ª singular'),'duceris');
 assert.equal(passive('capio','2.ª singular'),'capieris');
 assert.equal(passive('amo','3.ª plural'),'amabuntur');
 assert.equal(single('latin-ud7-futuro-sum').forms.find(x=>
  x.person==='3.ª plural').form,'erunt');
 assert.ok(!audit.results.future.some(x=>x.course==='latin4'),
  'El futuro no puede adelantarse al curso de 4.º');
});
test('Deponentes: cinco clases, paradigma de sentido activo e imperativo duc',()=>{
 const orior=single('latin-ud7-deponente-orior');
 assert.equal(orior.forms.find(x=>x.person==='2.ª singular').form,'oriris');
 assert.equal(orior.forms.find(x=>x.person==='3.ª plural').form,'oriuntur');
 const sequor=single('latin-ud7-deponente-sequor');
 assert.equal(sequor.forms.find(x=>x.person==='3.ª singular').form,'sequitur');
 assert.ok(sequor.forms.every(x=>x.voice.includes('deponente, sentido activo')));
 const imperative=single('latin-ud3-imperativos');
 const duc=imperative.forms.find(x=>x.analysis.includes('duco (')&&x.number==='singular');
 assert.equal(duc.form,'duc');
 const cap=imperative.forms.find(x=>x.analysis.includes('capio (')&&x.number==='singular');
 assert.equal(cap.form,'cape');
 assert.ok(!imperative.forms.some(x=>x.form==='duce'||x.form==='face'));
});
test('Imperfectos docentes de 4.º: sin contaminación entre conjugaciones',()=>{
 const forms=(lemma)=>single('latin4-docente-lat-'+lemma+'-imperfect').forms;
 for(const lemma of Object.keys(LATIN4_DOCENT_IMPERFECTS)){
  assert.equal(forms(lemma).length,6);
  assert.equal(single('latin4-docente-lat-'+lemma+'-imperfect').unit,4);
 }
 assert.equal(forms('capio')[0].form,'capiebam');
 assert.equal(forms('duco')[0].form,'ducebam');
 assert.equal(forms('audio')[0].form,'audiebam');
 assert.equal(forms('pugno')[0].form,'pugnabam');
 assert.equal(forms('lego')[5].form,'legebant');
});
test('Una corrupción de forma no se acepta ni modifica el banco histórico',()=>{
 const samples=[
  ['latin-ud7-cornu',f=>f.case==='nominativo'&&f.number==='plural','cornus'],
  ['latin4-docente-lat-exercitus',f=>f.case==='genitivo'&&f.number==='plural','exercitum'],
  ['latin-ud7-futuro-activa-capio',f=>f.person==='1.ª singular','capebo'],
  ['latin-ud7-deponente-orior',f=>f.person==='3.ª plural','orunt'],
  ['latin-ud3-imperativos',f=>f.analysis.includes('duco (')&&f.number==='singular','duce'],
  ['latin4-docente-lat-capio-imperfect',f=>f.person==='1.ª singular','capebam']
 ];
 const original=JSON.stringify(bank.records);
 for(const [id,isTarget,wrong] of samples){
  const records=bank.records.map(r=>r.id===id?{
   ...r,forms:r.forms.map(f=>isTarget(f)?{...f,form:wrong}:f)}:r);
  assert.throws(()=>auditLatinRemainingCurricularForms({...bank,records}),
   /Casilla discordante/,'No se detectó '+id);
 }
 assert.equal(JSON.stringify(bank.records),original);
});
