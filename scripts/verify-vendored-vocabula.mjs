// Conserva Vocabula íntegro, con comprobación de árbol y blobs Git.
// La copia interna se verifica sin consultar ni descargar el repositorio original.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {join,resolve,dirname,sep,isAbsolute} from 'node:path';
import {pathToFileURL} from 'node:url';

export const VOCABULA_ORIGIN_COMMIT='a7be2161a2401816ede78a96981daaac6850b8d2';
export const VOCABULA_ORIGIN_TREE='4d801fa31917dc177ce248eff162a9ad545fae7a';
const SOURCE='vendor/vocabula',COUNT=130,BYTES=1903396;
const root=resolve(import.meta.dirname,'..');
const git=(cwd,...args)=>execFileSync('git',['-C',cwd,...args],
 {encoding:'utf8',maxBuffer:16*1024*1024}).trim();
const digest=bytes=>createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
const ensure=(condition,message)=>{if(!condition)throw Error('Vocabula interno: '+message);};

export function parseVocabulaTree(data){
 const entries=data.split('\0').filter(Boolean).map(line=>{
  const tab=line.indexOf('\t');
  ensure(tab>0,'fila inválida del árbol Git');
  const [mode,type,sha]=line.slice(0,tab).split(' '),path=line.slice(tab+1);
  ensure(mode==='100644'&&type==='blob'&&/^[0-9a-f]{40}$/.test(sha),
   'modo u objeto inesperado: '+path);
  ensure(path&&path!=='..'&&!isAbsolute(path)&&!path.startsWith('/')&&
   !path.includes('\\')&&!path.split('/').includes('..'),'ruta insegura: '+path);
  return {path,sha,mode};
 });
 ensure(new Set(entries.map(x=>x.path)).size===entries.length,'rutas repetidas');
 return entries.sort((a,b)=>a.path.localeCompare(b,'en'));
}

export async function verifyVendoredVocabula({repoRoot=root}={}){
 const lock=JSON.parse(await readFile(join(repoRoot,'config/sources.lock.json'),'utf8'));
 const source=lock.sources?.vocabula;
 ensure(source?.integrated===true&&
  source.repository==='ArchaiosMagister/VocabulaLatinaGraecaque'&&
  source.sha===VOCABULA_ORIGIN_COMMIT&&source.sourceMode==='vendored'&&
  source.path===SOURCE&&source.treeSha===VOCABULA_ORIGIN_TREE,
  'lock académico no coincide con el origen verificado');
 const tree=git(repoRoot,'rev-parse','HEAD:'+SOURCE);
 ensure(tree===VOCABULA_ORIGIN_TREE,'árbol de Vocabula alterado: '+tree);
 const entries=parseVocabulaTree(git(repoRoot,'ls-tree','-rz','HEAD:'+SOURCE));
 ensure(entries.length===COUNT,'número de archivos distinto del origen');
 const base=join(repoRoot,SOURCE);
 let total=0;
 const records=[];
 for(const {path,sha,mode} of entries){
  const absolute=resolve(base,path);
  ensure(absolute.startsWith(base+sep),'ruta fuera del módulo');
  const bytes=await readFile(absolute);
  ensure(digest(bytes)===sha,'archivo diferente del origen: '+path);
  total+=bytes.length;
  records.push({path,sha,mode,bytes:bytes.length});
 }
 ensure(total===BYTES,'tamaño total distinto del origen');
 for(const essential of ['README.md','index.html','app.js','choice.js','config.js',
  'data.js','scope.js','style.css','teacher.js','theme.js',
  'tests/check-vocabulary-scope.cjs','tests/check-vocabulary-provenance.cjs',
  'icons/apple-touch-icon.png','icons/favicon.ico','icons/favicon.svg',
  'icons/icon-192.png','icons/icon-512.png']){
  ensure(records.some(x=>x.path===essential),'archivo esencial ausente: '+essential);
 }
 const dataset=await readFile(join(base,'data.js'),'utf8');
 const match=/^window\.VOCAB\s*=\s*([\s\S]*?);\s*$/.exec(dataset);
 ensure(Boolean(match),'banco léxico original no analizable');
 const words=JSON.parse(match[1]);
 ensure(Array.isArray(words)&&words.length>1000,'banco léxico incompleto');
 return {schema:'schola-vocabula-vendored-source/v1',
  origin:source.repository,originCommit:VOCABULA_ORIGIN_COMMIT,
  treeSha:tree,sourcePath:SOURCE,sourceMode:'vendored',
  files:entries.length,bytes:total,originalEntries:words.length,
  canCompileWithoutExternalCheckout:true,
  repositoryArchiveApproved:false,repositoryDeletionApproved:false,
  entries:records};
}

export async function auditVendoredVocabula(options={}){
 const report=await verifyVendoredVocabula(options);
 const target=join(options.repoRoot??root,'build/academic-audits/vocabula-autonomia/manifiesto-vendorizado.json');
 await mkdir(dirname(target),{recursive:true});
 await writeFile(target,JSON.stringify(report,null,2)+'\n');
 console.log('Vocabula original verificado:',report.files,'archivos,',report.bytes,
  'bytes,',report.originalEntries,'fichas; árbol',report.treeSha);
 return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)
 await auditVendoredVocabula();
