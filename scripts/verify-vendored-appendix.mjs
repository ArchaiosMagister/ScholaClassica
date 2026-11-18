// Comprobación fuerte de la fuente integrada de Appendix, sin acceder al repositorio original.
// Cada archivo (incluidos los binarios) debe coincidir con el objeto Git del
// árbol inmutable conservado: 111 ficheros y 2.160.046 bytes exactos.
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve,join,dirname,sep,isAbsolute} from 'node:path';
import {pathToFileURL} from 'node:url';

const root=resolve(import.meta.dirname,'..');
export const APPENDIX_SOURCE_TREE='ac24b5b997d3a37d78ef43de36085b850b22e472';
export const APPENDIX_SOURCE_COMMIT='6e9ae22d98c10f8752329d0fa65ad8dd882dcde9';
const SOURCE_REL='vendor/appendix';
const FILE_COUNT=111;
const TOTAL_BYTES=2160046;
const blobSha=bytes=>createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
function ensure(value,message){if(!value)throw Error('Appendix autónomo: '+message);}
function git(repoRoot,...args){
 return execFileSync('git',['-C',repoRoot,...args],{encoding:'utf8',maxBuffer:16*1024*1024}).trim();
}
export function parseVendorGitTree(text){
 const rows=text.split('\0').filter(Boolean).map(line=>{
  const tab=line.indexOf('\t');
  ensure(tab>0,'entrada malformada');
  const [mode,type,sha]=line.slice(0,tab).split(' ');
  const path=line.slice(tab+1);
  ensure(mode==='100644'&&type==='blob'&&/^[0-9a-f]{40}$/.test(sha),
   'modo u objeto de archivo inesperado: '+path);
  ensure(path&&path!=='..'&&!isAbsolute(path)&&!path.startsWith('/')&&
   !path.includes('\\')&&!path.split('/').includes('..'),
   'ruta insegura: '+path);
  return {path,sha,mode};
 });
 ensure(new Set(rows.map(x=>x.path)).size===rows.length,'rutas repetidas');
 return rows.sort((a,b)=>a.path.localeCompare(b,'en'));
}
export async function verifyVendoredAppendix({repoRoot=root}={}){
 const lock=JSON.parse(await readFile(join(repoRoot,'config/sources.lock.json'),'utf8'));
 const source=lock.sources?.appendix;
 ensure(source?.integrated===true&&source.repository==='ArchaiosMagister/Appendix-grammaticae'
  &&source.sha===APPENDIX_SOURCE_COMMIT&&source.sourceMode==='vendored'
  &&source.path===SOURCE_REL&&source.treeSha===APPENDIX_SOURCE_TREE,
  'el lock académico debe designar la copia interna y conservar el commit original');
 const recorded=git(repoRoot,'rev-parse','HEAD:'+SOURCE_REL);
 ensure(recorded===APPENDIX_SOURCE_TREE,
  'árbol Git de la copia interna distinto del original '+recorded);
 const index=git(repoRoot,'ls-tree','-rz','HEAD:'+SOURCE_REL);
 const tracked=parseVendorGitTree(index);
 ensure(tracked.length===FILE_COUNT,'número de archivos distinto de 111');
 const sourceDir=join(repoRoot,SOURCE_REL);
 const records=[];
 let total=0;
 for(const entry of tracked){
  const path=resolve(sourceDir,entry.path);
  ensure(path.startsWith(sourceDir+sep),'archivo fuera del árbol de origen');
  const bytes=await readFile(path);
  const actual=blobSha(bytes);
  ensure(actual===entry.sha,'contenido distinto del blob Git: '+entry.path);
  total+=bytes.length;
  records.push({...entry,bytes:bytes.length});
 }
 ensure(total===TOTAL_BYTES,'tamaño total distinto del original');
 for(const essential of ['README.md','.nojekyll','assets/curriculum.json',
  'val/curriculum.json','apple-touch-icon.png','scripts/validate-site.mjs']){
  ensure(records.some(x=>x.path===essential),'recurso académico esencial ausente: '+essential);
 }
 const icon=records.find(x=>x.path==='apple-touch-icon.png');
 ensure(icon?.bytes===9230&&icon.sha==='d93fbb529ad43c2ba664b99bbacfa7fd55fea93b',
  'el icono PNG no es idéntico al original');
 return {
  schema:'schola-appendix-vendored-source/v1',
  origin:source.repository,originCommit:source.sha,
  sourceMode:source.sourceMode,sourcePath:SOURCE_REL,
  treeSha:recorded,files:records.length,bytes:total,
  officialSourceDependency:false,canCompileWithoutSourceCheckout:true,
  repositoryDeletionApproved:false,
  entries:records
 };
}
export async function auditVendoredAppendix(options={}){
 const report=await verifyVendoredAppendix(options);
 const repoRoot=options.repoRoot??root;
 const target=join(repoRoot,'build/academic-audits/appendix-autonomia/manifiesto-vendorizado.json');
 await mkdir(dirname(target),{recursive:true});
 await writeFile(target,JSON.stringify(report,null,2)+'\n');
 console.log('Appendix autónomo: árbol original verificado en ScholaClassica',
  JSON.stringify({tree:report.treeSha,files:report.files,bytes:report.bytes}));
 return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)
 await auditVendoredAppendix();
