import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,join} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const source=join(root,'vendor/vocabula');
const dist=join(root,'dist/apps/vocabulario');
const read=(dir,file)=>readFileSync(join(dir,file));
const gitBlobSha=buf=>createHash('sha1')
 .update('blob '+buf.byteLength+'\0')
 .update(buf).digest('hex');

test('La actualización conserva exactamente el banco léxico Vocabula aprobado',()=>{
 const sourceData=read(source,'data.js');
 assert.equal(gitBlobSha(sourceData),'2193655783907cf2c972e934f0fc2e4ca429d3e4',
  'Cambió data.js: requiere nueva revisión filológica');
 const entries=JSON.parse(sourceData.toString('utf8').replace(/^window\.VOCAB\s*=\s*/u,'').replace(/;\s*$/u,''));
 assert.equal(entries.length,2055);
 assert.equal(new Set(entries.map(x=>x.id)).size,2055);
 assert.equal(JSON.parse(read(root,'config/sources.lock.json')).sources.vocabula.sha,
  'a7be2161a2401816ede78a96981daaac6850b8d2');
});

test('Solo la interfaz pública de alumnado llega al paquete integrado',()=>{
 const native=read(source,'teacher.js').toString('utf8');
 const index=read(source,'index.html').toString('utf8');
 const student=read(dist,'teacher.js').toString('utf8');
 const html=read(dist,'index.html').toString('utf8');
 for(const forbidden of ['sessionStorage','Authorization','teacher-dialog',
  'openTeacher',"api('login'",'teacher_words','vocab_sessions','service_role']){
  assert.ok(!native.includes(forbidden),'Origen inseguro: '+forbidden);
  assert.ok(!student.includes(forbidden),'Paquete contiene acceso docente heredado: '+forbidden);
 }
 assert.ok(native.includes("if(!['public_words','report'].includes(action))"));
 assert.ok(student.includes('scholaVocabulaOffline'));
 assert.ok(student.includes('scholaVocabularyReportPayload'));
 assert.ok(!index.includes('id="open-teacher"'));
 assert.ok(!html.includes('id="open-teacher"'));
 assert.ok(!html.includes('id="teacher-dialog"'));
 assert.ok(html.includes('schola-bridge.js'));
 assert.ok(!html.includes('schola-offline.js'));
 assert.ok(!html.includes('teacher.js?v=20261116-schola1'));
 assert.ok(!html.includes('config.js'));
 assert.ok(!html.includes('id="open-report"'));
 assert.ok(!html.includes('id="report-dialog"'));
 const service=read(dist,'config.js').toString('utf8');
 assert.ok(service.includes('.supabase.co/functions/v1/vocabulary'));
 assert.ok(!service.includes('service_role'));
});
