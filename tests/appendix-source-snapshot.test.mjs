import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,join} from 'node:path';
import {parseTrackedFiles} from '../scripts/snapshot-appendix-source.mjs';

const root=resolve(import.meta.dirname,'..');
const folder=join(root,'build/academic-audits/appendix-autonomia');
const lock=JSON.parse(await readFile(join(root,'config/sources.lock.json'),'utf8'));
const blobHash=raw=>createHash('sha1').update('blob '+raw.length+'\0').update(raw).digest('hex');

test('El inventario Git rechaza rutas externas, duplicados y modos no regulares',()=>{
 assert.deepEqual(parseTrackedFiles('100644 0123456789abcdef0123456789abcdef01234567 0\tREADME.md\0'),
  [{path:'README.md',sha:'0123456789abcdef0123456789abcdef01234567',mode:'100644'}]);
 assert.throws(()=>parseTrackedFiles('100644 0123456789abcdef0123456789abcdef01234567 0\t../x\0'),/ruta fuera/);
 assert.throws(()=>parseTrackedFiles('120000 0123456789abcdef0123456789abcdef01234567 0\tfoo\0'),/entrada Git/);
});

test('Copia completa de 111 fuentes de Appendix, incluidos icono PNG y valenciano',async()=>{
 const report=JSON.parse(await readFile(join(folder,'manifiesto.json'),'utf8'));
 assert.equal(report.schema,'schola-appendix-source-snapshot/v1');
 assert.equal(report.origin,'ArchaiosMagister/Appendix-grammaticae');
 assert.equal(report.sha,lock.sources.appendix.sha);
 assert.equal(report.files,111);
 assert.equal(report.completeOriginal,true);
 assert.equal(report.treeSha,'ac24b5b997d3a37d78ef43de36085b850b22e472');
 assert.equal(report.bytes,2160046);
 assert.ok(report.nonText>=1);
 assert.equal(new Set(report.entries.map(x=>x.path)).size,111);
 assert.ok(report.entries.some(x=>x.path==='apple-touch-icon.png'&&x.bytes>9000));
 assert.ok(report.entries.some(x=>x.path==='assets/curriculum.json'));
 assert.ok(report.entries.some(x=>x.path==='val/curriculum.json'));
 assert.ok(report.entries.some(x=>x.path==='assets/app.js'));
 assert.deepEqual(report.releasePolicy,{
  changesPublicApp:false,changesBuildSource:false,changesDocsInStudentPortal:false,
  allowsDeleteOriginal:false,validatedOfflineMigration:false
 });
 const files=await Promise.all(report.entries.map(async entry=>{
  const file=join(folder,'fuente',entry.path);
  const bytes=await readFile(file);
  assert.ok((await stat(file)).isFile(),entry.path);
  assert.equal(bytes.length,entry.bytes,entry.path);
  assert.equal(blobHash(bytes),entry.gitBlobSha,entry.path);
  return {path:entry.path,bytes:bytes.length};
 }));
 assert.equal(files.reduce((sum,x)=>sum+x.bytes,0),report.bytes);
 const workflow=await readFile(join(root,'.github/workflows/integracion.yml'),'utf8');
 assert.ok(workflow.includes('repository: '+report.origin));
 assert.ok(workflow.includes('ref: '+report.sha));
});
