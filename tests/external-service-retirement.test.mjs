import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {assessExternalServices} from '../scripts/audit-external-service-retirement.mjs';
const root=resolve(import.meta.dirname,'..');
const read=p=>readFileSync(join(root,p),'utf8');
const input=()=>({
 lock:JSON.parse(read('config/sources.lock.json')),
 build:read('scripts/build.mjs'),
 vocabConfig:read('vendor/vocabula/config.js'),
 teacherApp:read('public/docente/app.mjs'),
 teacherVocabAdmin:read('public/docente/admin-vocabula.mjs')
});
test('Las fuentes académicas siguen locales y se detectan las dependencias remotas sin extraer datos',()=>{
 const result=assessExternalServices(input());
 assert.equal(result.schema,'schola-external-service-retirement/v1');
 assert.equal(result.sourceRepoCheckouts,0);
 assert.equal(result.services.length,2);
 assert.deepEqual(result.services.map(x=>x.id),['vocabulario-y-docencia','palabra-del-dia']);
 assert.deepEqual(result.services[0].edgeFunctionNames,
  ['vocabulary','schola-login','schola-vocab-admin','schola-inbox']);
 assert.deepEqual(result.services[1].edgeFunctionNames,['schola-palabra-inbox']);
 assert.equal(result.services[1].crossProjectInbox,true);
 assert.equal(result.flags.safeToArchive,false);
 assert.equal(result.flags.safeToDelete,false);
 assert.equal(result.flags.archiveApproved,false);
 assert.equal(result.flags.gitBundleCoversRemoteDatabases,false);
 for(const service of result.services){
  assert.equal(service.databaseBackupVerified,false);
  assert.equal(service.authConfigurationBackupVerified,false);
  assert.equal(service.storageBackupVerified,false);
  assert.equal(service.edgeFunctionsBackupVerified,false);
 }
 assert.deepEqual(result.independentRepositories,['ArchaiosMagister/GeneradorExamenes']);
 const serialized=JSON.stringify(result);
 assert.doesNotMatch(serialized,/sb_publishable_|service_role|sb_secret_|password|access_token/i);
 assert.doesNotMatch(serialized,/[a-z]{20}\.supabase\.co/);
});
test('La auditoría bloquea inconsistencias de endpoints, acceso docente y límites de módulos',()=>{
 const cases=[
  x=>{x.vocabConfig='window.VOCAB_SERVICE="https://example.com/";'},
  x=>{x.build=x.build.replace('https://wpwlguufpkfnzlbyproe.supabase.co','https://otro.example.com');},
  x=>{x.teacherApp=x.teacherApp.replace("functions.invoke('schola-inbox'","functions.invoke('no-existe'");},
  x=>{x.teacherApp=x.teacherApp.replace('functions/v1/schola-palabra-inbox','functions/v1/no-inbox');},
  x=>{x.teacherVocabAdmin=x.teacherVocabAdmin.replace("functions.invoke('schola-vocab-admin'","functions.invoke('otra-funcion'");},
  x=>{x.teacherApp="import {mountVocabulaAdmin} from './admin-vocabula.mjs';\\n"+x.teacherApp;},
  x=>{x.lock.sources.examenes.integrated=true;},
  x=>{x.lock.sources.vocabula.sourceMode='external_checkout';}
 ];
 for(const mutate of cases){
  const i=input();mutate(i);
  assert.throws(()=>assessExternalServices(i));
 }
});
test('La auditoría se ejecuta en CI solo en lectura y sin levantar una conexión Supabase',()=>{
 const ci=read('.github/workflows/integracion.yml');
 assert.match(ci,/npm run audit:servicios:externos/);
 const script=read('scripts/audit-external-service-retirement.mjs');
 assert.doesNotMatch(script,/supabase\.from\(|execute_sql|service_role|SUPABASE_SECRET/i);
 assert.match(script,/databaseBackupVerified:false/);
 const saveScript=read('scripts/backup-originals.mjs');
 assert.match(saveScript,/No guardar bundles dentro del repositorio ScholaClassica/);
});
