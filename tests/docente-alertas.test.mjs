import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const code=path=>readFileSync(resolve(root,path),'utf8');
test('Las dos fuentes exigen verificación de usuario y TOTP antes de consultar',()=>{
 const vocab=code('supabase/functions/schola-inbox/index.ts');
 const palabra=code('supabase/functions/schola-palabra-inbox/index.ts');
 for(const source of [vocab,palabra]){
   assert.match(source,/auth\.getUser\(match\[1\]\)/);
   assert.match(source,/authorizeVerifiedTeacher/);
   assert.match(source,/SUPABASE_SERVICE_ROLE_KEY/);
   assert.ok(source.indexOf('getUser(match[1])')<source.indexOf("from('"));
   assert.doesNotMatch(source,/\.insert\(|\.update\(|\.delete\(|\.upsert\(/);
   assert.doesNotMatch(source,/student_id|student_code|student_email/);
 }
 assert.match(vocab,/SCHOLA_TEACHER_USER_ID/);
 assert.match(palabra,/teacherFingerprintMatches/);
 assert.match(palabra,/IDENTITY_URL/);
 assert.doesNotMatch(palabra,/PALABRA_SERVICE_ROLE_KEY|SCHOLA_AUTH_LOGIN_EMAIL/);
});
test('Los avisos no se guardan sin conexión ni usan HTML de alumnado',()=>{
 const js=code('public/docente/app.mjs');
 const html=code('public/docente/index.html');
 assert.match(js,/Promise\.allSettled/);
 assert.match(js,/client\.functions\.invoke\('schola-inbox'/);
 assert.match(js,/schola-palabra-inbox/);
 assert.match(js,/item\.source==='palabra'/);
 assert.match(js,/detail\.textContent=/);
 assert.doesNotMatch(js,/innerHTML|localStorage|sessionStorage/);
 assert.match(html,/id="notice-source"/);
 assert.match(html,/id="sources-state"/);
});
