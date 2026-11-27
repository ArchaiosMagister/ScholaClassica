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
 assert.deepEqual(original.words.filter((w,i)=>JSON.stringify(w)!==JSON.stringify(integrated.words[i])).map(w=>w.id).sort(),["ge-EVF-0211","ge-EVF-0221","ge-EVF-0295","ge-EVF-0310","ge-EVF-0362","ge-EVF-0367","ge-EVF-0400","ge-EVF-0413","ge-EVF-0441","ge-EVF-0823","ge-EVF-0840","ge-EVF-0936","ge-EVF-1075","ge-EVF-1084","ge-EVF-1089","ge-EVF-1091","ge-EVF-1093","ge-EVF-1101","ge-EVF-1102","ge-EVF-1103","ge-EVF-1105","ge-EVF-1112","ge-EVF-1139","ge-EVF-1162","ge-EVF-1179","ge-EVF-1184","ge-EVF-1195","ge-EVF-1197","ge-EVF-1200","xl-1027","xl-1028","xl-1029","xl-1031","xl-1032","xl-1033","xl-1034","xl-1035","xl-1037","xl-1038","xl-1039","xl-1040","xl-1041","xl-1042","xl-1044","xl-1048","xl-105","xl-1050","xl-1052","xl-1053","xl-1055","xl-106","xl-111","xl-114","xl-115","xl-125","xl-129","xl-131","xl-134","xl-143","xl-144","xl-145","xl-150","xl-156","xl-161","xl-164","xl-165","xl-182","xl-185","xl-190","xl-191","xl-196","xl-201","xl-203","xl-205","xl-210","xl-213","xl-215","xl-216","xl-218","xl-219","xl-220","xl-223","xl-234","xl-239","xl-244","xl-246","xl-249","xl-25","xl-251","xl-252","xl-266","xl-267","xl-274","xl-277","xl-284","xl-285","xl-289","xl-29","xl-297","xl-298","xl-300","xl-301","xl-302","xl-304","xl-305","xl-307","xl-309","xl-33","xl-36","xl-37","xl-458","xl-502","xl-508","xl-509","xl-527","xl-533","xl-539","xl-570","xl-592","xl-605","xl-606","xl-608","xl-614","xl-64","xl-65","xl-70","xl-716","xl-72","xl-720","xl-722","xl-724","xl-726","xl-727","xl-728","xl-732","xl-733","xl-736","xl-75","xl-78","xl-80","xl-81","xl-82","xl-820","xl-825","xl-830","xl-862","xl-87","xl-88","xl-917","xl-921","xl-922","xl-927","xl-950","xl-96"]);
 assert.equal(new Set(integrated.words.map(w=>w.id)).size,622);
});
