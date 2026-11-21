// Caché independiente del módulo de gramática. No controla Vocabula ni Etymologicon.
import assert from 'node:assert/strict';
import {readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join,extname} from 'node:path';
const PREFIX='schola-gramatica-';
// Solo recursos estáticos propios de Appendix: nunca recursos de otros módulos.
const CORE_EXTENSIONS=new Set(['.html','.js','.css','.json','.svg','.png','.webmanifest']);
const REQUIRED_CORE=[
 './index.html','./curso.html','./morfologia.html','./sintaxis.html',
 './griego-morfologia.html','./griego-sintaxis.html',
 './val/index.html','./val/curso.html','./val/griego-morfologia.html',
 './val/griego-sintaxis.html','./assets/app.js','./assets/search-data.json',
 './assets/curriculum.json','./val/app.js','./val/curriculum.json',
 './assets/curriculum-latin4.json','./val/curriculum-latin4.json',
 './assets/gramatica-offline.js'
];
// Contrato estable para las pruebas curriculares; la caché publicada se genera
// además a partir del inventario completo en el momento de la compilación.
export const GRAMMAR_CORE=Object.freeze([...REQUIRED_CORE]);
export async function listGrammarCore(destination){
 const files=[];
 for(const folder of ['', 'assets', 'val']){
  for(const entry of await readdir(join(destination,folder),{withFileTypes:true})){
   // sw.js se genera DESPUÉS del inventario; excluirlo al revisar dist
   // evita una discrepancia circular entre el hash y el código SW.
   if(entry.name==='sw.js'||!entry.isFile()||
      !CORE_EXTENSIONS.has(extname(entry.name)))continue;
   files.push('./'+(folder?folder+'/':'')+entry.name);
  }
 }
 files.sort();
 for(const required of REQUIRED_CORE)
  assert.ok(files.includes(required),'Falta recurso imprescindible de Appendix: '+required);
 // La ruta /apps/gramatica/ también debe funcionar offline como index.html.
 return ['./',...files];
}
export async function buildGrammarPwa(destination){
 // Evita rutas relativas erróneas al cargar el registro desde val/curso.html.
 const registration=String.raw`if('serviceWorker' in navigator){
 const scope=new URL(document.currentScript.src).href;
 const sw=new URL('../sw.js',scope);
 window.addEventListener('load',()=>navigator.serviceWorker.register(sw).catch(()=>{}));
}
`;
 await writeFile(join(destination,'assets/gramatica-offline.js'),registration);
 // El alumnado puede abrir directamente cualquier capítulo desde el portal,
 // un buscador o un enlace de clase. Todas las páginas registran la misma SW,
 // incluidas las páginas griegas y las versiones valencianas.
 for(const folder of ['', 'val']){
  const script=folder?'../assets/gramatica-offline.js':'assets/gramatica-offline.js';
  for(const file of (await readdir(join(destination,folder))).filter(f=>f.endsWith('.html'))){
   const path=join(destination,folder,file);
   let html=await readFile(path,'utf8');
   const end='</head>';
   assert.equal(html.split(end).length,2,'Cambió el HTML original: '+path);
   assert.ok(!html.includes('gramatica-offline.js'),'Registro duplicado: '+path);
   html=html.replace(end,'<script src="'+script+'" defer></script>'+end);
   await writeFile(path,html);
  }
 }
 const inventory=await listGrammarCore(destination);
 const hash=createHash('sha256');
 for(const file of inventory){
  hash.update(file);
  hash.update(await readFile(join(destination,file==='./'?'index.html':file.slice(2))));
 }
 const version=PREFIX+hash.digest('hex').slice(0,20);
 const sw=[
  "const PREFIX="+JSON.stringify(PREFIX)+";",
  "const VERSION="+JSON.stringify(version)+";",
  "const CORE="+JSON.stringify(inventory)+";",
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
 console.log('Gramática ScholaClassica: PWA offline aislada '+version+' ('+inventory.length+' recursos)');
}
