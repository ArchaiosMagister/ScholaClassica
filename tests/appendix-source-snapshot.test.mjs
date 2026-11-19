import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {parseVendorGitTree,verifyVendoredAppendix,
 APPENDIX_SOURCE_TREE,APPENDIX_SOURCE_COMMIT} from '../scripts/verify-vendored-appendix.mjs';

const root=resolve(import.meta.dirname,'..');

test('Git: rechazo de enlaces, duplicados y rutas fuera del árbol de Appendix',()=>{
 const sha='0123456789abcdef0123456789abcdef01234567';
 const row='100644 blob '+sha+'\tREADME.md\0';
 assert.deepEqual(parseVendorGitTree(row),[{path:'README.md',sha,mode:'100644'}]);
 assert.throws(()=>parseVendorGitTree('100644 blob '+sha+'\t../x\0'),/ruta insegura/);
 assert.throws(()=>parseVendorGitTree('120000 blob '+sha+'\tfoo\0'),/modo u objeto/);
 assert.throws(()=>parseVendorGitTree(row+row),/rutas repetidas/);
});

test('Appendix autónomo: 111 fuentes e icono binario tienen exactamente el árbol Git original',async()=>{
 const report=await verifyVendoredAppendix({repoRoot:root});
 const sourceLock=JSON.parse(await readFile(join(root,'config/sources.lock.json'),'utf8'));
 assert.equal(report.schema,'schola-appendix-vendored-source/v1');
 assert.equal(report.treeSha,APPENDIX_SOURCE_TREE);
 assert.equal(report.originCommit,APPENDIX_SOURCE_COMMIT);
 assert.equal(report.originCommit,sourceLock.sources.appendix.sha);
 assert.equal(report.sourcePath,'vendor/appendix');
 assert.equal(report.sourceMode,'vendored');
 assert.equal(report.files,111);
 assert.equal(report.bytes,2160046);
 assert.equal(report.repositoryDeletionApproved,false);
 assert.equal(report.officialSourceDependency,false);
 assert.equal(report.canCompileWithoutSourceCheckout,true);
 assert.equal(new Set(report.entries.map(x=>x.path)).size,111);
 assert.ok(report.entries.some(x=>x.path==='apple-touch-icon.png'&&x.bytes===9230));
 assert.ok(report.entries.some(x=>x.path==='assets/curriculum.json'));
 assert.ok(report.entries.some(x=>x.path==='val/curriculum.json'));
 assert.ok(report.entries.some(x=>x.path==='assets/app.js'));
 assert.ok(report.entries.some(x=>x.path==='.nojekyll'));
 assert.ok((await stat(join(root,'vendor/appendix/apple-touch-icon.png'))).isFile());
 assert.equal(report.entries.reduce((s,x)=>s+x.bytes,0),2160046);
});
test('La compilación y GitHub Actions ya no descargan Appendix',async()=>{
 const [build,ci]=await Promise.all([
  readFile(join(root,'scripts/build.mjs'),'utf8'),
  readFile(join(root,'.github/workflows/integracion.yml'),'utf8')
 ]);
 assert.ok(build.includes("join(root,'vendor/appendix')"));
 assert.ok(build.includes('verifyVendoredAppendix'));
 assert.ok(!build.includes('.sources/appendix'));
 assert.ok(!build.includes("process.env.APPENDIX_SOURCE||"));
 assert.ok(ci.includes('working-directory: vendor/appendix'));
 assert.ok(ci.includes('test ! -d .sources/appendix'));
 assert.ok(!ci.includes('repository: ArchaiosMagister/Appendix-grammaticae'));
 assert.ok(!ci.includes('path: .sources/appendix'));
});
