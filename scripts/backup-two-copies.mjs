// Dos copias Git privadas en volúmenes DISTINTOS, solo bajo --create explícito.
// Sin borrados, sin sobrescritura, sin CI, sin acceso a datos de alumnos/Supabase.
// Los bundles incluyen historia Git potencialmente sensible: NO compartir.
import {readFile,realpath,lstat,stat,mkdir,copyFile,chmod} from 'node:fs/promises';
import {constants} from 'node:fs';
import {basename,dirname,isAbsolute,join,resolve,sep} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createLocalBackups,getBackupPlan} from './backup-originals.mjs';
import {verifyLocalBackupCopies} from './verify-backup-copies.mjs';

const inside=(child,parent)=>child===parent||child.startsWith(parent+sep);
async function mustNotExist(path){
 try{await lstat(path);throw Error('Ya existe el destino, no se sobrescribirá: '+path)}
 catch(e){if(e.code!=='ENOENT')throw e}
}
export async function checkTwoDestinations({primary,secondary,root,statImpl=stat}){
 if(!primary||!secondary||!root||!isAbsolute(primary)||!isAbsolute(secondary))
  throw Error('Indica dos rutas absolutas y el repositorio de trabajo');
 if([basename(primary),basename(secondary)].some(x=>!x||x==='.'||x==='..'))
  throw Error('Los destinos deben tener nombre de carpeta');
 const [repo,firstParent,secondParent]=await Promise.all([
  realpath(root),realpath(dirname(primary)),realpath(dirname(secondary))
 ]);
 const first=join(firstParent,basename(primary));
 const second=join(secondParent,basename(secondary));
 if(inside(first,repo)||inside(second,repo)||inside(repo,first)||inside(repo,second))
  throw Error('No se permite guardar respaldos dentro de ScholaClassica ni alrededor de su checkout');
 if(inside(first,second)||inside(second,first))
  throw Error('Las dos carpetas no pueden estar anidadas ni ser la misma');
 await Promise.all([mustNotExist(first),mustNotExist(second)]);
 const [a,b]=await Promise.all([statImpl(firstParent),statImpl(secondParent)]);
 if(a.dev===b.dev)
  throw Error('Los destinos están en el MISMO sistema de archivos: conecta otro volumen protegido');
 return {primary:first,secondary:second,repoRoot:repo};
}
export async function makeTwoLocalBackups(lock,{
 primary,secondary,root,statImpl=stat,backup=createLocalBackups,
 verify=verifyLocalBackupCopies
}){
 const safe=await checkTwoDestinations({primary,secondary,root,statImpl});
 await mkdir(safe.primary,{mode:0o700});
 await backup(lock,{destination:safe.primary,root:safe.repoRoot});
 // Por seguridad, volver a comprobar el volumen externo antes de copiar.
 const secondParent=await realpath(dirname(safe.secondary));
 const firstDev=(await statImpl(dirname(safe.primary))).dev;
 const secondDev=(await statImpl(secondParent)).dev;
 if(firstDev===secondDev)
  throw Error('Se ha perdido el volumen externo: no se copia en la unidad primaria');
 await mkdir(safe.secondary,{mode:0o700});
 const files=[
  ...getBackupPlan(lock).map(x=>x.file),'respaldo-git-verificado.json'
 ];
 for(const file of files){
  // No sobrescribir, tampoco si otro proceso ha creado algo entre comprobaciones.
  await chmod(join(safe.primary,file),0o600);
  await copyFile(join(safe.primary,file),join(safe.secondary,file),constants.COPYFILE_EXCL);
  await chmod(join(safe.secondary,file),0o600);
 }
 const result=await verify(lock,{
  sourceDir:safe.primary,copyDir:safe.secondary,repoRoot:safe.repoRoot
 });
 if(result.archivesVerified!==3||!result.copyRestorationTested||
    !result.hashesIdentical)
  throw Error('La segunda copia NO ha superado la restauración de los tres bundles');
 return {
  archivesVerified:result.archivesVerified,
  copyRestorationTested:true,
  twoDifferentFileSystems:true,
  physicallyDifferentDisksConfirmed:false,
  supabaseBackupsVerified:false,
  ipadVerified:false,
  archiveApproved:false,
  deleteApproved:false
 };
}
async function main(){
 const args=process.argv.slice(2);
 if(args.length!==3||!['--plan','--create'].includes(args[0]))
  throw Error('Uso: node scripts/backup-two-copies.mjs --plan|--create /ruta/primaria /ruta/externa');
 const root=resolve(import.meta.dirname,'..');
 const {primary,secondary}=await checkTwoDestinations({
  root,primary:args[1],secondary:args[2]
 });
 if(args[0]==='--plan'){
  console.log('Plan seguro: carpeta 1='+primary+'; carpeta 2='+secondary);
  console.log('Volúmenes distintos detectados; sin archivos ni descargas.');
  console.log('Esto NO acredita soportes físicamente independientes. Confírmalo personalmente.');
  return;
 }
 if(process.env.CI||process.env.GITHUB_ACTIONS)
  throw Error('No se permiten respaldos históricos privados desde CI');
 const lock=JSON.parse(await readFile(join(root,'config/sources.lock.json'),'utf8'));
 const outcome=await makeTwoLocalBackups(lock,{primary,secondary,root});
 console.log(outcome.archivesVerified+' bundles verificados en DOS volúmenes distintos.');
 console.log('Se restauró la segunda copia. No se han enviado archivos fuera del equipo.');
 console.log('CONFIRMAR MANUALMENTE que son dos soportes físicos seguros e independientes.');
 console.log('Aún no se han verificado Supabase ni iPad; NO autoriza archivar ni borrar.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)
 main().catch(e=>{console.error('RESPALDO NO CERTIFICADO: '+e.message);process.exitCode=1});
