// Comprueba DOS carpetas de respaldos locales existentes. No crea copias,
// no contacta a Supabase ni a GitHub y NO acredita independencia física
// de dispositivos: eso debe comprobarlo el titular del soporte.
import assert from 'node:assert/strict';
import {createReadStream} from 'node:fs';
import {readFile,realpath,lstat,mkdtemp,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {join,resolve,sep} from 'node:path';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {getBackupPlan} from './backup-originals.mjs';

const HASH=/^[a-f0-9]{64}$/;
const SHA=/^[a-f0-9]{40}$/;
const manifestName='respaldo-git-verificado.json';
const git=args=>execFileSync('git',args,{
 encoding:'utf8',timeout:240000,maxBuffer:8*1024*1024,
 stdio:['ignore','pipe','pipe']
}).trim();
const nested=(p,parent)=>p===parent||p.startsWith(parent+sep);
async function regularFile(dir,name){
 if(name.includes('/')||name.includes('\\')||name==='.'||name==='..')
  throw Error('Nombre de archivo de respaldo no seguro');
 const file=join(dir,name);
 const item=await lstat(file);
 if(!item.isFile()||item.isSymbolicLink())
  throw Error('Respaldo inexistente o enlazado: '+name);
 return file;
}
async function hashFile(path){
 const sha=createHash('sha256');
 for await(const chunk of createReadStream(path))sha.update(chunk);
 return sha.digest('hex');
}
async function restoreAndCheck(bundle,record){
 const scratch=await mkdtemp(join(tmpdir(),'schola-verify-copy-'));
 try{
  const empty=join(scratch,'empty.git');
  git(['init','--bare',empty]);
  git(['-C',empty,'bundle','verify',bundle]);
  const mirror=join(scratch,'restored.git');
  git(['clone','--mirror','--',bundle,mirror]);
  git(['-C',mirror,'cat-file','-e',record.academicCommit+'^{commit}']);
  if(record.mainCommit){
   const actual=git(['-C',mirror,'rev-parse','refs/heads/main']);
   if(actual!==record.mainCommit)
    throw Error('La rama principal restaurada no coincide con el manifiesto');
  }
  const count=git(['-C',mirror,'for-each-ref','--format=%(refname)'])
   .split('\n').filter(Boolean).length;
  if(count!==record.refs)
   throw Error('Número de ramas y etiquetas restauradas diferente del manifiesto');
  git(['-C',mirror,'fsck','--full','--no-reflogs']);
 }finally{
  await rm(scratch,{recursive:true,force:true});
 }
}

// Plan inyectable solo para pruebas locales con Git ficticio.
// El acceso desde la línea de comandos siempre usa getBackupPlan(lock).
export async function verifyBackupPair({plan,sourceDir,copyDir,repoRoot}){
 if(!Array.isArray(plan)||!plan.length||!sourceDir||!copyDir||!repoRoot)
  throw Error('Faltan el plan y las dos carpetas de respaldos');
 const [source,copy,root]=await Promise.all([
  realpath(resolve(sourceDir)),realpath(resolve(copyDir)),realpath(resolve(repoRoot))
 ]);
 if(nested(source,root)||nested(copy,root))
  throw Error('Los respaldos no pueden estar dentro del repositorio ScholaClassica');
 if(nested(source,copy)||nested(copy,source))
  throw Error('Las carpetas deben ser independientes y no estar anidadas');
 const first=await regularFile(source,manifestName);
 const second=await regularFile(copy,manifestName);
 const [left,right]=await Promise.all([readFile(first),readFile(second)]);
 if(!left.equals(right))throw Error('El manifiesto de la segunda copia difiere del original');
 let manifest;
 try{manifest=JSON.parse(left.toString('utf8'))}
 catch{throw Error('Manifiesto JSON inválido')}
 if(manifest?.schema!=='schola-local-git-backup/v1'||
  manifest.createdOutsideScholaCheckout!==true||
  manifest.restorationTested!==true||!Array.isArray(manifest.records)||
  manifest.records.length!==plan.length)
  throw Error('Manifiesto de respaldo incompleto o incompatible');
 const allowed=new Map(plan.map(x=>[x.file,x]));
 if(allowed.size!==plan.length)throw Error('Plan de respaldo con nombres repetidos');
 const checked=new Set();
 for(const record of manifest.records){
  const entry=allowed.get(record.filename);
  if(!entry||checked.has(record.filename)||record.repository!==entry.repository||
     record.academicCommit!==entry.academicCommit||!SHA.test(record.academicCommit)||
     !HASH.test(record.sha256||'')||
     !Number.isSafeInteger(record.bytes)||record.bytes<=0||
     !Number.isSafeInteger(record.refs)||record.refs<1||
     !(record.mainCommit===null||SHA.test(record.mainCommit||''))||
     typeof record.verification!=='string'||
     !record.verification.includes('restored-mirror'))
   throw Error('Registro no corresponde al proyecto y commit académico esperado');
  checked.add(record.filename);
  const a=await regularFile(source,record.filename);
  const b=await regularFile(copy,record.filename);
  for(const file of [a,b]){
   const item=await lstat(file);
   if(item.size!==record.bytes||await hashFile(file)!==record.sha256)
    throw Error('Contenido o SHA-256 del bundle incorrecto: '+record.filename);
  }
  // Volver a restaurar desde la SEGUNDA copia, nunca desde el origen.
  await restoreAndCheck(b,record);
 }
 assert.equal(checked.size,plan.length);
 return {
  schema:'schola-verified-backup-pair/v1',
  archivesVerified:checked.size,hashesIdentical:true,
  copyRestorationTested:true,
  secondaryCopyCompared:true,
  physicalDeviceIndependenceVerified:false,
  databaseBackupsVerified:false,
  ipadTransferVerified:false,
  archiveAuthorized:false,deleteAuthorized:false,
  safeToArchive:false,safeToDelete:false
 };
}
export async function verifyLocalBackupCopies(lock,options){
 return verifyBackupPair({...options,plan:getBackupPlan(lock)});
}
async function main(){
 const args=process.argv.slice(2);
 if(args.length!==2||args.some(x=>!x||x.startsWith('--')))
  throw Error('Uso: node scripts/verify-backup-copies.mjs /carpeta/original /carpeta/segunda-copia');
 const root=resolve(import.meta.dirname,'..');
 const lock=JSON.parse(await readFile(join(root,'config/sources.lock.json'),'utf8'));
 const result=await verifyLocalBackupCopies(lock,{
  sourceDir:args[0],copyDir:args[1],repoRoot:root
 });
 console.log('Copias verificadas: '+result.archivesVerified+
  ' bundles. Hashes coinciden y segunda copia restaurada correctamente.');
 console.log('La independencia física del soporte NO está verificada automáticamente.');
 console.log('No incluye Supabase, PWA instaladas ni progreso remoto. No autoriza retirar repositorios.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)
 main().catch(error=>{console.error('Verificación incompleta: '+error.message);process.exitCode=1});
