import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {
  validateWordInput,validateReportReview,validateReportFilter
} from '../supabase/functions/_shared/vocab-admin-policy.mjs';
const root=resolve(import.meta.dirname,'..');
const ID='00000000-0000-4000-8000-000000000111';
const word={subject:'gr1',form:'λόγος, –ου (ὁ)',meaning:'palabra',
  answers:['palabra','razón'],units:['UD1','UD2'],in_exam:true,active:true};
test('valida sin ambigüedad el vocabulario que puede editar el profesor',()=>{
  const result=validateWordInput(word);
  assert.equal(result.id,null);
  assert.equal(result.payload.form,word.form);
  assert.equal(result.payload.form_key,word.form.toLowerCase());
  assert.equal(result.payload.in_exam,true);
  assert.equal(validateWordInput({...word,id:ID}).id,ID);
  assert.equal(validateWordInput({...word,subject:'alumnos'}),null);
  assert.equal(validateWordInput({...word,answers:[]}),null);
  assert.equal(validateWordInput({...word,units:['UD1',12]}),null);
  assert.equal(validateWordInput({...word,form:'x'.repeat(301)}),null);
  assert.equal(validateWordInput({...word,id:'no-uuid'}),null);
  assert.equal(validateWordInput({...word,active:'true'}),null);
});
test('solo admite estados y anotaciones docentes con limites explícitos',()=>{
  assert.deepEqual(validateReportReview({id:ID,status:'resolved',teacher_note:'Revisado'}),
    {id:ID,status:'resolved',teacher_note:'Revisado'});
  assert.equal(validateReportReview({id:ID,status:'published',teacher_note:''}),null);
  assert.equal(validateReportReview({id:ID,status:'pending',teacher_note:'x'.repeat(2001)}),null);
  assert.equal(validateReportReview({id:'1',status:'pending',teacher_note:''}),null);
  assert.deepEqual(validateReportFilter({}),{status:'pending',offset:0});
  assert.equal(validateReportFilter({status:'todos'}),null);
  assert.equal(validateReportFilter({offset:-1}),null);
  assert.equal(validateReportFilter({offset:1.5}),null);
});
test('la administración remota requiere UUID exacta, AAL2 y nunca acepta sesiones heredadas',()=>{
  const server=readFileSync(resolve(root,'supabase/functions/schola-vocab-admin/index.ts'),'utf8');
  const toml=readFileSync(resolve(root,'supabase/config.toml'),'utf8');
  assert.match(server,/auth\.getUser\(match\[1\]\)/);
  assert.match(server,/authorizeVerifiedTeacher/);
  assert.match(server,/SCHOLA_TEACHER_USER_ID/);
  assert.match(server,/VOCABULA_SERVICE_ROLE_KEY/);
  assert.match(toml,/\[functions\.schola-vocab-admin\]\s+verify_jwt = true/);
  assert.doesNotMatch(server,/vocab_sessions|teacher-code|teacher_codes|student_id/);
  assert.doesNotMatch(server,/\.delete\(|\.upsert\(/);
});
