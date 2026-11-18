// Primera fase de autonomía de Appendix: crea una copia íntegra y verificable
// del origen FIJADO en un artefacto de pruebas, no en dist/ ni public/.
// No realiza ningún commit o despliegue y no borra el repositorio original.
import {readFile,copyFile,mkdir,writeFile,stat,readdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve,join,relative,isAbsolute,sep,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';

const root=resolve(import.meta.dirname,'..');
const source=join(root,'.sources/appendix');
const snapshot=join(root,'build/academic-audits/appendix-autonomia/fuente');
const manifest=join(root,'build/academic-audits/appendix-autonomia/manifiesto.json');
function ensure(value,message){if(!value)throw Error('Snapshot Appendix: '+message)}
function git(args,at=source){
 return execFileSync('git',['-C',at,...args],{encoding:'utf8',maxBuffer:8*1024*1024}).trim();
}
function gitBlob(bytes){
 return createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
}
export function parseTrackedFiles(output){
 const rows=output.split('\0').filter(Boolean).map(line=>{
  const tab=line.indexOf('\t'),meta=line.slice(0,tab),path=line.slice(tab+1);
  const [mode,sha,stage]=meta.split(' ');
  ensure(tab>0&&stage==='0'&&mode==='100644'&&/^[0-9a-f]{40}$/.test(sha),
   'entrada Git no ordinaria: '+path);
  ensure(path&&path!=='..'&&!path.startsWith('/')&&!path.split('/').includes('..')
    &&!path.includes('\\')&&!isAbsolute(path),'ruta fuera de fuente: '+path);
  return {path,sha,mode};
 });
 ensure(new Set(rows.map(r=>r.path)).size===rows.length,'rutas repetidas');
 return rows.sort((a,b)=>a.path.localeCompare(b,'en'));
}
export async function snapshotAppendix({repoRoot=root,sourceDir=source,targetDir=snapshot}={}){
 const lock=JSON.parse(await readFile(join(repoRoot,'config/sources.lock.json'),'utf8'));
 const pinned=lock.sources.appendix;
 ensure(pinned?.repository==='ArchaiosMagister/Appendix-grammaticae'
  &&pinned.integrated===true&&/^[0-9a-f]{40}$/.test(pinned.sha),
  'fuente, permiso o referencia cambiaron');
 const head=git(['rev-parse','HEAD'],sourceDir);
 ensure(head===pinned.sha,'el checkout no coincide con el commit fijado');
 const treeSha=git(['rev-parse','HEAD^{tree}'],sourceDir);
 ensure(treeSha==='ac24b5b997d3a37d78ef43de36085b850b22e472',
  'árbol Git original distinto del lote de 111 ficheros');
 ensure(!targetDir.startsWith(join(repoRoot,'dist')+sep)
   &&!targetDir.startsWith(join(repoRoot,'public')+sep)
   &&targetDir!==sourceDir,'prohibido escribir en Pages o en el origen');
 const files=parseTrackedFiles(git(['ls-files','--stage','-z'],sourceDir));
 ensure(files.length===111,'el inventario de Appendix cambió de 111 archivos: revisar');
 let bytes=0,nonText=0;
 const copies=[];
 for(const file of files){
  const sourceFile=join(sourceDir,file.path);
  const raw=await readFile(sourceFile);
  const blob=gitBlob(raw);
  ensure(blob===file.sha,'bytes diferentes al índice Git: '+file.path);
  const destination=join(targetDir,file.path);
  await mkdir(dirname(destination),{recursive:true});
  await copyFile(sourceFile,destination);
  const copied=await readFile(destination);
  ensure(gitBlob(copied)===file.sha,'el archivo copiado no conserva los bytes: '+file.path);
  bytes+=raw.length;
  if(/\.(png|jpe?g|ico|woff2?|ttf|webp)$/i.test(file.path))nonText++;
  copies.push({path:file.path,gitBlobSha:file.sha,bytes:raw.length});
 }
 ensure(bytes===2160046,'el tamaño total original cambió: '+bytes);
 ensure(copies.some(f=>f.path==='apple-touch-icon.png'),
  'falta el icono binario original');
 ensure(copies.some(f=>f.path==='assets/curriculum.json')
  &&copies.some(f=>f.path==='val/curriculum.json'),
  'falta currículo o traducción del origen');
 return {
  schema:'schola-appendix-source-snapshot/v1',
  date:'2026-11-18',origin:pinned.repository,sha:pinned.sha,
  completeOriginal:true,treeSha,files:copies.length,bytes,nonText,
  releasePolicy:{
   changesPublicApp:false,changesBuildSource:false,changesDocsInStudentPortal:false,
   allowsDeleteOriginal:false,validatedOfflineMigration:false
  },
  entries:copies
 };
}
export async function buildSnapshotAppendix(){
 const report=await snapshotAppendix();
 await mkdir(dirname(manifest),{recursive:true});
 await writeFile(manifest,JSON.stringify(report,null,2)+'\n');
 console.log('Appendix: fuente original copiada fuera de Pages y validada por SHA Git',
  JSON.stringify({files:report.files,bytes:report.bytes,sha:report.sha,nonText:report.nonText}));
 return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)
 await buildSnapshotAppendix();
