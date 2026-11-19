// Verifica el snapshot exacto del Evolutio original sin checkout ni red.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {join,resolve,dirname,sep,isAbsolute} from 'node:path';
import {pathToFileURL} from 'node:url';

export const SOURCE_COMMIT='901dacb125ee7894ea9d11faf7b0d0afa7e713b5';
export const SOURCE_TREE='91fb41736365ab4bd4f81ca8b265ceb765907354';
const SOURCE='vendor/evolutio',FILE_COUNT=53,TOTAL_BYTES=1608767;
const root=resolve(import.meta.dirname,'..');
const ensure=(ok,what)=>{if(!ok)throw Error('Evolutio interno: '+what);};
const git=(cwd,...args)=>execFileSync('git',['-C',cwd,...args],
 {encoding:'utf8',maxBuffer:16*1024*1024}).trim();
const blobSha=bytes=>createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
export function parseEvolutioGitTree(tree){
 const list=tree.split('\0').filter(Boolean).map(line=>{
  const pos=line.indexOf('\t');
  ensure(pos>0,'entrada Git inválida');
  const [mode,type,sha]=line.slice(0,pos).split(' '),path=line.slice(pos+1);
  ensure(mode==='100644'&&type==='blob'&&/^[a-f0-9]{40}$/.test(sha),
    'modo u objeto inesperado '+path);
  ensure(path&&path!=='..'&&!isAbsolute(path)&&!path.startsWith('/')&&
    !path.includes('\\')&&!path.split('/').includes('..'),'ruta insegura '+path);
  return {path,mode,sha};
 });
 ensure(new Set(list.map(x=>x.path)).size===list.length,'entradas duplicadas');
 return list.sort((a,b)=>a.path.localeCompare(b,'en'));
}
export async function verifyVendoredEvolutio({repoRoot=root}={}){
 const lock=JSON.parse(await readFile(join(repoRoot,'config/sources.lock.json'),'utf8')).sources?.evolutio;
 ensure(lock?.repository==='ArchaiosMagister/EvolucionFonetica'&&lock.integrated===true&&
  lock.sha===SOURCE_COMMIT&&lock.sourceMode==='vendored'&&lock.path===SOURCE&&
  lock.treeSha===SOURCE_TREE,'lock de fuente original no corresponde al snapshot');
 const tree=git(repoRoot,'rev-parse','HEAD:'+SOURCE);
 ensure(tree===SOURCE_TREE,'árbol Git diferente del original');
 const entries=parseEvolutioGitTree(git(repoRoot,'ls-tree','-rz','HEAD:'+SOURCE));
 ensure(entries.length===FILE_COUNT,'cantidad de archivos distinta del origen');
 const base=join(repoRoot,SOURCE),out=[];
 let bytesCount=0;
 for(const entry of entries){
  const full=resolve(base,entry.path);
  ensure(full.startsWith(base+sep),'ruta fuera de la fuente');
  const bytes=await readFile(full);
  ensure(blobSha(bytes)===entry.sha,'contenido alterado '+entry.path);
  bytesCount+=bytes.length;
  out.push({...entry,bytes:bytes.length});
 }
 ensure(bytesCount===TOTAL_BYTES,'tamaño total distinto del origen');
 for(const path of ['README.md','package.json','index.html','manifest.webmanifest',
  'sw.js','data/pilot.json','data/difficulty.json','src/app.mjs','src/engine.mjs',
  'src/rules.mjs','src/latin.mjs','src/study.mjs','src/update.mjs',
  'tests/engine.test.mjs','icons/icon-192.png'])
  ensure(out.some(x=>x.path===path),'archivo esencial ausente '+path);
 const bank=JSON.parse(await readFile(join(base,'data/pilot.json'),'utf8'));
 ensure(bank?.words?.length===522,'banco original castellano incompleto');
 ensure(new Set(bank.words.map(w=>w.id)).size===522,'IDs originales duplicados');
 return {
  schema:'schola-evolutio-vendored-source/v1',origin:lock.repository,
  originCommit:SOURCE_COMMIT,sourcePath:SOURCE,treeSha:tree,
  files:entries.length,bytes:bytesCount,originalWords:bank.words.length,
  canCompileWithoutCheckout:true,repositoryArchiveApproved:false,
  repositoryDeletionApproved:false,entries:out
 };
}
export async function auditVendoredEvolutio(options={}){
 const report=await verifyVendoredEvolutio(options);
 const file=join(options.repoRoot??root,'build/academic-audits/evolutio-autonomia/manifiesto-vendorizado.json');
 await mkdir(dirname(file),{recursive:true});
 await writeFile(file,JSON.stringify(report,null,2)+'\n');
 console.log('Evolutio fuente original verificable:',report.files,'archivos',report.bytes,'bytes');
 return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)
 await auditVendoredEvolutio();
