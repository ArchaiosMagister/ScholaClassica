// Auditoría SOLO LECTURA de los tres repositorios públicos originales.
// No descarga bancos, no modifica fuentes ni migra progreso; distingue las
// diferencias históricas reconocidas de cambios nuevos sin revisar.
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {join,resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {getBackupPlan} from './backup-originals.mjs';

const SCHEMA='schola-source-drift-baseline/v1';
const SHA=/^[a-f0-9]{40}$/;
const PUBLIC_API='https://api.github.com/repos/';
const same=(a,b)=>JSON.stringify([...a].sort())===JSON.stringify([...b].sort());

export function validateDriftBaseline(lock,baseline){
 const plan=getBackupPlan(lock);
 if(baseline?.schema!==SCHEMA||!Array.isArray(baseline.sources)||
    baseline.sources.length!==plan.length)
  throw Error('Matriz de revisiones originales incompleta');
 const ids=new Set();
 for(const item of baseline.sources){
  const source=plan.find(x=>x.id===item.id);
  if(!source||ids.has(item.id))throw Error('Fuente inesperada o duplicada');
  ids.add(item.id);
  if(!SHA.test(item.reviewedHead)||!Number.isSafeInteger(item.aheadBy)||
     item.aheadBy<0||item.aheadBy>250||
     !Array.isArray(item.reviewedFiles)||!item.reviewedFiles.length||
     item.reviewedFiles.length>250)
   throw Error('Revisión de fuente inválida');
  const files=new Set();
  for(const name of item.reviewedFiles){
   if(typeof name!=='string'||!name||name.length>250||
      name.startsWith('/')||name.includes('\\')||
      name.split('/').some(p=>p==='..'||p==='.'||p==='')||
      files.has(name))
    throw Error('Ruta de diferencia inválida o duplicada');
   files.add(name);
  }
 }
 return plan;
}

async function githubJSON(fetchImpl,relative,{token,timeoutMs}){
 const url=PUBLIC_API+relative;
 const headers={accept:'application/vnd.github+json',
   'x-github-api-version':'2022-11-28','user-agent':'scholaclassica-source-audit'};
 if(token)headers.authorization='Bearer '+token;
 const response=await fetchImpl(url,{
  method:'GET',headers,redirect:'error',cache:'no-store',
  signal:AbortSignal.timeout(timeoutMs)
 });
 if(response.status!==200)throw Error('Consulta de metadatos GitHub HTTP '+response.status);
 return response.json();
}
export async function auditSourceDrift(lock,baseline,{
 fetchImpl=fetch,token='',timeoutMs=15000
}={}){
 const plan=validateDriftBaseline(lock,baseline);
 if(!Number.isSafeInteger(timeoutMs)||timeoutMs<100||timeoutMs>60000)
  throw Error('Tiempo de consulta no permitido');
 const sources=[];
 for(const target of plan){
  const reference=baseline.sources.find(x=>x.id===target.id);
  const repository=target.repository;
  // Los repositorios son fijos y se comprueban contra sources.lock.json.
  const branch=await githubJSON(fetchImpl,repository+'/branches/main',
   {token,timeoutMs});
  const sha=branch?.commit?.sha;
  if(!SHA.test(sha||''))throw Error('No se pudo verificar main de '+target.id);
  const compare=await githubJSON(fetchImpl,
   repository+'/compare/'+target.academicCommit+'...'+sha,{token,timeoutMs});
  if(!['ahead','identical','behind','diverged'].includes(compare?.status)||
     !Array.isArray(compare.files)||compare.files.length>=300||
     !Number.isSafeInteger(compare.ahead_by)||compare.ahead_by<0||
     !Number.isSafeInteger(compare.behind_by)||compare.behind_by<0)
   throw Error('Comparación GitHub incompleta o no reconocida para '+target.id);
  const changedFiles=compare.files.map(x=>x.filename);
  if(changedFiles.some(x=>typeof x!=='string'||!x||
     x.length>250))throw Error('Cambios sin rutas de archivo válidas');
  const known=sha===reference.reviewedHead&&
   compare.status==='ahead'&&compare.behind_by===0&&
   compare.ahead_by===reference.aheadBy&&
   same(changedFiles,reference.reviewedFiles);
  sources.push({
   id:target.id,repository,
   integratedAcademicCommit:target.academicCommit,
   reviewedSourceHead:reference.reviewedHead,
   liveSourceHead:sha,
   aheadBy:compare.ahead_by,behindBy:compare.behind_by,
   compareStatus:compare.status,
   changedFiles,
   classification:known?'transicion_conocida':'revision_nueva_pendiente',
   needsReview:!known,
   academicEquivalenceVerified:false,
   eligibleForArchive:false
  });
 }
 const unknown=sources.filter(x=>x.needsReview);
 return {
  schema:'schola-source-drift-report/v1',
  checkedAt:new Date().toISOString(),
  summary:{
   originals:plan.length,knownTransitions:plan.length-unknown.length,
   requireReview:unknown.length
  },
  sources,
  sourceRepositoriesModified:false,
  automaticSyncPerformed:false,
  safeToArchive:false,safeToDelete:false,
  limitations:[
   'Las diferencias reconocidas son del periodo de transición; no se incorporan automáticamente al snapshot académico',
   'Una comparación de commits no certifica equivalencia filológica ni funcional de las aplicaciones',
   'La auditoría pública no acredita respaldos de Git, Supabase ni progreso en dispositivos reales',
   'El archivo y el borrado requieren autorización docente individual e independiente'
  ]
 };
}
async function main(){
 const root=resolve(import.meta.dirname,'..');
 const [lock,baseline]=await Promise.all([
  readFile(join(root,'config/sources.lock.json'),'utf8').then(JSON.parse),
  readFile(join(root,'config/source-drift-baseline.json'),'utf8').then(JSON.parse)
 ]);
 const report=await auditSourceDrift(lock,baseline,{token:process.env.GITHUB_TOKEN||''});
 const dest=join(root,'build/academic-audits/retirada/drift-fuentes.json');
 await mkdir(dirname(dest),{recursive:true});
 await writeFile(dest,JSON.stringify(report,null,2)+'\n');
 console.log('Fuentes públicas: '+report.summary.knownTransitions+
  ' revisiones de transición conocidas; '+report.summary.requireReview+
  ' cambios que requieren revisión.');
 if(report.summary.requireReview){
  for(const x of report.sources.filter(y=>y.needsReview))
   console.error('Nueva revisión a examinar: '+x.id+' (sin sincronizar ni archivar).');
  process.exitCode=1;
 }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)
 main().catch(e=>{console.error('Auditoría no certificada: '+e.message);process.exitCode=1});
