// Inventario local de dependencias remotas previas a la retirada de fuentes.
// Este script NO consulta ni modifica Supabase. Nunca recopila datos personales,
// tokens, claves, filas ni secretos, y NO declara que exista una copia de la BD.
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {join,resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';

const sourceDomain=x=>{
 const m=String(x).match(/https:\/\/([a-z]{20})\.supabase\.co/);
 if(!m)throw Error('Referencia a servicio no válida');
 return m[1];
};
export function assessExternalServices({lock,build,vocabConfig,teacherApp,teacherVocabAdmin}){
 if(lock?.sources?.appendix?.sourceMode!=='vendored'||
   lock?.sources?.evolutio?.sourceMode!=='vendored'||
   lock?.sources?.vocabula?.sourceMode!=='vendored')
  throw Error('Fuentes internas no verificadas');
 const m=vocabConfig.match(/VOCAB_SERVICE\s*=\s*['"](https:\/\/[a-z]{20}\.supabase\.co\/functions\/v1\/vocabulary)['"]/);
 if(!m)throw Error('Falta el contrato de la función pública de vocabulario');
 const vocabularyService=sourceDomain(m[1]);
 if(!build.includes("url!=='https://"+vocabularyService+".supabase.co'"))
  throw Error('El área docente no usa la identidad vinculada a Vocabula');
 for(const fn of ["'schola-login'","'schola-inbox'"])
  if(!teacherApp.includes("functions.invoke("+fn))
   throw Error('Falta función de acceso o bandeja docente: '+fn);
 if(!teacherVocabAdmin.includes("functions.invoke('schola-vocab-admin'"))
  throw Error('Falta la función administrativa de vocabulario');
 // El backend se conserva transitoriamente por compatibilidad, pero el portal
 // ya no debe ofrecer ni cargar la administración de palabras ni sus avisos.
 if(/mountVocabulaAdmin|resetVocabulaAdmin|admin-vocabula\\.mjs/.test(teacherApp))
  throw Error('La zona docente sigue acoplada al editor de Vocabula');
 const inbox=teacherApp.match(/const PALABRA_INBOX=['"](https:\/\/[a-z]{20}\.supabase\.co\/functions\/v1\/schola-palabra-inbox)['"]/);
 if(!inbox)throw Error('Falta vínculo de la bandeja de Palabra del día');
 const palabraService=sourceDomain(inbox[1]);
 if(palabraService===vocabularyService)
  throw Error('El inventario debe mantener separadas las dos bases de datos');
 if(!build.includes('https://'+palabraService+'.supabase.co'))
  throw Error('La CSP docente no contempla el servicio de Palabra del día');
 if(lock.sources.examenes.integrated!==false)
  throw Error('GeneradorExamenes debe continuar independiente');
 return {
  schema:'schola-external-service-retirement/v1',
  auditScope:'Dependencias estáticas del frontend y del compilador; no es una copia de bases de datos ni una auditoría remota',
  sourceRepoCheckouts:0,
  services:[
   {id:'vocabulario-y-docencia',
    associatedModules:['vocabula','docente'],
    edgeFunctionNames:['vocabulary','schola-login','schola-vocab-admin','schola-inbox'],
    mode:'Servicio remoto activo independiente de los repositorios originales',
    publicVocabularyEndpointConfigured:true,
    databaseBackupVerified:false,edgeFunctionsBackupVerified:false,
    authConfigurationBackupVerified:false,storageBackupVerified:false},
   {id:'palabra-del-dia',
    associatedModules:['palabra-del-dia','docente'],
    edgeFunctionNames:['schola-palabra-inbox'],
    mode:'Proyecto remoto independiente, accesible desde la bandeja del profesor',
    crossProjectInbox:true,
    databaseBackupVerified:false,edgeFunctionsBackupVerified:false,
    authConfigurationBackupVerified:false,storageBackupVerified:false}
  ],
  independentRepositories:['ArchaiosMagister/GeneradorExamenes'],
  flags:{
   gitBundleCoversRemoteDatabases:false,
   gitBundleCoversEdgeFunctions:false,
   gitBundleCoversAuthConfig:false,
   gitBundleCoversStorageObjects:false,
   archiveApproved:false,deleteApproved:false,
   safeToArchive:false,safeToDelete:false
  },
  nextSteps:[
   'Exportar y verificar una copia de seguridad de cada base de datos en un soporte local seguro',
   'Conservar código y configuración de Edge Functions, RLS, Auth y Storage por proyecto, sin publicar secretos',
   'Verificar la continuidad del endpoint público de vocabulario y de ambas bandejas docentes',
   'Probar accesos desde Safari en un iPad físico; mantener URL y PWA antiguas durante la transición',
   'Solicitar autorización individual antes de archivar ningún repositorio'
  ]
 };
}
async function main(){
 const root=resolve(import.meta.dirname,'..');
 const files=await Promise.all([
  'config/sources.lock.json','scripts/build.mjs','vendor/vocabula/config.js',
  'public/docente/app.mjs','public/docente/admin-vocabula.mjs'
 ].map(x=>readFile(join(root,x),'utf8')));
 const report=assessExternalServices({
  lock:JSON.parse(files[0]),build:files[1],vocabConfig:files[2],
  teacherApp:files[3],teacherVocabAdmin:files[4]
 });
 const dest=join(root,'build/academic-audits/retirada/servicios-externos.json');
 await mkdir(dirname(dest),{recursive:true});
 await writeFile(dest,JSON.stringify(report,null,2)+'\n');
 console.log('Dependencias externas: 2 proyectos independientes, 5 funciones de enlace referenciadas; sin respaldos remotos confirmados.');
 console.log('Archivo y borrado de repositorios: NO AUTORIZADOS.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)
 await main();
