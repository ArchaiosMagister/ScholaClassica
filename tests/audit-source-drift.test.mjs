import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {getBackupPlan} from '../scripts/backup-originals.mjs';
import {validateDriftBaseline,auditSourceDrift}
 from '../scripts/audit-source-drift.mjs';

const root=resolve(import.meta.dirname,'..');
const lock=JSON.parse(readFileSync(join(root,'config/sources.lock.json'),'utf8'));
const baseline=JSON.parse(readFileSync(join(root,'config/source-drift-baseline.json'),'utf8'));
const plan=getBackupPlan(lock);
function fakeGithub({changeHead,addFile,wrongStatus,failHTTP}={}){
 const seen=[];
 const fetchImpl=async(url,options)=>{
  seen.push({url,options});
  const target=plan.find(x=>url.includes('/repos/'+x.repository+'/'));
  assert.ok(target,'El auditor ha consultado una URL no autorizada: '+url);
  const ref=baseline.sources.find(x=>x.id===target.id);
  if(failHTTP&&target.id===failHTTP)
   return {status:403,json:async()=>({message:'Sin acceso'})};
  if(url.endsWith('/branches/main')){
   return {status:200,json:async()=>({commit:{sha:changeHead===target.id?
    'f'.repeat(40):ref.reviewedHead}})};
  }
  const compare=target.repository+'/compare/'+target.academicCommit+'...';
  assert.ok(url.includes(compare),'Comparación no autorizada');
  const files=ref.reviewedFiles.map(filename=>({filename}));
  if(addFile===target.id)files.push({filename:'data/nuevas-fichas.json'});
  return {status:200,json:async()=>({
   status:wrongStatus===target.id?'diverged':'ahead',
   ahead_by:ref.aheadBy,behind_by:wrongStatus===target.id?1:0,
   files
  })};
 };
 return {seen,fetchImpl};
}

test('La matriz revisa solo las tres fuentes fijadas y excluye exámenes',()=>{
 const actual=validateDriftBaseline(lock,baseline);
 assert.deepEqual(actual.map(x=>x.id),['appendix','evolutio','vocabula']);
 assert.equal(baseline.sources.length,3);
 assert.equal(baseline.sources.reduce((s,x)=>s+x.aheadBy,0),22);
 assert.ok(!JSON.stringify(baseline).includes('GeneradorExamenes'));
 for(const source of baseline.sources){
  assert.match(source.reviewedHead,/^[a-f0-9]{40}$/);
  assert.ok(source.reviewedFiles.length>=3);
 }
});

test('Las diferencias reconocidas no autorizan el archivo ni modifican fuentes',async()=>{
 const fake=fakeGithub();
 const report=await auditSourceDrift(lock,baseline,{fetchImpl:fake.fetchImpl});
 assert.deepEqual(report.summary,{
  originals:3,knownTransitions:3,requireReview:0
 });
 assert.equal(report.safeToArchive,false);
 assert.equal(report.safeToDelete,false);
 assert.equal(report.automaticSyncPerformed,false);
 assert.equal(report.sourceRepositoriesModified,false);
 assert.ok(report.sources.every(x=>
  x.classification==='transicion_conocida'&&
  x.academicEquivalenceVerified===false&&x.eligibleForArchive===false
 ));
 assert.equal(fake.seen.length,6);
 for(const request of fake.seen){
  assert.equal(request.options.method,'GET');
  assert.equal(request.options.redirect,'error');
  assert.ok(request.url.startsWith('https://api.github.com/repos/ArchaiosMagister/'));
  assert.equal(request.options.headers.authorization,undefined);
 }
});

test('Cada fuente con nueva revisión o cambios académicos queda en revisión obligatoria',async()=>{
 for(const [mode,id] of [['changeHead','appendix'],
  ['addFile','evolutio'],['wrongStatus','vocabula']]){
  const fake=fakeGithub({[mode]:id});
  const report=await auditSourceDrift(lock,baseline,{fetchImpl:fake.fetchImpl});
  assert.equal(report.summary.requireReview,1);
  assert.equal(report.sources.find(x=>x.id===id).classification,
   'revision_nueva_pendiente');
  assert.equal(report.safeToArchive,false);
 }
});

test('Errores HTTP y comparaciones truncadas no se dan por verificadas',async()=>{
 await assert.rejects(
  auditSourceDrift(lock,baseline,{fetchImpl:fakeGithub({failHTTP:'appendix'}).fetchImpl}),
  /HTTP 403/
 );
 await assert.rejects(
  auditSourceDrift(lock,baseline,{timeoutMs:0,fetchImpl:fakeGithub().fetchImpl}),
  /Tiempo/
 );
 const broken=async url=>{
  if(url.endsWith('/branches/main'))
   return {status:200,json:async()=>({commit:{sha:'a'.repeat(40)}})};
  return {status:200,json:async()=>({
   status:'ahead',ahead_by:300,behind_by:0,files:[]
  })};
 };
 await assert.rejects(auditSourceDrift(lock,baseline,{fetchImpl:broken}),
  /incompleta/);
});

test('Se rechaza alterar la matriz académica o añadir repositorios ajenos',()=>{
 const copy=()=>structuredClone(baseline);
 for(const edit of [
  s=>{s.sources[0].reviewedHead='incorrecto'},
  s=>{s.sources[0].reviewedFiles.push('../secretos')},
  s=>{s.sources[0].reviewedFiles.push(s.sources[0].reviewedFiles[0])},
  s=>{s.sources[1].id='examenes'},
  s=>{s.sources.push({...s.sources[0]})},
  s=>{s.schema='otro'}
 ]){
  const draft=copy();edit(draft);
  assert.throws(()=>validateDriftBaseline(lock,draft));
 }
});
