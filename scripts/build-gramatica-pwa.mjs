// Caché independiente del módulo de gramática. No controla Vocabula ni Etymologicon.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
const PREFIX='schola-gramatica-';
export const GRAMMAR_CORE=[
 './index.html','./curso.html','./val/index.html','./val/curso.html',
 './assets/app.js','./val/app.js',
 './assets/curriculum.json','./val/curriculum.json',
 './assets/curriculum-latin4.json','./val/curriculum-latin4.json',
 './assets/style.css','./assets/participios.css','./assets/language-colors.css',
 './assets/theme.js','./assets/icon.svg','./assets/gramatica-offline.js'
];
export async function buildGrammarPwa(destination){
 // Evita rutas relativas erróneas al cargar el registro desde val/curso.html.
 const registration=String.raw`if('serviceWorker' in navigator){
 const scope=new URL(document.currentScript.src).href;
 const sw=new URL('../sw.js',scope);
 window.addEventListener('load',()=>navigator.serviceWorker.register(sw).catch(()=>{}));
}
`;
 await writeFile(join(destination,'assets/gramatica-offline.js'),registration);
 for(const [file,script] of [
  ['index.html','assets/gramatica-offline.js'],
  ['curso.html','assets/gramatica-offline.js'],
  ['val/index.html','../assets/gramatica-offline.js'],
  ['val/curso.html','../assets/gramatica-offline.js']
 ]){
  const path=join(destination,file);
  let html=await readFile(path,'utf8');
  const end='</head>';
  assert.equal(html.split(end).length,2,'Cambió el HTML original: '+file);
  html=html.replace(end,'<script src="'+script+'" defer></script>'+end);
  await writeFile(path,html);
 }
 const hash=createHash('sha256');
 for(const file of GRAMMAR_CORE){
  hash.update(file);hash.update(await readFile(join(destination,file.slice(2))));
 }
 const version=PREFIX+hash.digest('hex').slice(0,20);
 const sw=[
  "const PREFIX="+JSON.stringify(PREFIX)+";",
  "const VERSION="+JSON.stringify(version)+";",
  "const CORE="+JSON.stringify(GRAMMAR_CORE)+";",
  "const SCOPE=new URL(self.registration.scope);",
  "const OWN=new Set(CORE.map(x=>new URL(x,SCOPE).pathname));",
  "self.addEventListener('install',event=>event.waitUntil(",
  " caches.open(VERSION).then(cache=>cache.addAll(",
  " CORE.map(path=>new Request(new URL(path,SCOPE),{cache:'reload'}))))));",
  "self.addEventListener('activate',event=>event.waitUntil((async()=>{",
  " const keys=await caches.keys();",
  " await Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==VERSION).map(key=>caches.delete(key)));",
  " await self.clients.claim();",
  "})()));",
  "self.addEventListener('fetch',event=>{",
  " const req=event.request;if(req.method!=='GET')return;",
  " const url=new URL(req.url);",
  " if(url.origin!==SCOPE.origin||!url.pathname.startsWith(SCOPE.pathname))return;",
  " event.respondWith((async()=>{",
  "  const cache=await caches.open(VERSION);",
  "  const stored=await cache.match(req,{ignoreSearch:true});",
  "  if(stored)return stored;",
  "  try{return await fetch(req)}catch{",
  "    return new Response('No disponible sin conexión',{status:503});",
  "  }",
  " })());",
  "});"
 ].join('\n')+'\n';
 await writeFile(join(destination,'sw.js'),sw);
 console.log('Gramática ScholaClassica: PWA offline aislada '+version);
}
