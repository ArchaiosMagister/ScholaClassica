import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {
  allowedTeacherOrigin,validTeacherLogin,authorizedInitialSession
} from '../supabase/functions/_shared/teacher-login-policy.mjs';
const root=resolve(import.meta.dirname,'..');
const origin='https://docente.ejemplo.test';
const login={username:'MagisterArchaios',password:'contraseña-dummy-fuerte',turnstileToken:'token-de-pruebas-valido'};
test('el origen HTTPS es independiente de las aplicaciones de alumnos',()=>{
  assert.equal(allowedTeacherOrigin(origin),origin);
  for(const value of [
    'http://docente.ejemplo.test','https://archaiosmagister.github.io',
    'https://docente.ejemplo.test/ruta','https://docente.ejemplo.test:444',
    'https://localhost','http://127.0.0.1:4000',null
  ])assert.equal(allowedTeacherOrigin(value),null,String(value));
});
test('rechaza usuarios desconocidos, campos malformados y solicitudes enormes',()=>{
  assert.equal(validTeacherLogin(login),true);
  assert.equal(validTeacherLogin({...login,username:'invitado'}),false);
  assert.equal(validTeacherLogin({...login,password:'12345'}),false);
  assert.equal(validTeacherLogin({...login,turnstileToken:'x'}),false);
  assert.equal(validTeacherLogin({...login,turnstileToken:'x'.repeat(2049)}),false);
  assert.equal(validTeacherLogin(null),false);
});
test('una identidad de profesor exige un usuario exacto y tokens de sesión',()=>{
  const id='00000000-0000-4000-8000-000000000111';
  const user={id,is_anonymous:false};
  const session={access_token:'sesion-de-prueba',refresh_token:'renovacion-de-prueba'};
  assert.equal(authorizedInitialSession(user,session,id),true);
  assert.equal(authorizedInitialSession({...user,id:'otro'},session,id),false);
  assert.equal(authorizedInitialSession({...user,is_anonymous:true},session,id),false);
  assert.equal(authorizedInitialSession(user,{access_token:'ok'},id),false);
});
test('el login lee email solo de secretos y exige Siteverify ANTES de la contraseña',()=>{
  const server=readFileSync(join(root,'supabase/functions/schola-login/index.ts'),'utf8');
  const client=readFileSync(join(root,'public/docente/app.mjs'),'utf8');
  const build=readFileSync(join(root,'scripts/build-docente.mjs'),'utf8');
  const toml=readFileSync(join(root,'supabase/config.toml'),'utf8');
  assert.ok(server.includes("env('SCHOLA_AUTH_LOGIN_EMAIL')"));
  assert.match(server,/SCHOLA_AUTH_CAPTCHA_ENFORCED/);
  assert.match(server,/options:\{captchaToken:body\.turnstileToken\}/);
  assert.ok(!server.includes('turnstile/v0/siteverify'));
  assert.ok(!server.includes('SCHOLA_TURNSTILE_SECRET'));
  assert.match(toml,/\[functions\.schola-login\]\s+verify_jwt = false/);
  assert.match(toml,/\[functions\.schola-inbox\]\s+verify_jwt = true/);
  assert.ok(!client.includes('config.email'));
  assert.ok(!client.includes('signInWithPassword'));
  assert.ok(!build.includes('email:email'));
  assert.match(build,/SCHOLA_AUTH_LOGIN_EMAIL/);
  assert.ok(!server.includes('service_role'));
});
