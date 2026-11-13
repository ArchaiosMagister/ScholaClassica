// Preflight local del paquete docente de Cloudflare Pages; no despliega ni usa secretos.
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,existsSync,statSync} from 'node:fs';
import {join,resolve,relative,sep} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const output=resolve(root,process.env.SCHOLA_DOCENTE_OUTPUT||'dist-docente');
assert.ok(output.startsWith(root+sep));
const config=JSON.parse(readFileSync(join(output,'auth-config.json'),'utf8'));
assert.deepEqual(config,{enabled:false},'El artefacto de CI siempre está desactivado');
const files=new Set(['index.html','404.html','robots.txt','portal.css','style.css','app.mjs','auth-config.json','_headers']);
for(const entry of readdirSync(output,{recursive:true,withFileTypes:true})){
  assert.ok(entry.isFile()||entry.isDirectory(),'No admitir enlaces simbólicos');
  if(!entry.isFile())continue;
  const path=relative(output,join(entry.parentPath,entry.name)).split(sep).join('/');
  assert.ok(files.has(path),'Archivo inesperado en salida docente: '+path);
}
for(const name of files)assert.ok(existsSync(join(output,name)),name);
const headers=readFileSync(join(output,'_headers'),'utf8');
const html=readFileSync(join(output,'index.html'),'utf8');
const js=readFileSync(join(output,'app.mjs'),'utf8');
assert.ok(headers.startsWith('/*\n'));
for(const fragment of ["Content-Security-Policy:","frame-ancestors 'none'","X-Robots-Tag: noindex",
  'X-Frame-Options: DENY','X-Content-Type-Options: nosniff','Referrer-Policy: no-referrer',
  'Cache-Control: no-store'])assert.ok(headers.includes(fragment),fragment);
assert.ok(!headers.includes('cdn.jsdelivr.net'));
assert.ok(!headers.includes('unsafe-inline'));
assert.ok(html.includes('Content-Security-Policy'));
assert.ok(js.includes("SCRIPT_URL='./vendor/supabase.js'"));
assert.ok(js.includes('persistSession:false'));
assert.ok(!js.includes('config.email'));
assert.ok(!existsSync(join(output,'vendor')),'No bundle en una construcción desactivada');
assert.ok(readFileSync(join(output,'robots.txt'),'utf8').includes('Disallow: /'));
assert.ok(statSync(join(output,'404.html')).size>30);
console.log('OK: artefacto Cloudflare Pages desactivado, aislado y sin credenciales');
