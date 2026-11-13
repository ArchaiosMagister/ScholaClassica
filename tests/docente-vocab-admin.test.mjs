import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {
  validateWordInput,validateWordFilter,validateReportReview,validateReportFilter
} from '../supabase/functions/_shared/vocab-admin-policy.mjs';

const root=resolve(import.meta.dirname,'..');
const src=path=>readFileSync(resolve(root,path),'utf8');
const uuid='00000000-0000-4000-8000-000000000111';
const validWord={subject:'gr1',form:'λόγος, –ου (ὁ)',meaning:'palabra',
  answers:['palabra','razón'],units:['UD1','UD2'],in_exam:true,active:true};
test('El editor conserva las formas griegas, las unidades y el vocabulario de examen',()=>{
  const data=validateWordInput(validWord);
  assert.equal(data.id,null);
  assert.equal(data.payload.form,validWord.form);
  assert.equal(data.payload.form_key,validWord.form.toLowerCase());
  assert.deepEqual(data.payload.answers,validWord.answers);
  assert.equal(data.payload.in_exam,true);
  assert.equal(validateWordInput({...validWord,id:uuid}).id,uuid);
  assert.equal(validateWordInput({...validWord,subject:'admin'}),null);
  assert.equal(validateWordInput({...validWord,id:'otro'}),null);
  assert.equal(validateWordInput({...validWord,answers:[]}),null);
  assert.equal(validateWordInput({...validWord,units:['UD1',3]}),null);
  assert.equal(validateWordInput({...validWord,form:'x'.repeat(301)}),null);
  assert.equal(validateWordInput({...validWord,in_exam:'true'}),null);
  assert.equal(validateWordInput({...validWord,active:null}),null);
  assert.deepEqual(validateWordInput({...validWord,subject:'lat1',units:['UD10','UD 10']}).payload.units,['UD 10']);
  assert.deepEqual(validateWordInput({...validWord,subject:'lat2',units:['Verbos']}).payload.units,['Verbos']);
  assert.equal(validateWordInput({...validWord,subject:'lat2',units:['UD 10']}),null);
  assert.equal(validateWordInput({...validWord,subject:'lat2',units:['Sustantivos','Verbos']}),null);
});
test('Los filtros de búsqueda y paginación no permiten consultas arbitrarias',()=>{
  assert.deepEqual(validateWordFilter({}),{offset:0,subject:'',search:'',pageSize:50});
  assert.deepEqual(validateWordFilter({offset:50,subject:'lat4',search:'ἄνθρωπος'}),
    {offset:50,subject:'lat4',search:'ἄνθρωπος',pageSize:50});
  assert.equal(validateWordFilter({search:'x%,id.eq.foo'}),null);
  assert.equal(validateWordFilter({search:'x"'}),null);
  assert.equal(validateWordFilter({subject:'other'}),null);
  assert.equal(validateWordFilter({offset:-1}),null);
  assert.equal(validateWordFilter({offset:1.2}),null);
  assert.deepEqual(validateReportFilter({}),{status:'pending',area:'all',offset:0,pageSize:50});
  assert.deepEqual(validateReportFilter({area:'grammar'}),{status:'pending',area:'grammar',offset:0,pageSize:50});
  assert.deepEqual(validateReportFilter({area:'vocabula',status:''}),{status:'',area:'vocabula',offset:0,pageSize:50});
  assert.equal(validateReportFilter({area:'student'}),null);
  assert.equal(validateReportFilter({status:'evil'}),null);
  assert.equal(validateReportFilter({offset:1.5}),null);
});
test('Revisión de avisos: estados cerrados, notas con límites y UUID obligatoria',()=>{
  assert.deepEqual(validateReportReview({id:uuid,status:'resolved',teacher_note:'Revisado'}),
    {id:uuid,status:'resolved',teacher_note:'Revisado'});
  assert.equal(validateReportReview({id:uuid,status:'publish',teacher_note:''}),null);
  assert.equal(validateReportReview({id:uuid,status:'pending',teacher_note:'x'.repeat(2001)}),null);
  assert.equal(validateReportReview({id:'1',status:'pending',teacher_note:''}),null);
});
test('Todas las operaciones exigen JWT, UUID y AAL2, jamás códigos anteriores',()=>{
  const server=src('supabase/functions/schola-vocab-admin/index.ts');
  const toml=src('supabase/config.toml');
  assert.match(server,/getUser\(match\[1\]\)/);
  assert.match(server,/authorizeVerifiedTeacher/);
  assert.match(server,/getAuthenticatorAssuranceLevel\(match\[1\]\)/);
  assert.match(server,/SCHOLA_TEACHER_USER_ID/);
  assert.match(server,/SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(toml,/\[functions\.schola-vocab-admin\]\s+verify_jwt = true/);
  assert.doesNotMatch(server,/vocab_sessions|vocab_settings|teacher-code/);
  assert.doesNotMatch(server,/\.(?:delete|upsert)\(/);
  assert.match(server,/return reply\(409/);
  assert.match(server,/\.order\('id'/);
});
test('La interfaz nunca interpreta HTML del alumnado y reinicia los datos al cerrar sesión',()=>{
  const client=src('public/docente/admin-vocabula.mjs');
  const page=src('public/docente/app.mjs');
  const html=src('public/docente/index.html');
  assert.doesNotMatch(client,/innerHTML|sessionStorage|localStorage/);
  assert.match(client,/textContent/);
  assert.match(client,/resetVocabulaAdmin/);
  assert.match(client,/reports.review/);
  assert.match(client,/words.save/);
  assert.match(client,/Preparar palabra nueva/);
  assert.match(client,/admin-words-prev/);
  assert.match(client,/admin-search-form/);
  assert.match(client,/showGrammarReports/);
  assert.match(client,/admin-report-area/);
  assert.match(page,/mountVocabulaAdmin/);
  assert.match(page,/resetVocabulaAdmin/);
  assert.match(html,/id="admin-word-form"/);
  assert.match(html,/id="admin-report-list"/);
  assert.match(html,/id="notice-source"/);
});
