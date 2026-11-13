import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const html=readFileSync(resolve(root,'public/docente/index.html'),'utf8');
const app=readFileSync(resolve(root,'public/docente/app.mjs'),'utf8');
test('el acceso docente exige escribir el usuario en vez de mostrarlo precargado',()=>{
  const input=html.match(/<input id="username"[^>]*>/)?.[0];
  assert.ok(input,'Falta el campo de usuario');
  assert.match(input,/autocomplete="off"/);
  assert.doesNotMatch(input,/\bvalue=/);
  assert.match(html,/<form id="login-form" autocomplete="off">/);
  assert.doesNotMatch(app,/el\('username'\)\.value\s*=\s*config\.username/);
  assert.match(app,/el\('username'\)\.value=''/);
  assert.match(app,/username!==config\.username/,'La validación del usuario debe mantenerse');
});
