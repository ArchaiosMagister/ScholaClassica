import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mkdtemp,mkdir,writeFile,readFile,copyFile,rm,symlink} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {getBackupPlan,verifyGitBundle} from '../scripts/backup-originals.mjs';
import {verifyBackupPair,verifyLocalBackupCopies}
 from '../scripts/verify-backup-copies.mjs';

const root=resolve(import.meta.dirname,'..');
const git=(...args)=>execFileSync('git',args,{
 encoding:'utf8',stdio:['ignore','pipe','pipe']
}).trim();

async function fixture(){
 const base=await mkdtemp(join(tmpdir(),'schola-two-copies-'));
 const source=join(base,'original'),copy=join(base,'duplicado');
 await mkdir(source);await mkdir(copy);
 const work=join(base,'git-work');
 git('init','-b','main',work);
 git('-C',work,'config','user.name','Fictitious Test');
 git('-C',work,'config','user.email','example@test.invalid');
 await writeFile(join(work,'document.txt'),'Prueba de restauración sin datos reales.\n');
 git('-C',work,'add','document.txt');
 git('-C',work,'commit','-m','Ejemplo');
 git('-C',work,'tag','v1');
 const sha=git('-C',work,'rev-parse','HEAD');
 const mirror=join(base,'mirror.git');
 git('clone','--mirror','--',work,mirror);
 const file='Appendix-grammaticae.bundle';
 const record=await verifyGitBundle({
  mirror,bundle:join(source,file),lockedSha:sha
 });
 const plan=[{
  id:'appendix',repository:'ArchaiosMagister/Appendix-grammaticae',
  academicCommit:sha,file
 }];
 const manifest={
  schema:'schola-local-git-backup/v1',
  createdOutsideScholaCheckout:true,restorationTested:true,
  records:[{repository:plan[0].repository,filename:file,...record}],
  offDeviceCopyVerified:false,manualSecondaryCopyRequired:true,
  archivingAuthorized:false,deletionAuthorized:false
 };
 const bytes=JSON.stringify(manifest,null,2)+'\n';
 await writeFile(join(source,'respaldo-git-verificado.json'),bytes);
 await writeFile(join(copy,'respaldo-git-verificado.json'),bytes);
 await copyFile(join(source,file),join(copy,file));
 return {base,source,copy,plan,file,manifest};
}

test('La segunda copia conserva el manifiesto, los hashes y restaura el bundle',async()=>{
 const fx=await fixture();
 try{
  const result=await verifyBackupPair({
   plan:fx.plan,sourceDir:fx.source,copyDir:fx.copy,repoRoot:root
  });
  assert.equal(result.archivesVerified,1);
  assert.equal(result.hashesIdentical,true);
  assert.equal(result.copyRestorationTested,true);
  assert.equal(result.secondaryCopyCompared,true);
  assert.equal(result.physicalDeviceIndependenceVerified,false);
  assert.equal(result.safeToArchive,false);
  assert.equal(result.safeToDelete,false);
  assert.equal(result.databaseBackupsVerified,false);
  assert.equal(result.ipadTransferVerified,false);
 }finally{await rm(fx.base,{recursive:true,force:true})}
});

test('Detecta corrupción, cambio de manifiesto y carpeta compartida',async()=>{
 const fx=await fixture();
 try{
  await assert.rejects(verifyBackupPair({
   plan:fx.plan,sourceDir:fx.source,copyDir:fx.source,repoRoot:root
  }),/independientes/);
  const same=join(fx.base,'subdir');
  await mkdir(same);
  await assert.rejects(verifyBackupPair({
   plan:fx.plan,sourceDir:fx.source,copyDir:same,repoRoot:root
  }));
  const originalManifest=await readFile(join(fx.copy,'respaldo-git-verificado.json'));
  await writeFile(join(fx.copy,'respaldo-git-verificado.json'),
   JSON.stringify({...fx.manifest,restorationTested:false}));
  await assert.rejects(verifyBackupPair({
   plan:fx.plan,sourceDir:fx.source,copyDir:fx.copy,repoRoot:root
  }),/manifiesto/);
  await writeFile(join(fx.copy,'respaldo-git-verificado.json'),originalManifest);
  await writeFile(join(fx.copy,fx.file),'Archivo truncado');
  await assert.rejects(verifyBackupPair({
   plan:fx.plan,sourceDir:fx.source,copyDir:fx.copy,repoRoot:root
  }),/SHA-256|Contenido/);
  await rm(join(fx.copy,fx.file));
  await symlink(join(fx.source,fx.file),join(fx.copy,fx.file));
  await assert.rejects(verifyBackupPair({
   plan:fx.plan,sourceDir:fx.source,copyDir:fx.copy,repoRoot:root
  }),/enlazado/);
 }finally{await rm(fx.base,{recursive:true,force:true})}
});

test('No se confunde comprobar una copia con tener respaldo remoto de Supabase',async()=>{
 const lock=JSON.parse(readFileSync(join(root,'config/sources.lock.json'),'utf8'));
 assert.equal(getBackupPlan(lock).length,3);
 await assert.rejects(verifyLocalBackupCopies(lock,{
  sourceDir:root,copyDir:root,repoRoot:root
 }),/dentro del repositorio/);
 const source=readFileSync(join(root,'scripts/verify-backup-copies.mjs'),'utf8');
 assert.ok(!source.includes('supabase.from('));
 assert.ok(!source.includes('safeToArchive:true'));
 assert.ok(source.includes('physicalDeviceIndependenceVerified:false'));
});
