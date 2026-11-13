// Auditoría final del artefacto que se publicará en GitHub Pages.
// No admite datos de acceso docente, ni elementos de construcción internos.
import assert from 'node:assert/strict';
import {readFileSync,existsSync,statSync} from 'node:fs';
import {resolve,join,sep} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const out=join(root,'dist');
const read=(path)=>readFileSync(join(out,path),'utf8');
assert.ok(existsSync(out),'Falta dist/: ejecutar npm run build antes de publicar');
for(const path of ['index.html','app.js','style.css','sw.js','manifest.webmanifest','.nojekyll',
  'icons/icon.svg','icons/icon-192.png','icons/icon-512.png',
  'apps/gramatica/index.html','apps/vocabulario/index.html',
  'apps/evolucion-fonetica/index.html','apps/etymologicon/index.html',
  'apps/morfologia/index.html','apps/morfologia/sw.js',
  'apps/morfologia/engine.mjs','apps/morfologia/written.mjs',
  'apps/morfologia/review.mjs','apps/morfologia/greek-keyboard.mjs',
  'apps/morfologia/data/paradigmas.json',
  'docente/auth-config.json']){
  assert.ok(existsSync(join(out,path)),'Falta recurso de publicación: '+path);
}
assert.deepEqual(JSON.parse(read('docente/auth-config.json')),{enabled:false},
  'El portal público no puede contener autenticación docente activada');
for(const prohibited of ['dist-docente','build','apps/examenes','supabase/functions']){
  assert.equal(existsSync(join(out,prohibited)),false,
    'No publicar recursos internos ni el generador: '+prohibited);
}
const manifest=JSON.parse(read('manifest.webmanifest'));
assert.equal(manifest.start_url,'./');
assert.equal(manifest.scope,'./');
assert.equal(manifest.display,'standalone');
for(const item of manifest.icons){
  assert.ok(item.src.startsWith('./icons/'));
  const file=resolve(out,item.src);
  assert.ok(file.startsWith(out+sep));
  assert.ok(statSync(file).isFile());
}
const portalWorker=read('sw.js');
assert.ok(portalWorker.includes("CACHE_PREFIX='schola-portal-'"));
assert.ok(portalWorker.includes('OWN_PATHS.has(url.pathname)'));
assert.ok(!portalWorker.includes('__SCHOLA_PORTAL_CACHE_VERSION__'));
const evolutioWorker=read('apps/evolucion-fonetica/sw.js');
assert.ok(evolutioWorker.includes("CACHE_PREFIX='schola-evolutio-'"));
assert.ok(evolutioWorker.includes('url.pathname.startsWith(scope.pathname)'));
const etymologiconWorker=read('apps/etymologicon/sw.js');
assert.ok(etymologiconWorker.includes("CACHE_PREFIX='schola-etymologicon-'"));
const morphology=JSON.parse(read('apps/morfologia/data/paradigmas.json'));
assert.equal(morphology.schema,'schola-morphology-source/v1');
assert.equal(morphology.records.length,60);
assert.deepEqual(morphology.coverage,{latin:[1,2,3,4,5],griego:[1,2,3,4,5]});
assert.ok(morphology.records.every(r=>r.evidence.status==='paradigma-documentado'));
assert.ok(read('apps/morfologia/sw.js').includes("CACHE_PREFIX='schola-morphology-'"));
for(const file of ['written.mjs','review.mjs','greek-keyboard.mjs']){
  assert.ok(read('apps/morfologia/sw.js').includes("'./"+file+"'"),
    'El modo offline debe precargar '+file);
}
assert.ok(read('apps/morfologia/index.html').includes('id="greek-keyboard"'));
assert.ok(read('apps/morfologia/index.html').includes('id="review-mode"'));
const vocabEndpoint=read('apps/vocabulario/config.js');
assert.ok(vocabEndpoint.includes('wpwlguufpkfnzlbyproe.supabase.co'));
const html=read('index.html');
assert.ok(!html.includes('ScholaClassica/docente/auth-config.json?enabled=true'));
assert.ok(!html.includes('<script src="https://'));
console.log('Preflight GitHub Pages: recursos, PWAs y autenticación docente desactivada — correcto');
