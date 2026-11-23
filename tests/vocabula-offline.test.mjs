import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {runInNewContext} from 'node:vm';
import {VOCABULA_CORE} from '../scripts/build-vocabula-pwa.mjs';

const root=resolve(import.meta.dirname,'..');
const target=join(root,'dist/apps/vocabulario');
const source=join(root,'vendor/vocabula');
const read=(path)=>readFileSync(path,'utf8');
const manifest=JSON.parse(read(join(target,'manifest.webmanifest')));

test('Offline: la PWA de vocabulario precarga sólo sus archivos, sin acceder al backend',()=>{
 assert.equal(manifest.start_url,'./index.html');
 assert.equal(manifest.scope,'./');
 assert.equal(manifest.display,'standalone');
 assert.deepEqual(manifest.icons.map(x=>x.sizes),['192x192','512x512']);
 const sw=read(join(target,'sw.js'));
 assert.match(sw,/schola-vocabula-/);
 assert.match(sw,/startsWith\(SCOPE.pathname\)/);
 assert.match(sw,/req.method!=='GET'/);
 assert.match(sw,/new Request\(new URL\(path,SCOPE\),\{cache:'reload'\}\)/);
 assert.ok(sw.includes('keys.filter(key=>key.startsWith(PREFIX)&&key!==VERSION)'));
 assert.ok(!sw.includes('supabase.co'));
 const scripts=read(join(target,'index.html'));
 assert.ok(!scripts.includes('schola-offline.js'));
 assert.ok(!scripts.includes('teacher.js?v='));
 assert.match(scripts,/<link rel="manifest" href="manifest.webmanifest">/);
 assert.doesNotMatch(scripts,/id="pending-reports"/);
 assert.deepEqual(new Set(VOCABULA_CORE).size,VOCABULA_CORE.length);
 for(const file of VOCABULA_CORE.filter(p=>p!=='./')){
   assert.ok(readFileSync(join(target,file.slice(2))).byteLength>0,file);
 }
 for(const file of ['data.js','config.js','scope.js','choice.js']){
   if(file==='data.js')continue; // Correcciones docentes inalteradas en el banco integrado.
   assert.equal(read(join(target,file)),read(join(source,file)),file+' alterado');
 }
 assert.equal(read(join(source,'index.html')).includes('schola-offline.js'),false);
});
function environment(){
 const memory=new Map(),events=[];
 const localStorage={
  getItem:key=>memory.get(key)||null,
  setItem:(key,value)=>memory.set(key,String(value))
 };
 const window={addEventListener:(event,fn)=>events.push({event,fn})};
 const navigator={onLine:true,serviceWorker:{register:async()=>({scope:'/x/apps/vocabulario/'})}};
 const context={window,localStorage,navigator,crypto:{randomUUID:()=>String(memory.size+1)},Date,Math,Error,Object,Array};
 runInNewContext(read(join(target,'schola-offline.js')),context);
 return {api:window.scholaVocabulaOffline,memory,navigator,events};
}
const word={
 id:'9b8233af-453e-4aca-bf71-64368fe1310e',subject:'lat1',
 form:'Ephesius, –a, –um',meaning:'de Éfeso',answers:['efesio'],
 units:['UD 10'],active:true,in_exam:false
};
const report={
 subject:'lat1',mode:'general',units:['UD 10'],entry_id:word.id,
 entry_form:word.form,kind:'translation',message:'Comprobar este significado.'
};
test('Offline: persistencia del catálogo docente y validación de datos',()=>{
 const {api,memory}=environment();
 assert.equal(api.loadWords(),null);
 assert.equal(api.saveWords([word]),true);
 assert.equal(api.loadWords()[0].id,word.id);
 assert.equal(api.saveWords([{...word,subject:'desconocido'}]),false);
 assert.equal(api.loadWords()[0].subject,'lat1');
 assert.equal(memory.has('classics-progress-v1'),false);
 memory.set('schola-vocabula-public-words-v1','{no-valido');
 assert.equal(api.loadWords(),null);
});
test('Offline: los avisos esperan la conexión sin borrar progreso ni perder la cola',async()=>{
 const {api,navigator,memory}=environment();
 const initial=JSON.stringify({[word.id]:{total:3,right:2,failed:true}});
 memory.set('classics-progress-v1',initial);
 assert.equal(api.queueReport(report),1);
 assert.equal(api.pendingCount(),1);
 assert.throws(()=>api.queueReport({...report,mode:'all'}));
 navigator.onLine=false;
 const calls=[];
 assert.equal((await api.flushReports(async data=>calls.push(data))).sent,0);
 assert.equal(calls.length,0);
 assert.equal(api.pendingCount(),1);
 navigator.onLine=true;
 const result=await api.flushReports(async data=>{calls.push(data);return {ok:true}});
 assert.equal(result.sent,1);
 assert.equal(result.pending,0);
 assert.equal(calls[0].message,report.message);
 assert.equal(memory.get('classics-progress-v1'),initial);
 assert.equal(api.queueReport(report),1);
 const failed=await api.flushReports(async()=>{throw Error('429 rate limit')});
 assert.equal(failed.sent,0);
 assert.equal(failed.pending,1);
 for(let i=1;i<15;i++)api.queueReport(report);
 assert.equal(api.pendingCount(),15);
 assert.throws(()=>api.queueReport(report),/demasiados avisos/);
});
