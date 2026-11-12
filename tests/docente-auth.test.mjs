import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {authorizeVerifiedTeacher} from '../supabase/functions/_shared/teacher-authorization.mjs';

const root=resolve(import.meta.dirname,'..');
function jwt(payload){
  const encoded=Buffer.from(JSON.stringify(payload)).toString('base64url');
  return 'eyJhbGciOiJub25lIn0.'+encoded+'.firma-de-pruebas';
}
const teacher={id:'00000000-0000-4000-8000-000000000111',is_anonymous:false};
const teacherId=teacher.id;
const claims={sub:teacher.id,aal:'aal2',role:'authenticated',exp:2000000000,is_anonymous:false};
const check=(payload=claims,user=teacher,uuid=teacherId)=>authorizeVerifiedTeacher({
  verifiedUser:user,accessToken:jwt(payload),teacherUserId:uuid,nowSeconds:1800000000
});

test('la autorización docente exige cuenta, sujeto y nivel aal2 verificados',()=>{
  assert.equal(check(),true);
  assert.equal(check({...claims,aal:'aal1'}),false);
  assert.equal(check({...claims,sub:'otro'}),false);
  assert.equal(check({...claims,exp:1000}),false);
  assert.equal(check({...claims,role:'anon'}),false);
  assert.equal(check({...claims,is_anonymous:true}),false);
  assert.equal(check(claims,{...teacher,is_anonymous:true}),false);
  assert.equal(check(claims,null),false);
  assert.equal(check(claims,teacher,'UUID-OTRA'),false);
  assert.equal(authorizeVerifiedTeacher({verifiedUser:teacher,accessToken:'false',teacherUserId:teacherId}),false);
});
test('el endpoint verifica el token en Supabase antes de interpretar claims y no escribe en los orígenes',()=>{
  const server=readFileSync(join(root,'supabase/functions/schola-inbox/index.ts'),'utf8');
  assert.match(server,/identity\.auth\.getUser\(match\[1\]\)/);
  assert.match(server,/authorizeVerifiedTeacher\(/);
  assert.match(server,/SCHOLA_TEACHER_USER_ID/);
  assert.match(server,/SCHOLA_ALLOWED_ORIGIN/);
  assert.ok(!server.includes("origin==='https://archaiosmagister.github.io'"));
  assert.match(server,/VOCABULA_SERVICE_ROLE_KEY/);
  assert.match(server,/PALABRA_SERVICE_ROLE_KEY/);
  assert.match(server,/\.eq\('status','pending'\)/);
  assert.match(server,/\.in\('status',\['pending','reviewing'\]\)/);
  assert.ok(!/\.insert\(|\.update\(|\.delete\(|\.upsert\(/.test(server));
  assert.ok(!server.includes('student_id'));
});
test('la zona docente se publica bloqueada por defecto, sin claves privilegiadas ni exámenes',()=>{
  const authConfig=JSON.parse(readFileSync(join(root,'dist/docente/auth-config.json'),'utf8'));
  assert.equal(authConfig.enabled,false,'CI no debe activar acceso docente');
  const html=readFileSync(join(root,'dist/docente/index.html'),'utf8');
  const js=readFileSync(join(root,'dist/docente/app.mjs'),'utf8');
  assert.match(html,/id="verify-code"/);
  assert.match(html,/id="enroll-code"/);
  assert.match(js,/getAuthenticatorAssuranceLevel/);
  assert.match(js,/challengeAndVerify/);
  assert.match(js,/persistSession:false/);
  assert.ok(!js.includes('localStorage'));
  assert.match(js,/client\.functions\.invoke\('schola-inbox'/);
  assert.ok(!js.includes('service_role'));
  assert.ok(!html.includes('GeneradorExamenes'));
  assert.equal(existsSync(join(root,'dist/apps/examenes')),false);
  assert.ok(readFileSync(join(root,'dist/index.html'),'utf8').includes('docente/index.html'));
});
