import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mkdtemp,mkdir,writeFile,readFile,lstat,rm,symlink,realpath} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {getBackupPlan} from '../scripts/backup-originals.mjs';
import {checkTwoDestinations,makeTwoLocalBackups}
 from '../scripts/backup-two-copies.mjs';

const root=resolve(import.meta.dirname,'..');
const lock=JSON.parse(readFileSync(join(root,'config/sources.lock.json'),'utf8'));
async function fixture(){
 const base=await realpath(await mkdtemp(join(tmpdir(),'schola-dual-safe-')));
 const repo=join(base,'repo'),home=join(base,'home'),disk=join(base,'disk');
 await Promise.all([mkdir(repo),mkdir(home),mkdir(disk)]);
 const primary=join(home,'copia-git'),secondary=join(disk,'copia-git');
 const statImpl=async p=>({dev:resolve(p)===resolve(home)?10:20});
 return {base,repo,home,disk,primary,secondary,statImpl};
}
test('Se rechaza escribir en el checkout, sobre carpetas existentes o en el mismo volumen',async()=>{
 const f=await fixture();
 try{
  const q={primary:f.primary,secondary:f.secondary,root:f.repo};
  await assert.rejects(checkTwoDestinations(q),/MISMO sistema/);
  await assert.rejects(checkTwoDestinations({...q,primary:'copia'}),/rutas absolutas/);
  await assert.rejects(checkTwoDestinations({...q,primary:join(f.repo,'privado'),
   statImpl:f.statImpl}),/ScholaClassica/);
  await mkdir(f.primary);
  await assert.rejects(checkTwoDestinations({...q,statImpl:f.statImpl}),/Ya existe/);
  await rm(f.primary,{recursive:true});
  await symlink(f.disk,f.primary);
  await assert.rejects(checkTwoDestinations({...q,statImpl:f.statImpl}),/Ya existe/);
 }finally{await rm(f.base,{recursive:true,force:true})}
});
test('Previsualizar rutas no crea archivos ni desencadena descargas',async()=>{
 const f=await fixture();
 try{
  const result=await checkTwoDestinations({
   primary:f.primary,secondary:f.secondary,root:f.repo,statImpl:f.statImpl
  });
  assert.equal(result.primary,f.primary);
  assert.equal(result.secondary,f.secondary);
  await assert.rejects(lstat(f.primary),{code:'ENOENT'});
  await assert.rejects(lstat(f.secondary),{code:'ENOENT'});
 }finally{await rm(f.base,{recursive:true,force:true})}
});
test('El modo crear copia los cuatro archivos, verifica la secundaria y no autoriza retirada',async()=>{
 const f=await fixture();
 const filenames=[
  ...getBackupPlan(lock).map(x=>x.file),'respaldo-git-verificado.json'
 ];
 let backups=0,verified=0;
 try{
  const report=await makeTwoLocalBackups(lock,{
   primary:f.primary,secondary:f.secondary,root:f.repo,statImpl:f.statImpl,
   backup:async(_,opts)=>{
    backups++;
    for(const name of filenames)
     await writeFile(join(opts.destination,name),'Contenido Git de prueba '+name);
   },
   verify:async(_,opts)=>{
    verified++;
    assert.equal(opts.sourceDir,f.primary);
    assert.equal(opts.copyDir,f.secondary);
    for(const name of filenames){
     assert.deepEqual(await readFile(join(f.primary,name)),
      await readFile(join(f.secondary,name)));
     assert.equal((await lstat(join(f.secondary,name))).mode&0o077,0);
    }
    return {archivesVerified:3,copyRestorationTested:true,hashesIdentical:true};
   }
  });
  assert.equal(backups,1);
  assert.equal(verified,1);
  assert.equal(report.archivesVerified,3);
  assert.equal(report.twoDifferentFileSystems,true);
  assert.equal(report.physicallyDifferentDisksConfirmed,false);
  assert.equal(report.supabaseBackupsVerified,false);
  assert.equal(report.ipadVerified,false);
  assert.equal(report.archiveApproved,false);
  assert.equal(report.deleteApproved,false);
 }finally{await rm(f.base,{recursive:true,force:true})}
});
test('La creación falla de forma cerrada si la copia secundaria no se restaura',async()=>{
 const f=await fixture();
 try{
  await assert.rejects(makeTwoLocalBackups(lock,{
   primary:f.primary,secondary:f.secondary,root:f.repo,statImpl:f.statImpl,
   backup:async(_,opts)=>{
    for(const x of getBackupPlan(lock))
     await writeFile(join(opts.destination,x.file),'Prueba');
    await writeFile(join(opts.destination,'respaldo-git-verificado.json'),'{}');
   },
   verify:async()=>({archivesVerified:2,copyRestorationTested:false,hashesIdentical:true})
  }),/NO ha superado/);
 }finally{await rm(f.base,{recursive:true,force:true})}
});
test('No hay operación de eliminación o archivo remoto y se bloquea CI',()=>{
 const s=readFileSync(join(root,'scripts/backup-two-copies.mjs'),'utf8');
 assert.match(s,/process\.env\.CI\|\|process\.env\.GITHUB_ACTIONS/);
 assert.match(s,/COPYFILE_EXCL/);
 assert.match(s,/--create/);
 assert.match(s,/physicallyDifferentDisksConfirmed:false/);
 assert.doesNotMatch(s,/deleteRepo|archiveRepo|service_role|supabase\.from\(/i);
});
