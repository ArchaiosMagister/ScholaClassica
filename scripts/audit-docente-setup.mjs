// Comprobación del artefacto público de incorporación TOTP antes de publicar.
import assert from 'node:assert/strict';
import {readFileSync,existsSync,statSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'..');
const out=join(root,'dist');
const read=path=>readFileSync(join(out,path),'utf8');
const config=JSON.parse(read('docente/auth-config.json'));
assert.equal(config.enabled,true);
const inboxEnabled=process.env.SCHOLA_DOCENTE_INBOX==='confirmed';
assert.equal(config.setupOnly,!inboxEnabled,'Solo habilitar la bandeja tras confirmar el modo de lectura');
assert.equal(config.origin,'https://archaiosmagister.github.io');
assert.equal(config.url,'https://wpwlguufpkfnzlbyproe.supabase.co');
assert.match(config.publishableKey,/^sb_publishable_[A-Za-z0-9_-]{12,}$/);
assert.equal(config.username,'MagisterArchaios');
for(const k of ['email','teacherId','serviceKey','secret','password'])
  assert.ok(!(k in config),'Dato privado en el frontend: '+k);
const sdkPath=join(out,'docente/vendor/supabase.js');
assert.ok(existsSync(sdkPath));
const sdk=readFileSync(sdkPath);
assert.ok(statSync(sdkPath).size>10000);
const expected=readFileSync(join(root,'build/docente/supabase.sha256'),'utf8').trim();
assert.equal(createHash('sha256').update(sdk).digest('hex'),expected);
const html=read('docente/index.html'),js=read('docente/app.mjs');
assert.ok(html.includes('Content-Security-Policy'));
assert.match(html,/connect-src/);
assert.ok(html.includes(config.url));
if(inboxEnabled){
  assert.ok(html.includes('https://rzjemisvaaqpnvvgfntl.supabase.co'));
  assert.ok(html.includes('id="notice-source"'));
  assert.ok(html.includes('id="sources-state"'));
  assert.ok(js.includes('schola-palabra-inbox'));
  assert.ok(js.includes("client.functions.invoke('schola-inbox'"));
  assert.ok(js.includes("state('unavailable','Acceso docente no autorizado"));
}

assert.ok(!html.includes('unsafe-inline'));
assert.ok(html.includes('id="ready"'));
assert.match(js,/config\.setupOnly===true/);
assert.ok(js.includes("state('ready'"));
assert.ok(js.includes("persistSession:false"));
assert.ok(js.includes("SCRIPT_URL='./vendor/supabase.js'"));
const bad=/service_role|sb_secret_|SCHOLA_AUTH_LOGIN_EMAIL|SCHOLA_TEACHER_USER_ID/i;
for(const [path,body] of [['docente/index.html',html],['docente/app.mjs',js],['docente/auth-config.json',JSON.stringify(config)]])
  assert.ok(!bad.test(body),'Contenido sensible en '+path);
// Los bancos originales de gramática y su informe, ya públicos en Vocabula,
// se conservan completos como consulta docente independiente.
const grammarBank=JSON.parse(read('docente/gramatica-banco.json'));
const grammarCoverage=JSON.parse(read('docente/gramatica-cobertura.json'));
assert.equal(grammarBank.schema,1);
assert.ok(grammarBank.exercises.length>=100);
assert.ok(grammarBank.exercises.every(q=>q.id&&q.prompt&&q.answer&&q.unit!=='UD 0'));
assert.deepEqual(Object.keys(grammarBank.syllabi).sort(),['gr1','lat1','lat4']);
assert.equal(grammarCoverage.schema,1);
for(const subject of ['gr1','lat1','lat4'])assert.ok(grammarCoverage.subjects[subject]?.lemmas>0);
const grammarAdmin=read('docente/gramatica-auditoria.mjs');
assert.doesNotMatch(grammarAdmin,/innerHTML|sessionStorage|localStorage/);
assert.match(html,/id="grammar-audit"/);
assert.match(html,/id="admin-report-area"/);
assert.match(js,/mountGrammarAudit/);
const sw=read('sw.js');
assert.ok(sw.includes("CACHE_PREFIX='schola-portal-'"));
assert.ok(sw.includes('OWN_PATHS.has(url.pathname)'));
console.log('OK: alta de TOTP en GitHub Pages, sin datos ni operaciones docentes expuestos');
