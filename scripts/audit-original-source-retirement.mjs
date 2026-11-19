// Inventario reproducible y conservador de dependencias originales.
// "vendored" significa autonomia de COMPILACION; no autoriza archivo ni borrado.
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';

const sourceContracts=[
 {key:'appendix',externalAnchor:'const source=resolve(process.env.APPENDIX_SOURCE',
  vendorAnchor:"const source=join(root,'vendor/appendix');",
  vendorGuard:"if(process.env.APPENDIX_SOURCE)throw",
  vendorWorkflow:'npm run audit:appendix:vendor'},
 {key:'evolutio',externalAnchor:'const phonetics=resolve(process.env.EVOLUTIO_SOURCE'},
 {key:'vocabula',externalAnchor:'const vocabulaSource=resolve(process.env.VOCABULA_SOURCE',
  vendorAnchor:"const vocabulaSource=join(root,'vendor/vocabula');",
  vendorGuard:"if(process.env.VOCABULA_SOURCE)throw",
  vendorWorkflow:'npm run audit:vocabula:vendor'}
];
export function assessOriginalDependencies(lock,build,workflow){
 const integrated=sourceContracts.map(spec=>{
  const item=lock.sources[spec.key];
  if(item?.integrated!==true||!item.repository||!item.sha||!/^[a-f0-9]{40}$/.test(item.sha))
   throw Error('Fuente original sin fijar o sin integrar: '+spec.key);
  const buildUsesOriginal=build.includes(spec.externalAnchor);
  const checkoutMarker='repository: '+item.repository;
  const workflowMentionsOriginal=workflow.includes(checkoutMarker);
  const workflowFetchesOriginal=workflowMentionsOriginal&&workflow.includes('ref: '+item.sha);
  if(buildUsesOriginal!==workflowFetchesOriginal||workflowMentionsOriginal!==workflowFetchesOriginal)
   throw Error('Compilacion y CI desacoplados sin auditoria: '+spec.key);
  let localVendorIncluded=false,sourceMode;
  if(buildUsesOriginal){
   sourceMode='external_checkout';
  }else if(spec.vendorAnchor){
   const dir='vendor/'+spec.key,oldDir='.sources/'+spec.key;
   const internalBuild=build.includes(spec.vendorAnchor)&&build.includes(spec.vendorGuard);
   const internalWorkflow=workflow.includes(spec.vendorWorkflow)&&
     (workflow.includes('working-directory: '+dir)||workflow.includes('cd '+dir))&&
     workflow.includes('test ! -d '+oldDir);
   if(!internalBuild||!internalWorkflow)
    throw Error(spec.key+' sin checkout, pero falta fuente interna verificada o barrera de CI');
   if(item.sourceMode!=='vendored'||item.path!==dir||!/^[a-f0-9]{40}$/.test(item.treeSha||''))
    throw Error('Lock de '+spec.key+' no declara árbol interno verificable');
   localVendorIncluded=true;
   sourceMode='vendored';
  }else{
   throw Error('Origen '+spec.key+' retirado sin fuente interna verificada');
  }
  return {
   module:spec.key,repository:item.repository,sha:item.sha,target:item.target,
   sourceMode,buildUsesOriginal,workflowFetchesOriginal,localVendorIncluded,
   compileAutonomous:sourceMode==='vendored',
   safeToArchiveSource:false,safeToDeleteSource:false,
   stage:sourceMode==='vendored'?'fuente_interna_verificada':'dependencia_activa',
   recommendation:sourceMode==='vendored'?
    'Mantener original hasta revisar URLs, PWA, respaldo y autorizacion docente para archivarlo':
    'Mantener: necesario para compilar y probar'
  };
 });
 const exams=lock.sources.examenes;
 return {
  schema:'schola-original-source-retirement-audit/v3',
  auditScope:'Codigo y CI; no prueba compatibilidad de URLs/PWA originales ni respaldos',
  sourceReposRequiredForBuild:integrated.filter(x=>x.buildUsesOriginal).length,
  integrated,
  independent:{repository:exams?.repository,integrated:exams?.integrated??false,
   policy:'No fusionar ni retirar GeneradorExamenes'},
  generalSafeToArchive:false,
  generalSafeToDelete:false,
  nextSteps:[
   'Comparar la publicacion con los recorridos originales y todas las pruebas de regresion',
   'Verificar enlaces, URLs antiguas y PWA instaladas antes de archivar cada origen',
   'Mantener una copia restaurable e identificar el punto de recuperacion',
   'Solicitar autorizacion separada para archivar; el borrado requiere otra autorizacion'
  ]
 };
}
async function main(){
 const root=resolve(import.meta.dirname,'..');
 const [lock,build,workflow]=await Promise.all([
  readFile(join(root,'config/sources.lock.json'),'utf8').then(JSON.parse),
  readFile(join(root,'scripts/build.mjs'),'utf8'),
  readFile(join(root,'.github/workflows/integracion.yml'),'utf8')
 ]);
 const report=assessOriginalDependencies(lock,build,workflow);
 const file=join(root,'build/academic-audits/castellano/dependencias-originales.json');
 await mkdir(resolve(file,'..'),{recursive:true});
 await writeFile(file,JSON.stringify(report,null,2)+'\n');
 console.log('Fuentes originales: '+report.sourceReposRequiredForBuild+' checkouts activos; '+
  report.integrated.filter(x=>x.localVendorIncluded).length+' fuentes internas; sin archivo autorizado.');
}
if(process.argv[1]&&resolve(process.argv[1])===resolve(new URL(import.meta.url).pathname))await main();
