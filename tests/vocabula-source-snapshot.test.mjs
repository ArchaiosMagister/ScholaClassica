import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {verifyVendoredVocabula,parseVocabulaTree,VOCABULA_ORIGIN_TREE}
 from '../scripts/verify-vendored-vocabula.mjs';

const root=resolve(import.meta.dirname,'..');
test('El banco de Vocabula es la fuente original íntegra y no depende de un checkout',async()=>{
 const report=await verifyVendoredVocabula();
 assert.equal(report.treeSha,VOCABULA_ORIGIN_TREE);
 assert.equal(report.sourcePath,'vendor/vocabula');
 assert.equal(report.files,130);
 assert.equal(report.bytes,1903396);
 assert.ok(report.originalEntries>1000);
 assert.equal(report.canCompileWithoutExternalCheckout,true);
 assert.equal(report.repositoryArchiveApproved,false);
 assert.equal(report.repositoryDeletionApproved,false);
 assert.equal(report.entries.length,130);
});
test('Se rechazan rutas, modos y objetos inseguros en un árbol Git',()=>{
 const sha='0123456789012345678901234567890123456789';
 assert.throws(()=>parseVocabulaTree('100644 blob '+sha+'\t../outside\0'),/ruta insegura/);
 assert.throws(()=>parseVocabulaTree('100755 blob '+sha+'\tapp.js\0'),/modo u objeto/);
 assert.throws(()=>parseVocabulaTree('100644 blob '+sha+'\tdata.js\0'+
  '100644 blob '+sha+'\tdata.js\0'),/rutas repetidas/);
});
test('El snapshot guarda intacta la fuente y sus dos bancos docentes',()=>{
 const data=readFileSync(join(root,'vendor/vocabula/data.js'),'utf8');
 assert.match(data,/^window\.VOCAB=/);
 const source=JSON.parse(data.replace(/^window\.VOCAB=/,'').replace(/;\s*$/,''));
 assert.ok(source.some(x=>x.subject==='lat1'));
 assert.ok(source.some(x=>x.subject==='gr1'));
 assert.ok(source.some(x=>x.mode==='general'));
 assert.ok(source.some(x=>x.mode==='examen'));
});
