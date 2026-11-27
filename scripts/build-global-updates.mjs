import {readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';

const extensions=/\.(html|css|js|mjs|json|svg|png|webp|ico|woff2?|webmanifest)$/i;
const digest=value=>createHash('sha256').update(value).digest('hex').slice(0,20);
async function assets(dir,prefix=''){
 const paths=[];
 for(const item of (await readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){
  if(item.name.startsWith('.')||item.name==='sw.js')continue;
  const path=prefix+item.name;
  if(item.isDirectory())paths.push(...await assets(join(dir,item.name),path+'/'));
  else if(item.isFile()&&extensions.test(item.name))paths.push(path);
 }
 return paths;
}
async function fingerprint(dir,paths){
 const hash=createHash('sha256');
 for(const path of paths){hash.update(path+'\0');hash.update(await readFile(join(dir,path)));}
 return hash.digest('hex').slice(0,20);
}
function fallbackWorker(id,paths,version){
 const prefix='schola-'+id+'-global-';
 return [
  'const PREFIX='+JSON.stringify(prefix)+';',
  'const CACHE=PREFIX+'+JSON.stringify(version)+';',
  'const ASSETS='+JSON.stringify(['./',...paths.map(p=>'./'+p)])+';',
  'const SCOPE=new URL(self.registration.scope);',
  'const OWN=new Set(ASSETS.map(p=>new URL(p,SCOPE).pathname));',
  "self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS.map(p=>new Request(new URL(p,SCOPE),{cache:'reload'}))))));",
  "self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));",
  "self.addEventListener('fetch',e=>{const url=new URL(e.request.url);if(e.request.method!=='GET'||url.origin!==SCOPE.origin||!OWN.has(url.pathname))return;e.respondWith(caches.open(CACHE).then(async c=>await c.match(url.href,{ignoreSearch:true})||fetch(e.request)));});"
 ].join('\n')+'\n';
}
export async function buildGlobalUpdates(out){
 const apps=join(out,'apps'),modules=[];
 for(const item of (await readdir(apps,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){
  if(!item.isDirectory()||!/^[a-z0-9-]+$/.test(item.name))continue;
  const dir=join(apps,item.name);
  const files=await assets(dir);
  if(!files.includes('index.html'))continue;
  const workerPath=join(dir,'sw.js');
  let worker;
  try{worker=await readFile(workerPath,'utf8');}catch(error){if(error.code!=='ENOENT')throw error;}
  if(!worker)worker=fallbackWorker(item.name,files,await fingerprint(dir,files));
  // Estos dos workers tienen una versión editorial fija, no derivada del contenido.
  // Evitar que una corrección de datos reutilice una caché antigua.
  if(item.name==='evolucion-fonetica'||item.name==='latinismos'){
   const revision=await fingerprint(dir,[...files,'../../theme.js','../../style.css','../../icons/icon.svg']);
   const pattern=/(const (?:VERSION|CACHE)\s*=\s*)([^;\n]+);/;
   if(!pattern.test(worker))throw Error('No se reconoce la versión de '+item.name);
   worker=worker.replace(pattern,(_all,start,value)=>start+value+'+'+JSON.stringify('-'+revision)+';');
   // La instalación debe revalidar el contenido HTTP, no reutilizar una copia vieja.
   const list=item.name==='evolucion-fonetica'?'CORE':'ASSETS';
   const old='addAll('+list+')';
   if(worker.includes(old))worker=worker.replace(old,'addAll('+list+".map(p=>new Request(new URL(p,self.registration.scope),{cache:'reload'})))");
  }
  const revision=digest(worker);
  worker+= '\n'+
   "self.addEventListener('message',event=>{const type=event.data?.type;if(type==='SCHOLA_GLOBAL_VERSION'){event.ports[0]?.postMessage("+JSON.stringify(revision)+");return;}if(type!=='SCHOLA_GLOBAL_ACTIVATE')return;event.waitUntil((async()=>{const scope=new URL(self.registration.scope);const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});if(windows.some(client=>{const url=new URL(client.url);return url.origin===scope.origin&&url.pathname.startsWith(scope.pathname);})){event.ports[0]?.postMessage('busy');return;}event.ports[0]?.postMessage('ok');await self.skipWaiting();})());});\n";
  await writeFile(workerPath,worker);
  modules.push({id:item.name,revision});
 }
 if(!modules.length)throw Error('No hay módulos para la actualización global');
 await writeFile(join(out,'global-updates.json'),JSON.stringify({schema:1,modules})+'\n');
 return modules;
}
