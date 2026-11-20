import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync,readdirSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {runInNewContext} from 'node:vm';

const root=resolve(import.meta.dirname,'..');
const read=p=>readFileSync(join(root,p),'utf8');
const dir='dist/apps/repaso-gramatica/';
function progressApi(){
 const sandbox={module:{exports:{}}};
 runInNewContext(read('scripts/grammar-progress-client.js'),sandbox);
 return sandbox.module.exports;
}
const api=progressApi();
const nice=obj=>JSON.parse(JSON.stringify(obj));
test('Mantener separados el módulo de repaso y los motores de vocabulario y morfología',()=>{
 const html=read(dir+'index.html');
 assert.match(html,/<title>Repaso gramatical · ScholaClassica<\/title>/);
 assert.match(html,/href="\.\.\/vocabulario\/index.html"/);
 assert.match(html,/href="\.\.\/morfologia\/index.html"/);
 assert.match(html,/<option value="Sintaxis" selected>/);
 assert.match(html,/grammar-progress.js/);
 assert.match(html,/grammar-review-init.js/);
 assert.match(html,/rel="manifest"/);
 assert.doesNotMatch(html,/href="gramatica.html"/);
 assert.ok(statSync(join(root,'dist/apps/vocabulario/index.html')).isFile());
 assert.ok(statSync(join(root,'dist/apps/morfologia/index.html')).isFile());
 assert.ok(!readdirSync(join(root,'dist/apps/vocabulario')).includes('gramatica.html'),
  'La gramática no debe volver a incrustarse en Vocabula');
});
test('Se conservan las 120 preguntas antiguas y se añaden 24 de sintaxis con índices históricos estables',()=>{
 const sandbox={window:{}};
 runInNewContext(read(dir+'gramatica-contenidos.js'),sandbox);
 const content=sandbox.window.GRAMMAR_CONTENT,q=content.questions;
 const source=JSON.parse(read('vendor/vocabula/gramatica-contenidos.js')
  .split('window.GRAMMAR_CONTENT=')[1].trim().replace(/;\s*$/,''));
 const approved=JSON.parse(read('data/repaso-sintaxis-aprobadas.json'));
 const approvedTwo=JSON.parse(read('data/repaso-sintaxis-lote2-aprobadas.json'));
 assert.equal(source.questions.length,84);
 assert.deepEqual(nice(q.slice(0,84)),source.questions,
  'Los índices concept-i y las preguntas antiguas no deben variar');
 assert.deepEqual(nice(q.slice(84,120)),approved.questions.map(({candidateId,...question})=>question),
  'Las primeras 36 aprobadas conservan sus posiciones y respuestas');
 assert.deepEqual(nice(q.slice(120)),approvedTwo.questions.map(({candidateId,...question})=>question),
  'El segundo lote aprobado debe agregarse después de las 120 preguntas anteriores');
 assert.equal(q.length,144);
 assert.equal(q.filter(x=>x.c==='Sintaxis').length,87);
 assert.equal(q.filter(x=>x.c==='Conceptos').length,7);
 assert.equal(q.filter(x=>x.c.startsWith('Morfología')).length,50);
 assert.deepEqual(nice(Object.keys(content.syllabi)).sort(),['gr1','lat1','lat4']);
 for(const subject of ['gr1','lat4'])assert.deepEqual(nice(content.syllabi[subject]),source.syllabi[subject],
  'La secuenciación no debe alterarse en '+subject);
 for(const [unit,topic] of [['UD 4','Aposición y dativo de aproximación'],['UD 7','Dativo posesivo']]){
  const orig=source.syllabi.lat1.find(([u])=>u===unit)[1];
  const next=nice(content.syllabi.lat1.find(([u])=>u===unit)[1]);
  assert.deepEqual(next,[...orig,topic],'Nuevo epígrafe de '+unit+' tras los originales');
 }
 for(const p of ['gramatica-importada.js','gramatica-respaldo-online.js',
 'gramatica-enunciados.js','gramatica-paradigmas.js','gramatica-griego-ampliacion.js']){
  assert.equal(read(dir+p),read('vendor/vocabula/'+p),'Motor docente de '+p+' modificado');
 }
 const m=JSON.parse(read(dir+'data/unimorph-syllabus/manifest.json'));
 assert.ok(m&&typeof m==='object');
 assert.ok(readdirSync(join(root,dir,'data/unimorph-syllabus/lat')).length>=32);
 assert.ok(readdirSync(join(root,dir,'data/unimorph-syllabus/grc')).length>=8);
});
test('El JSON de gramática es diferente del de vocabulario y conserva los datos válidos',()=>{
 const original={
  'lat1|UD 2|concept-1':{total:3,right:2,failed:true},
  'gr1|UD 1|concept-2':{total:1,right:1,failed:false},
  'import|lat4|UD 4|amo|write':{total:1,right:0,failed:true}
 };
 const json=api.pack(original);
 assert.match(json,/"kind": "grammar"/);
 const roundtrip=nice(api.unpack(json));
 assert.deepEqual(roundtrip,original);
 assert.equal(api.KEY,'classics-grammar-v1');
 assert.throws(()=>api.unpack(JSON.stringify({version:1,progress:original})),/gramatical/);
 assert.throws(()=>api.unpack(JSON.stringify({version:1,kind:'vocabulary',progress:original})),/gramatical/);
 const other={'lat1|UD 2|concept-1':{total:2,right:1,failed:false},
  'lat4|UD 3|concept-5':{total:4,right:3,failed:true}};
 assert.deepEqual(nice(api.merge(original,other)),{...original,
  'lat4|UD 3|concept-5':{total:4,right:3,failed:true}});
 assert.deepEqual(nice(api.merge(original,original)),original);
});
test('Importación rechaza registros corruptos sin aceptarlos parcial o silenciosamente',()=>{
 for(const invalid of [
  {'lat1|UD 3|concept-3':{total:1,right:2,failed:false}},
  {'lat1|UD 3|concept-3':{total:-1,right:0,failed:false}},
  {'lat1|UD 3|concept-3':{total:1,right:1,failed:'false'}},
  {'vocabula-id':{total:1,right:1,failed:false}},
  []
 ])assert.throws(()=>api.pack(invalid));
 assert.throws(()=>api.unpack('not-json'),{name:'SyntaxError'});
 assert.throws(()=>api.unpack('x'.repeat(8*1024*1024+1)),/grande/);
});
test('La PWA usa caché y ámbito propios, sin borrar los otros módulos',()=>{
 const sw=read(dir+'sw.js');
 const manifest=JSON.parse(read(dir+'manifest.webmanifest'));
 assert.equal(manifest.scope,'./');
 assert.equal(manifest.start_url,'./index.html');
 assert.match(sw,/schola-repaso-gramatica-/);
 assert.match(sw,/key.startsWith\(PREFIX\)/);
 assert.doesNotMatch(sw,/caches\.delete\([^)]*key\)\s*;\s*await self\.clients/);
 const html=read(dir+'index.html');
 assert.match(html,/serviceWorker\.register\("\.\/sw\.js"/);
});
