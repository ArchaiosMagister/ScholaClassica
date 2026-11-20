// Preparar respaldos GIT RESTAURABLES fuera de ScholaClassica, SOLO con ejecución
// local explícita --dest. No archiva, borra ni escribe en repositorios remotos.
// Los bundles pueden contener secretos históricos: no subirlos a GitHub/Pages.
import {readFile,mkdir,rm,mkdtemp,stat,realpath,rename,open} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve,join,sep} from 'node:path';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';

const allowed={
 appendix:'ArchaiosMagister/Appendix-grammaticae',
 evolutio:'ArchaiosMagister/EvolucionFonetica',
 vocabula:'ArchaiosMagister/VocabulaLatinaGraecaque'
};
const exactSha=/^[0-9a-f]{40}$/;
const command=(args)=>execFileSync('git',args,{
 encoding:'utf8',timeout:240000,maxBuffer:8*1024*1024,
 stdio:['ignore','pipe','pipe']
}).trim();

export function getBackupPlan(lock){
 if(lock?.schema!==1||!lock.sources)throw Error('Lock de fuentes incorrecto');
 return Object.entries(allowed).map(([id,repo])=>{
  const item=lock.sources[id];
  if(item?.repository!==repo||item.sourceMode!=='vendored'||
    item.integrated!==true||!exactSha.test(item.sha||'')||
    !exactSha.test(item.treeSha||''))
   throw Error('Fuente sin fijar para respaldo: '+id);
  return {
   id,repository:repo,cloneUrl:'https://github.com/'+repo+'.git',
   academicCommit:item.sha,academicTree:item.treeSha,
   file:repo.split('/')[1]+'.bundle'
  };
 });
}

function refs(folder){
 const out=command(['-C',folder,'for-each-ref','--format=%(refname) %(objectname)']);
 if(!out)throw Error('El espejo no contiene ramas ni etiquetas Git');
 return out.split('\n').sort();
}

async function fileHash(file){
 const hash=createHash('sha256');
 for await(const chunk of createReadStream(file))hash.update(chunk);
 return hash.digest('hex');
}

export async function verifyGitBundle({mirror,bundle,lockedSha}){
 if(!exactSha.test(lockedSha||''))throw Error('SHA académico no válido');
 if(command(['-C',mirror,'rev-parse','--is-bare-repository'])!=='true')
  throw Error('La fuente no es un clon espejo/bare');
 command(['-C',mirror,'cat-file','-e',lockedSha+'^{commit}']);
 const before=refs(mirror);
 const scratch=await mkdtemp(join(tmpdir(),'schola-check-bundle-'));
 try{
  command(['-C',mirror,'bundle','create',bundle,'--all']);
  command(['-C',mirror,'bundle','verify',bundle]);
  const restored=join(scratch,'restored.git');
  command(['clone','--mirror','--',bundle,restored]);
  const after=refs(restored);
  if(JSON.stringify(before)!==JSON.stringify(after))
   throw Error('Las ramas y etiquetas recuperadas no coinciden con el espejo');
  command(['-C',restored,'cat-file','-e',lockedSha+'^{commit}']);
  command(['-C',restored,'fsck','--full','--no-reflogs']);
  const main=after.find(ref=>ref.startsWith('refs/heads/main '))?.split(' ')[1]||null;
  const size=(await stat(bundle)).size;
  if(size<=0)throw Error('Bundle vacío');
  return {sha256:await fileHash(bundle),bytes:size,refs:before.length,
   academicCommit:lockedSha,mainCommit:main,verification:'bundle-verify + restored-mirror + git-fsck'};
 }finally{
  await rm(scratch,{recursive:true,force:true});
 }
}

export async function createLocalBackups(lock,{destination,root}){
 const plan=getBackupPlan(lock);
 if(!destination||!root)throw Error('Falta directorio de destino o repositorio');
 const dest=resolve(destination),base=await realpath(root);
 if(dest===base||dest.startsWith(base+sep))
  throw Error('No guardar bundles dentro del repositorio ScholaClassica');
 await mkdir(dest,{recursive:true,mode:0o700});
 const realDest=await realpath(dest);
 if(realDest===base||realDest.startsWith(base+sep))
  throw Error('Destino enlazado al repositorio: usar disco/carpeta ajena');
 const manifest=join(realDest,'respaldo-git-verificado.json');
 const paths=plan.flatMap(x=>[join(realDest,x.file),join(realDest,x.file+'.partial')]);
 for(const path of [...paths,manifest]){
  try{await stat(path);throw Error('Archivo existente, no sobrescribir: '+path)}
  catch(error){if(error.code!=='ENOENT')throw error}
 }
 const rows=[];
 for(const spec of plan){
  const scratch=await mkdtemp(join(tmpdir(),'schola-mirror-'));
  const part=join(realDest,spec.file+'.partial');
  const complete=join(realDest,spec.file);
  try{
   const mirror=join(scratch,'source.git');
   command(['clone','--mirror','--',spec.cloneUrl,mirror]);
   const record=await verifyGitBundle({mirror,bundle:part,lockedSha:spec.academicCommit});
   await rename(part,complete);
   rows.push({repository:spec.repository,filename:spec.file,...record});
  }catch(error){
   await rm(part,{force:true});
   throw Error('No se completó '+spec.repository+': '+error.message);
  }finally{
   await rm(scratch,{recursive:true,force:true});
  }
 }
 const data={
  schema:'schola-local-git-backup/v1',createdAt:new Date().toISOString(),
  scope:'Tres repositorios originales de código, ramas, etiquetas e historial; no incluye Pages, PWA instaladas, bases de datos, usuarios ni Git LFS externos',
  records:rows,createdOutsideScholaCheckout:true,restorationTested:true,
  offDeviceCopyVerified:false,
  manualSecondaryCopyRequired:true,
  archivingAuthorized:false,deletionAuthorized:false,
  warning:'Los bundles contienen historia Git y podrían incluir secretos históricos; NO subir a un repositorio público.'
 };
 // Nunca publica información ni sube ficheros a GitHub. Solo deja evidencias en --dest.
 const fh=await open(manifest,'wx',0o600);
 try{await fh.writeFile(JSON.stringify(data,null,2)+'\n')}finally{await fh.close()}
 return {destination:realDest,manifest,records:rows.length};
}

async function main(){
 const args=process.argv.slice(2),planOnly=args.length===1&&args[0]==='--plan';
 const doBackup=args.length===2&&args[0]==='--dest'&&Boolean(args[1]);
 if(!planOnly&&!doBackup)throw Error('Uso: node scripts/backup-originals.mjs --plan | --dest /ruta/fuera/del/repo');
 const root=resolve(import.meta.dirname,'..');
 const lock=JSON.parse(await readFile(join(root,'config/sources.lock.json'),'utf8'));
 const plan=getBackupPlan(lock);
 if(planOnly){
  console.log(JSON.stringify({
   plan,performed:false,safeToArchive:false,safeToDelete:false,
   note:'Plan sin descargas. Ejecutar --dest en un equipo personal; guardar otra copia en un disco externo.'
  },null,2));
  return;
 }
 const info=await createLocalBackups(lock,{destination:args[1],root});
 console.log('Se han verificado '+info.records+' bundles Git locales: '+info.destination);
 console.log('Crear también copia fuera del equipo y revisar PWA y Supabase. NO se autoriza archivar.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)
 main().catch(error=>{console.error('Respaldo no terminado: '+error.message);process.exitCode=1});
