import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {runInNewContext} from 'node:vm';

const root=resolve(import.meta.dirname,'..');
const read=x=>readFileSync(join(root,x),'utf8');
const html=read('dist/index.html');
const source=read('public/index.html');
function grammarApi(){
 const sandbox={module:{exports:{}}};
 runInNewContext(read('scripts/grammar-progress-client.js'),sandbox);
 return sandbox.module.exports;
}
const normalize=x=>JSON.parse(JSON.stringify(x));

test('Guía de migración sin redirecciones, con enlaces a cada módulo correcto',()=>{
 assert.equal(html,source,'El portal no debe modificar la guía durante la compilación');
 assert.match(html,/<details id="trasladar-progreso" class="install-help">/);
 assert.match(html,/La web antigua y ScholaClassica tienen direcciones diferentes/);
 assert.match(html,/no comparten automáticamente el historial/);
 const links=[
  'https://archaiosmagister.github.io/VocabulaLatinaGraecaque/',
  'https://archaiosmagister.github.io/VocabulaLatinaGraecaque/gramatica.html',
  'apps/vocabulario/index.html?subject=lat1',
  'apps/repaso-gramatica/index.html?subject=lat1'
 ];
 for(const url of links)assert.ok(html.includes('href="'+url+'"'),'Enlace de migración ausente '+url);
 assert.ok(!html.includes('meta http-equiv="refresh"'));
 assert.match(html,/No desinstales las aplicaciones antiguas ni borres sus datos/);
 assert.match(html,/No lo confundas con el archivo de vocabulario/);
 const ids=['apps/vocabulario/index.html','apps/repaso-gramatica/index.html'];
 for(const path of ids)assert.ok(read('dist/'+path).includes('<html'),'Destino sin publicar '+path);
});

test('Los archivos de historial gramatical son portables entre orígenes aislados',()=>{
 const api=grammarApi();
 assert.equal(api.KEY,'classics-grammar-v1');
 assert.equal(api.SCHEMA,'schola-grammar-progress/v1');
 const values={
  'lat1|UD 2|concept-1':{total:3,right:2,failed:false},
  'gr1|UD 10|concept-119':{total:2,right:1,failed:true},
  'lat1|UD 4|concept-122':{total:1,right:1,failed:false},
  'lat1|UD 4|concept-123':{total:1,right:0,failed:true}
 };
 const exported=JSON.parse(api.pack(values));
 assert.deepEqual(normalize(api.unpack(JSON.stringify(exported))),values);
 assert.deepEqual(normalize(api.merge(values,values)),values);
 assert.throws(()=>api.unpack(JSON.stringify({version:1,progress:values})),/gramatical/);
 assert.equal(read('dist/apps/repaso-gramatica/grammar-progress.js'),
  read('scripts/grammar-progress-client.js'));
 const vocabulary=read('dist/apps/vocabulario/app.js');
 assert.match(vocabulary,/localStorage\.getItem\('classics-progress-v1'\)/);
 assert.ok(!vocabulary.includes("localStorage.getItem('classics-grammar-v1')"));
});

test('El monitor mantiene el aviso de cambio legado anclado al commit docente, sin dar permiso a borrar',()=>{
 const lock=JSON.parse(read('config/sources.lock.json'));
 const approved=JSON.parse(read('config/legacy-transition-approved-heads.json')).approved;
 const sourceIds=['appendix','evolutio','vocabula'];
 for(const id of sourceIds){
  const item=lock.sources[id],legacy=approved[item.repository];
  assert.equal(item.sourceMode,'vendored');
  assert.equal(legacy.pinned,item.sha);
  assert.equal(legacy.kind,'legacy-transition');
  assert.match(legacy.head,/^[a-f0-9]{40}$/);
  assert.notEqual(legacy.head,legacy.pinned);
 }
 const retire=read('scripts/audit-original-source-retirement.mjs');
 assert.match(retire,/safeToArchiveSource:false,safeToDeleteSource:false/);
 assert.match(retire,/generalSafeToArchive:false/);
 assert.match(retire,/generalSafeToDelete:false/);
 assert.equal(lock.sources.examenes.integrated,false);
});
