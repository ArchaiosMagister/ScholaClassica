import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
const root=resolve(import.meta.dirname,'..');
test('el preflight activo debe denegar un artefacto todavía desactivado',()=>{
  const check=spawnSync(process.execPath,[join(root,'scripts/check-docente-readiness.mjs')],{
    cwd:root,encoding:'utf8',env:{...process.env,SCHOLA_DOCENTE_OUTPUT:'dist-docente'}
  });
  assert.notEqual(check.status,0,'El paquete docente inactivo no puede darse por listo');
  assert.match((check.stderr||'')+(check.stdout||''),/desactivad|no preparada|configuraci[oó]n/i);
});
test('el preflight exige hostname pages.dev, clave pública, SDK con SHA-256 y cabeceras HTTPS',()=>{
  const content=readFileSync(join(root,'scripts/check-docente-readiness.mjs'),'utf8');
  for(const term of [
    'pages\\.dev','SCHOLA_SUPABASE_SDK_SHA256','X-Frame-Options: DENY',
    'Cache-Control: no-store','persistSession:false','auth-config.json'
  ])assert.ok(content.includes(term),'Comprobación ausente: '+term);
  assert.ok(!content.includes('fetch('),'El control no puede contactar con servidores externos');
  assert.ok(!content.includes('wrangler'),'El control no puede desplegar');
});
