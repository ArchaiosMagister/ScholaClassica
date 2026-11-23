import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';

export const VOCABULA_CORE=Object.freeze([
 './','./index.html','./app.js','./choice.js',
 './data.js','./scope.js','./style.css','./theme.js',
 './schola-all.js','./schola-bridge.js','./schola-register.js',
 './manifest.webmanifest',
 './icons/favicon.ico','./icons/favicon.svg','./icons/apple-touch-icon.png',
 './icons/icon-192.png','./icons/icon-512.png'
]);
const PREFIX='schola-vocabula-';
export async function buildVocabulaPwa(destination){
 const manifest={
  name:'Vocabulario clásico · ScholaClassica',
  short_name:'Vocabulario',
  description:'Repaso de vocabulario latino y griego sin conexión.',
  lang:'es',start_url:'./index.html',scope:'./',
  display:'standalone',background_color:'#f6f4ed',theme_color:'#203d37',
  icons:[
   {src:'icons/icon-192.png',sizes:'192x192',type:'image/png'},
   {src:'icons/icon-512.png',sizes:'512x512',type:'image/png'}
  ]
 };
 await writeFile(join(destination,'manifest.webmanifest'),JSON.stringify(manifest,null,2)+'\n');
 assert.ok(VOCABULA_CORE.every(x=>x.startsWith('./')));
 const hash=createHash('sha256');
 for(const file of VOCABULA_CORE){
   hash.update(file+'\0');
   const data=await readFile(join(destination,file==='./'?'index.html':file.slice(2)));
   hash.update(data);
 }
 const version=PREFIX+hash.digest('hex').slice(0,20);
 // Ningún GET ajeno al ámbito del módulo ni solicitudes al backend se interceptan.
 // La caché se invalida por contenido; las demás PWA jamás se limpian.
 const sw=[
  'const PREFIX='+JSON.stringify(PREFIX)+';',
  'const VERSION='+JSON.stringify(version)+';',
  'const CORE='+JSON.stringify(VOCABULA_CORE)+';',
  'const SCOPE=new URL(self.registration.scope);',
  'const OWN=new Set(CORE.map(path=>new URL(path,SCOPE).pathname));',
  "self.addEventListener('install',event=>event.waitUntil(",
  "  caches.open(VERSION).then(cache=>cache.addAll(",
  "   CORE.map(path=>new Request(new URL(path,SCOPE),{cache:'reload'}))))));",
  "self.addEventListener('activate',event=>event.waitUntil((async()=>{",
  " const keys=await caches.keys();",
  " await Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==VERSION).map(key=>caches.delete(key)));",
  " await self.clients.claim();",
  "})()));",
  "self.addEventListener('fetch',event=>{",
  " const req=event.request;if(req.method!=='GET')return;",
  " const url=new URL(req.url);",
  " if(url.origin!==SCOPE.origin||!url.pathname.startsWith(SCOPE.pathname))return;",
  " const key=url.pathname===SCOPE.pathname?new URL('./index.html',SCOPE).pathname:url.pathname;",
  " if(!OWN.has(key))return;",
  " event.respondWith((async()=>{",
  "  const cache=await caches.open(VERSION);",
  "  const stored=await cache.match(new URL(key,SCOPE.origin).href,{ignoreSearch:true});",
  "  if(stored)return stored;",
  "  return fetch(req);",
  " })());",
  "});"
 ].join('\n')+'\n';
 await writeFile(join(destination,'sw.js'),sw);
 console.log('Vocabula integrado: recursos offline aislados en '+version);
}
