import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';

const PREFIX='schola-repaso-gramatica-';
const CORE=Object.freeze([
 'index.html','data.js','style.css','theme.js','config.js',
 'gramatica.css','gramatica.js','gramatica-contenidos.js',
 'gramatica-enunciados.js','gramatica-paradigmas.js',
 'gramatica-latin-imperfectos.js','gramatica-griego-ampliacion.js',
 'gramatica-importada.js','gramatica-respaldo-online.js',
 'gramatica-admin.js','grammar-progress.js','grammar-review-init.js','icons/favicon.svg',
 'data/unimorph-syllabus/manifest.json','manifest.webmanifest'
]);
export async function buildGrammarReviewPwa(dest){
 const manifest={
  name:'Repaso gramatical · ScholaClassica',
  short_name:'Repaso gramatical',
  description:'Preguntas de sintaxis y conceptos de latín y griego por unidades.',
  lang:'es',start_url:'./index.html',scope:'./',display:'standalone',
  background_color:'#f6f4ed',theme_color:'#203d37',
  icons:[{src:'icons/favicon.svg',sizes:'any',type:'image/svg+xml'}]
 };
 await writeFile(join(dest,'manifest.webmanifest'),JSON.stringify(manifest,null,2)+'\n');
 const hash=createHash('sha256');
 for(const path of CORE){hash.update(path+'\0');hash.update(await readFile(join(dest,path)));}
 const version=PREFIX+hash.digest('hex').slice(0,20);
 const sw=[
  'const PREFIX='+JSON.stringify(PREFIX)+';',
  'const VERSION='+JSON.stringify(version)+';',
  'const CORE='+JSON.stringify(CORE.map(x=>'./'+x))+';',
  'const SCOPE=new URL(self.registration.scope);',
  'const OWN=new Set(CORE.map(path=>new URL(path,SCOPE).pathname));',
  "self.addEventListener('install',event=>event.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(CORE.map(path=>new Request(new URL(path,SCOPE),{cache:'reload'}))))));",
  "self.addEventListener('activate',event=>event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==VERSION).map(key=>caches.delete(key)));await self.clients.claim();})()));",
  "self.addEventListener('fetch',event=>{const request=event.request;if(request.method!=='GET')return;const url=new URL(request.url);if(url.origin!==SCOPE.origin||!url.pathname.startsWith(SCOPE.pathname))return;const key=url.pathname===SCOPE.pathname?new URL('./index.html',SCOPE).pathname:url.pathname;if(!OWN.has(key))return;event.respondWith((async()=>{const cache=await caches.open(VERSION);return await cache.match(new URL(key,SCOPE.origin).href,{ignoreSearch:true})||fetch(request);})());});"
 ].join('\n')+'\n';
 await writeFile(join(dest,'sw.js'),sw);
 const html=await readFile(join(dest,'index.html'),'utf8');
 const tag='<script>if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js",{scope:"./"}).catch(()=>{}));</script>';
 assert.equal(html.split('</body></html>').length,2,'No se puede registrar SW en HTML alterado');
 await writeFile(join(dest,'index.html'),html.replace('</body></html>',tag+'</body></html>'));
 console.log('Repaso gramatical: PWA con caché independiente '+version);
}
