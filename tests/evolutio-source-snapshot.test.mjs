import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {correctCastilianSourceWords} from '../scripts/evolutio-castellano-lote100.mjs';
import {verifyVendoredEvolutio,parseEvolutioGitTree,SOURCE_TREE}
 from '../scripts/verify-vendored-evolutio.mjs';
const root=resolve(import.meta.dirname,'..');

test('Evolutio conserva los 53 archivos binariamente idénticos al origen',async()=>{
 const report=await verifyVendoredEvolutio();
 assert.equal(report.treeSha,SOURCE_TREE);
 assert.equal(report.files,53);
 assert.equal(report.bytes,1608767);
 assert.equal(report.originalWords,522);
 assert.equal(report.sourcePath,'vendor/evolutio');
 assert.equal(report.canCompileWithoutCheckout,true);
 assert.equal(report.repositoryArchiveApproved,false);
 assert.equal(report.repositoryDeletionApproved,false);
});
test('Se rechazan rutas peligrosas, objetos inesperados y duplicados',()=>{
 const sha='0123456789012345678901234567890123456789';
 assert.throws(()=>parseEvolutioGitTree('100644 blob '+sha+'\t../extra\0'),/ruta insegura/);
 assert.throws(()=>parseEvolutioGitTree('100755 blob '+sha+'\tindex.html\0'),/modo u objeto/);
 assert.throws(()=>parseEvolutioGitTree('100644 blob '+sha+'\tindex.html\0'+
 '100644 blob '+sha+'\tindex.html\0'),/entradas duplicadas/);
});
test('El banco original no incorpora ni altera las 100 palabras adicionales de ScholaClassica',()=>{
 const original=JSON.parse(readFileSync(join(root,'vendor/evolutio/data/pilot.json'),'utf8'));
 assert.equal(original.words.length,522);
 assert.equal(new Set(original.words.map(w=>w.id)).size,522);
 const integrated=JSON.parse(readFileSync(join(root,'dist/apps/evolucion-fonetica/data/pilot.json'),'utf8'));
 assert.equal(integrated.words.length,622);
 assert.deepEqual(integrated.words.slice(0,522),correctCastilianSourceWords(original.words));
 assert.deepEqual(original.words.filter((w,i)=>JSON.stringify(w)!==JSON.stringify(integrated.words[i])).map(w=>w.id).sort(),["xl-201","xl-246","xl-285","xl-29","xl-36","xl-37","xl-509","xl-75","xl-78","xl-80","xl-825","xl-87","xl-921"]);
 assert.equal(new Set(integrated.words.map(w=>w.id)).size,622);
});
