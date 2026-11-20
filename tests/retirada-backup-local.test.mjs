import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mkdtemp,mkdir,readFile,rm,stat} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {getBackupPlan,verifyGitBundle,createLocalBackups}
 from '../scripts/backup-originals.mjs';

const root=resolve(import.meta.dirname,'..');
const lock=JSON.parse(readFileSync(join(root,'config/sources.lock.json'),'utf8'));
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
test('Solo hay tres fuentes públicas respaldables y se excluye GeneradorExamenes',()=>{
 const plan=getBackupPlan(lock);
 assert.deepEqual(plan.map(x=>x.id),['appendix','evolutio','vocabula']);
 for(const record of plan){
  assert.match(record.cloneUrl,/^https:\/\/github\.com\/ArchaiosMagister\/[a-zA-Z-]+\.git$/);
  assert.match(record.academicCommit,/^[0-9a-f]{40}$/);
  assert.match(record.academicTree,/^[0-9a-f]{40}$/);
  assert.match(record.file,/\.bundle$/);
 }
 assert.ok(!JSON.stringify(plan).includes('GeneradorExamenes'));
 for(const modify of [
  x=>x.sources.appendix.sha='not-pinned',
  x=>x.sources.evolutio.integrated=false,
  x=>x.sources.vocabula.repository='Other/repo'
 ]){
  const bad=structuredClone(lock);modify(bad);
  assert.throws(()=>getBackupPlan(bad),/Fuente sin fijar/);
 }
});

test('Un bundle de prueba restaura rama, etiqueta, SHA y pasa git-fsck',async()=>{
 const scratch=await mkdtemp(join(tmpdir(),'schola-test-backup-'));
 try{
  const repo=join(scratch,'source');
  await mkdir(repo);
  git('init','-b','main',repo);
  git('-C',repo,'config','user.email','test@example.com');
  git('-C',repo,'config','user.name','Test Fixture');
  const {writeFile}=await import('node:fs/promises');
  await writeFile(join(repo,'fuente.txt'),'Contenido de prueba sin datos reales.\n');
  git('-C',repo,'add','.');
  git('-C',repo,'commit','-m','Prueba de restauración');
  const locked=git('-C',repo,'rev-parse','HEAD');
  git('-C',repo,'tag','v1-prueba');
  const mirror=join(scratch,'original.git');
  git('clone','--mirror',repo,mirror);
  const bundle=join(scratch,'verificado.bundle');
  const result=await verifyGitBundle({mirror,bundle,lockedSha:locked});
  assert.equal(result.academicCommit,locked);
  assert.equal(result.mainCommit,locked);
  assert.equal(result.refs,2);
  assert.match(result.sha256,/^[0-9a-f]{64}$/);
  assert.ok(result.bytes>0);
  assert.match(result.verification,/restored-mirror/);
  assert.equal((await stat(bundle)).isFile(),true);
  assert.throws(()=>git('bundle','verify',join(scratch,'archivo-inexistente.bundle')));
 }finally{
  await rm(scratch,{recursive:true,force:true});
 }
});

test('El programa impide crear respaldos dentro del repositorio y no hace descargas',async()=>{
 await assert.rejects(
  createLocalBackups(lock,{destination:join(root,'build','respaldo-no-permitido'),root}),
  /dentro del repositorio/
 );
});
