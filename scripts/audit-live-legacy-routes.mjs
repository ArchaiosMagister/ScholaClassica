// Solo lectura: audita rutas públicas originales e integradas sin abrir sesiones,
// mover progreso, desplegar, archivar ni borrar repositorios. No registra HTML,
// cabeceras privadas ni datos de usuarios; únicamente códigos y presencia de marcas.
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';

const SOURCE='schola-live-legacy-routes/v2';
const EXPECTED_ORIGIN='https://archaiosmagister.github.io';

export function validateRouteSpec(spec){
 if(spec?.schema!==SOURCE||spec.origin!==EXPECTED_ORIGIN)
  throw Error('Origen de auditoría ajeno a los sitios públicos fijados');
 if(!Array.isArray(spec.routes)||spec.routes.length<8||spec.routes.length>40||
    !Array.isArray(spec.integratedOnly)||spec.integratedOnly.length<1||
    spec.integratedOnly.length>30||!Array.isArray(spec.checks)||
    spec.checks.length<8||spec.checks.length>30)
  throw Error('Inventario de rutas y comprobaciones incompleto o excesivo');
 const ids=new Set();
 const urlOf=path=>{
  if(typeof path!=='string'||!path.startsWith('/')||path.startsWith('//')||
    path.includes('\\')||path.includes('#')||path.includes('\0')||
    path.split('/').includes('..')||path.split('/').includes('.'))
   throw Error('Ruta pública mal formada');
  const url=new URL(path,spec.origin);
  if(url.origin!==EXPECTED_ORIGIN||url.pathname+url.search!==path)
   throw Error('La ruta se desplaza fuera del origen permitido');
  if(!/^\/(?:ScholaClassica|Appendix-grammaticae|EvolucionFonetica|VocabulaLatinaGraecaque)\//.test(path))
   throw Error('Ruta no relacionada con la unificación');
  return url.href;
 };
 for(const entry of spec.routes){
  if(typeof entry.id!=='string'||!entry.id.match(/^[a-z0-9-]+$/)||
    ids.has(entry.id))throw Error('ID de ruta duplicado o inválido');
  ids.add(entry.id);
  const source=urlOf(entry.legacy),dest=urlOf(entry.integrated);
  if(!source.includes('.github.io/')||!dest.includes('/ScholaClassica/apps/'))
   throw Error('Correspondencia de web antigua y ScholaClassica inválida');
  if(!/^\/(?:Appendix-grammaticae|EvolucionFonetica|VocabulaLatinaGraecaque)\//.test(entry.legacy))
   throw Error('La ruta antigua debe pertenecer a una fuente aprobada');
  if(typeof entry.markers?.legacy!=='string'||typeof entry.markers?.integrated!=='string'||
    Object.values(entry.markers).some(x=>!x.trim()||x.length>150))
   throw Error('Faltan identificadores HTML del módulo antiguo y del integrado');
 }
 for(const entry of spec.integratedOnly){
  if(typeof entry.id!=='string'||!entry.id.match(/^[a-z0-9-]+$/)||
    ids.has(entry.id))throw Error('ID de módulo integrado repetido o inválido');
  ids.add(entry.id);
  const dest=urlOf(entry.integrated);
  if(!dest.includes('/ScholaClassica/')||
    (!entry.integrated.startsWith('/ScholaClassica/apps/')&&
     entry.integrated!=='/ScholaClassica/'))
   throw Error('Módulo integrado ajeno a ScholaClassica');
  if(typeof entry.contains!=='string'||!entry.contains.trim()||
    entry.contains.length>150||
    typeof entry.note!=='string'||!entry.note.trim()||entry.note.length>250)
   throw Error('Falta descripción o marca del módulo nativo');
 }
 for(const entry of spec.checks){
  if(typeof entry.id!=='string'||!entry.id.match(/^[a-z0-9-]+$/)||
    ids.has(entry.id))throw Error('ID de comprobación duplicado o inválido');
  ids.add(entry.id);
  const url=urlOf(entry.path);
  if(!/\.(?:js|html)(?:$|\?)/.test(url))throw Error('Marca fuera de script/HTML');
  if(!Array.isArray(entry.contains)||!entry.contains.length||
     entry.contains.some(x=>typeof x!=='string'||!x||x.length>200))
   throw Error('Marcas de comprobación inválidas');
 }
 return true;
}

export async function auditLegacyLiveRoutes(spec,{fetchImpl=fetch,timeoutMs=12000}={}){
 validateRouteSpec(spec);
 if(!Number.isInteger(timeoutMs)||timeoutMs<100||timeoutMs>60000)
  throw Error('Timeout no permitido');
 const visited=new Map();
 async function read(path,{html=false,contains=[]}={}){
  const key=path,href=new URL(path,spec.origin).href;
  if(!visited.has(key)){
   visited.set(key,(async()=>{
    try{
     const response=await fetchImpl(href,{
      method:'GET',redirect:'follow',cache:'no-store',signal:AbortSignal.timeout(timeoutMs),
      headers:{accept:'text/html,application/javascript,text/javascript,*/*'}
     });
     const final=new URL(response.url||href);
     if(final.origin!==EXPECTED_ORIGIN)throw Error('Redirección fuera del dominio público');
     if(final.pathname+final.search!==path)
      throw Error('Redirección o reescritura fuera de la ruta esperada');
     if(response.status!==200)throw Error('HTTP '+response.status);
     const size=Number(response.headers?.get?.('content-length')||0);
     if(size>1_000_000)throw Error('Recurso inesperadamente grande');
     const content=await response.text();
     if(content.length>1_000_000)throw Error('Recurso excede el límite');
     const ct=response.headers?.get?.('content-type')||'';
     return {ok:true,status:response.status,contentType:ct,finalUrl:final.href,content};
    }catch(error){
     return {ok:false,status:null,contentType:null,finalUrl:null,error:String(error?.message||error)};
    }
   })());
  }
  const resource=await visited.get(key);
  if(!resource.ok)return {path,ok:false,status:resource.status,error:resource.error};
  const missing=contains.filter(token=>!resource.content.includes(token));
  const htmlOk=!html||(/<html(?:\s|>)/i.test(resource.content)&&
    (!resource.contentType||/text\/html/i.test(resource.contentType)));
  return {path,ok:missing.length===0&&htmlOk,status:resource.status,
   ...(missing.length?{missingMarkers:missing}:{}),
   ...(!htmlOk?{error:'Documento HTML esperado'}:{})};
 }
 const checks=[];
 // Se realizan secuencialmente para no sobrecargar Pages y facilitar trazas.
 for(const entry of spec.routes){
  const legacy=await read(entry.legacy,{html:true,contains:[entry.markers.legacy]});
  const integrated=await read(entry.integrated,{html:true,contains:[entry.markers.integrated]});
  checks.push({id:entry.id,kind:'redirectless-route-pair',ok:legacy.ok&&integrated.ok,
   legacy,integrated});
 }
 // Los módulos creados en ScholaClassica carecen de homólogo histórico:
 // auditarlos por separado evita confundir disponibilidad con equivalencia.
 for(const entry of spec.integratedOnly){
  const resource=await read(entry.integrated,{html:true,contains:[entry.contains]});
  checks.push({id:entry.id,kind:'integrated-only',ok:resource.ok,resource,
   note:entry.note});
 }
 for(const entry of spec.checks){
  const item=await read(entry.path,{html:entry.path.endsWith('.html'),contains:entry.contains});
  checks.push({id:entry.id,kind:'content-marker',ok:item.ok,resource:item});
 }
 const failures=checks.filter(x=>!x.ok);
 // Informe por web antigua: permite comprobar por separado los proyectos archivados.
 // La disponibilidad HTTP no demuestra que GitHub haya archivado un repositorio.
 const legacyItems=[
  ...spec.routes.map(entry=>({id:entry.id,path:entry.legacy})),
  ...spec.checks.map(entry=>({id:entry.id,path:entry.path}))
 ];
 const byLegacySource=Object.fromEntries(
  ['Appendix-grammaticae','EvolucionFonetica','VocabulaLatinaGraecaque'].map(source=>{
   const ids=new Set(legacyItems.filter(entry=>entry.path.startsWith('/'+source+'/'))
    .map(entry=>entry.id));
   const relevant=checks.filter(check=>ids.has(check.id));
   const failed=relevant.filter(check=>!check.ok).length;
   return [source,{total:relevant.length,passed:relevant.length-failed,failed}];
  })
 );
 return {
  schema:'schola-retirement-live-report/v2',
  origin:spec.origin,
  checkedAt:new Date().toISOString(),
  summary:{total:checks.length,passed:checks.length-failures.length,failed:failures.length,
   paired:spec.routes.length,integratedOnly:spec.integratedOnly.length,
   contentChecks:spec.checks.length,byLegacySource},
  checks,
  autoPublish:false,repositoryArchived:false,repositoryDeleted:false,
  safeToArchive:false,safeToDelete:false,
  limitations:[
   'Comprobar HTTP y marcas HTML/JS no demuestra equivalencia funcional o filológica, ni prueba un iPad real o PWA ya instalada',
   'Las páginas de curso cargan el contenido dinámicamente; su equivalencia requiere pruebas específicas en navegador',
   'No revisa enlaces compartidos en documentos, QR o marcadores externos',
   'No demuestra la existencia de respaldos restaurables fuera de GitHub',
   'La autorización docente para archivar o borrar debe ser específica e independiente'
  ]
 };
}

async function main(){
 const root=resolve(import.meta.dirname,'..');
 const spec=JSON.parse(await readFile(join(root,'config/retirada-rutas-publicas.json'),'utf8'));
 const report=await auditLegacyLiveRoutes(spec);
 const filename=join(root,'build/academic-audits/retirada/urls-vivas.json');
 await mkdir(dirname(filename),{recursive:true});
 await writeFile(filename,JSON.stringify(report,null,2)+'\n');
 console.log('URLs públicas: '+report.summary.passed+'/'+report.summary.total+' verificaciones positivas');
 for(const [source,counts] of Object.entries(report.summary.byLegacySource))
  console.log('Origen '+source+': '+counts.passed+'/'+counts.total+' (fallos: '+counts.failed+')');
 for(const x of report.checks.filter(x=>!x.ok))
  console.error('Ruta no certificada: '+x.id+' '+JSON.stringify(x));
 console.log('La auditoría no archiva repositorios y no reemplaza las pruebas reales en iPad.');
 if(report.summary.failed)process.exitCode=1;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)
 await main();
