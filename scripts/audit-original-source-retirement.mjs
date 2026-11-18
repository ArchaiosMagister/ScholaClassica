// Inventario reproducible de dependencias de los repositorios originales.
// No borra, archiva, altera ni modifica ningún repositorio GitHub.
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';

export function assessOriginalDependencies(lock,build,workflow){
 const origins=[
  {key:'appendix',label:'Appendix-grammaticae',compileAnchor:'const source=resolve(process.env.APPENDIX_SOURCE',env:'APPENDIX_SOURCE'},
  {key:'evolutio',label:'EvolucionFonetica',compileAnchor:'const phonetics=resolve(process.env.EVOLUTIO_SOURCE',env:'EVOLUTIO_SOURCE'},
  {key:'vocabula',label:'VocabulaLatinaGraecaque',compileAnchor:'const vocabulaSource=resolve(process.env.VOCABULA_SOURCE',env:'VOCABULA_SOURCE'}
 ];
 const dependent=origins.map(({key,label,compileAnchor,env})=>{
  const item=lock.sources[key];
  if(item?.integrated!==true||!item.sha||!item.repository)
   throw Error('Falta dependencia original fijada: '+key);
  const buildUsesOriginal=build.includes(compileAnchor);
  const workflowFetchesOriginal=workflow.includes('repository: '+item.repository) &&
   workflow.includes('ref: '+item.sha);
  if(buildUsesOriginal!==workflowFetchesOriginal)
   throw Error('Compilación y CI se han desacoplado sin auditoría: '+key);
  return {
   module:key,repository:item.repository,sha:item.sha,target:item.target,
   buildUsesOriginal,workflowFetchesOriginal,
   localVendorIncluded:false,
   safeToDeleteSource:!buildUsesOriginal&&!workflowFetchesOriginal,
   recommendation:buildUsesOriginal?'Mantener: se necesita al compilar y probar':
    'Revisar licencia, recursos, URLs y PWA antes de archivar o borrar',
   stage:buildUsesOriginal?'dependencia_activa':'sin_checkout_original'
  };
 });
 const exams=lock.sources.examenes;
 return {
  schema:'schola-original-source-retirement-audit/v1',
  auditScope:'Solo lectura de source lock, compilación y workflow; NO prueba repositorios borrados',
  sourceReposRequiredForBuild:dependent.filter(x=>x.buildUsesOriginal).length,
  integrated:dependent,
  independent:{repository:exams?.repository,integrated:exams?.integrated??false,policy:'No fusionar ni retirar GeneradorExamenes'},
  generalSafeToDelete:dependent.every(x=>x.safeToDeleteSource),
  nextSteps:[
   'Importar cada código original como fuente conservada dentro de ScholaClassica o un paquete versionado independiente',
   'Eliminar un checkout cada vez, sin reescribir motores ni perder compatibilidad offline',
   'Ejecutar pruebas de origen, CI y despliegue de Pages desde un clon limpio sin el repositorio original',
   'Revisar las URL de las PWA ya instaladas y redirigir o avisar antes de archivar los orígenes',
   'Archivar en GitHub como primera medida reversible; borrar solo tras copia verificable, periodo de transición y autorización expresa'
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
 const output=join(root,'build/academic-audits/castellano/dependencias-originales.json');
 await mkdir(resolve(output,'..'),{recursive:true});
 await writeFile(output,JSON.stringify(report,null,2)+'\n');
 console.log('Auditoría de retirada de repositorios:',JSON.stringify({
  required:report.sourceReposRequiredForBuild,
  canDelete:report.generalSafeToDelete,
  sources:report.integrated.map(x=>x.repository)
 }));
}
if(process.argv[1]&&resolve(process.argv[1])===resolve(new URL(import.meta.url).pathname))await main();
